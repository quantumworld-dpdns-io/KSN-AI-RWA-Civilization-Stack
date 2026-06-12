// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice Minimal oracle adapter for energy and compute telemetry.
/// @dev Production systems need signed hardware measurements, dispute windows, medianization, and fallback modes.
contract KSNOracleAdapter is AccessControl {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    struct Snapshot {
        uint256 powerWatts;
        uint256 hashrate;
        uint256 timestamp;
        uint256 confidenceBps;
    }

    mapping(bytes32 => Snapshot) public snapshots;

    event SnapshotUpdated(
        bytes32 indexed assetId,
        uint256 powerWatts,
        uint256 hashrate,
        uint256 timestamp,
        uint256 confidenceBps
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
    }

    function updateSnapshot(
        bytes32 assetId,
        uint256 powerWatts,
        uint256 hashrate,
        uint256 confidenceBps
    ) external onlyRole(ORACLE_ROLE) {
        require(assetId != bytes32(0), "invalid asset");
        require(powerWatts > 0, "power required");
        require(hashrate > 0, "hashrate required");
        require(confidenceBps <= 10_000, "confidence overflow");

        snapshots[assetId] = Snapshot({
            powerWatts: powerWatts,
            hashrate: hashrate,
            timestamp: block.timestamp,
            confidenceBps: confidenceBps
        });

        emit SnapshotUpdated(assetId, powerWatts, hashrate, block.timestamp, confidenceBps);
    }

    function ksnScore(bytes32 assetId) external view returns (uint256) {
        Snapshot memory s = snapshots[assetId];
        require(s.hashrate > 0, "missing snapshot");
        return (s.powerWatts * 1e18) / s.hashrate;
    }
}
