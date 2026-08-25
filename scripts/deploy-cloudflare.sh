#!/usr/bin/env sh
set -e

echo "=== Distributed Compute Marketplace - Cloudflare Pages Deployer ==="

if [ -z "$CLOUDFLARE_API_TOKEN" ] || [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "⚠️ Warning: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID not found in environment."
  echo "Export them to perform live production deployment, or deploy via GitHub Actions."
fi

echo "[1/3] Building Shared Types..."
npm run build --workspace=@distributed-compute/shared-types

echo "[2/3] Generating Next.js Static Export for Free Cloudflare Pages..."
cd apps/web
npm run build

echo "[3/3] Build completed successfully! Output artifact directory: apps/web/out"
echo "To deploy manually with wrangler, run:"
echo "npx wrangler pages deploy apps/web/out --project-name=distributed-compute"
