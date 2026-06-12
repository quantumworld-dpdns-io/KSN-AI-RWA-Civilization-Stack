#!/bin/bash
set -e

echo "Running security scan..."

echo "1. Checking for leaked secrets with gitleaks (if installed)..."
if command -v gitleaks &> /dev/null
then
    gitleaks detect --source . -v
else
    echo "gitleaks not found. Skipping secret scan."
fi

echo "2. Running npm audit..."
pnpm audit || true

echo "Security scan complete."