// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

interface IKSNOracleAdapter {
    function ksnScore(bytes32 assetId) external view returns (uint256);
}

/// @notice Skeleton for tokenized compute-energy revenue rights.
/// @dev This is not production-ready and intentionally omits regulated transfer controls.
contract ComputeEnergyRWA is ERC20, AccessControl, Pausable {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public immutable assetId;
    IKSNOracleAdapter public oracle;

    uint256 public maintenanceBps = 1_800;
    uint256 public insuranceBps = 700;
    uint256 public aiTreasuryBps = 1_500;
    uint256 public planetaryDividendBps = 500;
    uint256 public retainedExpansionBps = 1_000;

    address public maintenanceVault;
    address public insuranceVault;
    address public aiTreasury;
    address public planetaryDividendVault;
    address public expansionVault;

    event YieldPolicyUpdated(
        uint256 maintenanceBps,
        uint256 insuranceBps,
        uint256 aiTreasuryBps,
        uint256 planetaryDividendBps,
        uint256 retainedExpansionBps
    );

    event GrossYieldReported(bytes32 indexed assetId, uint256 grossAmount, uint256 ksnScore);

    constructor(
        string memory name_,
        string memory symbol_,
        bytes32 assetId_,
        address oracle_,
        address admin_,
        address[] memory vaults_
    ) ERC20(name_, symbol_) {
        require(assetId_ != bytes32(0), "invalid asset");
        require(oracle_ != address(0), "invalid oracle");
        require(admin_ != address(0), "invalid admin");
        require(vaults_.length == 5, "five vaults required");
        for (uint256 i = 0; i < vaults_.length; i++) {
            require(vaults_[i] != address(0), "invalid vault");
        }

        assetId = assetId_;
        oracle = IKSNOracleAdapter(oracle_);
        maintenanceVault = vaults_[0];
        insuranceVault = vaults_[1];
        aiTreasury = vaults_[2];
        planetaryDividendVault = vaults_[3];
        expansionVault = vaults_[4];

        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(OPERATOR_ROLE, admin_);
    }

    function mint(address to, uint256 amount) external onlyRole(OPERATOR_ROLE) {
        _mint(to, amount);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function setYieldPolicy(
        uint256 maintenanceBps_,
        uint256 insuranceBps_,
        uint256 aiTreasuryBps_,
        uint256 planetaryDividendBps_,
        uint256 retainedExpansionBps_
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 reserved = maintenanceBps_ + insuranceBps_ + aiTreasuryBps_ + planetaryDividendBps_ + retainedExpansionBps_;
        require(reserved <= 9_500, "excessive reserved yield");
        maintenanceBps = maintenanceBps_;
        insuranceBps = insuranceBps_;
        aiTreasuryBps = aiTreasuryBps_;
        planetaryDividendBps = planetaryDividendBps_;
        retainedExpansionBps = retainedExpansionBps_;
        emit YieldPolicyUpdated(maintenanceBps_, insuranceBps_, aiTreasuryBps_, planetaryDividendBps_, retainedExpansionBps_);
    }

    /// @notice Records a gross yield event. Actual payment routing is intentionally left to integration code.
    function reportGrossYield(uint256 grossAmount) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        uint256 score = oracle.ksnScore(assetId);
        emit GrossYieldReported(assetId, grossAmount, score);
    }

    function humanInvestorBps() public view returns (uint256) {
        return 10_000 - maintenanceBps - insuranceBps - aiTreasuryBps - planetaryDividendBps - retainedExpansionBps;
    }

    /// @dev Pausing freezes token movement as well as operational reporting.
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
}
