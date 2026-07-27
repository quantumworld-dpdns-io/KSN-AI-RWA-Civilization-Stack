#!/bin/sh
set -eu

exec pnpm --filter @aks/mobile dev "$@"
