// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @notice Treasury boundary for AI-generated proposals.
/// @dev The AI cannot execute arbitrary actions directly. It can only submit bounded proposals.
contract AIAgentTreasury is AccessControl, Pausable {
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant AI_PROPOSER_ROLE = keccak256("AI_PROPOSER_ROLE");

    uint256 public maxProposalValue;
    uint256 public proposalDelaySeconds = 1 days;

    struct Proposal {
        address target;
        uint256 value;
        bytes data;
        uint256 executableAfter;
        bool executed;
        string policyHash;
    }

    Proposal[] public proposals;

    event ProposalCreated(uint256 indexed proposalId, address target, uint256 value, string policyHash);
    event ProposalExecuted(uint256 indexed proposalId);

    constructor(address admin, uint256 maxProposalValue_) {
        require(admin != address(0), "invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GUARDIAN_ROLE, admin);
        maxProposalValue = maxProposalValue_;
    }

    receive() external payable {}

    function pause() external onlyRole(GUARDIAN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(GUARDIAN_ROLE) {
        _unpause();
    }

    function propose(address target, uint256 value, bytes calldata data, string calldata policyHash)
        external
        onlyRole(AI_PROPOSER_ROLE)
        whenNotPaused
        returns (uint256 proposalId)
    {
        require(target != address(0), "invalid target");
        require(value <= maxProposalValue, "proposal value too high");
        proposalId = proposals.length;
        proposals.push(Proposal({
            target: target,
            value: value,
            data: data,
            executableAfter: block.timestamp + proposalDelaySeconds,
            executed: false,
            policyHash: policyHash
        }));
        emit ProposalCreated(proposalId, target, value, policyHash);
    }

    function execute(uint256 proposalId) external onlyRole(GUARDIAN_ROLE) whenNotPaused {
        Proposal storage p = proposals[proposalId];
        require(!p.executed, "already executed");
        require(block.timestamp >= p.executableAfter, "delay not elapsed");
        p.executed = true;
        (bool ok,) = p.target.call{value: p.value}(p.data);
        require(ok, "execution failed");
        emit ProposalExecuted(proposalId);
    }
}
