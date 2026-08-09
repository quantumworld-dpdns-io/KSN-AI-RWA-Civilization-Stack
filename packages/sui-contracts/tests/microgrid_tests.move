#[test_only]
module ksn_microgrid::microgrid_tests;

use ksn_microgrid::microgrid::{Self, Microgrid, AdminCap};
use ksn_microgrid::agent_cap::AgentCap;
use ksn_microgrid::credential::DividendCredential;
use sui::test_scenario as ts;

const ADMIN: address = @0xA;
const AGENT: address = @0xB;

/// Demo fixture. Seeded deliberately *below* the dividend threshold so the
/// recorded demo starts with a low efficiency score and one cooling upgrade
/// crosses it:
///   S(0) = 15_000_000 * 1e18 / 4.2e14 = 3.571e10  > 3.0e10  → E = 71.40
///   after one -20% cooling tier: 12_000_000 W
///   S(1) = 2.857e10 <= 3.0e10                              → E = 89.25
const SEED_POWER_WATTS: u64 = 15_000_000;
const SEED_HASHRATE: u64 = 420_000_000_000_000;
const SEED_DIVIDEND_THRESHOLD: u64 = 30_000_000_000;
const SEED_BUYOUT_THRESHOLD: u64 = 100_000_000;

fun setup(scenario: &mut ts::Scenario) {
    // tx1: mint admin cap and create the shared microgrid.
    {
        let admin = microgrid::init_for_testing(scenario.ctx());
        microgrid::create_microgrid(
            &admin,
            b"grid",
            b"asset",
            SEED_POWER_WATTS,
            SEED_HASHRATE,
            SEED_DIVIDEND_THRESHOLD,
            SEED_BUYOUT_THRESHOLD,
            scenario.ctx(),
        );
        transfer::public_transfer(admin, ADMIN);
    };
    // tx2: issue an agent cap to AGENT.
    scenario.next_tx(ADMIN);
    {
        let grid = scenario.take_shared<Microgrid>();
        let admin = scenario.take_from_sender<AdminCap>();
        microgrid::issue_agent_cap(&grid, &admin, AGENT, scenario.ctx());
        scenario.return_to_sender(admin);
        ts::return_shared(grid);
    };
}

#[test]
fun test_set_paused_toggles() {
    let mut scenario = ts::begin(ADMIN);
    setup(&mut scenario);

    scenario.next_tx(ADMIN);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let admin = scenario.take_from_sender<AdminCap>();
        assert!(!microgrid::is_paused(&grid));
        microgrid::set_paused(&mut grid, &admin, true);
        assert!(microgrid::is_paused(&grid));
        microgrid::set_paused(&mut grid, &admin, false);
        assert!(!microgrid::is_paused(&grid));
        scenario.return_to_sender(admin);
        ts::return_shared(grid);
    };
    scenario.end();
}

#[test]
#[expected_failure(abort_code = ksn_microgrid::microgrid::EPaused)]
fun test_paused_blocks_telemetry() {
    let mut scenario = ts::begin(ADMIN);
    setup(&mut scenario);

    // Pause the grid.
    scenario.next_tx(ADMIN);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let admin = scenario.take_from_sender<AdminCap>();
        microgrid::set_paused(&mut grid, &admin, true);
        scenario.return_to_sender(admin);
        ts::return_shared(grid);
    };

    // Agent attempt to update telemetry must abort with EPaused.
    scenario.next_tx(AGENT);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let cap = scenario.take_from_sender<AgentCap>();
        microgrid::update_telemetry(&mut grid, &cap, 9_000_000, 420_000_000_000_000, scenario.ctx());
        scenario.return_to_sender(cap);
        ts::return_shared(grid);
    };
    scenario.end();
}

#[test]
fun test_public_stake_mints_receipt() {
    let mut scenario = ts::begin(ADMIN);
    setup(&mut scenario);

    // Any address (AGENT here, holding no capability) can stake SUI.
    scenario.next_tx(AGENT);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let coin = sui::coin::mint_for_testing<sui::sui::SUI>(5_000_000, scenario.ctx());
        microgrid::stake(&mut grid, coin, scenario.ctx());
        assert!(microgrid::treasury_value(&grid) == 5_000_000);
        ts::return_shared(grid);
    };
    // The staker now holds a StakeReceipt token for the staked amount.
    scenario.next_tx(AGENT);
    {
        let receipt = scenario.take_from_sender<ksn_microgrid::microgrid::StakeReceipt>();
        assert!(microgrid::stake_receipt_amount(&receipt) == 5_000_000);
        scenario.return_to_sender(receipt);
    };
    scenario.end();
}

/// The headline demo assertion: the fixture starts below the narrated "85"
/// threshold, and exactly one wallet-signed cooling upgrade carries it across —
/// which is the same moment the microgrid becomes dividend-eligible on-chain.
#[test]
fun test_cooling_upgrade_crosses_threshold() {
    let mut scenario = ts::begin(ADMIN);
    setup(&mut scenario);

    scenario.next_tx(AGENT);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        // Before: 71.40, below the threshold, and not dividend-eligible.
        assert!(microgrid::efficiency_score_bps(&grid) == 7_140);
        assert!(microgrid::efficiency_score_bps(&grid) < microgrid::efficiency_threshold_bps());
        assert!(microgrid::ksn_score(&grid) > microgrid::dividend_threshold(&grid));
        assert!(microgrid::cooling_tier(&grid) == 0);

        let coin = sui::coin::mint_for_testing<sui::sui::SUI>(
            microgrid::cooling_upgrade_price_mist(),
            scenario.ctx(),
        );
        microgrid::upgrade_cooling(&mut grid, coin, scenario.ctx());

        // After: power cut 20%, score crossed 85, dividend gate now open.
        assert!(microgrid::power_watts(&grid) == 12_000_000);
        assert!(microgrid::cooling_tier(&grid) == 1);
        assert!(microgrid::efficiency_score_bps(&grid) >= microgrid::efficiency_threshold_bps());
        assert!(microgrid::ksn_score(&grid) <= microgrid::dividend_threshold(&grid));
        // The upgrade payment funded the treasury.
        assert!(microgrid::treasury_value(&grid) == microgrid::cooling_upgrade_price_mist());
        ts::return_shared(grid);
    };
    // The builder holds a CoolingUpgradeReceipt object for tier 1.
    scenario.next_tx(AGENT);
    {
        let receipt = scenario.take_from_sender<ksn_microgrid::microgrid::CoolingUpgradeReceipt>();
        assert!(microgrid::cooling_upgrade_receipt_tier(&receipt) == 1);
        scenario.return_to_sender(receipt);
    };
    scenario.end();
}

/// The efficiency score is defined so that 85.00 is exactly the dividend gate.
#[test]
fun test_efficiency_score_crosses_at_threshold() {
    let mut scenario = ts::begin(ADMIN);
    setup(&mut scenario);

    scenario.next_tx(AGENT);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        // The dividend gate sits at P = threshold * H / 1e18 = 12_600_000 W.
        // One cooling tier lands at 12_000_000 W, just inside it.
        let coin = sui::coin::mint_for_testing<sui::sui::SUI>(
            microgrid::cooling_upgrade_price_mist(),
            scenario.ctx(),
        );
        microgrid::upgrade_cooling(&mut grid, coin, scenario.ctx());
        // 12_000_000 W → S(t) strictly below threshold → E strictly above 85.
        assert!(microgrid::efficiency_score_bps(&grid) > 8_500);
        // And the score is clamped to 100.00, never above.
        assert!(microgrid::efficiency_score_bps(&grid) <= 10_000);
        ts::return_shared(grid);
    };
    scenario.end();
}

#[test]
#[expected_failure(abort_code = ksn_microgrid::microgrid::EInsufficientPayment)]
fun test_cooling_upgrade_underpayment_aborts() {
    let mut scenario = ts::begin(ADMIN);
    setup(&mut scenario);

    scenario.next_tx(AGENT);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let coin = sui::coin::mint_for_testing<sui::sui::SUI>(
            microgrid::cooling_upgrade_price_mist() - 1,
            scenario.ctx(),
        );
        microgrid::upgrade_cooling(&mut grid, coin, scenario.ctx());
        ts::return_shared(grid);
    };
    scenario.end();
}

#[test]
#[expected_failure(abort_code = ksn_microgrid::microgrid::EMaxCoolingTier)]
fun test_cooling_upgrade_max_tier_aborts() {
    let mut scenario = ts::begin(ADMIN);
    setup(&mut scenario);

    scenario.next_tx(AGENT);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let max = microgrid::max_cooling_tier();
        let mut i = 0u8;
        // MAX_COOLING_TIER upgrades succeed; the next one must abort.
        while (i <= max) {
            let coin = sui::coin::mint_for_testing<sui::sui::SUI>(
                microgrid::cooling_upgrade_price_mist(),
                scenario.ctx(),
            );
            microgrid::upgrade_cooling(&mut grid, coin, scenario.ctx());
            i = i + 1;
        };
        ts::return_shared(grid);
    };
    scenario.end();
}

#[test]
#[expected_failure(abort_code = ksn_microgrid::microgrid::EPaused)]
fun test_paused_blocks_cooling_upgrade() {
    let mut scenario = ts::begin(ADMIN);
    setup(&mut scenario);

    scenario.next_tx(ADMIN);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let admin = scenario.take_from_sender<AdminCap>();
        microgrid::set_paused(&mut grid, &admin, true);
        scenario.return_to_sender(admin);
        ts::return_shared(grid);
    };

    scenario.next_tx(AGENT);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let coin = sui::coin::mint_for_testing<sui::sui::SUI>(
            microgrid::cooling_upgrade_price_mist(),
            scenario.ctx(),
        );
        microgrid::upgrade_cooling(&mut grid, coin, scenario.ctx());
        ts::return_shared(grid);
    };
    scenario.end();
}

/// After the upgrade crosses 85, the agent distributes a dividend on its own —
/// no AdminCap in the transaction — because a human pre-authorized an allowance.
#[test]
fun test_auto_dividend_within_allowance() {
    let mut scenario = ts::begin(ADMIN);
    setup(&mut scenario);

    // Human arms the agent with a 2_000_000 MIST budget.
    scenario.next_tx(ADMIN);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let admin = scenario.take_from_sender<AdminCap>();
        microgrid::set_dividend_allowance(&mut grid, &admin, 2_000_000);
        assert!(microgrid::dividend_allowance(&grid) == 2_000_000);
        scenario.return_to_sender(admin);
        ts::return_shared(grid);
    };

    // A builder upgrades cooling and stakes, funding the treasury.
    scenario.next_tx(AGENT);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let coin = sui::coin::mint_for_testing<sui::sui::SUI>(
            microgrid::cooling_upgrade_price_mist(),
            scenario.ctx(),
        );
        microgrid::upgrade_cooling(&mut grid, coin, scenario.ctx());
        ts::return_shared(grid);
    };

    // The agent acts alone: AgentCap only, no AdminCap argument.
    scenario.next_tx(AGENT);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let cap = scenario.take_from_sender<AgentCap>();
        microgrid::distribute_planetary_dividend_auto(&mut grid, &cap, 1_500_000, scenario.ctx());
        assert!(microgrid::dividend_pool_value(&grid) == 1_500_000);
        // The allowance is spent down monotonically.
        assert!(microgrid::dividend_allowance(&grid) == 500_000);
        scenario.return_to_sender(cap);
        ts::return_shared(grid);
    };
    scenario.end();
}

#[test]
#[expected_failure(abort_code = ksn_microgrid::microgrid::EAllowanceExceeded)]
fun test_auto_dividend_over_allowance_aborts() {
    let mut scenario = ts::begin(ADMIN);
    setup(&mut scenario);

    scenario.next_tx(ADMIN);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let admin = scenario.take_from_sender<AdminCap>();
        microgrid::set_dividend_allowance(&mut grid, &admin, 1_000_000);
        scenario.return_to_sender(admin);
        ts::return_shared(grid);
    };

    scenario.next_tx(AGENT);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let coin = sui::coin::mint_for_testing<sui::sui::SUI>(
            microgrid::cooling_upgrade_price_mist(),
            scenario.ctx(),
        );
        microgrid::upgrade_cooling(&mut grid, coin, scenario.ctx());
        ts::return_shared(grid);
    };

    scenario.next_tx(AGENT);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let cap = scenario.take_from_sender<AgentCap>();
        microgrid::distribute_planetary_dividend_auto(&mut grid, &cap, 1_000_001, scenario.ctx());
        scenario.return_to_sender(cap);
        ts::return_shared(grid);
    };
    scenario.end();
}

/// Allowance alone is not enough: the efficiency threshold still gates payout,
/// so the agent cannot distribute before the cooling upgrade lands.
#[test]
#[expected_failure(abort_code = ksn_microgrid::microgrid::EDividendThresholdNotMet)]
fun test_auto_dividend_below_threshold_aborts() {
    let mut scenario = ts::begin(ADMIN);
    setup(&mut scenario);

    scenario.next_tx(ADMIN);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let admin = scenario.take_from_sender<AdminCap>();
        microgrid::set_dividend_allowance(&mut grid, &admin, 5_000_000);
        scenario.return_to_sender(admin);
        ts::return_shared(grid);
    };

    // Fund the treasury without upgrading cooling — E stays at 71.40.
    scenario.next_tx(AGENT);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let coin = sui::coin::mint_for_testing<sui::sui::SUI>(9_000_000, scenario.ctx());
        microgrid::stake(&mut grid, coin, scenario.ctx());
        ts::return_shared(grid);
    };

    scenario.next_tx(AGENT);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let cap = scenario.take_from_sender<AgentCap>();
        microgrid::distribute_planetary_dividend_auto(&mut grid, &cap, 1_000_000, scenario.ctx());
        scenario.return_to_sender(cap);
        ts::return_shared(grid);
    };
    scenario.end();
}

#[test]
#[expected_failure(abort_code = ksn_microgrid::microgrid::EShareCapExceeded)]
fun test_mint_cannot_exceed_full_share() {
    let mut scenario = ts::begin(ADMIN);
    setup(&mut scenario);

    scenario.next_tx(ADMIN);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let admin = scenario.take_from_sender<AdminCap>();
        // 6000 + 5000 bps = 11000 > 10000 → must abort on the second mint.
        microgrid::mint_credential(&mut grid, &admin, ADMIN, 6_000, scenario.ctx());
        microgrid::mint_credential(&mut grid, &admin, AGENT, 5_000, scenario.ctx());
        scenario.return_to_sender(admin);
        ts::return_shared(grid);
    };
    scenario.end();
}

#[test]
#[expected_failure(abort_code = ksn_microgrid::microgrid::EAlreadyClaimed)]
fun test_cannot_claim_same_round_twice() {
    // ADMIN holds BOTH the AdminCap and the AgentCap here — the demo topology,
    // and the only way one signer can satisfy both the agent check and the
    // human gate on distribute_planetary_dividend.
    let mut scenario = ts::begin(ADMIN);
    {
        let admin = microgrid::init_for_testing(scenario.ctx());
        microgrid::create_microgrid(
            &admin,
            b"grid",
            b"asset",
            8_500_000,
            420_000_000_000_000,
            50_000_000,
            100_000_000,
            scenario.ctx(),
        );
        transfer::public_transfer(admin, ADMIN);
    };
    // Issue agent cap to ADMIN and mint a full-share credential to AGENT.
    scenario.next_tx(ADMIN);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let admin = scenario.take_from_sender<AdminCap>();
        microgrid::issue_agent_cap(&grid, &admin, ADMIN, scenario.ctx());
        microgrid::mint_credential(&mut grid, &admin, AGENT, 10_000, scenario.ctx());
        scenario.return_to_sender(admin);
        ts::return_shared(grid);
    };
    // Deposit, refresh telemetry, and open one dividend round.
    scenario.next_tx(ADMIN);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let admin = scenario.take_from_sender<AdminCap>();
        let cap = scenario.take_from_sender<AgentCap>();
        let coin = sui::coin::mint_for_testing<sui::sui::SUI>(1_000_000, scenario.ctx());
        microgrid::deposit_yield(&mut grid, &cap, coin, scenario.ctx());
        microgrid::update_telemetry(&mut grid, &cap, 1, 420_000_000_000_000, scenario.ctx());
        microgrid::distribute_planetary_dividend(&mut grid, &cap, &admin, 500_000, scenario.ctx());
        scenario.return_to_sender(cap);
        scenario.return_to_sender(admin);
        ts::return_shared(grid);
    };
    // AGENT claims twice in the same round — the second claim must abort.
    scenario.next_tx(AGENT);
    {
        let mut grid = scenario.take_shared<Microgrid>();
        let mut cred = scenario.take_from_sender<DividendCredential>();
        microgrid::claim_dividend(&mut grid, &mut cred, scenario.ctx());
        microgrid::claim_dividend(&mut grid, &mut cred, scenario.ctx());
        scenario.return_to_sender(cred);
        ts::return_shared(grid);
    };
    scenario.end();
}
