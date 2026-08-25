# Changelog — Distributed Compute Marketplace

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2026-08-25 (Documentation Consolidation & E2E Test Suite Expansion)

### Changed
- **Documentation Architecture**: Consolidated all architecture, guides, requirements, setup, security, and tracking documents into the central `docs/` folder, with updated links in root `README.md` and verification scripts.
- **E2E Integration Test Expansion (`apps/api/test/e2e-marketplace-flow.spec.ts`)**:
  - Expanded test coverage from 1 to 5 modular test suites covering full happy-path lifecycle, invalid/expired pairing token rejections, hardware spoofing mitigations, insufficient balance escrow rejections, and developer API key scope validations/revocations.
  - Added `validateApiKey` implementation to `ApiKeyService` with multi-tier Redis and local lookup.
- **Unit Test Suite Growth**: Total unit tests increased to 136 tests across 30 test suites (100% pass rate).

---

## [1.0.0] - 2026-08-25 (Sprint 16 — Production Readiness & Master Release Milestone)

### Added
- **Master End-to-End Integration Test Suite (`apps/api/test/e2e-marketplace-flow.spec.ts`)**:
  - Full automated lifecycle validation across all 12 platform modules: Provider token pairing -> Hardware synthetic benchmarking -> Marketplace catalog search -> Customer deposit & escrow hold -> Multi-objective scheduler placement -> Container sandbox run -> Per-second usage metering -> Escrow settlement (85/15 split) -> Provider payout -> SLA reliability scoring & dispute arbitration -> Security audit log & Prometheus metric exposition -> Developer API key scoped auth.
- **Production Launch Runbook (`docs/RUNBOOK_PRODUCTION.md`)**:
  - Complete Day-1 cluster deployment guide (Terraform, Kubernetes, Cloudflare Pages), monitoring matrix with escalation procedures, and disaster recovery failover plan (RPO $< 5$m, RTO $< 15$m).
- **Security Penetration & Compliance Audit Matrix (`docs/SECURITY_AUDIT.md`)**:
  - Full OWASP API Security Top 10 compliance audit, gVisor container sandbox boundary verification, cryptominer threat mitigation, and SOC2 / ISO 27001 readiness review.
- **Final Master Validation**: 132 API/SDK unit tests passing across all 30 test suites, 23 Python provider agent tests passing with 88% code coverage, 18/18 static export routes for Cloudflare Free Pages, and 100% automated Podman container validation.

---

## [0.16.0] - 2026-08-25 (Sprint 15 — Performance Tuning, Load & Scale Testing)

### Added
- **Multi-Tier High Performance Caching (`apps/api`)**:
  - In-memory / Redis short-TTL cache buffers on `/api/v1/marketplace/nodes` and `/api/v1/marketplace/summary` reducing repeated database roundtrips to $< 5$ms.
  - Connection pool optimizations and query pipeline streamlining.
- **Autocannon Scale Testing Suite (`tests/load`)**:
  - `heartbeat-load.js`: Simulates 500 concurrent provider heartbeats.
  - `marketplace-load.js`: Simulates 1,000 concurrent marketplace searches.
  - `scheduler-load.js`: Simulates 200 concurrent container scheduling evaluations.
  - `run-all-load-tests.js`: Master benchmark runner asserting throughput and P95 $< 50$ms SLA with zero 5xx errors.
- **Containerized Load Test Runner (`scripts/run-load-test.sh`)**:
  - Automated script executing the load test suite inside Podman containers.
- **Testing & Quality**: 131 API and SDK unit tests passing across 29 test suites (including `performance.spec.ts`), 23 Python pytest tests passing with 88% code coverage, and 18/18 static routes generated for Cloudflare Free Pages.

---

## [0.15.0] - 2026-08-25 (Sprint 14 — Production Infrastructure as Code & Kubernetes Manifests)

### Added
- **Terraform Cloud Infrastructure Modules (`infra/terraform`)**:
  - High-availability multi-AZ PostgreSQL RDS cluster (`database.tf`) with automated daily snapshots, read replicas, and SSL enforcement.
  - Multi-AZ ElastiCache Redis cluster (`redis.tf`) for heartbeat TTL leases and distributed locks.
  - VPC network topology, subnets, and zero-trust security groups (`security.tf`).
- **Kubernetes Production Manifests (`infra/k8s`)**:
  - Hardened API Deployment (`api-deployment.yaml`) with dual liveness/readiness probes, pod anti-affinity, non-root security context (`runAsNonRoot: true`, `readOnlyRootFilesystem: true`), and tmpfs mounts.
  - HorizontalPodAutoscaler (`api-hpa.yaml`) scaling 3 to 20 replicas based on CPU/memory utilization.
  - Ingress routing with automated Let's Encrypt TLS termination via cert-manager (`ingress.yaml`) and zero-trust NetworkPolicy (`network-policy.yaml`).
- **Cloudflare Pages Edge CI/CD Automation (`infra/cloudflare` & `.github/workflows`)**:
  - GitHub Actions automated deployment workflow (`deploy-cloudflare.yml`) compiling Next.js static export (`apps/web/out`) and deploying to Cloudflare Free Pages.
  - Wrangler project configuration (`wrangler.toml`) with edge security headers (CSP, HSTS, X-Frame-Options) and immutable asset caching.
- **Testing & Quality**: 129 API and SDK unit tests passing across 28 test suites, 23 Python pytest tests passing with 88% code coverage, and 18/18 static routes generated for Cloudflare Free Pages.

---

## [0.14.0] - 2026-08-25 (Sprint 13 — Customer API & Client SDKs)

### Added
- **Developer API Key Management (`apps/api`)**:
  - Scoped API key generation (`POST /api/v1/api-keys`), listing (`GET /api/v1/api-keys`), and revocation (`DELETE /api/v1/api-keys/:id`).
  - SHA-256 token hashing, Redis caching, and Bearer / `x-api-key` validation headers.
- **TypeScript Client SDK (`packages/sdk-ts`)**:
  - Published `@distributed-compute/sdk` with `DistributedComputeClient` sub-clients (`nodes`, `workloads`, `billing`, `reputation`), retry logic, and full typing.
- **Python Client SDK (`packages/sdk-py`)**:
  - Published `distributed-compute-sdk` with `DistributedComputeClient` supporting Pythonic context managers and request session persistence.
- **Standalone CLI Tool (`packages/cli`)**:
  - Published `@distributed-compute/cli` providing the `dcompute` binary (`dcompute nodes list`, `dcompute run`, `dcompute status`, `dcompute logs`).
- **Developer Portal & API Keys Web UI (`apps/web`)**:
  - Interactive `/developers` dashboard featuring API key generation modal, revocation controls, multi-language code recipes (TypeScript, Python, cURL, CLI), and SDK documentation.
  - Navbar navigation link to "Developers".
- **Testing & Quality**: 129 API and SDK unit tests passing across 28 test suites, 23 Python pytest tests passing with 88% code coverage, and 18/18 static routes generated for Cloudflare Free Pages.

---

## [0.13.0] - 2026-08-25 (Sprint 12 — Trust, Reputation & SLA Enforcement)

### Added
- **Trust & Reputation Engine (`apps/api`)**:
  - Dynamic Node Reliability scoring based on 30-day uptime, job completion rate, and anti-spoofing verification confidence.
  - Provider Reputation Badge classifier (`ELITE_PROVIDER`, `VERIFIED_PROVIDER`, `COMMUNITY_PROVIDER`, `PROBATION`).
  - Customer Dispute Resolution API (`POST /api/v1/reputation/disputes`, `POST /api/v1/reputation/disputes/:id/arbitrate`) with automated telemetry log analysis, provider penalties, and 100% escrow balance refunds.
  - Leaderboard API (`GET /api/v1/reputation/leaderboard`) and SLA summary (`GET /api/v1/reputation/summary`).
- **Trust & Reputation Web UI (`apps/web`)**:
  - Interactive `/trust` dashboard featuring Network Reliability gauges (99.4%), Top Provider Reputation Leaderboard, SLA Contract warranties breakdown (99.5% uptime, 100% escrow protection), and File SLA Claim modal with live arbitration logs.
  - Navbar navigation link to "Trust & SLA".
- **Testing & Quality**: 124 API unit tests passing across 26 test suites, 23 Python pytest tests passing with 88% code coverage, and 17/17 static routes generated for Cloudflare Free Pages.

---

## [0.12.0] - 2026-08-25 (Sprint 11 — Observability, Metrics & Distributed Tracing)

### Added
- **Prometheus Metrics Engine (`apps/api`)**:
  - `GET /metrics`: Standard Prometheus text exposition endpoint (`text/plain; version=0.0.4`) exposing HTTP request totals, active nodes, GPU gauges, active jobs, escrow balances, and P99 latency histograms.
  - `GET /api/v1/metrics/json`: Structured JSON metrics endpoint for UI and APM consumers.
  - `GET /api/v1/metrics/summary`: Aggregated RED metrics (Rate, Errors, Duration) and platform summary.
- **OpenTelemetry Distributed Tracing (`apps/api`)**:
  - `TraceInterceptor`: Automatic `x-trace-id` and `x-span-id` header injection and span waterfall logging.
  - Distributed trace waterfall buffer supporting request traversal tracing from API Gateway → Intelligent Scheduler → Node Container Sandbox.
- **Production Monitoring Templates (`docs/`)**:
  - `docs/grafana-marketplace-overview.json`: Complete Grafana dashboard with panels for fleet health, active workloads, GPU utilization, escrow balances, and latency.
  - `docs/prometheus-alerts.yml`: Alertmanager alert rules for node dropouts, high failure rates, and high P99 latency.
- **Platform Observability Web UI (`apps/web`)**:
  - Interactive `/telemetry` dashboard with live RED metrics cards (Requests/sec, Avg Latency, Error Rate, Exported Metrics), Distributed Trace Waterfall visual timeline, and raw Prometheus scrape viewer.
  - Navbar navigation link to "Telemetry".
- **Testing & Quality**: 115 API unit tests passing across 24 test suites, 23 Python pytest tests passing with 88% code coverage, and 16/16 static routes generated for Cloudflare Free Pages.

---

## [0.11.0] - 2026-08-25 (Sprint 10 — Security Hardening & Sandboxing)

### Added
- **Defense-in-Depth Container Sandboxing (`apps/provider-agent`)**:
  - Hardened OCI execution flags: `--cap-drop=ALL`, `--security-opt=no-new-privileges:true`, `--read-only` root filesystem.
  - Ephemeral scratch memory: `--tmpfs=/tmp:rw,noexec,nosuid,size=512m`.
  - Non-root user constraint: `--user=10001:10001` and fork-bomb prevention: `--pids-limit=1024`.
  - Malicious image blacklist filter rejecting prohibited cryptominer signatures (`xmrig`, `coinhive`, `monero`, `stratum`).
  - gVisor (`runsc`) user-space kernel runtime configuration support.
- **Security Auditing & Threat Telemetry API (`apps/api`)**:
  - `POST /api/v1/security/events`: Threat event ingestion & classification engine.
  - `GET /api/v1/security/audit`: Security audit summary, critical threats blocked counter, and platform compliance score (99.8%).
  - `GET /api/v1/security/policy`: Standard platform sandbox security baseline.
- **Platform Security & Compliance Web UI (`apps/web`)**:
  - Interactive `/security` dashboard with real-time Threat Interception Log, severity filtering (`CRITICAL`, `HIGH`, `LOW`), Sandboxing Architecture blueprint, and SOC2 / ISO 27001 readiness posture.
  - Navbar navigation link to "Security".
- **Testing & Quality**: 109 API unit tests passing across 22 test suites, 23 Python pytest tests passing with 88% code coverage, and 15/15 static routes generated for Cloudflare Free Pages.

---

## [0.10.0] - 2026-08-25 (Sprint 9 — Provider Payouts & Earnings Dashboard)

### Added
- **Automated Provider Payout Pipeline (`apps/api`)**:
  - `POST /api/v1/payouts/request`: Multi-rail provider disbursement processor (Stripe Connect Direct Bank Transfer, Crypto USDC/SOL/ETH).
  - Enforced $50.00 standard minimum payout threshold and real-time balance solvency check.
  - `POST /api/v1/payouts/destinations`: Payout destination registry supporting IBAN / Routing accounts and on-chain crypto wallets.
  - `GET /api/v1/payouts/analytics/:providerId`: Real-time machine ROI, 85/15 revenue split metrics, and 30-day monthly yield forecasting:
    $$\text{Yield} = \text{GPUs} \times \text{Rate} \times 24 \times 30 \times \text{Utilization} \times 0.85$$
- **Provider Payouts & ROI Web UI (`apps/web`)**:
  - Interactive `/provider/payouts` dashboard featuring Available Payout Balance, Total Lifetime Paid Out, and 30-Day Yield cards.
  - Request Payout modal with automated fee calculations and destination selector.
  - Add Payout Destination modal with verification status.
  - Complete Payout Transaction Ledger table.
  - Provider Fleet Dashboard integration with direct "Earnings & Payouts" action link.
- **Testing & Quality**: 103 API unit tests passing across 20 test suites, 22 Python pytest tests passing with 88% code coverage, and 14/14 static routes generated for Cloudflare Free Pages.

---

## [0.9.0] - 2026-08-25 (Sprint 8 — Payments, Crypto/Fiat Escrow & Customer Wallets)

### Added
- **Multi-Rail Payments & Automated Escrow Engine (`apps/api`)**:
  - `POST /api/v1/payments/deposit`: Multi-rail deposit pipeline supporting Credit/Debit cards (Stripe Checkout) and on-chain Crypto (USDC, USDT, ETH, SOL).
  - Deterministic multi-chain crypto deposit address generation.
  - `POST /api/v1/payments/escrows/lock`: Automated budget escrow locking before workload execution.
  - `POST /api/v1/payments/escrows/settle`: Precise cost settlement with 85% Provider / 15% Platform revenue distribution and instant unused escrow buffer refunds.
  - `POST /api/v1/payments/escrows/:jobId/refund`: Full 100% escrow refund on job failure or user cancellation.
  - `GET /api/v1/payments/wallet/:userId`: Complete customer/provider vault summary, active escrow contracts, and transaction ledger.
- **Customer Wallet & Escrow Web UI (`apps/web`)**:
  - Interactive `/wallet` page with Available Balance & Locked Escrow Hold gauges.
  - Multi-Rail Deposit Modal supporting Stripe Card Checkout and instant Crypto QR/address generation.
  - Active Escrow Contracts table with live locked funds tracking.
  - Real-time Transaction Ledger with filter badges (`DEPOSIT`, `ESCROW_LOCK`, `ESCROW_SETTLE`, `ESCROW_REFUND`).
  - Navbar navigation link to "Wallet".
- **Testing & Quality**: 94 API unit tests passing across 18 test suites, 22 Python pytest tests passing with 88% code coverage, and 13/13 static routes generated for Cloudflare Free Pages.

---

## [0.8.0] - 2026-08-25 (Sprint 7 — Usage Metering & Billing Engine)

### Added
- **Usage Metering & Real-Time Billing Engine (`apps/api`)**:
  - `POST /api/v1/billing/tick`: Sub-second telemetry usage metering endpoint calculating exact compute expenditure: $C = \frac{\text{Rate}}{3600} \times \Delta t$.
  - Real-time customer balance deduction with automated workload termination safeguard (`DEPLETED`) on balance exhaustion.
  - Automatic 85% Provider revenue share and 15% marketplace commission split.
  - `GET /api/v1/billing/usage/:customerId`: Real-time compute burn rate ($/hr) and telemetry ledger history.
  - `GET /api/v1/billing/provider-earnings/:providerId`: Gross compute revenue, platform fee deductions, and net pending payouts.
  - `GET /api/v1/billing/invoices/:userId`: Itemized invoice statement generation with line items and subtotal.
  - `POST /api/v1/billing/credits/:userId`: Customer account balance top-up endpoint.
- **Billing & Invoices Web UI (`apps/web`)**:
  - Interactive `/billing` page featuring Available Balance card with quick top-up modal ($25, $50, $100).
  - Active Hourly Burn Rate gauge and total GPU hours counter.
  - Invoices tab with itemized line items, subtotal, and tax/commission breakdown.
  - Provider Revenue Split tab displaying 85/15 distribution models.
  - Navbar navigation link to "Billing".
- **Testing & Quality**: 83 API unit tests passing across 16 test suites, 22 Python pytest tests passing with 88% code coverage, and 12/12 static routes generated for Cloudflare Free Pages.

---

## [0.7.0] - 2026-08-25 (Sprint 6 — Intelligent Multi-Objective Scheduler)

### Added
- **Intelligent Multi-Objective Scheduler Engine (`apps/api`)**:
  - `POST /api/v1/scheduler/evaluate`: Simulates workload placement against live nodes with multi-criteria normalization (Cost $S_{cost}$, Performance $S_{perf}$, Reliability $S_{rel}$).
  - `POST /api/v1/scheduler/schedule`: Dispatches workloads using preset strategies (`CHEAPEST`, `BEST_PERFORMANCE`, `BEST_PRICE_PERFORMANCE`, `HIGHEST_RELIABILITY`) or custom normalized objective weights.
  - `POST /api/v1/scheduler/failover/:nodeId`: Automated failover reconciler migrating active workloads away from dropped provider nodes.
  - `GET /api/v1/scheduler/decisions/:jobId`: Audit explanation for placement decisions.
- **Frontend Strategy Optimizer & Live Simulator (`apps/web`)**:
  - Added Multi-Objective Strategy selector in `/workloads/submit` with live placement score preview.
  - Custom objective weight sliders (Cost % vs Performance % vs Reliability %).
- **Testing & Quality**: 70 API unit tests passing, 22 Python pytest tests passing with 88% code coverage, and 11/11 static routes generated for Cloudflare Free Pages.

---

## [0.6.0] - 2026-08-25 (Sprint 5 — Workload Submission & Container Execution)

### Added
- **Workload Submission & Management API (`apps/api`)**:
  - `POST /api/v1/workloads/jobs`: Customer endpoint to submit container workloads with image, command, environment variables, and GPU count.
  - `GET /api/v1/workloads/jobs`: Retrieve customer's compute workload history and status.
  - `GET /api/v1/workloads/jobs/:jobId`: Get detailed execution profile and cost metrics.
  - `POST /api/v1/workloads/jobs/:jobId/cancel`: Cancel scheduled or active jobs.
  - `GET /api/v1/workloads/jobs/:jobId/logs`: Retrieve stdout/stderr execution log streams.
  - `POST /api/v1/workloads/agent/status`: Provider agent status transition (`RUNNING`, `COMPLETED`, `FAILED`) and log buffer ingestion.
  - `GET /api/v1/workloads/agent/pending/:nodeId`: Node job polling endpoint.
- **Provider Agent OCI / Podman Execution Sandbox (`apps/provider-agent`)**:
  - `agent/sandbox.py`: Isolated container execution engine with GPU device passthrough (`nvidia.com/gpu=all` or `--gpus all`), memory/CPU quotas, non-root security constraints, and real-time stdout/stderr capture.
  - Daemon job execution cycle polling assigned workloads and reporting live execution states.
- **Workload Launch & Inspector Web UI (`apps/web`)**:
  - `/workloads/submit`: Interactive launch wizard with quick presets (PyTorch, CUDA, Transformers, FFmpeg), environment variable builder, and live cost calculation.
  - `/workloads`: Workloads Dashboard with live status cards, duration tracking, cost accumulation, and embedded live terminal log streamer.
  - Navbar navigation link to "Workloads".
- **Testing & Quality**: 59 API unit tests passing, 22 Python pytest tests passing with 88% code coverage, and 11/11 static routes generated for Cloudflare Free Pages.

---

## [0.5.0] - 2026-08-25 (Sprint 4 — Marketplace Discovery & Filtering)

### Added
- **Marketplace Discovery & Search API (`apps/api`)**:
  - `GET /api/v1/marketplace/nodes`: Query and filter compute nodes by GPU model, compute tier, minimum VRAM, price ceiling, and benchmark score with pagination and sorting.
  - `GET /api/v1/marketplace/nodes/:nodeId`: Inspect single node specifications, live telemetry, and verification certificate.
  - `GET /api/v1/marketplace/summary`: Real-time network statistics (total online GPUs, aggregate VRAM, lowest $/hr rate).
- **Marketplace Explorer Web UI (`apps/web`)**:
  - Interactive `/marketplace` search and multi-faceted filtering catalog.
  - Sidebar filters for Compute Tier, VRAM thresholds (16GB, 24GB, 80GB), and hourly price ceiling slider.
  - Multi-column sorting (Lowest Price, Highest Benchmark Score, Highest Price).
  - Compute node cards with accelerator specifications, verified score badges, and direct "Rent Now" action buttons.
- **Testing & Quality**: 50 API unit tests passing, 21 Python pytest tests passing with 92% code coverage, and 9/9 static routes generated for Cloudflare Free Pages.

---

## [0.4.0] - 2026-08-25 (Sprint 3 — Hardware Discovery & Benchmarking Engine)

### Added
- **Synthetic Benchmarking Suite (`apps/provider-agent`)**:
  - Matrix multiplication floating point benchmark measuring real sustained throughput (GFLOPS / TFLOPS).
  - Streaming memory read/write bandwidth benchmark (GB/s).
  - 4KB random persistent storage benchmark (IOPS).
  - Anti-spoofing cryptographic challenge engine (Proof-of-Capability hashing).
- **Compute Tier Classifier**:
  - Classifies nodes into `TIER_1_ENTERPRISE_GPU`, `TIER_2_PRO_GPU`, `TIER_3_CONSUMER_GPU`, and `TIER_4_CPU_ONLY`.
- **Backend Benchmark Verification Module (`apps/api`)**:
  - `POST /api/v1/benchmarks/submit`: Verifies proof-of-work challenge, detects spoofed hardware, and updates certified score.
  - `GET /api/v1/benchmarks/tiers`: Returns standardized compute tier definitions and score thresholds.
  - `GET /api/v1/benchmarks/node/:nodeId`: Returns benchmark audit certificates.
- **Hardware Leaderboard Web UI (`apps/web`)**:
  - Public `/benchmarks` leaderboard with tier filtering, hardware verification badges, and compute tier classification guide.
- **Testing & Quality**: 42 API unit tests passing, 21 Python pytest tests passing with 92% code coverage.

---

## [0.3.0] - 2026-08-25 (Sprint 2 — Provider Registration & Discovery)

### Added
- **Provider Pairing & Node Management**:
  - `POST /api/v1/providers/pairing-tokens`: Cryptographic node-scoped pairing tokens with 1h TTL.
  - `POST /api/v1/providers/nodes/register`: Public onboarding endpoint parsing discovered hardware manifests (CPU, GPUs, RAM, Disk).
  - `POST /api/v1/providers/nodes/heartbeat`: 15-second telemetry keepalive pulse updating availability and hardware health.
  - `GET /api/v1/providers/nodes`: Retrieves provider's connected compute fleet with live telemetry.
- **Provider Agent Daemon (`apps/provider-agent`)**:
  - `agent/client.py`: High-performance HTTP client for registration and heartbeats.
  - `agent/cli.py`: Daemon loop with signal interception (`SIGINT`/`SIGTERM`) notifying control plane of graceful node draining.
- **Provider Dashboard Web UI (`apps/web`)**:
  - Provider Fleet Management (`/provider/dashboard`) with real-time status badges and hardware gauges.
  - Interactive "Add Machine" modal generating one-line Podman commands with pairing token.
  - Navbar navigation link for authenticated providers.
- **Testing & Quality**: 34 Node API tests passing, 17 Python pytest tests passing with 93% code coverage.

---

## [0.2.0] - 2026-08-25 (Sprint 1 — Authentication & Authorization)

### Added
- **JWT & Password Security**: Implemented bcrypt password hashing and JWT access token (1h) / refresh token (7d) signing lifecycles.
- **Authentication Endpoints**:
  - `POST /api/v1/auth/register`: Create accounts with `CUSTOMER` or `PROVIDER` roles.
  - `POST /api/v1/auth/login`: Authenticate users and issue JWT token pairs.
  - `POST /api/v1/auth/refresh`: Token rotation and renewal.
  - `POST /api/v1/auth/logout`: Invalidate sessions.
  - `GET /api/v1/auth/me`: Retrieve authenticated user profile with balance and roles.
- **RBAC Security Layer**:
  - `JwtAuthGuard`: Authenticates Bearer tokens.
  - `RolesGuard` & `@Roles(...)`: Enforces role-based access permissions (`CUSTOMER`, `PROVIDER`, `ADMIN`, `AGENT`).
  - `@CurrentUser()` parameter decorator.
- **Web Authentication UI**:
  - Glassmorphic Login page (`/auth/login`) with real-time error handling.
  - Register page (`/auth/register`) with interactive role selector card (`Customer` vs `Provider`).
  - `AuthProvider` React context with local storage token persistence.
  - Navbar integration displaying user avatar, role badge, and logout action when authenticated.
- **Unit & Integration Test Suite**: 23 passing tests covering auth services, guards, and controllers.

---

## [0.1.0] - 2026-08-25 (Sprint 0 — Foundation & Infrastructure)

### Added
- **Monorepo Architecture**: Setup Turborepo/npm workspaces across `apps/api`, `apps/web`, `apps/provider-agent`, and `packages/shared-types`.
- **NestJS API Gateway**: Skeleton API with global prefix `/api/v1`, OpenAPI / Swagger integration, configuration loader, Prisma PostgreSQL connection service, and Redis cache/heartbeat service.
- **Health Module**: `/api/v1/health` endpoint returning database, Redis, and scheduler operational status.
- **Next.js 15 Web Application**: Modern dark-mode marketplace web application with glassmorphic design system, live stats dashboard, compute node cards, provider onboarding CTA, and Cloudflare Free Pages static export (`out/`).
- **Python Provider Agent**: Standalone Python 3.11+ daemon with CPU discovery (`psutil`), GPU detection (`nvidia-smi` / fallback), synthetic compute benchmarking (FLOPS, memory bandwidth), telemetry pulse generator, and CLI interface (`info`, `benchmark`, `run`).
- **Podman Container Suite**: `docker-compose.yml` defining PostgreSQL 16, Redis 7, API, and Web containers, along with multi-stage `api.Dockerfile`, `web.Dockerfile`, and `agent.Dockerfile`.
- **Cross-Platform Automated Validation**: `scripts/podman-validate.ps1` and `scripts/podman-validate.sh` executing all 6 gates inside Podman containers (Node lint/typecheck/build/tests, Python pytest with 97% coverage, Dockerfile builds, and documentation checks).
- **Comprehensive Documentation Suite**: 18 detailed architectural and operational documents.
