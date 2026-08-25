"""
Official Python Client for the Distributed Compute Marketplace API.
"""
from typing import Dict, Any, Optional, List
import requests


class DistributedComputeClient:
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://api.distributed.gpu/api/v1",
        timeout: int = 30,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self.session = requests.Session()

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "distributed-compute-python-sdk/0.1.0",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            headers["x-api-key"] = self.api_key

        self.session.headers.update(headers)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.session.close()

    def list_nodes(
        self,
        tier: Optional[str] = None,
        gpu_model: Optional[str] = None,
        min_vram_gb: Optional[int] = None,
        max_hourly_rate_usd: Optional[float] = None,
    ) -> Dict[str, Any]:
        params = {}
        if tier:
            params["tier"] = tier
        if gpu_model:
            params["gpuModel"] = gpu_model
        if min_vram_gb:
            params["minVramGb"] = min_vram_gb
        if max_hourly_rate_usd:
            params["maxHourlyRateUsd"] = max_hourly_rate_usd

        res = self.session.get(f"{self.base_url}/marketplace/nodes", params=params, timeout=self.timeout)
        res.raise_for_status()
        return res.json()

    def submit_workload(
        self,
        image: str,
        command: Optional[str] = None,
        gpu_count: int = 1,
        min_vram_gb: int = 16,
        strategy: str = "BEST_PRICE_PERFORMANCE",
    ) -> Dict[str, Any]:
        payload = {
            "image": image,
            "command": command,
            "gpuCount": gpu_count,
            "minVramGb": min_vram_gb,
            "strategy": strategy,
        }
        res = self.session.post(f"{self.base_url}/workloads/jobs", json=payload, timeout=self.timeout)
        res.raise_for_status()
        return res.json()

    def get_workload_status(self, job_id: str) -> Dict[str, Any]:
        res = self.session.get(f"{self.base_url}/workloads/jobs/{job_id}", timeout=self.timeout)
        res.raise_for_status()
        return res.json()

    def get_workload_logs(self, job_id: str) -> List[str]:
        res = self.session.get(f"{self.base_url}/workloads/jobs/{job_id}/logs", timeout=self.timeout)
        res.raise_for_status()
        data = res.json()
        return data.get("logs", [])
