#[test_only]
module ksn_microgrid::microgrid_tests;

use ksn_microgrid::microgrid::{Self, Microgrid, AdminCap};
use ksn_microgrid::agent_cap::AgentCap;
use ksn_microgrid::credential::DividendCredential;
use sui::test_scenario as ts;

const ADMIN: address = @0xA;
const AGENT: address = @0xB;

fun setup(scenario: &mut ts::Scenario) {
    // tx1: mint admin cap and create the shared microgrid.
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
