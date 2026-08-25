# Technology Decisions Record (ADR)

## 1. Context & Motivation

The goal is to build a high-performance, modular, secure, and production-grade distributed compute marketplace. The architecture must aggregate third-party compute (GPU/CPU) while ensuring strict resource isolation, deterministic billing, and an exceptional user experience.

---

## 2. Decision Log

### ADR 001: Backend Framework — NestJS (TypeScript)
- **Decision**: Select **NestJS (TypeScript)** as the primary backend framework.
- **Rationale**:
  - **Modular Architecture**: Built-in Dependency Injection, Modules, Guards, Interceptors, and Pipes enforce clean separation of concerns and Domain-Driven Design (DDD).
  - **Unified Monorepo Types**: Shares data transfer objects (DTOs), types, and validation schemas directly with the Next.js frontend, preventing contract mismatch bugs.
  - **Microservices Path**: NestJS provides native transport abstraction (Redis, gRPC, RabbitMQ), allowing any module (e.g. Scheduler or Billing) to be broken into independent microservices without rewriting business logic.
  - **OpenAPI / Swagger**: Auto-generates type-safe OpenAPI v3 documentation from decorators.
- **Alternatives Considered**: 
  - *FastAPI (Python)*: Exceptional for standalone AI inference, but lacks the native enterprise module discipline and end-to-end TypeScript sharing with Next.js web clients.

### ADR 002: Frontend Framework — Next.js 15 (React 19) + Cloudflare Pages
- **Decision**: Select **Next.js 15 (App Router)** configured for static/edge deployment compatibility on **Cloudflare Free Pages**.
- **Rationale**:
  - **Speed & Global Latency**: Cloudflare Free Pages delivers instant static assets and edge computing across 300+ global data centers with zero server hosting costs.
  - **Modern Reactive UI**: Supports React Server Components, responsive design, dark mode, glassmorphism, and dynamic animations.
  - **Client-Side API Integration**: Connects dynamically to the NestJS API via configurable environment variables (`NEXT_PUBLIC_API_URL`).
- **Alternatives Considered**: 
  - *Vite + React SPA*: Lacks built-in SSR/SSG optimization and SEO primitives.

### ADR 003: Provider Agent — Python 3.11+ Daemon
- **Decision**: Build the Provider Agent as a lightweight **Python 3.11+** standalone daemon.
- **Rationale**:
  - **GPU & Hardware Ecosystem**: Python has the most mature hardware detection and monitoring libraries (`pynvml` for NVIDIA, `GPUtil`, `psutil`, `py-cpuinfo`, PyTorch benchmark harness).
  - **Cross-Platform**: Runs seamlessly across Linux, Windows (WSL), and macOS.
  - **Outbound Communication**: Communicates with the NestJS backend via HTTPS REST and WebSockets, requiring zero open ports on the provider's machine.

### ADR 004: Container Runtime & Development — Podman
- **Decision**: Utilize **Podman** for all development containers, testing, and containerized workload execution.
- **Rationale**:
  - **100% Open Source & Daemonless**: No proprietary licensing constraints; runs without requiring root privileges.
  - **Rootless Security**: Enhances provider host security by running customer workloads in rootless user namespaces.
  - **OCI Compliant**: Complete compatibility with standard Docker images and Compose manifests.

### ADR 005: Database & ORM — PostgreSQL 16 + Prisma ORM
- **Decision**: Use **PostgreSQL 16** with **Prisma ORM**.
- **Rationale**:
  - **ACID Financial Integrity**: Financial ledgers (metering, invoices, payouts) require strict transactional consistency and constraint enforcement.
  - **Type-Safe Queries**: Prisma generates fully type-safe TypeScript query clients synchronized with database migrations.

### ADR 006: In-Memory Cache & Message Broker — Redis 7
- **Decision**: Use **Redis 7** for caching, rate limiting, node heartbeat leases, and real-time job event pub/sub.
- **Rationale**:
  - Sub-millisecond latency for provider heartbeat lease expiry (TTL-based node liveness).
  - High-throughput pub/sub for streaming job dispatch events to connected provider agents.
