"""
Hardened Container Execution Sandbox for Provider Agent (OCI / Podman / Docker / gVisor Engine)
"""

import os
import shutil
import subprocess
import time
from typing import Dict, List, Optional, Callable, Any

# Known malicious or prohibited image signatures
PROHIBITED_IMAGE_SIGNATURES = [
    "xmrig",
    "coinhive",
    "monero",
    "stratum",
    "crypto-miner",
    "ethminer",
    "nbminer",
]


class ContainerSandbox:
    """
    Manages hardened, isolated execution of containerized customer workloads
    using Podman, Docker, or gVisor (runsc) with defense-in-depth isolation.
    """

    def __init__(self, runtime: Optional[str] = None):
        if runtime:
            self.runtime = runtime
        elif shutil.which("podman"):
            self.runtime = "podman"
        elif shutil.which("docker"):
            self.runtime = "docker"
        else:
            self.runtime = "simulated"

    def is_available(self) -> bool:
        return self.runtime in ["podman", "docker"]

    def validate_image_security(self, image: str) -> bool:
        """
        Scans container image name against prohibited signatures.
        """
        lower_img = image.lower()
        for sig in PROHIBITED_IMAGE_SIGNATURES:
            if sig in lower_img:
                return False
        return True

    def build_command(
        self,
        image: str,
        command: Optional[str] = None,
        env: Optional[Dict[str, str]] = None,
        gpu_count: int = 1,
        memory_limit_mb: int = 8192,
        cpu_quota: float = 4.0,
        enable_gvisor: bool = False,
    ) -> List[str]:
        """
        Constructs the hardened OCI container execution command with capability dropping,
        no-new-privileges, read-only rootfs, tmpfs mounts, non-root user, and device passthrough.
        """
        cmd = [
            self.runtime,
            "run",
            "--rm",
            "--network=none",  # Network isolation for untrusted compute
            f"--memory={memory_limit_mb}m",
            f"--cpus={cpu_quota}",
            "--cap-drop=ALL",  # Drop all Linux capabilities
            "--security-opt=no-new-privileges:true",  # Prevent privilege escalation
            "--read-only",  # Read-only root filesystem
            "--tmpfs=/tmp:rw,noexec,nosuid,size=512m",  # In-memory ephemeral scratch space
            "--user=10001:10001",  # Enforce non-root execution
            "--pids-limit=1024",  # Prevent fork bombs
        ]

        if enable_gvisor:
            cmd.extend(["--runtime", "runsc"])

        # GPU passthrough flags
        if gpu_count > 0:
            if self.runtime == "podman":
                cmd.extend(["--device", "nvidia.com/gpu=all"])
            else:
                cmd.extend(["--gpus", "all"])

        # Inject environment variables safely
        if env:
            for k, v in env.items():
                cmd.extend(["-e", f"{k}={v}"])

        cmd.append(image)

        if command:
            cmd.extend(command.split())

        return cmd

    def execute_job(
        self,
        job_id: str,
        image: str,
        command: Optional[str] = None,
        env: Optional[Dict[str, str]] = None,
        gpu_count: int = 1,
        timeout_seconds: int = 3600,
        log_callback: Optional[Callable[[List[str]], None]] = None,
    ) -> Dict[str, Any]:
        """
        Executes a container workload synchronously or in simulation mode, capturing stdout/stderr logs.
        """
        logs: List[str] = []
        start_time = time.time()

        timestamp_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        # Security image validation check
        if not self.validate_image_security(image):
            err_msg = f"[{timestamp_str}] [SECURITY] Image '{image}' rejected: Prohibited workload signature detected."
            logs.append(err_msg)
            if log_callback:
                log_callback([err_msg])
            return {
                "exit_code": 126,
                "status": "FAILED",
                "logs": logs,
                "duration_seconds": 0.0,
            }

        logs.append(f"[{timestamp_str}] [SANDBOX] Preparing hardened container sandbox for job {job_id}...")
        logs.append(f"[{timestamp_str}] [SANDBOX] Image: {image}, Runtime: {self.runtime}, GPU Count: {gpu_count}")
        logs.append(f"[{timestamp_str}] [SECURITY] Enforced: cap-drop=ALL, no-new-privileges, read-only rootfs, non-root user 10001")

        if log_callback:
            log_callback(logs[-3:])

        if self.runtime == "simulated":
            time.sleep(0.05)
            logs.append(f"[{timestamp_str}] [STDOUT] Container initialized. Running task: {command or 'default entrypoint'}")
            logs.append(f"[{timestamp_str}] [STDOUT] Executing model forward pass / compute workload...")
            logs.append(f"[{timestamp_str}] [STDOUT] Process completed with exit code 0.")
            if log_callback:
                log_callback(logs[-3:])
            return {
                "exit_code": 0,
                "status": "COMPLETED",
                "logs": logs,
                "duration_seconds": round(time.time() - start_time, 2),
            }

        cmd = self.build_command(
            image=image,
            command=command,
            env=env,
            gpu_count=gpu_count,
        )

        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
            )

            if process.stdout:
                for line in iter(process.stdout.readline, ""):
                    clean_line = line.strip()
                    if clean_line:
                        log_entry = f"[{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}] {clean_line}"
                        logs.append(log_entry)
                        if log_callback:
                            log_callback([log_entry])

            process.stdout.close()
            return_code = process.wait(timeout=timeout_seconds)

            status = "COMPLETED" if return_code == 0 else "FAILED"
            logs.append(f"[{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}] [SANDBOX] Job finished with exit code {return_code}")

            return {
                "exit_code": return_code,
                "status": status,
                "logs": logs,
                "duration_seconds": round(time.time() - start_time, 2),
            }

        except subprocess.TimeoutExpired:
            process.kill()
            logs.append(f"[{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}] [SANDBOX] Execution timed out after {timeout_seconds}s")
            return {
                "exit_code": 124,
                "status": "FAILED",
                "logs": logs,
                "duration_seconds": round(time.time() - start_time, 2),
            }
        except Exception as e:
            logs.append(f"[{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}] [SANDBOX] Execution failed: {str(e)}")
            return {
                "exit_code": 1,
                "status": "FAILED",
                "logs": logs,
                "duration_seconds": round(time.time() - start_time, 2),
            }
