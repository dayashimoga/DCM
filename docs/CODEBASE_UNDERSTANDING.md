# Codebase Understanding & Architecture Reference

## 1. System Purpose & Core Domain

The **Distributed Compute Marketplace** aggregates compute resources from distributed third-party providers (NVIDIA/AMD GPUs, high-core CPUs, RAM, and NVMe storage) and provides an automated, secure marketplace where customers can lease capacity for machine learning training, AI inference, and compute-intensive simulations.

---

## 2. Directory Layout & Module Responsibilities

```text
distributed-compute-marketplace/
├── apps/
│   ├── web/                    # Next.js 15 App Router Frontend (Cloudflare Pages compatible)
│   │   ├── src/app/            # App Router pages (Marketplace, Dashboard, Launch, Invoices)
│   │   ├── src/components/     # Modern responsive UI components with glassmorphism
│   │   └── src/lib/            # API client and formatting utilities
│   │
│   ├── api/                    # NestJS API Gateway & Core Control Plane
│   │   ├── src/modules/        # Domain modules (Auth, Providers, Compute, Jobs, Billing)
│   │   ├── src/common/         # Interceptors, Exception Filters, Guards, Decorators
│   │   ├── src/config/         # Environment variable validation
│   │   └── prisma/             # Prisma Schema and Migrations
│   │
│   └── provider-agent/         # Python 3.11+ Hardware Discovery & Execution Daemon
│       ├── agent/              # Discovery, Benchmark, Executor, Telemetry modules
│       └── tests/              # Pytest automated test suite
│
├── packages/
│   ├── shared-types/           # Shared TypeScript interfaces, DTOs, Enums
│   ├── validation/             # Shared validation schemas
│   └── test-utils/             # Test factories and mocks
│
├── infrastructure/
│   ├── docker/                 # Container definitions
│   └── terraform/              # Infrastructure-as-code
│
├── tests/                      # Monorepo-level E2E and integration tests
├── docs/                       # Architectural decisions and guides
└── scripts/                    # Podman automated validation scripts
```

---

## 3. Request & Data Lifecycle

1. **Discovery**: Provider Agent starts on host → detects GPU via NVML / CPU / RAM → runs benchmarks → registers node with API over TLS → node appears on Marketplace.
2. **Scheduling**: Customer submits job requirements → Scheduler evaluates candidate nodes using multi-objective optimization → top compatible node is atomically reserved.
3. **Execution**: Provider Agent receives workload dispatch event → pulls container image → launches isolated container with dedicated GPU/memory quotas → streams logs back to API.
4. **Billing**: Agent reports runtime pulses → API records immutable usage records → customer invoice generated upon job completion → provider balance credited.
