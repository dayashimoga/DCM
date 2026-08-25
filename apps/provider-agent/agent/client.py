"""
HTTP Client for Provider Agent communicating with Marketplace API Gateway
"""

import logging
from typing import Dict, Any, Optional, List
import requests

logger = logging.getLogger(__name__)


class ApiClient:
    def __init__(self, base_url: str = "http://localhost:4000", api_version: str = "v1"):
        self.base_url = f"{base_url.rstrip('/')}/api/{api_version}"
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "DistributedCompute-ProviderAgent/0.5.0",
            "Content-Type": "application/json",
            "Accept": "application/json",
        })

    def register_node(
        self,
        pairing_token: str,
        hardware_profile: Dict[str, Any],
        node_name: Optional[str] = None,
        hourly_rate_usd: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Registers a new compute node with the control plane using a pairing token.
        """
        url = f"{self.base_url}/providers/nodes/register"
        payload = {
            "pairingToken": pairing_token,
            "nodeName": node_name,
            "hardware": hardware_profile,
            "hourlyRateUsd": hourly_rate_usd,
        }

        try:
            response = self.session.post(url, json=payload, timeout=10)
            if response.status_code == 201:
                data = response.json()
                logger.info(f"Node successfully registered: ID={data.get('nodeId')}")
                return data
            else:
                logger.error(f"Registration failed: {response.status_code} - {response.text}")
                raise RuntimeError(f"Registration rejected: {response.text}")
        except requests.RequestException as e:
            logger.error(f"Network error during node registration: {e}")
            raise

    def send_heartbeat(
        self,
        node_id: str,
        status: str,
        metrics: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Sends 15-second telemetry heartbeat pulse to maintain node online lease.
        """
        url = f"{self.base_url}/providers/nodes/heartbeat"
        payload = {
            "nodeId": node_id,
            "status": status,
            "metrics": metrics,
        }

        try:
            response = self.session.post(url, json=payload, timeout=5)
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"Heartbeat rejected: {response.status_code} - {response.text}")
                return {"status": "NACK"}
        except requests.RequestException as e:
            logger.warning(f"Failed to transmit heartbeat: {e}")
            return {"status": "ERROR"}

    def submit_benchmark(
        self,
        node_id: str,
        benchmark_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Submits benchmark measurements and proof-of-work challenge results for verification.
        """
        url = f"{self.base_url}/benchmarks/submit"
        payload = {
            "nodeId": node_id,
            "metrics": {
                "version": benchmark_data.get("version", "1.0"),
                "cpuGflops": benchmark_data.get("cpuGflops", 0),
                "gpuTflops": benchmark_data.get("gpuTflops", 0),
                "memoryBandwidthGbps": benchmark_data.get("memoryBandwidthGbps", 0),
                "diskIops": benchmark_data.get("diskIops", 0),
                "challengeDurationMs": benchmark_data.get("challengeDurationMs", 0),
                "compositeScore": benchmark_data.get("compositeScore", 0),
                "computeTier": benchmark_data.get("computeTier", "TIER_4_CPU_ONLY"),
            },
            "proofOfWorkSignature": benchmark_data.get("proofOfWorkSignature", ""),
        }

        try:
            response = self.session.post(url, json=payload, timeout=15)
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Benchmark verified: Score={data.get('verifiedScore')}, Status={data.get('status')}")
                return data
            else:
                logger.error(f"Benchmark submission failed: {response.status_code} - {response.text}")
                raise RuntimeError(f"Benchmark rejected: {response.text}")
        except requests.RequestException as e:
            logger.error(f"Network error during benchmark submission: {e}")
            raise

    def get_pending_job(self, node_id: str) -> Optional[Dict[str, Any]]:
        """
        Polls for scheduled compute jobs assigned to this node.
        """
        url = f"{self.base_url}/workloads/agent/pending/{node_id}"
        try:
            response = self.session.get(url, timeout=5)
            if response.status_code == 200:
                return response.json()
            return None
        except requests.RequestException:
            return None

    def update_job_status(
        self,
        job_id: str,
        node_id: str,
        status: str,
        exit_code: Optional[int] = None,
        error_reason: Optional[str] = None,
        logs: Optional[List[str]] = None,
    ) -> bool:
        """
        Transmits job status transition updates and stdout/stderr execution log buffers.
        """
        url = f"{self.base_url}/workloads/agent/status"
        payload = {
            "jobId": job_id,
            "nodeId": node_id,
            "status": status,
            "exitCode": exit_code,
            "errorReason": error_reason,
            "logs": logs or [],
        }

        try:
            response = self.session.post(url, json=payload, timeout=5)
            return response.status_code == 200
        except requests.RequestException as e:
            logger.warning(f"Failed to report job status {status}: {e}")
            return False
