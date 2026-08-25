"""
Provider Agent Telemetry and Heartbeat Generation
"""

import time
import psutil
from typing import Dict, Any


def generate_heartbeat_payload(node_id: str, status: str = "AVAILABLE") -> Dict[str, Any]:
    """Generate structured keepalive heartbeat pulse."""
    cpu_percent = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory()
    
    return {
        "nodeId": node_id,
        "status": status,
        "timestamp": time.time(),
        "metrics": {
            "cpuUsagePercent": cpu_percent,
            "ramUsagePercent": mem.percent,
            "ramUsedGb": round((mem.total - mem.available) / (1024 ** 3), 2),
            "gpuUtilizationPercent": 0.0,
            "gpuTemperatureCelsius": 35.0,
        }
    }
