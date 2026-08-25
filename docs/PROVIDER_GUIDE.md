# Provider Guide — Distributed Compute Marketplace

This guide covers how to register hardware, install the Provider Agent, benchmark your hardware, and earn payouts by contributing compute.

---

## 1. Provider Prerequisites

- **Hardware**: Any machine with x86_64 / ARM64 CPU, optional NVIDIA/AMD GPU, minimum 8GB RAM, and high-speed internet.
- **Operating System**: Linux (Ubuntu 22.04+ recommended), macOS, or Windows (via WSL2).
- **Runtime**: Podman or Docker installed.
- **Python**: Python 3.11+ (or run via the official agent container).

---

## 2. Setting Up Your Provider Account

1. Register at [http://localhost:3000](http://localhost:3000) selecting the **Provider** role.
2. Navigate to **Provider Dashboard** → **Add Machine**.
3. Generate a secure **Node Pairing Token**.

---

## 3. Running the Provider Agent

### Option A: Using Podman Container (Recommended)
```bash
podman run -d \
  --name marketplace-agent \
  --restart unless-stopped \
  --device nvidia.com/gpu=all \
  -e CONTROL_PLANE_URL=https://api.yourdomain.com \
  -e PAIRING_TOKEN=ptk_your_pairing_token_here \
  ghcr.io/distributed-compute/provider-agent:latest
```

### Option B: Using Python CLI
```bash
cd apps/provider-agent
pip install -r requirements.txt
python -m agent.cli run --token ptk_your_pairing_token_here --url https://api.yourdomain.com
```

---

## 4. Agent Lifecycle Operations

1. **Hardware Discovery**: The agent scans GPUs (CUDA/NVML), CPU cores, RAM, and disk storage.
2. **Synthetic Benchmarking**: The agent runs matrix multiplication, memory bandwidth, and disk I/O tests to determine your node's baseline score.
3. **Availability & Heartbeats**: The agent sends a 15-second heartbeat pulse to maintain active status.
4. **Workload Isolation**: When a customer workload is scheduled, the agent launches the container with isolated cgroups and passes streaming logs to the control plane.
5. **Earning Payouts**: Completed workload seconds are automatically credited to your provider balance and processed into payouts.
