# Configuration Guide — Distributed Compute Marketplace

This document provides a comprehensive reference for all configuration options across the platform.

---

## 1. Global Environment Variables (`.env`)

| Variable | Default Value | Description | Required |
|---|---|---|---|
| `NODE_ENV` | `development` | Environment mode (`development`, `production`, `test`) | Yes |
| `PORT` | `4000` | Port for the NestJS API Server | Yes |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/marketplace?schema=public` | PostgreSQL connection string | Yes |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection URL | Yes |
| `JWT_SECRET` | `dev-jwt-secret-replace-in-production-min-32-chars` | HMAC secret for signing JWT access tokens | Yes |
| `JWT_EXPIRES_IN` | `3600s` | Access token lifespan | No |
| `JWT_REFRESH_SECRET`| `dev-refresh-secret-replace-in-prod` | Secret for refresh tokens | Yes |
| `JWT_REFRESH_EXPIRES_IN`| `7d` | Refresh token lifespan | No |
| `PLATFORM_COMMISSION_RATE` | `0.15` | Platform commission cut (15%) | No |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` | Public API endpoint for Web Frontend | Yes |
| `LOG_LEVEL` | `info` | Logging verbosity (`debug`, `info`, `warn`, `error`) | No |

---

## 2. Web Frontend Configuration (`apps/web`)

Configured in `apps/web/next.config.js` or environment:
- `NEXT_PUBLIC_API_URL`: Directs browser fetch requests to the API Gateway.
- `NEXT_PUBLIC_APP_NAME`: "Distributed Compute Marketplace".

---

## 3. Provider Agent Configuration (`apps/provider-agent`)

Configured via CLI arguments or environment variables:
- `CONTROL_PLANE_URL`: e.g. `https://api.yourdomain.com`
- `PAIRING_TOKEN`: Node pairing secret obtained from Provider Dashboard
- `HEARTBEAT_INTERVAL_SECONDS`: Default `15`
- `BENCHMARK_ON_STARTUP`: `true` or `false`
