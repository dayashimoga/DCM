#!/usr/bin/env sh
set -e

echo "=== Running Autocannon Scale Testing in Podman Container ==="
cd /workspace/tests/load
npm install --no-audit --no-fund
node run-all-load-tests.js
