# Architecture Specification — Distributed Compute Marketplace

## 1. Architectural Philosophy

The platform is designed as a **Modular Monolith** for the API Control Plane with **outbound-only distributed edge agents**.

Key architectural tenets:
1. **Zero Hardware Ownership**: Aggregation layer only.
2. **Outbound Communication Pattern**: Provider Agents establish outbound WebSocket / HTTPS connections to the Control Plane. No firewall port forwarding or public IPs required on provider nodes.
3. **Execution Sandbox Isolation**: Untrusted customer workloads run inside isolated OCI containers with hardware resource quotas (cgroups, GPU device limits, memory limits).
4. **Deterministic Authoritative Metering**: Usage records are generated via cryptographically signed agent heartbeats and verified server-side.
5. **Portability & Open Source**: Built entirely with open-source tools (NestJS, Next.js, PostgreSQL, Redis, Python, Podman, Prisma).

---

## 2. System Component Topology

```text
                                  ┌───────────────────────────────┐
                                  │       Cloudflare Edge         │
                                  │   (Cloudflare Free Pages)     │
                                  │   Next.js 15 Web Frontend     │
                                  └───────────────┬───────────────┘
                                                  │ HTTPS / WSS
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CONTROL PLANE (NestJS Monolith)                                 │
│                                                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐│
│  │   Auth Module   │ │ Provider Module │ │ Compute Engine  │ │Scheduler Service│ │Billing Core││
│  │  - JWT & Tokens │ │ - Registration  │ │ - Discovery     │ │ - Ranking Engine│ │ - Ledger   ││
│  │  - RBAC Guards  │ │ - Heartbeats    │ │ - Benchmarks    │ │ - Allocation    │ │ - Invoices ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └────────────┘│
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐│
│  │ Job Orchestrator│ │ Payment Gateway │ │ Trust Engine    │ │ Telemetry Svc   │ │API Gateway ││
│  │ - Lifecycle     │ │ - Mock Provider │ │ - Reputation    │ │ - OpenTelemetry │ │ - OpenAPI  ││
│  │ - Queue Mgmt    │ │ - Stripe/Crypto │ │ - Score Version │ │ - Prometheus    │ │ - RateLimit││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └────────────┘│
└─────────────────────────────────┬───────────────────────────────┬───────────────────────────────┘
                                  │                               │
                                  ▼                               ▼
                     ┌────────────────────────┐      ┌────────────────────────┐
                     │   PostgreSQL 16 (DB)   │      │     Redis 7 (Queue)    │
                     │  Prisma ORM & Ledgers  │      │ Cache, PubSub, Locking │
                     └────────────────────────┘      └────────────────────────┘
                                                                  ▲
                                                                  │ Outbound TLS Connection
                                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             PROVIDER NODE (Independent Hardware)                                │
│                                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              Provider Agent Daemon (Python)                               │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────────────────────────┐ │  │
│  │  │ Hardware Discovery  │  │ Benchmark Runner    │  │ Container Runtime Manager          │ │  │
│  │  │ - NVML (NVIDIA GPU) │  │ - Matrix Multiply   │  │ - Podman / Docker Engine           │ │  │
│  │  │ - ROCm (AMD GPU)    │  │ - Memory Bandwidth  │  │ - Resource Sandboxing              │ │  │
│  │  │ - psutil / lscpu    │  │ - Disk IOPS         │  │ - Stream Log Forwarder             │ │  │
│  │  └─────────────────────┘  └─────────────────────┘  └────────────────────────────────────┘ │  │
│  └────────────────────────────────────────┬──────────────────────────────────────────────────┘  │
│                                           │                                                     │
│                                           ▼                                                     │
│                           ┌───────────────────────────────┐                                     │
│                           │   Isolated Container Sandbox  │                                     │
│                           │  (Customer AI/GPU Workload)   │                                     │
│                           └───────────────────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Pipelines

### 3.1 Provider Registration & Discovery Flow
1. Provider installs and runs `provider-agent run --token <PAIRING_TOKEN>`.
2. Agent probes hardware: GPUs (via NVML), CPU cores, RAM, NVMe storage.
3. Agent executes synthetic benchmark suite and calculates raw metrics.
4. Agent submits hardware profile & benchmark evidence over TLS to `/api/v1/providers/register`.
5. API normalizes benchmark score (Algorithm v1.0), assigns provider ID, and marks node `ONLINE`.
6. Agent begins 15-second heartbeat loop to maintain active status in Redis/PostgreSQL.

### 3.2 Customer Job Scheduling & Execution Flow
1. Customer submits job request via Web UI or API (`POST /api/v1/jobs`):
   ```json
   {
     "image": "pytorch/pytorch:2.2.0-cuda12.1-cudnn8-runtime",
     "command": "python train.py",
     "gpuCount": 1,
     "minVramGb": 24,
     "strategy": "BEST_PRICE_PERFORMANCE"
   }
   ```
2. Intelligent Scheduler queries available nodes matching hard constraints.
3. Scheduler scores candidates using the selected strategy:
   $$\text{Score} = w_1 \cdot \text{Cost} + w_2 \cdot \text{Perf} + w_3 \cdot \text{Reliability}$$
4. Scheduler atomically reserves the top node in Redis/Postgres.
5. Workload dispatch event is sent to the assigned Provider Agent over WebSocket.
6. Agent pulls image, creates isolated container with GPU device flags, and streams logs back.
7. Upon completion or stop request, container is cleaned, total resource seconds are committed to the billing ledger.

---

## 4. Database Domain Entity Model (ERD)

```text
+-------------------+       +-------------------+       +--------------------+
|       User        | 1   * |     Provider      | 1   * |    ComputeNode     |
|-------------------|-------|-------------------|-------|--------------------|
| id: UUID          |       | id: UUID          |       | id: UUID           |
| email: String     |       | userId: UUID      |       | providerId: UUID   |
| password: Hash    |       | name: String      |       | name: String       |
| role: Enum        |       | payoutAddress: Str|       | status: NodeStatus |
| balance: Decimal  |       | reputation: Float |       | cpuModel: String   |
+-------------------+       +-------------------+       | cpuCores: Int      |
          | 1                                           | gpuModel: String   |
          |                                             | gpuCount: Int      |
          | *                                           | vramGb: Int        |
+-------------------+                                   | ramGb: Int         |
|        Job        |                                   | diskGb: Int        |
|-------------------|                                   | hourlyRate: Decimal|
| id: UUID          |                                   | benchmarkScore: Int|
| customerId: UUID  |                                   | lastHeartbeat: Time|
| nodeId: UUID      |*                                1 +--------------------+
| image: String     |---------------------------------------------+
| status: JobStatus |
| startedAt: Time   |
| completedAt: Time |
| totalCost: Decimal|
+-------------------+
          | 1
          |
          | *
+-------------------+       +-------------------+
|    UsageRecord    | 1   1 |      Invoice      |
|-------------------|-------|-------------------|
| id: UUID          |       | id: UUID          |
| jobId: UUID       |       | userId: UUID      |
| gpuSeconds: Int   |       | amount: Decimal   |
| cpuSeconds: Int   |       | status: InvStatus |
| rateApplied: Dec  |       | items: JSON       |
+-------------------+       +-------------------+
```

---

## 5. Security Isolation Boundary

1. **Host Isolation**: Customer workloads execute strictly inside rootless OCI containers (Podman/Docker).
2. **Device Sharing Restrictions**: NVIDIA GPU devices are mapped exclusively using `--gpus` device isolation.
3. **Network Constraints**: Provider agents can enforce network policies (allow outbound internet for dataset downloads, block local LAN subnet access `192.168.0.0/16`, `10.0.0.0/8`).
4. **Ephemerality**: Ephemeral volumes are securely wiped after job teardown.
