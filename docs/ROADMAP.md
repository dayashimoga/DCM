# Product Engineering Roadmap — Distributed Compute Marketplace

This roadmap outlines the planned sprint milestones and capabilities.

---

## 📅 Sprint Milestones

- [x] **Sprint 0: Foundation & Core Infrastructure**
  - Monorepo structure, NestJS API skeleton, Next.js 15 Web App (Cloudflare Pages ready), Python Provider Agent skeleton, PostgreSQL + Prisma, Redis, Podman Compose, CI workflows, and documentation suite.
- [ ] **Sprint 1: Authentication & Authorization**
  - JWT auth, refresh token rotation, RBAC (Customer, Provider, Admin, Agent), password hashing with Argon2/Bcrypt, role guards.
- [ ] **Sprint 2: Provider Agent Registration & Discovery**
  - Node pairing token authentication, hardware discovery introspection (NVML, lscpu, psutil), active heartbeat pulse.
- [ ] **Sprint 3: Hardware Verification & Benchmarking Suite**
  - Synthetic compute, memory bandwidth, and disk I/O benchmarks, normalized score algorithm v1.0, anti-spoofing verification.
- [ ] **Sprint 4: Marketplace Discovery & Search Engine**
  - Rich marketplace UI, dynamic filtering (GPU model, VRAM, price, reliability), sorting algorithms, real-time node availability.
- [ ] **Sprint 5: Workload Submission & Container Execution**
  - OCI/Docker container workload specification, scheduling dispatch, isolated execution sandbox on provider, log streaming.
- [ ] **Sprint 6: Intelligent Scheduler**
  - Multi-objective optimization (cheapest, max performance, best value, highest reliability), constraint evaluation, race-safe node locking.
- [ ] **Sprint 7: Usage Metering & Billing Engine**
  - Sub-minute precision usage tracking, immutable billing ledger, platform fee calculation, provider earnings calculation.
- [ ] **Sprint 8: Payments & Escrow**
  - Payment provider abstraction, wallet balances, automatic invoice generation, payment capture.
- [ ] **Sprint 9: Provider Payouts & Earnings Dashboard**
  - Payout ledger, withdrawal requests, provider earnings visual analytics (today, 7d, 30d, all-time).
- [ ] **Sprint 10: Security Hardening & Isolation Review**
  - Rootless Podman execution, network egress limits, seccomp profiles, rate limiting, audit logs, SAST scanning.
- [ ] **Sprint 11: Observability & Telemetry**
  - OpenTelemetry distributed tracing, Prometheus metrics, Grafana dashboards, node health alert rules.
- [ ] **Sprint 12: Trust & Reputation System**
  - Algorithmic provider scoring based on uptime, job completion, latency, and verified customer reviews.
- [ ] **Sprint 13: Customer API & Developer SDK**
  - API keys, TypeScript & Python SDKs, developer CLI for programmatic workload orchestration.
- [ ] **Sprint 14: Production Infrastructure & IaC**
  - Terraform configurations, Kubernetes deployment manifests, automated database backup and disaster recovery.
- [ ] **Sprint 15: Performance, Stress & Scale Testing**
  - 10,000 node concurrency load testing, API latency profiling, scheduler optimization.
- [ ] **Sprint 16: Production Readiness & Launch**
  - Final end-to-end acceptance testing, security compliance audit, production deployment verification.
