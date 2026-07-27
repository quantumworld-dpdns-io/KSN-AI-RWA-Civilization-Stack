/// Capability object authorizing an AI agent to operate a microgrid.
module ksn_microgrid::agent_cap;

const EUnauthorizedAgent: u64 = 1;
const EWrongMicrogrid: u64 = 2;

/// Grants an agent permission to update telemetry and trigger treasury actions.
public struct AgentCap has key, store {
    id: UID,
    microgrid_id: ID,
    agent_address: address,
}

public fun create(microgrid_id: ID, agent_address: address, ctx: &mut TxContext): AgentCap {
    AgentCap {
        id: object::new(ctx),
        microgrid_id,
        agent_address,
    }
}

public fun microgrid_id(cap: &AgentCap): ID {
    cap.microgrid_id
}

public fun agent_address(cap: &AgentCap): address {
    cap.agent_address
}

public fun assert_agent(cap: &AgentCap, ctx: &TxContext) {
    assert!(cap.agent_address == ctx.sender(), EUnauthorizedAgent);
}

public fun assert_microgrid(cap: &AgentCap, microgrid_id: ID) {
    assert!(cap.microgrid_id == microgrid_id, EWrongMicrogrid);
}

public fun transfer_to(cap: AgentCap, recipient: address) {
    transfer::public_transfer(cap, recipient);
}
