# Local Development Setup Guide

This guide describes how to run and develop the Distributed Compute Marketplace using **Podman** without installing unnecessary host tools.

---

## 1. Prerequisites

1. **Podman** (v4.5+ / v5.0+): Podman client and running Podman machine.
2. **Git**: For version control.

---

## 2. Fast Launch with Podman

### Step 1: Clone Repository
```bash
git clone https://github.com/distributed-compute/marketplace.git
cd marketplace
```

### Step 2: Configure Environment
```bash
# Copy template environment variables
cp .env.example .env
```

### Step 3: Start Services via Podman Compose
```bash
podman compose -f docker-compose.yml up -d
```

This launches:
- `postgres`: PostgreSQL 16 on port `5432`
- `redis`: Redis 7 on port `6379`
- `api`: NestJS API Backend on port `4000`
- `web`: Next.js Web Frontend on port `3000`

---

## 3. Verifying the Setup

1. **API Health Check**:
   ```bash
   curl http://localhost:4000/api/v1/health
   ```
   *Expected Response:*
   ```json
   {
     "status": "ok",
     "services": {
       "database": "connected",
       "redis": "connected"
     }
   }
   ```

2. **Web Frontend**:
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

3. **OpenAPI / Swagger UI**:
   Open [http://localhost:4000/api/docs](http://localhost:4000/api/docs) to explore interactive API documentation.

---

## 4. Running Automated Tests & Validation via Podman

Execute all tests, linter checks, typechecks, and coverage in a disposable container:

```bash
# Windows PowerShell
.\scripts\podman-validate.ps1

# Linux / macOS
./scripts/podman-validate.sh
```
