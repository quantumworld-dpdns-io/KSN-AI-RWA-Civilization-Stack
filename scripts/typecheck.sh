#!/bin/bash
set -e

echo "Running full typecheck..."
pnpm -r typecheck
echo "Typecheck passed."