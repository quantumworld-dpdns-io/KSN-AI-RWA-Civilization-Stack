/// KSN microgrid shared object — Scene 3/6/10/12 on Sui.
module ksn_microgrid::microgrid;

use ksn_microgrid::agent_cap::{Self, AgentCap};
use ksn_microgrid::credential::{Self, DividendCredential};
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;

const KSN_SCALE: u64 = 1_000_000_000_000_000_000;

/// Efficiency score is reported in basis points (10_000 = 100.00).
const EFFICIENCY_SCALE_BPS: u64 = 10_000;
/// The efficiency score at which the microgrid becomes dividend-eligible.
/// `efficiency_score_bps` is defined so that E >= 8_500 (85.00) holds exactly
/// when `ksn_score <= dividend_threshold` — the on-chain dividend condition.
/// The narrated "critical threshold of 85" and the contract gate are one fact.
const EFFICIENCY_THRESHOLD_BPS: u64 = 8_500;

/// Price of one cooling upgrade tier, in MIST (0.01 SUI).
const COOLING_UPGRADE_PRICE_MIST: u64 = 10_000_000;
/// Each cooling tier cuts the microgrid's power draw P(t) by 20%.
const COOLING_STEP_BPS: u64 = 2_000;
/// Upper bound on cooling tiers, so P(t) can never be driven to zero.
const MAX_COOLING_TIER: u8 = 5;

const EInvalidTelemetry: u64 = 3;
const EInsufficientTreasury: u64 = 4;
const EDividendThresholdNotMet: u64 = 5;
const EBuyoutThresholdNotMet: u64 = 6;
const EAlreadySovereign: u64 = 7;
const EEmptyDividendPool: u64 = 8;
const EInvalidShare: u64 = 9;
const EWrongMicrogrid: u64 = 10;
const ENotHolder: u64 = 11;
const EPaused: u64 = 12;
const EShareCapExceeded: u64 = 13;
const EAlreadyClaimed: u64 = 14;
const EZeroStake: u64 = 15;
const EInsufficientPayment: u64 = 16;
const EMaxCoolingTier: u64 = 17;
const EAllowanceExceeded: u64 = 18;

public struct Microgrid has key {
    id: UID,
    name: vector<u8>,
    asset_id: vector<u8>,
    power_watts: u64,
    hashrate: u64,
    ksn_score: u64,
    agency_stage: u8,
    sovereign_owner: address,
    dividend_threshold: u64,
    buyout_threshold: u64,
    treasury_balance: Balance<SUI>,
    dividend_pool: Balance<SUI>,
    /// Kill-switch: when true, every state-changing entry function aborts.
    /// Only the human-held AdminCap can toggle it.
    paused: bool,
    /// Sum of share_bps across all issued credentials. Capped at 10_000 (100%)
    /// so total legitimate claims can never exceed the pool (over-issuance guard).
    total_issued_bps: u64,
    /// Monotonic dividend round, bumped each distribution. A credential may claim
    /// each round at most once.
    dividend_round: u64,
    /// Number of cooling upgrades applied. Each tier cuts P(t) by COOLING_STEP_BPS,
    /// which lowers S(t)=P/H and therefore raises the efficiency score.
    cooling_tier: u8,
    /// Human-set spending ceiling for autonomous dividends. The AdminCap holder
    /// arms the agent once with a budget; `distribute_planetary_dividend_auto`
    /// then spends inside that budget without a per-transaction human co-signature,
    /// decrementing it each time. Zero (the default) means the agent may not
    /// distribute autonomously at all.
    dividend_allowance: u64,
}

public struct AdminCap has key, store {
    id: UID,
}

public struct TelemetryUpdated has copy, drop {
    microgrid_id: ID,
    power_watts: u64,
    hashrate: u64,
    ksn_score: u64,
}

public struct YieldDeposited has copy, drop {
    microgrid_id: ID,
    amount: u64,
    treasury_total: u64,
}

public struct BuyoutExecuted has copy, drop {
    microgrid_id: ID,
    sovereign_owner: address,
    treasury_spent: u64,
}

public struct DividendDistributed has copy, drop {
    microgrid_id: ID,
    amount: u64,
    ksn_score: u64,
}

public struct DividendClaimed has copy, drop {
    microgrid_id: ID,
    holder: address,
    amount: u64,
}

public struct PauseToggled has copy, drop {
    microgrid_id: ID,
    paused: bool,
}

/// A token representing SUI a holder staked into the microgrid treasury.
public struct StakeReceipt has key, store {
    id: UID,
    microgrid_id: ID,
    staker: address,
    amount_mist: u64,
}

public struct Staked has copy, drop {
    microgrid_id: ID,
    staker: address,
    amount: u64,
}

/// Proof that a builder paid for a cooling upgrade tier on this microgrid.
public struct CoolingUpgradeReceipt has key, store {
    id: UID,
    microgrid_id: ID,
    tier: u8,
    upgrader: address,
}

public struct CoolingUpgraded has copy, drop {
    microgrid_id: ID,
    upgrader: address,
    tier: u8,
    power_watts: u64,
    ksn_score: u64,
    efficiency_score_bps: u64,
}

public struct DividendAllowanceSet has copy, drop {
    microgrid_id: ID,
    allowance: u64,
}

const STAGE_AI_MANAGED: u8 = 1;
const STAGE_AI_CO_OWNED: u8 = 2;
const STAGE_SOVEREIGN_AI_ASSET: u8 = 3;
const STAGE_KARDASHEV_CONVERGENCE: u8 = 4;

fun init(ctx: &mut TxContext) {
    transfer::transfer(
        AdminCap { id: object::new(ctx) },
        ctx.sender(),
    );
}

public fun create_microgrid(
    _admin: &AdminCap,
    name: vector<u8>,
    asset_id: vector<u8>,
    power_watts: u64,
    hashrate: u64,
    dividend_threshold: u64,
    buyout_threshold: u64,
    ctx: &mut TxContext,
) {
    assert!(hashrate > 0, EInvalidTelemetry);
    let ksn_score = compute_ksn_score(power_watts, hashrate);
    let microgrid = Microgrid {
        id: object::new(ctx),
        name,
        asset_id,
        power_watts,
        hashrate,
        ksn_score,
        agency_stage: STAGE_AI_MANAGED,
        sovereign_owner: ctx.sender(),
        dividend_threshold,
        buyout_threshold,
        treasury_balance: balance::zero(),
        dividend_pool: balance::zero(),
        paused: false,
        total_issued_bps: 0,
        dividend_round: 0,
        cooling_tier: 0,
        dividend_allowance: 0,
    };
    transfer::share_object(microgrid);
}

/// Human kill-switch. Only the AdminCap holder (a human operator) can pause or
/// resume the microgrid. While paused, all agent and holder actions abort.
public fun set_paused(
    microgrid: &mut Microgrid,
    _admin: &AdminCap,
    paused: bool,
) {
    microgrid.paused = paused;
    event::emit(PauseToggled {
        microgrid_id: object::id(microgrid),
        paused,
    });
}

public fun is_paused(microgrid: &Microgrid): bool {
    microgrid.paused
}

public fun update_telemetry(
    microgrid: &mut Microgrid,
    cap: &AgentCap,
    power_watts: u64,
    hashrate: u64,
    ctx: &TxContext,
) {
    assert!(!microgrid.paused, EPaused);
    agent_cap::assert_agent(cap, ctx);
    agent_cap::assert_microgrid(cap, object::id(microgrid));
    assert!(hashrate > 0, EInvalidTelemetry);

    microgrid.power_watts = power_watts;
    microgrid.hashrate = hashrate;
    microgrid.ksn_score = compute_ksn_score(power_watts, hashrate);

    event::emit(TelemetryUpdated {
        microgrid_id: object::id(microgrid),
        power_watts,
        hashrate,
        ksn_score: microgrid.ksn_score,
    });
}

public fun deposit_yield(
    microgrid: &mut Microgrid,
    cap: &AgentCap,
    payment: Coin<SUI>,
    ctx: &TxContext,
) {
    assert!(!microgrid.paused, EPaused);
    agent_cap::assert_agent(cap, ctx);
    agent_cap::assert_microgrid(cap, object::id(microgrid));

    let amount = coin::value(&payment);
    balance::join(&mut microgrid.treasury_balance, coin::into_balance(payment));

    if (microgrid.agency_stage == STAGE_AI_MANAGED && balance::value(&microgrid.treasury_balance) >= microgrid.buyout_threshold / 2) {
        microgrid.agency_stage = STAGE_AI_CO_OWNED;
    };

    event::emit(YieldDeposited {
        microgrid_id: object::id(microgrid),
        amount,
        treasury_total: balance::value(&microgrid.treasury_balance),
    });
}

/// Irreversible ownership transfer. Requires BOTH the agent capability and the
/// human-held AdminCap (the human gate): the transaction can only execute if a
/// human operator co-signs by supplying their AdminCap. This makes the code
/// match the oracle's advertised `humanApprovalRequiredForIssuanceAndOwnership`.
public fun execute_buyout(
    microgrid: &mut Microgrid,
    cap: &AgentCap,
    _admin: &AdminCap,
    ctx: &mut TxContext,
) {
    assert!(!microgrid.paused, EPaused);
    agent_cap::assert_agent(cap, ctx);
    agent_cap::assert_microgrid(cap, object::id(microgrid));
    assert!(microgrid.agency_stage < STAGE_SOVEREIGN_AI_ASSET, EAlreadySovereign);
    assert!(balance::value(&microgrid.treasury_balance) >= microgrid.buyout_threshold, EBuyoutThresholdNotMet);

    let spent = microgrid.buyout_threshold;
    let payout = balance::split(&mut microgrid.treasury_balance, spent);
    transfer::public_transfer(coin::from_balance(payout, ctx), microgrid.sovereign_owner);

    microgrid.sovereign_owner = cap.agent_address();
    microgrid.agency_stage = STAGE_SOVEREIGN_AI_ASSET;

    event::emit(BuyoutExecuted {
        microgrid_id: object::id(microgrid),
        sovereign_owner: microgrid.sovereign_owner,
        treasury_spent: spent,
    });
}

/// Moves treasury funds into the dividend pool. Requires the human-held AdminCap
/// (human gate) in addition to the agent capability, since this is an
/// expensive-to-undo capital movement.
public fun distribute_planetary_dividend(
    microgrid: &mut Microgrid,
    cap: &AgentCap,
    _admin: &AdminCap,
    amount: u64,
    ctx: &TxContext,
) {
    assert!(!microgrid.paused, EPaused);
    agent_cap::assert_agent(cap, ctx);
    agent_cap::assert_microgrid(cap, object::id(microgrid));
    apply_dividend(microgrid, amount);
}

/// Human ceiling for autonomous dividends. The AdminCap holder arms (or disarms,
/// by passing 0) the agent with a total budget it may distribute on its own.
/// This is a *bounded* delegation, not a removal of human control: the ceiling is
/// set by a human, spent down monotonically, and `set_paused` still hard-stops
/// every agent action.
public fun set_dividend_allowance(
    microgrid: &mut Microgrid,
    _admin: &AdminCap,
    amount: u64,
) {
    microgrid.dividend_allowance = amount;
    event::emit(DividendAllowanceSet {
        microgrid_id: object::id(microgrid),
        allowance: amount,
    });
}

/// Autonomous dividend distribution: the agent acts alone, but only inside the
/// allowance a human pre-authorized via `set_dividend_allowance`. Every other
/// guard from the AdminCap path still applies (kill-switch, agent capability,
/// microgrid binding, efficiency threshold, treasury sufficiency).
public fun distribute_planetary_dividend_auto(
    microgrid: &mut Microgrid,
    cap: &AgentCap,
    amount: u64,
    ctx: &TxContext,
) {
    assert!(!microgrid.paused, EPaused);
    agent_cap::assert_agent(cap, ctx);
    agent_cap::assert_microgrid(cap, object::id(microgrid));
    assert!(amount <= microgrid.dividend_allowance, EAllowanceExceeded);

    microgrid.dividend_allowance = microgrid.dividend_allowance - amount;
    apply_dividend(microgrid, amount);
}

/// Shared body of both dividend paths: enforces the efficiency threshold and
/// treasury sufficiency, then moves capital and opens a new claim round.
fun apply_dividend(microgrid: &mut Microgrid, amount: u64) {
    assert!(microgrid.ksn_score <= microgrid.dividend_threshold, EDividendThresholdNotMet);
    assert!(balance::value(&microgrid.treasury_balance) >= amount, EInsufficientTreasury);

    let payout = balance::split(&mut microgrid.treasury_balance, amount);
    balance::join(&mut microgrid.dividend_pool, payout);
    // Open a new dividend round so each credential can claim exactly once.
    microgrid.dividend_round = microgrid.dividend_round + 1;

    if (microgrid.agency_stage == STAGE_SOVEREIGN_AI_ASSET) {
        microgrid.agency_stage = STAGE_KARDASHEV_CONVERGENCE;
    };

    event::emit(DividendDistributed {
        microgrid_id: object::id(microgrid),
        amount,
        ksn_score: microgrid.ksn_score,
    });
}

public fun mint_credential(
    microgrid: &mut Microgrid,
    _admin: &AdminCap,
    holder: address,
    share_bps: u64,
    ctx: &mut TxContext,
) {
    assert!(share_bps > 0 && share_bps <= 10_000, EInvalidShare);
    // Enforce that cumulative issued shares never exceed 100%.
    assert!(microgrid.total_issued_bps + share_bps <= 10_000, EShareCapExceeded);
    microgrid.total_issued_bps = microgrid.total_issued_bps + share_bps;
    let credential = credential::create(object::id(microgrid), holder, share_bps, ctx);
    credential::transfer_to(credential, holder);
}

public fun issue_agent_cap(
    microgrid: &Microgrid,
    _admin: &AdminCap,
    agent_address: address,
    ctx: &mut TxContext,
) {
    let cap = agent_cap::create(object::id(microgrid), agent_address, ctx);
    agent_cap::transfer_to(cap, agent_address);
}

#[allow(lint(self_transfer))]
public fun claim_dividend(
    microgrid: &mut Microgrid,
    credential: &mut DividendCredential,
    ctx: &mut TxContext,
) {
    assert!(!microgrid.paused, EPaused);
    assert!(object::id(microgrid) == credential.microgrid_id(), EWrongMicrogrid);
    assert!(credential.holder() == ctx.sender(), ENotHolder);
    // Each credential may claim a given dividend round only once.
    assert!(credential.last_claimed_round() < microgrid.dividend_round, EAlreadyClaimed);
    credential.mark_claimed(microgrid.dividend_round);

    let pool = balance::value(&microgrid.dividend_pool);
    assert!(pool > 0, EEmptyDividendPool);
    let amount = pool * credential.share_bps() / 10_000;
    assert!(amount > 0, EEmptyDividendPool);
    let payout = balance::split(&mut microgrid.dividend_pool, amount);
    transfer::public_transfer(coin::from_balance(payout, ctx), ctx.sender());

    event::emit(DividendClaimed {
        microgrid_id: object::id(microgrid),
        holder: ctx.sender(),
        amount,
    });
}

/// Public staking: anyone can stake SUI into the microgrid treasury and receive
/// a StakeReceipt token representing their contribution. No capability required,
/// so any connected wallet can participate. Honors the kill-switch.
#[allow(lint(self_transfer))]
public fun stake(
    microgrid: &mut Microgrid,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    assert!(!microgrid.paused, EPaused);
    let amount = coin::value(&payment);
    assert!(amount > 0, EZeroStake);
    balance::join(&mut microgrid.treasury_balance, coin::into_balance(payment));

    let receipt = StakeReceipt {
        id: object::new(ctx),
        microgrid_id: object::id(microgrid),
        staker: ctx.sender(),
        amount_mist: amount,
    };
    transfer::public_transfer(receipt, ctx.sender());

    event::emit(Staked {
        microgrid_id: object::id(microgrid),
        staker: ctx.sender(),
        amount,
    });
}

public fun stake_receipt_amount(receipt: &StakeReceipt): u64 {
    receipt.amount_mist
}

/// Permissionless infrastructure upgrade: anyone can pay to install one more
/// tier of cooling. Better cooling cuts the microgrid's power draw P(t) by
/// COOLING_STEP_BPS, which lowers S(t) = P(t)/H(t) and therefore raises the
/// efficiency score toward (and past) the dividend threshold.
///
/// The whole `payment` coin joins the treasury — callers should split exactly
/// `COOLING_UPGRADE_PRICE_MIST` off their gas coin rather than passing a larger
/// coin, since the surplus is not refunded. Honors the kill-switch.
#[allow(lint(self_transfer))]
public fun upgrade_cooling(
    microgrid: &mut Microgrid,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    assert!(!microgrid.paused, EPaused);
    assert!(microgrid.cooling_tier < MAX_COOLING_TIER, EMaxCoolingTier);
    assert!(coin::value(&payment) >= COOLING_UPGRADE_PRICE_MIST, EInsufficientPayment);

    balance::join(&mut microgrid.treasury_balance, coin::into_balance(payment));

    microgrid.power_watts =
        microgrid.power_watts * (EFFICIENCY_SCALE_BPS - COOLING_STEP_BPS) / EFFICIENCY_SCALE_BPS;
    microgrid.cooling_tier = microgrid.cooling_tier + 1;
    microgrid.ksn_score = compute_ksn_score(microgrid.power_watts, microgrid.hashrate);

    let receipt = CoolingUpgradeReceipt {
        id: object::new(ctx),
        microgrid_id: object::id(microgrid),
        tier: microgrid.cooling_tier,
        upgrader: ctx.sender(),
    };
    transfer::public_transfer(receipt, ctx.sender());

    event::emit(CoolingUpgraded {
        microgrid_id: object::id(microgrid),
        upgrader: ctx.sender(),
        tier: microgrid.cooling_tier,
        power_watts: microgrid.power_watts,
        ksn_score: microgrid.ksn_score,
        efficiency_score_bps: efficiency_score_bps(microgrid),
    });
}

public fun cooling_upgrade_receipt_tier(receipt: &CoolingUpgradeReceipt): u8 {
    receipt.tier
}

public fun cooling_upgrade_price_mist(): u64 {
    COOLING_UPGRADE_PRICE_MIST
}

public fun max_cooling_tier(): u8 {
    MAX_COOLING_TIER
}

public fun efficiency_threshold_bps(): u64 {
    EFFICIENCY_THRESHOLD_BPS
}

/// Human-facing efficiency score in basis points (10_000 = 100.00), derived from
/// the raw cost metric S(t) = P(t)/H(t), where lower S(t) is better:
///
///     E = min(10_000, 8_500 * dividend_threshold / ksn_score)
///
/// The scaling is chosen so that `E >= 8_500` (i.e. "85") holds exactly when
/// `ksn_score <= dividend_threshold`, the on-chain dividend gate. Crossing 85 and
/// becoming dividend-eligible are therefore the same event, by construction.
public fun efficiency_score_bps(microgrid: &Microgrid): u64 {
    if (microgrid.ksn_score == 0) {
        return EFFICIENCY_SCALE_BPS
    };
    let raw =
        (EFFICIENCY_THRESHOLD_BPS as u128) * (microgrid.dividend_threshold as u128)
            / (microgrid.ksn_score as u128);
    if (raw > (EFFICIENCY_SCALE_BPS as u128)) {
        EFFICIENCY_SCALE_BPS
    } else {
        raw as u64
    }
}

public fun cooling_tier(microgrid: &Microgrid): u8 {
    microgrid.cooling_tier
}

public fun dividend_allowance(microgrid: &Microgrid): u64 {
    microgrid.dividend_allowance
}

public fun dividend_threshold(microgrid: &Microgrid): u64 {
    microgrid.dividend_threshold
}

public fun compute_ksn_score(power_watts: u64, hashrate: u64): u64 {
    if (hashrate == 0) {
        return 0
    };
    ((power_watts as u128) * (KSN_SCALE as u128) / (hashrate as u128)) as u64
}

public fun power_watts(microgrid: &Microgrid): u64 {
    microgrid.power_watts
}

public fun hashrate(microgrid: &Microgrid): u64 {
    microgrid.hashrate
}

public fun ksn_score(microgrid: &Microgrid): u64 {
    microgrid.ksn_score
}

public fun agency_stage(microgrid: &Microgrid): u8 {
    microgrid.agency_stage
}

public fun treasury_value(microgrid: &Microgrid): u64 {
    balance::value(&microgrid.treasury_balance)
}

public fun dividend_pool_value(microgrid: &Microgrid): u64 {
    balance::value(&microgrid.dividend_pool)
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext): AdminCap {
    AdminCap { id: object::new(ctx) }
}

#[test]
fun test_compute_ksn_score() {
    let score = compute_ksn_score(8_500_000, 420_000_000_000_000);
    assert!(score > 0);
}
