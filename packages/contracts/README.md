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

The project pins the Solidity 0.8.24 JavaScript compiler, so compilation is deterministic and does not depend on downloading a compiler during CI.

## Sepolia deployment

1. Use `.env.example` as the variable template and export the values in your shell or CI secret store.
2. Set `SEPOLIA_RPC_URL` and a funded testnet-only `DEPLOYER_PRIVATE_KEY`.
3. Deploy the complete suite:

```bash
pnpm --filter @aks/contracts deploy:sepolia
```

The deployment script refuses any non-local chain except Ethereum Sepolia (`11155111`). It deploys and initializes:

- `KSNOracleAdapter`, including the first Taipei asset snapshot.
- `AIAgentTreasury`, including the deployer’s guarded AI proposer role.
- `ComputeEnergyRWA`, including one million prototype units minted to the deployer.

Addresses and transaction hashes are written to `deployments/sepolia.json` and copied to `apps/web/src/generated/contracts.sepolia.json`. Rebuild the web app after deployment to publish Etherscan links.

Local validation uses an ephemeral Hardhat chain and spends no ETH:

```bash
pnpm --filter @aks/contracts deploy:local
```

## Production warnings

These contracts are not production-ready. Real RWA deployment requires:

- Compliance-aware transfer restrictions.
- Legal wrapper and investor rights documentation.
- Audited payment routing.
- Oracle dispute mechanism.
- Upgrade/kill-switch governance.
- Jurisdiction-specific securities analysis.
