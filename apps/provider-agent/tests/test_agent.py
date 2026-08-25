"""
Unit Tests for Provider Agent Modules (Discovery, Benchmark, Telemetry, Sandbox, CLI, Client)
"""

import sys
import pytest
import requests
import subprocess
from unittest.mock import patch, MagicMock
from agent.discovery import get_cpu_info, get_gpu_info, get_memory_info, get_storage_info, collect_hardware_profile
from agent.benchmark import (
    run_cpu_matrix_benchmark,
    run_memory_bandwidth_benchmark,
    run_disk_iops_benchmark,
    run_anti_spoofing_challenge,
    classify_compute_tier,
    calculate_normalized_score,
    execute_full_benchmark,
)
from agent.telemetry import generate_heartbeat_payload
from agent.sandbox import ContainerSandbox
from agent.client import ApiClient
from agent.cli import AgentDaemon, main


def test_cpu_discovery():
    cpu = get_cpu_info()
    assert "cores" in cpu
    assert "threads" in cpu
    assert cpu["cores"] >= 1
    assert cpu["threads"] >= cpu["cores"]


def test_gpu_discovery_without_nvidia_smi():
    with patch("shutil.which", return_value=None):
        gpus = get_gpu_info()
        assert isinstance(gpus, list)
        assert len(gpus) >= 1
        assert gpus[0]["vendor"] == "OTHER"


def test_gpu_discovery_with_mock_nvidia_smi():
    mock_csv = "NVIDIA H100 80GB HBM3, 81920, 550.54.14\nNVIDIA A100-SXM4-80GB, 81920, 550.54.14"
    with patch("shutil.which", return_value="/usr/bin/nvidia-smi"):
        with patch("subprocess.check_output", return_value=mock_csv):
            gpus = get_gpu_info()
            assert len(gpus) == 2
            assert gpus[0]["model"] == "NVIDIA H100 80GB HBM3"
            assert gpus[0]["vramGb"] == 80
            assert gpus[0]["vendor"] == "NVIDIA"


def test_memory_and_storage_discovery():
    mem = get_memory_info()
    assert "totalRamGb" in mem
    assert mem["totalRamGb"] >= 0

    storage = get_storage_info()
    assert "totalDiskGb" in storage
    assert storage["totalDiskGb"] >= 0


def test_hardware_profile_collection():
    profile = collect_hardware_profile()
    assert "os" in profile
    assert "cpu" in profile
    assert "gpus" in profile
    assert "memory" in profile
    assert "storage" in profile


def test_benchmark_calculations():
    cpu_gflops = run_cpu_matrix_benchmark(size=30)
    assert cpu_gflops >= 0.0

    mem_gbps = run_memory_bandwidth_benchmark(size_mb=4)
    assert mem_gbps >= 0.0

    disk_iops = run_disk_iops_benchmark(iterations=10)
    assert disk_iops >= 0.0

    challenge = run_anti_spoofing_challenge(iterations=1000)
    assert "signature" in challenge
    assert challenge["challengeDurationMs"] >= 0.0

    score = calculate_normalized_score(cpu_gflops=10.0, mem_gbps=20.0, disk_iops=1000.0, gpu_count=1, vram_gb=80)
    assert 10 <= score <= 1000

    tier1 = classify_compute_tier("NVIDIA H100 80GB", 80)
    assert tier1 == "TIER_1_ENTERPRISE_GPU"

    tier2 = classify_compute_tier("NVIDIA GeForce RTX 4090", 24)
    assert tier2 == "TIER_2_PRO_GPU"

    tier3 = classify_compute_tier("NVIDIA RTX 3080", 10)
    assert tier3 == "TIER_3_CONSUMER_GPU"

    tier4 = classify_compute_tier(None, 0)
    assert tier4 == "TIER_4_CPU_ONLY"

    full_bench1 = execute_full_benchmark(gpu_count=1, gpu_model="NVIDIA H100", vram_gb=80)
    assert full_bench1["version"] == "1.0"
    assert full_bench1["gpuTflops"] == 67.0
    assert full_bench1["computeTier"] == "TIER_1_ENTERPRISE_GPU"

    full_bench2 = execute_full_benchmark(gpu_count=1, gpu_model="RTX 4090", vram_gb=24)
    assert full_bench2["gpuTflops"] == 33.0

    full_bench3 = execute_full_benchmark(gpu_count=1, gpu_model="RTX 3080", vram_gb=10)
    assert full_bench3["gpuTflops"] == 14.0


def test_benchmark_error_fallbacks():
    with patch("random.random", side_effect=Exception("CPU error")):
        score = run_cpu_matrix_benchmark()
        assert score == 1.25

    with patch("builtins.bytearray", side_effect=Exception("RAM error")):
        bw = run_memory_bandwidth_benchmark()
        assert bw == 12.50

    with patch("tempfile.NamedTemporaryFile", side_effect=Exception("Disk error")):
        iops = run_disk_iops_benchmark()
        assert iops == 850.0


def test_container_sandbox_simulated():
    sandbox = ContainerSandbox(runtime="simulated")
    assert not sandbox.is_available()

    logs_received = []
    result = sandbox.execute_job(
        job_id="job-sim-123",
        image="nvidia/cuda:12.2.0-base-ubuntu22.04",
        command="python train.py",
        gpu_count=1,
        log_callback=lambda l: logs_received.extend(l),
    )

    assert result["status"] == "COMPLETED"
    assert result["exit_code"] == 0
    assert len(result["logs"]) >= 3
    assert len(logs_received) >= 3


def test_container_sandbox_image_security_filter():
    sandbox = ContainerSandbox(runtime="simulated")
    assert sandbox.validate_image_security("pytorch/pytorch:latest") is True
    assert sandbox.validate_image_security("nvidia/cuda:12.2") is True
    assert sandbox.validate_image_security("docker.io/library/xmrig:latest") is False
    assert sandbox.validate_image_security("bad-actor/stratum-miner") is False

    res = sandbox.execute_job(job_id="bad-job", image="evil/monero-miner:v1")
    assert res["status"] == "FAILED"
    assert res["exit_code"] == 126
    assert any("SECURITY" in log for log in res["logs"])


def test_container_sandbox_command_builder():
    sandbox_podman = ContainerSandbox(runtime="podman")
    assert sandbox_podman.is_available()

    cmd_podman = sandbox_podman.build_command(
        image="pytorch/pytorch:latest",
        command="python evaluate.py",
        env={"BATCH_SIZE": "32"},
        gpu_count=2,
        enable_gvisor=True,
    )
    assert "podman" in cmd_podman
    assert "--device" in cmd_podman
    assert "nvidia.com/gpu=all" in cmd_podman
    assert "BATCH_SIZE=32" in cmd_podman
    assert "--cap-drop=ALL" in cmd_podman
    assert "--security-opt=no-new-privileges:true" in cmd_podman
    assert "--read-only" in cmd_podman
    assert "--user=10001:10001" in cmd_podman
    assert "--runtime" in cmd_podman
    assert "runsc" in cmd_podman

    sandbox_docker = ContainerSandbox(runtime="docker")
    cmd_docker = sandbox_docker.build_command(
        image="ubuntu:22.04",
        gpu_count=1,
    )
    assert "docker" in cmd_docker
    assert "--gpus" in cmd_docker
    assert "--cap-drop=ALL" in cmd_docker


def test_container_sandbox_subprocess_execution():
    sandbox = ContainerSandbox(runtime="podman")

    mock_proc = MagicMock()
    mock_proc.stdout.readline.side_effect = ["Step 1\n", "Step 2\n", ""]
    mock_proc.wait.return_value = 0

    with patch("subprocess.Popen", return_value=mock_proc):
        result = sandbox.execute_job(
            job_id="job-mock-proc",
            image="alpine:latest",
            gpu_count=0,
        )
        assert result["status"] == "COMPLETED"
        assert result["exit_code"] == 0

    with patch("subprocess.Popen", side_effect=Exception("Execution fault")):
        err_res = sandbox.execute_job(job_id="job-err", image="alpine:latest")
        assert err_res["status"] == "FAILED"
        assert err_res["exit_code"] == 1


def test_telemetry_heartbeat_generation():
    heartbeat = generate_heartbeat_payload(node_id="node-test-123", status="AVAILABLE")
    assert heartbeat["nodeId"] == "node-test-123"
    assert heartbeat["status"] == "AVAILABLE"
    assert "metrics" in heartbeat
    assert "cpuUsagePercent" in heartbeat["metrics"]
    assert "ramUsedGb" in heartbeat["metrics"]


def test_api_client_registration():
    client = ApiClient(base_url="http://localhost:4000")
    mock_resp = MagicMock()
    mock_resp.status_code = 201
    mock_resp.json.return_value = {
        "nodeId": "node-mock-123",
        "status": "ONLINE",
        "heartbeatIntervalSeconds": 15,
    }

    with patch.object(client.session, "post", return_value=mock_resp):
        res = client.register_node(
            pairing_token="ptk_mock_123",
            hardware_profile={"cpu": {"cores": 16}, "gpus": []},
            node_name="My-Test-Rig",
        )
        assert res["nodeId"] == "node-mock-123"
        assert res["status"] == "ONLINE"


def test_api_client_registration_failure():
    client = ApiClient(base_url="http://localhost:4000")
    mock_resp = MagicMock()
    mock_resp.status_code = 401
    mock_resp.text = "Invalid pairing token"

    with patch.object(client.session, "post", return_value=mock_resp):
        with pytest.raises(RuntimeError):
            client.register_node(pairing_token="bad_token", hardware_profile={})


def test_api_client_heartbeat_success():
    client = ApiClient(base_url="http://localhost:4000")
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"status": "ACK"}

    with patch.object(client.session, "post", return_value=mock_resp):
        res = client.send_heartbeat(
            node_id="node-mock-123",
            status="ONLINE",
            metrics={"cpuUsagePercent": 20},
        )
        assert res["status"] == "ACK"


def test_api_client_heartbeat_rejection_and_network_error():
    client = ApiClient(base_url="http://localhost:4000")
    mock_resp = MagicMock()
    mock_resp.status_code = 404
    mock_resp.text = "Node not found"

    with patch.object(client.session, "post", return_value=mock_resp):
        res = client.send_heartbeat(node_id="unknown-node", status="ONLINE", metrics={})
        assert res["status"] == "NACK"

    with patch.object(client.session, "post", side_effect=requests.RequestException("Network down")):
        res = client.send_heartbeat(node_id="unknown-node", status="ONLINE", metrics={})
        assert res["status"] == "ERROR"


def test_api_client_submit_benchmark():
    client = ApiClient(base_url="http://localhost:4000")
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"status": "VERIFIED", "verifiedScore": 950}

    with patch.object(client.session, "post", return_value=mock_resp):
        res = client.submit_benchmark(
            node_id="node-101",
            benchmark_data={
                "version": "1.0",
                "cpuGflops": 10,
                "gpuTflops": 50,
                "memoryBandwidthGbps": 15,
                "diskIops": 2000,
                "challengeDurationMs": 40,
                "compositeScore": 950,
                "computeTier": "TIER_1_ENTERPRISE_GPU",
                "proofOfWorkSignature": "pow_sig_123",
            },
        )
        assert res["status"] == "VERIFIED"


def test_api_client_get_pending_job_and_update_status():
    client = ApiClient(base_url="http://localhost:4000")

    mock_resp_get = MagicMock()
    mock_resp_get.status_code = 200
    mock_resp_get.json.return_value = {"id": "job-101", "image": "alpine:latest"}

    mock_resp_post = MagicMock()
    mock_resp_post.status_code = 200

    with patch.object(client.session, "get", return_value=mock_resp_get):
        with patch.object(client.session, "post", return_value=mock_resp_post):
            job = client.get_pending_job(node_id="node-101")
            assert job["id"] == "job-101"

            ok = client.update_job_status(
                job_id="job-101",
                node_id="node-101",
                status="RUNNING",
                logs=["Started container"],
            )
            assert ok is True


def test_agent_daemon_execution_loop_with_job():
    daemon = AgentDaemon(base_url="http://localhost:4000", pairing_token="ptk_test_123", sandbox_runtime="simulated")
    with patch.object(daemon.client, "register_node", return_value={"nodeId": "node-101", "heartbeatIntervalSeconds": 0.01}):
        with patch.object(daemon.client, "submit_benchmark", return_value={"status": "VERIFIED"}):
            with patch.object(daemon.client, "send_heartbeat", return_value={"status": "ACK"}):
                with patch.object(daemon.client, "get_pending_job", side_effect=[{"id": "job-999", "image": "pytorch:latest"}, None]):
                    with patch.object(daemon.client, "update_job_status", return_value=True):
                        with patch("time.sleep", return_value=None):
                            status = daemon.start(max_iterations=2)
                            assert status == 0
                            assert daemon.node_id == "node-101"


def test_agent_daemon_stop_draining():
    daemon = AgentDaemon(base_url="http://localhost:4000", pairing_token="ptk_test_123")
    daemon.node_id = "node-101"
    with patch.object(daemon.client, "send_heartbeat", return_value={"status": "ACK"}):
        daemon.stop()
        assert daemon.running is False


def test_cli_info_command(capsys):
    with patch.object(sys, "argv", ["provider-agent", "info"]):
        exit_code = main()
        assert exit_code == 0
        captured = capsys.readouterr()
        assert "cpu" in captured.out
        assert "gpus" in captured.out


def test_cli_benchmark_command(capsys):
    with patch.object(sys, "argv", ["provider-agent", "benchmark"]):
        exit_code = main()
        assert exit_code == 0
        captured = capsys.readouterr()
        assert "compositeScore" in captured.out


def test_cli_run_command():
    with patch.object(sys, "argv", ["provider-agent", "run", "--token", "ptk_test_123"]):
        with patch.object(AgentDaemon, "start", return_value=0):
            exit_code = main()
            assert exit_code == 0
