# API Specification — Distributed Compute Marketplace

Base URL: `/api/v1`  
Protocol: `HTTPS / WSS`  
Content-Type: `application/json`

---

## 1. Authentication & Users

### `POST /api/v1/auth/register`
Create a new user account.
```json
// Request
{
  "email": "customer@example.com",
  "password": "SecurePassword123!",
  "role": "CUSTOMER" // "CUSTOMER" | "PROVIDER"
}

// Response (201 Created)
{
  "user": {
    "id": "c1f93f12-0000-4000-8000-000000000001",
    "email": "customer@example.com",
    "role": "CUSTOMER",
    "createdAt": "2026-08-25T12:00:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

### `POST /api/v1/auth/login`
Authenticate user with email and password.
```json
// Request
{
  "email": "customer@example.com",
  "password": "SecurePassword123!"
}

// Response (200 OK)
{
  "user": { ... },
  "tokens": { ... }
}
```

### `GET /api/v1/auth/me`
Retrieve authenticated user profile. (Requires `Bearer` token)

---

## 2. Provider & Compute Management

### `POST /api/v1/providers/register`
Register a new hardware node from Provider Agent. (Requires Provider Auth)
```json
// Request
{
  "name": "Datacenter-Node-01",
  "cpu": {
    "model": "AMD EPYC 9654 96-Core Processor",
    "cores": 96,
    "threads": 192
  },
  "gpus": [
    {
      "model": "NVIDIA H100 80GB HBM3",
      "vramGb": 80,
      "driverVersion": "550.54.14",
      "cudaVersion": "12.4"
    }
  ],
  "ramGb": 256,
  "diskGb": 2000,
  "pricing": {
    "hourlyRateUsd": 1.95
  },
  "benchmark": {
    "version": "1.0",
    "flopsTflops": 60.5,
    "memoryBandwidthGbps": 2000,
    "score": 940
  }
}

// Response (201 Created)
{
  "nodeId": "node-8899aabb-1122-3344",
  "status": "ONLINE",
  "assignedScore": 940,
  "pairingToken": "ptk_sec_..."
}
```

### `POST /api/v1/providers/heartbeat`
Provider Agent keep-alive pulse (every 15s).
```json
// Request
{
  "nodeId": "node-8899aabb-1122-3344",
  "status": "AVAILABLE", // "AVAILABLE" | "BUSY" | "DRAINING"
  "gpuUtilizationPercent": 12.5,
  "ramUsedGb": 32.0,
  "gpuTemperatureCelsius": 48
}

// Response (200 OK)
{
  "status": "ACK",
  "pendingJob": null
}
```

---

## 3. Compute Discovery & Marketplace

### `GET /api/v1/compute/nodes`
Query and filter available compute nodes.
```text
Query Parameters:
- minVramGb: number (e.g. 24)
- gpuModel: string (e.g. "H100", "RTX 4090")
- maxPrice: number (e.g. 2.50)
- minCores: number (e.g. 16)
- sortBy: "CHEAPEST" | "PERFORMANCE" | "PRICE_PERF" | "RELIABILITY"
- page: number
- limit: number
```

```json
// Response (200 OK)
{
  "total": 42,
  "page": 1,
  "limit": 10,
  "nodes": [
    {
      "id": "node-8899aabb-1122-3344",
      "name": "Node-H100-US-East",
      "gpuModel": "NVIDIA H100 80GB HBM3",
      "gpuCount": 1,
      "vramGb": 80,
      "cpuCores": 96,
      "ramGb": 256,
      "hourlyRateUsd": 1.95,
      "benchmarkScore": 940,
      "reliabilityScore": 99.8,
      "status": "ONLINE"
    }
  ]
}
```

---

## 4. Jobs & Workloads

### `POST /api/v1/jobs`
Submit a compute workload.
```json
// Request
{
  "image": "pytorch/pytorch:2.2.0-cuda12.1-cudnn8-runtime",
  "command": "python train.py --epochs 100",
  "env": {
    "BATCH_SIZE": "64",
    "LEARNING_RATE": "0.0001"
  },
  "gpuCount": 1,
  "minVramGb": 24,
  "nodeId": "node-8899aabb-1122-3344", // Optional: manual selection or omit for auto-schedule
  "strategy": "BEST_PRICE_PERFORMANCE"
}

// Response (201 Created)
{
  "jobId": "job-5500-4400-3300",
  "status": "SCHEDULED",
  "allocatedNodeId": "node-8899aabb-1122-3344",
  "estimatedHourlyCost": 1.95,
  "createdAt": "2026-08-25T12:05:00Z"
}
```

### `GET /api/v1/jobs/:id`
Get job execution status and telemetry.

### `POST /api/v1/jobs/:id/stop`
Stop and terminate a running job, finalizing the billing record.

---

## 5. Billing & Invoices

### `GET /api/v1/billing/usage`
Get usage metrics breakdown for the customer.

### `GET /api/v1/billing/invoices`
List customer billing invoices.

### `GET /api/v1/providers/earnings`
Get provider lifetime and 30-day earnings ledger.

---

## 6. System Health

### `GET /api/v1/health`
Health and readiness check.
```json
// Response (200 OK)
{
  "status": "ok",
  "timestamp": "2026-08-25T12:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "scheduler": "active"
  },
  "uptimeSeconds": 1420
}
```
