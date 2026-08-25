#!/usr/bin/env bash
set -e

echo "================================================================"
echo "  🚀 RUNNING FULL AUTOMATED VALIDATION SUITE (PODMAN RUNNER)    "
echo "================================================================"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "\n[1/6] Verifying Podman Environment..."
podman --version

echo -e "\n[2/6] Running TypeScript Linting, Typecheck & Tests in Node Container..."
podman run --rm -v "${ROOT_DIR}:/workspace:z" -w /workspace docker.io/library/node:20-alpine sh /workspace/scripts/run-node-tests.sh

echo -e "\n[3/6] Running Provider Agent Unit Tests in Python 3.11 Container..."
podman run --rm -v "${ROOT_DIR}:/workspace:z" -w /workspace/apps/provider-agent docker.io/library/python:3.11-slim sh /workspace/scripts/run-python-tests.sh

echo -e "\n[4/6] Validating Podman Image Builds..."
podman build -t marketplace-api:test -f infrastructure/docker/api.Dockerfile .
podman build -t marketplace-agent:test -f infrastructure/docker/agent.Dockerfile .

echo -e "\n[5/6] Verifying Documentation Suite..."
docs=(
    "README.md" "REQUIREMENTS.md" "ARCHITECTURE.md" "API.md"
    "SETUP.md" "CONFIGURATION.md" "SECURITY.md" "TESTING.md"
    "DEPLOYMENT.md" "USER_GUIDE.md" "PROVIDER_GUIDE.md" "CONTRIBUTING.md"
    "ROADMAP.md" "PROJECT_STATUS.md" "GAP_ANALYSIS.md" "CODEBASE_UNDERSTANDING.md"
    "TODO.md" "CHANGELOG.md"
)

for doc in "${docs[@]}"; do
    if [ ! -f "${ROOT_DIR}/${doc}" ]; then
        echo "❌ Missing doc: ${doc}"
        exit 1
    fi
done
echo "✅ All 18 documentation files verified!"

echo -e "\n================================================================"
echo "  🎉 SPRINT 0 VALIDATION COMPLETED SUCCESSFULLY (100% PASS)     "
echo "================================================================"
