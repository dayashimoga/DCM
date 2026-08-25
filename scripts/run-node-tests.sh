#!/usr/bin/env sh
set -e

echo "=== Installing Dependencies ==="
npm install

echo "=== Building Shared Types ==="
npm run build --workspace=@distributed-compute/shared-types

echo "=== Building TypeScript SDK & CLI ==="
npm run build --workspace=@distributed-compute/sdk
npm run test --workspace=@distributed-compute/sdk
npm run build --workspace=@distributed-compute/cli

echo "=== Generating Prisma Client ==="
cd apps/api
npx prisma generate

echo "=== Running API Unit Tests ==="
npm run test

echo "=== Building Web Application (Static Export for Cloudflare Pages) ==="
cd ../web
npm run build

echo "=== Node & Web Suite Successfully Passed! ==="
