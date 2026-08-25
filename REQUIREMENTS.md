# Requirements Specification — Distributed Compute Marketplace

## 1. Executive Summary

The Distributed Compute Marketplace is an open-source, vendor-neutral compute exchange that aggregates idle GPU and CPU capacity from distributed third-party providers and allows customers to provision, run, and pay for containerized compute workloads on-demand.

---

## 2. System Actors & Roles

### 2.1 Compute Provider
- **Definition**: An entity contributing hardware resources (GPUs, CPUs, RAM, Storage, Bandwidth) to the network.
- **Capabilities**:
  - Download and run the lightweight Provider Agent.
  - Automatic hardware discovery & capability introspection.
  - Automated synthetic benchmarking to verify real compute capacity.
  - Dynamic availability management (online, paused, maintenance).
  - Configurable pricing (per GPU-hour, CPU core-hour, RAM GB-hour).
  - Receive automated earnings calculation and payouts.
  - Real-time hardware health and utilization telemetry.

### 2.2 Compute Customer
- **Definition**: A developer, researcher, or organization leasing compute resources.
- **Capabilities**:
  - Search and filter available compute instances (by GPU architecture, VRAM, CPU cores, RAM, reliability score, geographic region, price).
  - Submit containerized workloads (Docker/OCI images, entrypoints, env vars, resource limits).
  - Automatic optimal node scheduling or manual node selection.
  - Monitor job execution, streaming logs, resource utilization, and health.
  - Secure workload termination and idempotent usage billing.
  - Payment processing via flexible abstractions and invoice generation.

### 2.3 Platform Administrator
- **Definition**: Platform operators supervising marketplace health, security, and economics.
- **Capabilities**:
  - Global user, provider, machine, and job supervision.
  - Platform commission and fee configuration.
  - Dispute resolution and escrow management.
  - Audit logging and threat/abuse detection.

---

## 3. Functional Requirements (FR)

### FR-1: Authentication & Authorization
- **FR-1.1**: JWT-based authentication with secure token refresh lifecycles.
- **FR-1.2**: Role-Based Access Control (RBAC) supporting `CUSTOMER`, `PROVIDER`, `ADMIN`, and `SERVICE_AGENT` roles.
- **FR-1.3**: Cryptographic API Key management for programmatic CLI/SDK access.
- **FR-1.4**: Provider Agent authentication using node-scoped pairing tokens.

### FR-2: Hardware Discovery & Introspection
- **FR-2.1**: CPU detection: Vendor, model, architecture, physical cores, logical threads, base/boost clock.
- **FR-2.2**: GPU detection: Vendor (NVIDIA, AMD), model, VRAM capacity, driver version, CUDA compute capability, PCIe bandwidth.
- **FR-2.3**: Memory & Storage: Total RAM, swap, NVMe/SSD storage capacity and IOPS capabilities.
- **FR-2.4**: Network: Ingress/egress bandwidth and round-trip latency measurements.

### FR-3: Standardized Benchmarking Suite
- **FR-3.1**: Compute synthetic benchmark (FLOPS, matrix multiply, integer throughput).
- **FR-3.2**: GPU VRAM and system memory bandwidth benchmarks.
- **FR-3.3**: Disk sequential & random I/O benchmarks.
- **FR-3.4**: Normalized scoring system (0-1000 scale) with algorithm versioning to prevent score manipulation.

### FR-4: Marketplace & Discovery
- **FR-4.1**: Multi-dimensional search engine with filtering by GPU model, min VRAM, min CPU cores, min RAM, location, price, and reputation.
- **FR-4.2**: Sorting presets: `Cheapest`, `Best Performance`, `Best Price/Performance`, `Highest Reliability`.
- **FR-4.3**: Real-time node availability state engine (`ONLINE`, `BUSY`, `OFFLINE`, `DRAINING`).

### FR-5: Intelligent Scheduler
- **FR-5.1**: Hard constraint evaluation (hardware compatibility, min VRAM, image architecture).
- **FR-5.2**: Soft constraint optimization (pricing, reliability score, geographic proximity).
- **FR-5.3**: Pluggable scheduling strategy interface (`CheapestStrategy`, `PerformanceStrategy`, `ReliabilityStrategy`, `BalancedStrategy`).
- **FR-5.4**: Race-condition safe allocation locking via atomic transactions.

### FR-6: Workload Execution & Isolation
- **FR-6.1**: OCI/Docker container runtime execution.
- **FR-6.2**: Strict resource limits (CPU cgroups, memory limits, NVIDIA GPU device mapping).
- **FR-6.3**: Outbound-only communication from Provider Agent to Control Plane (zero inbound port opening required on provider).
- **FR-6.4**: Real-time container stdout/stderr log streaming and metrics capture.

### FR-7: Metering, Billing & Payments
- **FR-7.1**: Sub-minute granularity usage metering (wall-clock GPU-seconds, CPU-seconds).
- **FR-7.2**: Immutable billing ledger with deterministic calculations.
- **FR-7.3**: Configurable platform commission rate (e.g. 15%).
- **FR-7.4**: Provider earnings ledger and automated payout tracking.
- **FR-7.5**: Payment gateway abstraction with mock development provider.

### FR-8: Trust & Reputation Engine
- **FR-8.1**: Dynamic provider scoring based on uptime, job completion rate, benchmark consistency, and latency.
- **FR-8.2**: Algorithmic penalty for ungraceful node disconnections or failed workloads.
- **FR-8.3**: Verifiable customer ratings and reviews.

---

## 4. Non-Functional Requirements (NFR)

### NFR-1: Security
- Zero customer code execution on bare host without container sandbox isolation.
- Outbound-only agent architecture to eliminate provider firewall exposure.
- Encrypted data transmission via TLS 1.3 / WSS.
- No hardcoded credentials or plaintext secrets.

### NFR-2: Performance & Scalability
- API Gateway latency p95 < 50ms for marketplace queries.
- Scheduling decision latency < 100ms for 10,000 active nodes.
- Lightweight Provider Agent footprint (< 100MB RAM, < 1% idle CPU).

### NFR-3: Reliability & Fault Tolerance
- Automatic job re-queuing upon ungraceful node failure.
- Idempotent API endpoints and message processing.
- Heartbeat timeout detection with automatic node state transition to `OFFLINE`.

### NFR-4: Observability
- OpenTelemetry instrumentation for distributed tracing.
- Structured JSON logging across all microservices.
- Prometheus-compatible metrics endpoint.

### NFR-5: Cross-Platform & Open Source
- 100% open-source software stack (NestJS, Next.js, PostgreSQL, Redis, Python, Podman/Docker).
- Fully deployable on Linux, macOS, and Windows.
- Web frontend optimized for static/edge deployment on Cloudflare Pages.
