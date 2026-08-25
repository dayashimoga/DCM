# Deployment Guide — Cloudflare Pages & Production Control Plane

This document details how to deploy the **Distributed Compute Marketplace Web Frontend** to **Cloudflare Free Pages** and the backend control plane to containerized environments.

---

## 1. Deploying Web Frontend to Cloudflare Free Pages

The Next.js frontend (`apps/web`) is optimized for static and edge deployment on Cloudflare Free Pages.

### Method A: Cloudflare Dashboard (Recommended)

1. **Push Code to GitHub**:
   Ensure your code is pushed to your GitHub repository.
2. **Log in to Cloudflare**:
   Navigate to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. **Select Repository**:
   Choose `distributed-compute-marketplace`.
4. **Configure Build Settings**:
   - **Framework Preset**: `Next.js (Static Export)`
   - **Root directory**: `apps/web`
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
5. **Environment Variables**:
   Add the following variable in the Cloudflare Pages settings:
   - `NEXT_PUBLIC_API_URL`: `https://api.yourdomain.com/api/v1` (or your staging API URL)
6. **Deploy**:
   Click **Save and Deploy**. Cloudflare builds and deploys your site to `https://<your-project>.pages.dev` with free global CDN and SSL.

### Method B: Deploy via Wrangler CLI

```bash
# Build static export
cd apps/web
npm run build

# Deploy output directory to Cloudflare Pages
npx wrangler pages deploy out --project-name=distributed-compute-marketplace
```

---

## 2. Deploying NestJS API & Control Plane

The API backend is fully containerized and can be deployed to any container platform:

### 2.1 Podman / Docker Production Build
```bash
podman build -f infrastructure/docker/api.Dockerfile -t marketplace-api:latest .
```

### 2.2 Environment Variables for API Production
```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:password@pg-host:5432/marketplace?schema=public
REDIS_URL=redis://:password@redis-host:6379/0
JWT_SECRET=super-secure-production-secret-min-32-chars
CORS_ORIGIN=https://your-project.pages.dev,https://yourdomain.com
```

---

## 3. Provider Agent Deployment

Providers run the agent on their machines:
```bash
# Using Container
podman run -d \
  --name compute-agent \
  --device nvidia.com/gpu=all \
  -e CONTROL_PLANE_URL=https://api.yourdomain.com \
  -e PAIRING_TOKEN=ptk_... \
  ghcr.io/distributed-compute/provider-agent:latest
```
