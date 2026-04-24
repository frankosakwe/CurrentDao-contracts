// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./../structures/SecurityStructs.sol";

/**
 * @title IAdvancedSecurity
 * @dev Interface for advanced security features with zero-knowledge proofs and privacy-preserving mechanisms
 * @author CurrentDao Security Team
 */
interface IAdvancedSecurity {
    // Events
    event ZKProofGenerated(
        bytes32 indexed proofId,
        address indexed verifier,
        bytes32 commitment,
        uint256 timestamp
    );
    
    event PrivateTransactionExecuted(
        bytes32 indexed txHash,
        address indexed sender,
        address indexed receiver,
        bytes32 nullifier,
        uint256 timestamp
    );
    
    event SMPCComputationInitiated(
        bytes32 indexed computationId,
        address[] participants,
        bytes32 computationHash,
        uint256 timestamp
    );
    
    event ConfidentialTransactionProcessed(
        bytes32 indexed txId,
        bytes32 commitment,
        bytes32 nullifier,
        uint256 timestamp
    );
    
    event PrivacyAuditTrailUpdated(
        bytes32 indexed auditId,
        address indexed user,
        bytes32 transactionHash,
        uint256 complianceLevel,
        uint256 timestamp
    );

    // Zero-Knowledge Proof Functions
    function generateZKProof(
        SecurityStructs.ZKProofInput calldata input
    ) external returns (bytes32 proofId);
    
    function verifyZKProof(
        bytes32 proofId,
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external view returns (bool isValid);
    
    function revokeZKProof(bytes32 proofId) external;

    // Privacy-Preserving Transaction Functions
    function executePrivateTransaction(
        SecurityStructs.PrivateTx calldata transaction
    ) external returns (bytes32 txHash);
    
    function verifyPrivateTransaction(
        bytes32 txHash,
        bytes calldata proof
    ) external view returns (bool isValid);
    
    function getTransactionPrivacy(bytes32 txHash) external view returns (SecurityStructs.PrivacyLevel);

    // Secure Multi-Party Computation Functions
    function initiateSMPC(
        address[] calldata participants,
        bytes32 computationHash,
        bytes calldata encryptedInputs
    ) external returns (bytes32 computationId);
    
    function submitSMPCShare(
        bytes32 computationId,
        bytes calldata encryptedShare
    ) external returns (bool completed);
    
    function getSMPCResult(bytes32 computationId) external view returns (bytes memory result);

    // Confidential Transaction Functions
    function processConfidentialTransaction(
        SecurityStructs.ConfidentialTx calldata transaction
    ) external returns (bytes32 txId);
    
    function verifyConfidentialTransaction(
        bytes32 txId,
        bytes calldata rangeProof,
        bytes calldata bulletproof
    ) external view returns (bool isValid);
    
    function getCommitment(bytes32 txId) external view returns (bytes32 commitment);

    // Privacy Audit Trail Functions
    function updatePrivacyAudit(
        address user,
        bytes32 transactionHash,
        uint256 complianceLevel
    ) external returns (bytes32 auditId);
    
    function getPrivacyAudit(bytes32 auditId) external view returns (SecurityStructs.AuditRecord memory);
    
    function verifyCompliance(address user) external view returns (bool isCompliant);

    // Gas Optimization Functions
    function estimatePrivacyCost(
        SecurityStructs.PrivacyOperation operation
    ) external view returns (uint256 gasEstimate);
    
    function optimizeGasUsage(
        bytes32 transactionId,
        SecurityStructs.GasOptimizationStrategy strategy
    ) external returns (uint256 savedGas);

    // Security Integration Functions
    function integrateWithSecuritySystem(
        address securityContract,
        bytes calldata integrationParams
    ) external returns (bool success);
    
    function getSecurityStatus() external view returns (SecurityStructs.SecurityStatus memory);
    
    function emergencyPause() external;
    
    function emergencyUnpause() external;

    // View Functions
    function getZKProof(bytes32 proofId) external view returns (SecurityStructs.ZKProof memory);
    
    function getPrivateTransaction(bytes32 txHash) external view returns (SecurityStructs.PrivateTx memory);
    
    function getSMPCComputation(bytes32 computationId) external view returns (SecurityStructs.SMPCComputation memory);
    
    function getConfidentialTransaction(bytes32 txId) external view returns (SecurityStructs.ConfidentialTx memory);
    
    function getTotalPrivacyTransactions() external view returns (uint256);
    
    function getActiveSMPCComputations() external view returns (uint256);
    
    function getPrivacyComplianceRate() external view returns (uint256);

    // Admin Functions
    function setPrivacyParameters(
        uint256 minPrivacyLevel,
        uint256 maxPrivacyLevel,
        uint256 complianceThreshold
    ) external;
    
    function updateZKVerifier(address verifier) external;
    
    function setSMPCParameters(
        uint256 minParticipants,
        uint256 maxParticipants,
        uint256 timeoutPeriod
    ) external;
    
    function updateCryptographicParameters(
        bytes32 newHashFunction,
        bytes32 newCurveParams
    ) external;
}
