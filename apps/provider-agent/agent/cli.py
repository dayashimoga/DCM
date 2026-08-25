"""
CLI and Daemon Entrypoint for Provider Agent
"""

import sys
import time
import json
import signal
import logging
import argparse
from typing import Optional, Dict, Any

from agent.discovery import collect_hardware_profile
from agent.benchmark import execute_full_benchmark
from agent.telemetry import generate_heartbeat_payload
from agent.client import ApiClient
from agent.sandbox import ContainerSandbox

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("provider-agent")


class AgentDaemon:
    def __init__(
        self,
        base_url: str = "http://localhost:4000",
        pairing_token: Optional[str] = None,
        node_name: Optional[str] = None,
        hourly_rate_usd: Optional[float] = None,
        sandbox_runtime: Optional[str] = None,
    ):
        self.base_url = base_url
        self.pairing_token = pairing_token
        self.node_name = node_name
        self.hourly_rate_usd = hourly_rate_usd
        self.client = ApiClient(base_url=base_url)
        self.sandbox = ContainerSandbox(runtime=sandbox_runtime)
        self.node_id: Optional[str] = None
        self.heartbeat_interval = 15
        self.running = False
        self.current_job_id: Optional[str] = None

    def _setup_signal_handlers(self):
        def handle_signal(sig, frame):
            logger.info("Signal received. Draining node and terminating daemon gracefully...")
            self.stop()

        signal.signal(signal.SIGINT, handle_signal)
        signal.signal(signal.SIGTERM, handle_signal)

    def stop(self):
        self.running = False
        if self.node_id:
            logger.info("Sending final DRAINING state to control plane...")
            self.client.send_heartbeat(
                node_id=self.node_id,
                status="DRAINING",
                metrics={"cpuUsagePercent": 0, "ramUsagePercent": 0, "ramUsedGb": 0, "gpuUtilizationPercent": 0, "gpuTemperatureCelsius": 0},
            )

    def start(self, max_iterations: Optional[int] = None) -> int:
        self._setup_signal_handlers()
        logger.info("Starting Distributed Compute Provider Agent Daemon...")

        # 1. Hardware Discovery
        logger.info("Gathering local hardware inventory...")
        profile = collect_hardware_profile()
        gpu_count = len(profile.get("gpus", []))
        gpu_model = profile.get("gpus", [{}])[0].get("model", "None") if gpu_count > 0 else "None"
        vram_gb = profile.get("gpus", [{}])[0].get("vramGb", 0) if gpu_count > 0 else 0
        logger.info(f"Discovered: {profile['cpu']['cores']} Cores, {gpu_count} GPUs ({gpu_model})")

        # 2. Registration via Pairing Token
        if not self.pairing_token:
            logger.error("No pairing token provided. Run with --token <PAIRING_TOKEN> or set PROVIDER_PAIRING_TOKEN.")
            return 1

        try:
            reg_data = self.client.register_node(
                pairing_token=self.pairing_token,
                hardware_profile=profile,
                node_name=self.node_name,
                hourly_rate_usd=self.hourly_rate_usd,
            )
            self.node_id = reg_data.get("nodeId")
            self.heartbeat_interval = reg_data.get("heartbeatIntervalSeconds", 15)
            logger.info(f"Node connected with ID: {self.node_id}")
        except Exception as e:
            logger.error(f"Failed to register node: {e}")
            return 1

        # 3. Benchmark Run & Verification
        try:
            logger.info("Running synthetic hardware verification benchmark...")
            benchmark_data = execute_full_benchmark(
                gpu_count=gpu_count,
                gpu_model=gpu_model,
                vram_gb=vram_gb,
            )
            self.client.submit_benchmark(self.node_id, benchmark_data)
        except Exception as e:
            logger.warning(f"Could not complete benchmark verification: {e}")

        # 4. Daemon Execution Loop
        self.running = True
        iterations = 0

        logger.info(f"Entering telemetry & job execution loop (every {self.heartbeat_interval}s)...")
        while self.running:
            try:
                # Send Heartbeat
                status = "BUSY" if self.current_job_id else "ONLINE"
                heartbeat = generate_heartbeat_payload(node_id=self.node_id, status=status)
                self.client.send_heartbeat(
                    node_id=self.node_id,
                    status=status,
                    metrics=heartbeat["metrics"],
                )

                # Check for assigned pending jobs if idle
                if not self.current_job_id:
                    job = self.client.get_pending_job(self.node_id)
                    if job and job.get("id"):
                        job_id = job["id"]
                        self.current_job_id = job_id
                        logger.info(f"Received assigned job: {job_id} (Image: {job.get('image')})")

                        # Report status RUNNING
                        self.client.update_job_status(
                            job_id=job_id,
                            node_id=self.node_id,
                            status="RUNNING",
                            logs=[f"Provider agent {self.node_id} accepted job {job_id}"],
                        )

                        # Execute in container sandbox
                        result = self.sandbox.execute_job(
                            job_id=job_id,
                            image=job["image"],
                            command=job.get("command"),
                            gpu_count=gpu_count,
                            log_callback=lambda lines: self.client.update_job_status(
                                job_id=job_id,
                                node_id=self.node_id,
                                status="RUNNING",
                                logs=lines,
                            ),
                        )

                        # Report final status
                        self.client.update_job_status(
                            job_id=job_id,
                            node_id=self.node_id,
                            status=result["status"],
                            exitCode=result.get("exit_code", 0),
                            logs=result.get("logs", []),
                        )
                        logger.info(f"Job {job_id} finished with status {result['status']}")
                        self.current_job_id = None

            except Exception as e:
                logger.error(f"Error in daemon cycle: {e}")

            iterations += 1
            if max_iterations and iterations >= max_iterations:
                break

            time.sleep(self.heartbeat_interval)

        logger.info("Agent daemon stopped.")
        return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Distributed Compute Provider Agent CLI")
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # info command
    subparsers.add_parser("info", help="Discover and print local hardware inventory")

    # benchmark command
    bench_parser = subparsers.add_parser("benchmark", help="Run synthetic hardware benchmark suite")
    bench_parser.add_argument("--submit", action="store_true", help="Submit benchmark to marketplace control plane")
    bench_parser.add_argument("--node-id", type=str, help="Node ID (required if submitting benchmark)")
    bench_parser.add_argument("--api-url", type=str, default="http://localhost:4000", help="API Gateway URL")

    # run command (daemon)
    run_parser = subparsers.add_parser("run", help="Start provider agent daemon")
    run_parser.add_argument("--token", type=str, help="Provider node pairing token")
    run_parser.add_argument("--name", type=str, help="Custom node display name")
    run_parser.add_argument("--rate", type=float, help="Custom hourly rate in USD")
    run_parser.add_argument("--api-url", type=str, default="http://localhost:4000", help="API Gateway URL")
    run_parser.add_argument("--sandbox", type=str, default="simulated", help="Container sandbox runtime (podman/docker/simulated)")

    args = parser.parse_args()

    if args.command == "info":
        profile = collect_hardware_profile()
        print(json.dumps(profile, indent=2))
        return 0

    elif args.command == "benchmark":
        profile = collect_hardware_profile()
        gpu_count = len(profile.get("gpus", []))
        gpu_model = profile.get("gpus", [{}])[0].get("model", "None") if gpu_count > 0 else "None"
        vram_gb = profile.get("gpus", [{}])[0].get("vramGb", 0) if gpu_count > 0 else 0

        res = execute_full_benchmark(gpu_count=gpu_count, gpu_model=gpu_model, vram_gb=vram_gb)
        print(json.dumps(res, indent=2))

        if args.submit:
            if not args.node_id:
                print("Error: --node-id is required when using --submit", file=sys.stderr)
                return 1
            client = ApiClient(base_url=args.api_url)
            try:
                verification = client.submit_benchmark(args.node_id, res)
                print(f"Benchmark verified successfully: Score={verification.get('verifiedScore')}")
            except Exception as e:
                print(f"Benchmark submission failed: {e}", file=sys.stderr)
                return 1
        return 0

    elif args.command == "run":
        daemon = AgentDaemon(
            base_url=args.api_url,
            pairing_token=args.token,
            node_name=args.name,
            hourly_rate_usd=args.rate,
            sandbox_runtime=args.sandbox,
        )
        return daemon.start()

    else:
        parser.print_help()
        return 0


if __name__ == "__main__":
    sys.exit(main())
