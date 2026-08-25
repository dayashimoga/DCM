# Distributed Compute Marketplace

> **A high-performance, secure, and trustless marketplace and intelligent orchestration platform for distributed GPU/CPU compute capacity.**

[![CI/CD](https://github.com/distributed-compute/marketplace/actions/workflows/ci.yml/badge.svg)](https://github.com/distributed-compute/marketplace/actions)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-yellow)](https://www.python.org/)

---

## 🌟 Overview

The **Distributed Compute Marketplace** connects independent hardware providers with idle GPU/CPU capacity to developers, AI researchers, and enterprises who need affordable, scalable compute. 

The platform operates without owning physical hardware: it serves as the **aggregation, orchestration, scheduling, benchmarking, metering, billing, security, and trust layer**.

### 👥 Primary User Personas

* **Compute Providers**: Connect idle consumer or datacenter hardware (NVIDIA GPUs, AMD GPUs, high-core CPUs, fast NVMe storage) via a lightweight, secure Provider Agent. Earn automated payouts.
* **Compute Customers**: Search, filter, launch, and manage containerized workloads across globally distributed nodes with transparent pricing, guaranteed resource isolation, and deterministic billing.
* **Platform Administrators**: Supervise marketplace health, disputes, payment gateways, payout processing, and security events.

---

## 🏗️ Architecture at a Glance

```text
┌─────────────────────────────────────────────────────────────┐
│                       CUSTOMERS                             │
│       Web Dashboard  │  CLI  │  SDK  │  REST API            │
└──────────────┬───────────────┴───────┬──────────────────────┘
               │                       │
               ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY & CONTROL PLANE              │
│       NestJS Modular Monolith + OpenAPI / Swagger           │
│  - Auth (JWT, RBAC)           - Compute Discovery           │
│  - Intelligent Scheduler      - Metering & Invoicing        │
│  - Provider Management        - Payments & Payouts          │
└──────────────┬───────────────────────┬──────────────────────┘
               │                       │
         ┌─────┴──────┐          ┌─────┴──────┐
         ▼            ▼          ▼            ▼
   ┌───────────┐┌───────────┐┌───────────────────────────────┐
   │PostgreSQL ││   Redis   ││       Cloudflare Pages        │
   │  Storage  ││Queue/Cache││       (Static/Edge Web)       │
   └───────────┘└───────────┘└───────────────────────────────┘
                                       ▲
                                       │ Outbound WSS / HTTPS
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 DISTRIBUTED PROVIDER AGENTS                 │
│              (Python 3.11+ Secure Daemon)                   │
│  - Hardware Discovery (NVML, lscpu, psutil)                 │
│  - Synthetic Benchmarking Suite                             │
│  - Isolated Docker / Container Executor                     │
│  - Real-time Metering & Telemetry                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: v20+ LTS
- **Python**: v3.11+
- **Docker & Docker Compose**: v24+
- **pnpm** or **npm**

### 1. Clone & Setup
```bash
git clone https://github.com/distributed-compute/marketplace.git
cd marketplace
cp .env.example .env
npm run setup
```

### 2. Launch Local Environment
```bash
# Start all backing services (PostgreSQL, Redis) and dev servers
npm run dev
```

* **Web UI**: [http://localhost:3000](http://localhost:3000)
* **API Server**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
* **API Documentation (Swagger)**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
* **Health Check**: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

### 3. Run Automated Validation
```bash
npm run validate
```

---

## 📁 Repository Structure

```text
distributed-compute-marketplace/
├── apps/
│   ├── web/               # Next.js 15 App Router (Deployable to Cloudflare Pages)
│   ├── api/               # NestJS Enterprise API Gateway & Core Services
│   └── provider-agent/    # Python Hardware Discovery & Execution Agent
├── packages/
│   ├── shared-types/      # Shared TypeScript DTOs, Enums, Interfaces
│   ├── validation/        # Zod/Class-Validator schemas
│   └── test-utils/        # Common mocks, fixtures, test factories
├── infrastructure/
│   ├── docker/            # Multi-stage Dockerfiles
│   ├── terraform/         # IaC definitions
│   └── kubernetes/        # K8s deployment manifests
├── tests/
│   ├── unit/              # Unit test suites (>90% coverage)
│   ├── integration/       # DB & Redis integration tests
│   ├── e2e/               # Playwright end-to-end flows
│   └── security/          # Automated security & RBAC tests
├── docs/                  # In-depth architectural & operational documentation
└── scripts/               # Project automation & validation scripts
```

---

## 📖 Documentation Index

- [Architecture Guide](docs/ARCHITECTURE.md)
- [Requirements Specification](docs/REQUIREMENTS.md)
- [API Reference](docs/API.md)
- [Local Setup Guide](docs/SETUP.md)
- [Configuration Reference](docs/CONFIGURATION.md)
- [Provider Guide](docs/PROVIDER_GUIDE.md)
- [User Guide](docs/USER_GUIDE.md)
- [Security Model & Threat Matrix](docs/SECURITY.md)
- [Testing Strategy](docs/TESTING.md)
- [Deployment & Cloudflare Guide](docs/DEPLOYMENT.md)
- [Production Runbook](docs/RUNBOOK_PRODUCTION.md)
- [Security Penetration & SOC2 Audit](docs/SECURITY_AUDIT.md)
- [Codebase Understanding](docs/CODEBASE_UNDERSTANDING.md)
- [Project Status](docs/PROJECT_STATUS.md)
- [Gap Analysis](docs/GAP_ANALYSIS.md)
- [Changelog](docs/CHANGELOG.md)
- [TODO List](docs/TODO.md)
- [Contributing](docs/CONTRIBUTING.md)

---

## 📜 License

Licensed under the Apache License, Version 2.0.
