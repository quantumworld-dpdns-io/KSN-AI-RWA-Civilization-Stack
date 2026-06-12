#!/bin/bash
set -e

echo "Cleaning project..."
rm -rf node_modules
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
find . -name "dist" -type d -prune -exec rm -rf '{}' +
find . -name ".turbo" -type d -prune -exec rm -rf '{}' +
find . -name "coverage" -type d -prune -exec rm -rf '{}' +

echo "Clean complete."