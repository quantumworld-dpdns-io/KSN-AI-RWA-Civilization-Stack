#!/bin/bash
set -e

echo "Setting up KSN-AI RWA Civilization Stack..."
echo "1. Installing dependencies..."
pnpm install

echo "2. Building packages..."
pnpm build

echo "3. Copying environment templates..."
if [ ! -f .env ]; then
  cp .env.example .env
fi

echo "4. Checking formatting..."
pnpm check

echo "Setup complete! Run 'make dev' to start the stack."