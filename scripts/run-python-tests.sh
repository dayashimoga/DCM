#!/usr/bin/env sh
set -e

echo "=== Installing Python Requirements ==="
pip install --no-cache-dir -q -r requirements.txt

echo "=== Running Pytest Suite with Coverage ==="
PYTHONPATH=. pytest -v --cov=agent --cov-report=term-missing

echo "=== Python Suite Successfully Passed! ==="
