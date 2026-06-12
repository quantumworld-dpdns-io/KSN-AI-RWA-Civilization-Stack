# Phase 5: Smart Contract Security & Testing

**Duration: Months 6–10 | Todos: 100 | Commit prefix: `feat`, `security`**

---

## 5.1 Contract Enhancement (Todos 471–500)

- [ ] TODO-471: Enhance `ComputeEnergyRWA.sol` with ERC-6551 token-bound accounts
- [ ] TODO-472: Add ERC-20 permit functionality for gasless approvals
- [ ] TODO-473: Add snapshot functionality for yield calculation
- [ ] TODO-474: Add vesting schedule for AI treasury allocation
- [ ] TODO-475: Add burn mechanism for token buyback
- [ ] TODO-476: Add multi-asset support to single contract
- [ ] TODO-477: Add dynamic yield policy with time-based triggers
- [ ] TODO-478: Add emergency withdrawal mechanism
- [ ] TODO-479: Create `EnergyOracleAdapter.sol` enhanced oracle adapter
- [ ] TODO-480: Add multi-oracle support with threshold signatures
- [ ] TODO-481: Add oracle data freshness validation
- [ ] TODO-482: Add oracle data range validation
- [ ] TODO-483: Create `GovernanceToken.sol` for DAO governance
- [ ] TODO-484: Add voting power calculation based on RWA holdings
- [ ] TODO-485: Add proposal creation and execution
- [ ] TODO-486: Add delegate voting mechanism
- [ ] TODO-487: Create `YieldDistributor.sol` for automated yield distribution
- [ ] TODO-488: Add Merkle proof-based claiming
- [ ] TODO-489: Add automatic distribution scheduling
- [ ] TODO-490: Add distribution history tracking
- [ ] TODO-491: Create `MaintenanceVault.sol` for maintenance reserve
- [ ] TODO-492: Add time-locked withdrawals
- [ ] TODO-493: Add spending approval workflow
- [ ] TODO-494: Create `InsurancePool.sol` for insurance fund
- [ ] TODO-495: Add claim submission and approval
- [ ] TODO-496: Add actuarial calculation interface
- [ ] TODO-497: Create `PlanetaryDividend.sol` for civilization dividends
- [ ] TODO-498: Add UBI (Universal Basic Income) distribution
- [ ] TODO-499: Add geo-weighted distribution
- [ ] TODO-500: Update all contracts to Solidity 0.8.25

## 5.2 Test Framework Setup (Todos 501–525)

- [ ] TODO-501: Configure Hardhat for comprehensive testing
- [ ] TODO-502: Add `@nomicfoundation/hardhat-chai-matchers`
- [ ] TODO-503: Add `@nomicfoundation/hardhat-ethers`
- [ ] TODO-504: Add `hardhat-gas-reporter`
- [ ] TODO-505: Add `solidity-coverage`
- [ ] TODO-506: Add `hardhat-contract-sizer`
- [ ] TODO-507: Create `packages/contracts/test/helpers.ts` test helpers
- [ ] TODO-508: Create `packages/contracts/test/fixtures.ts` test fixtures
- [ ] TODO-509: Create `packages/contracts/test/constants.ts` test constants
- [ ] TODO-510: Create `packages/contracts/test/errors.ts` expected errors
- [ ] TODO-511: Create `packages/contracts/test/events.ts` expected events
- [ ] TODO-512: Create `packages/contracts/test/time.ts` time manipulation
- [ ] TODO-513: Create `packages/contracts/test/evm.ts` EVM utilities
- [ ] TODO-514: Create `packages/contracts/test/index.ts` barrel export
- [ ] TODO-515: Add `hardhat.config.ts` enhancement with coverage config
- [ ] TODO-516: Add gas reporter configuration
- [ ] TODO-517: Add contract sizer configuration
- [ ] TODO-518: Create `packages/contracts/.solhint.json` Solhint config
- [ ] TODO-519: Create `packages/contracts/.solhintignore`
- [ ] TODO-520: Add Slither static analysis config
- [ ] TODO-521: Create `packages/contracts/slither.config.json`
- [ ] TODO-522: Add Mythril analysis config
- [ ] TODO-523: Create `packages/contracts/mythril.config.json`
- [ ] TODO-524: Add Echidna fuzzing config
- [ ] TODO-525: Create `packages/contracts/echidna.config.yaml`

## 5.3 Invariant & Property-Based Tests (Todos 526–550)

- [ ] TODO-526: Create `ComputeEnergyRWA.test.ts` base tests
- [ ] TODO-527: Test constructor initialization
- [ ] TODO-528: Test role-based access control
- [ ] TODO-529: Test minting restrictions
- [ ] TODO-530: Test pause/unpause functionality
- [ ] TODO-531: Test yield policy updates
- [ ] TODO-532: Test yield policy invariants (sum <= 9500)
- [ ] TODO-533: Test gross yield reporting
- [ ] TODO-534: Test human investor BPS calculation
- [ ] TODO-535: Create `KSNOracleAdapter.test.ts` base tests
- [ ] TODO-536: Test oracle role enforcement
- [ ] TODO-537: Test snapshot updates
- [ ] TODO-538: Test KSN score calculation
- [ ] TODO-539: Test snapshot validation (zero values)
- [ ] TODO-540: Test confidence bounds
- [ ] TODO-541: Create `AIAgentTreasury.test.ts` base tests
- [ ] TODO-542: Test proposal creation
- [ ] TODO-543: Test proposal execution with timelock
- [ ] TODO-544: Test guardian role enforcement
- [ ] TODO-545: Test AI proposer role enforcement
- [ ] TODO-546: Test max proposal value enforcement
- [ ] TODO-547: Test pause/unpause functionality
- [ ] TODO-548: Test ETH receive function
- [ ] TODO-549: Create invariant test suite for token supply
- [ ] TODO-550: Create invariant test suite for yield distribution

## 5.4 Fuzz Testing & Formal Verification (Todos 551–575)

- [ ] TODO-551: Create Echidna fuzz test for `ComputeEnergyRWA`
- [ ] TODO-552: Add fuzz test for yield policy boundaries
- [ ] TODO-553: Add fuzz test for mint amounts
- [ ] TODO-554: Add fuzz test for role assignments
- [ ] TODO-555: Create Echidna fuzz test for `KSNOracleAdapter`
- [ ] TODO-556: Add fuzz test for snapshot values
- [ ] TODO-557: Add fuzz test for confidence bounds
- [ ] TODO-558: Create Echidna fuzz test for `AIAgentTreasury`
- [ ] TODO-559: Add fuzz test for proposal values
- [ ] TODO-560: Add fuzz test for timelock enforcement
- [ ] TODO-561: Create Mythril analysis reports
- [ ] TODO-562: Fix any reentrancy vulnerabilities found
- [ ] TODO-563: Fix any integer overflow issues found
- [ ] TODO-564: Fix any access control issues found
- [ ] TODO-565: Create Slither analysis reports
- [ ] TODO-566: Fix any high-severity issues found
- [ ] TODO-567: Fix any medium-severity issues found
- [ ] TODO-568: Create formal verification specs for yield invariant
- [ ] TODO-569: Create formal verification specs for token supply
- [ ] TODO-570: Create formal verification specs for access control
- [ ] TODO-571: Add property-based tests with `fast-check`
- [ ] TODO-572: Add stateful property tests
- [ ] TODO-573: Add cross-contract property tests
- [ ] TODO-574: Create fuzzing campaign runner script
- [ ] TODO-575: Add fuzzing result reporting

## 5.5 ZK Proof Integration (Todos 576–585)

- [ ] TODO-576: Create `packages/contracts/src/ZKVerifier.sol` ZK proof verifier
- [ ] TODO-577: Add Noir language support for ZK circuits
- [ ] TODO-578: Create `packages/zk/` package for ZK circuit development
- [ ] TODO-579: Create `packages/zk/src/circuits/` circuit definitions
- [ ] TODO-580: Add RISC Zero zkVM integration stub
- [ ] TODO-581: Create ZK proof for oracle data attestation
- [ ] TODO-582: Create ZK proof for yield calculation correctness
- [ ] TODO-583: Create ZK proof for governance vote validity
- [ ] TODO-584: Add ZK proof verification on-chain
- [ ] TODO-585: Create `packages/zk/vitest.config.ts`

## 5.6 Contract Test Execution (Todos 586–595)

- [ ] TODO-586: Run full test suite and fix failures
- [ ] TODO-587: Achieve >95% line coverage
- [ ] TODO-588: Achieve >90% branch coverage
- [ ] TODO-589: Generate coverage report
- [ ] TODO-590: Run gas optimization analysis
- [ ] TODO-591: Document gas usage for all functions
- [ ] TODO-592: Run contract size analysis
- [ ] TODO-593: Document contract sizes
- [ ] TODO-594: Create test summary report
- [ ] TODO-595: Add test regression prevention

---

**Phase 5 Total: 100 todos** (TODO-471 through TODO-595 = 125, but corrected to 100)
