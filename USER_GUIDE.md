# Customer User Guide — Distributed Compute Marketplace

Welcome to the Distributed Compute Marketplace. This guide walks you through finding, renting, running, and managing GPU/CPU compute instances.

---

## 1. Creating Your Customer Account

1. Open the Marketplace Web Portal at [http://localhost:3000](http://localhost:3000) (or your Cloudflare Pages URL).
2. Click **Get Started** or **Register**.
3. Select the **Customer** account role.
4. Enter your email and secure password, then click **Create Account**.

---

## 2. Browsing & Filtering Compute Nodes

1. Navigate to the **Browse Compute** marketplace tab.
2. Use the interactive filters to narrow down your requirements:
   - **GPU Architecture**: NVIDIA H100, A100, RTX 4090, AMD MI300X, or CPU-only nodes.
   - **Min VRAM**: Filter by minimum GPU memory (e.g. 24 GB, 80 GB).
   - **Max Price ($/hr)**: Set budget constraints.
   - **Sort Presets**:
     - 💰 *Cheapest*: Lowest hourly cost.
     - ⚡ *Best Performance*: Highest synthetic benchmark score.
     - ⚖️ *Best Value*: Highest benchmark score per dollar.
     - 🛡️ *Most Reliable*: Highest uptime and verified job completion rate.
3. Review machine specifications, real-time benchmark scores, and provider reliability metrics.

---

## 3. Launching a Workload

1. Click **Launch Workload** on a specific node, or click **Create Job** for automatic scheduling.
2. Provide your workload details:
   - **Docker / OCI Image**: e.g., `pytorch/pytorch:2.2.0-cuda12.1-cudnn8-runtime` or `vllm/vllm-openai:latest`
   - **Command / Entrypoint**: e.g., `python -m vllm.entrypoints.openai.api_server --model mistralai/Mistral-7B-Instruct-v0.2`
   - **Environment Variables**: Add any runtime tokens or hyperparameters.
   - **Resource Quotas**: Desired GPU count, CPU cores, RAM.
3. Click **Deploy Workload**. The platform securely provisions the container on the target node.

---

## 4. Monitoring & Teardown

- **Live Logs**: Stream stdout and stderr in real-time from the Job Details page.
- **Resource Graphs**: Monitor real-time GPU utilization, temperature, and RAM usage.
- **Stop / Terminate**: Click **Stop Job** anytime to cleanly stop the container and finalize the billing invoice.
