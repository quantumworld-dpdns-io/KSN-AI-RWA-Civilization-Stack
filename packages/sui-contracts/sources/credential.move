/// Planetary dividend credential for microgrid revenue share.
module ksn_microgrid::credential;

/// Dividend share tied to one microgrid (key-only for controlled transfer).
public struct DividendCredential has key {
    id: UID,
    microgrid_id: ID,
    holder: address,
    share_bps: u64,
}

const EInvalidShare: u64 = 1;

public fun create(
    microgrid_id: ID,
    holder: address,
    share_bps: u64,
    ctx: &mut TxContext,
): DividendCredential {
    assert!(share_bps > 0 && share_bps <= 10_000, EInvalidShare);
    DividendCredential {
        id: object::new(ctx),
        microgrid_id,
        holder,
        share_bps,
    }
}

public fun holder(credential: &DividendCredential): address {
    credential.holder
}

public fun share_bps(credential: &DividendCredential): u64 {
    credential.share_bps
}

public fun microgrid_id(credential: &DividendCredential): ID {
    credential.microgrid_id
}

public fun transfer_to(credential: DividendCredential, recipient: address) {
    transfer::transfer(credential, recipient);
}
