# Contracts

This package contains Solidity skeletons for the Autonomous Kardashev RWA Stack.

## Contracts

| Contract | Purpose |
|---|---|
| `KSNOracleAdapter.sol` | Stores oracle snapshots of power and hashrate. |
| `ComputeEnergyRWA.sol` | ERC20-like claim token for compute-energy RWA shares. |
| `AIAgentTreasury.sol` | Bounded AI treasury proposal shell with timelock and guardian execution. |

## Compile

```bash
pnpm --filter @aks/contracts compile
```

## Production warnings

These contracts are not production-ready. Real RWA deployment requires:

- Compliance-aware transfer restrictions.
- Legal wrapper and investor rights documentation.
- Audited payment routing.
- Oracle dispute mechanism.
- Upgrade/kill-switch governance.
- Jurisdiction-specific securities analysis.
