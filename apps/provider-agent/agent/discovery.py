"""
Hardware Discovery and Introspection Module
"""

import os
import platform
import subprocess
import shutil
import psutil
from typing import Dict, List, Any


def get_cpu_info() -> Dict[str, Any]:
    """Discover host CPU specifications."""
    cores = psutil.cpu_count(logical=False) or 1
    threads = psutil.cpu_count(logical=True) or cores
    freq = psutil.cpu_freq()
    
    # Try to determine processor name
    processor = platform.processor() or "Generic x86_64 / ARM CPU"
    
    return {
        "model": processor,
        "cores": cores,
        "threads": threads,
        "frequencyGhz": round(freq.max / 1000.0, 2) if freq and freq.max else 2.5,
        "architecture": platform.machine(),
    }


def get_gpu_info() -> List[Dict[str, Any]]:
    """Discover host GPU accelerators (NVIDIA/AMD) with fallback simulation."""
    gpus: List[Dict[str, Any]] = []
    
    # Try querying nvidia-smi if available
    if shutil.which("nvidia-smi"):
        try:
            cmd = ["nvidia-smi", "--query-gpu=gpu_name,memory.total,driver_version", "--format=csv,noheader,nounits"]
            output = subprocess.check_output(cmd, encoding="utf-8").strip()
            for line in output.splitlines():
                parts = [p.strip() for p in line.split(",")]
                if len(parts) >= 3:
                    name, mem_mb, driver = parts[0], parts[1], parts[2]
                    gpus.append({
                        "model": name,
                        "vendor": "NVIDIA",
                        "vramGb": int(round(float(mem_mb) / 1024.0)),
                        "driverVersion": driver,
                        "cudaVersion": "12.4",
                        "count": 1,
                    })
        except Exception:
            pass

    # If no physical GPU is detected, provide fallback entry
    if not gpus:
        gpus.append({
            "model": "Generic Compute Accelerator",
            "vendor": "OTHER",
            "vramGb": 0,
            "count": 0,
        })

    return gpus


def get_memory_info() -> Dict[str, Any]:
    """Discover host RAM and swap memory."""
    mem = psutil.virtual_memory()
    return {
        "totalRamGb": int(round(mem.total / (1024 ** 3))),
        "availableRamGb": int(round(mem.available / (1024 ** 3))),
    }


def get_storage_info() -> Dict[str, Any]:
    """Discover disk storage capacity."""
    disk = psutil.disk_usage(os.path.abspath(os.sep))
    return {
        "totalDiskGb": int(round(disk.total / (1024 ** 3))),
        "freeDiskGb": int(round(disk.free / (1024 ** 3))),
    }


def collect_hardware_profile() -> Dict[str, Any]:
    """Collect complete hardware discovery manifest."""
    return {
        "os": platform.system(),
        "osRelease": platform.release(),
        "cpu": get_cpu_info(),
        "gpus": get_gpu_info(),
        "memory": get_memory_info(),
        "storage": get_storage_info(),
    }
