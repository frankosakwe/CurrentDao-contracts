// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SecurityStructs
 * @dev Data structures for advanced security features
 * @author CurrentDao Security Team
 */
library SecurityStructs {
    
    // Enums
    enum PrivacyLevel {
        NONE,           // 0: No privacy
        LOW,            // 1: Basic privacy
        MEDIUM,         // 2: Standard privacy
        HIGH,           // 3: Enhanced privacy
        MAXIMUM         // 4: Maximum privacy
    }
    
    enum PrivacyOperation {
        ZK_PROOF_GENERATION,
        PRIVATE_TRANSACTION,
        SMPC_COMPUTATION,
        CONFIDENTIAL_TRANSACTION,
        AUDIT_TRAIL_UPDATE
    }
    
    enum GasOptimizationStrategy {
        NONE,
        BATCH_PROCESSING,
        PROOF_AGGREGATION,
        COMPRESSED_COMMITMENTS,
        LAZY_VERIFICATION
    }
    
    enum SMPCStatus {
        NOT_STARTED,
        INITIATED,
        COLLECTING_SHARES,
        COMPUTING,
        COMPLETED,
        FAILED
    }
    
    enum ComplianceLevel {
        NON_COMPLIANT,
        PARTIALLY_COMPLIANT,
        FULLY_COMPLIANT,
        EXEMPT
    }
    
    // Zero-Knowledge Proof Structures
    struct ZKProofInput {
        bytes32[] publicInputs;
        bytes32[] privateInputs;
        bytes32 circuitHash;
        uint256 witness;
        address verifier;
    }
    
    struct ZKProof {
        bytes32 proofId;
        address verifier;
        bytes32 circuitHash;
        bytes32[] publicInputs;
        bytes proof;
        uint256 timestamp;
        bool isValid;
        bool isRevoked;
    }
    
    // Private Transaction Structures
    struct PrivateTx {
        bytes32 senderNullifier;
        bytes32 receiverNullifier;
        bytes32 commitment;
        bytes32 root;
        bytes[] proof;
        uint256 amount;
        address token;
        PrivacyLevel privacyLevel;
        uint256 fee;
        uint256 timestamp;
    }
    
    struct UTXO {
        bytes32 commitment;
        bytes32 nullifier;
        uint256 amount;
        address owner;
        bool isSpent;
        uint256 timestamp;
    }
    
    // Secure Multi-Party Computation Structures
    struct SMPCComputation {
        bytes32 computationId;
        address[] participants;
        bytes32 computationHash;
        bytes[] encryptedInputs;
        bytes[] shares;
        bytes result;
        SMPCStatus status;
        uint256 initiatedAt;
        uint256 completedAt;
        uint256 minParticipants;
        uint256 maxParticipants;
        uint256 timeoutPeriod;
    }
    
    struct SMPCShare {
        bytes32 computationId;
        address participant;
        bytes encryptedShare;
        bool isSubmitted;
        uint256 submittedAt;
    }
    
    // Confidential Transaction Structures
    struct ConfidentialTx {
        bytes32 txId;
        bytes32 inputCommitment;
        bytes32 outputCommitment;
        bytes32[] inputNullifiers;
        bytes32[] outputCommitments;
        bytes rangeProof;
        bytes bulletproof;
        uint256 fee;
        address token;
        uint256 timestamp;
        bool isVerified;
    }
    
    struct Commitment {
        bytes32 commitment;
        bytes32 nullifier;
        uint256 amount;
        address owner;
        bool isSpent;
        uint256 created;
        uint256 spent;
    }
    
    // Privacy Audit Trail Structures
    struct AuditRecord {
        bytes32 auditId;
        address user;
        bytes32 transactionHash;
        ComplianceLevel complianceLevel;
        bytes32 privacyProof;
        uint256 timestamp;
        bool isValid;
        string auditData;
    }
    
    struct PrivacyMetrics {
        uint256 totalPrivateTransactions;
        uint256 compliantTransactions;
        uint256 nonCompliantTransactions;
        uint256 averagePrivacyLevel;
        uint256 totalGasSaved;
        uint256 auditPassRate;
    }
    
    // Security Status Structures
    struct SecurityStatus {
        bool isPaused;
        bool isUnderAttack;
        uint256 lastSecurityUpdate;
        bytes32 lastSecurityHash;
        uint256 activeThreats;
        uint256 totalZKProofs;
        uint256 totalPrivateTxs;
        uint256 totalSMPCComputations;
        uint256 totalConfidentialTxs;
    }
    
    // Gas Optimization Structures
    struct GasOptimization {
        bytes32 transactionId;
        GasOptimizationStrategy strategy;
        uint256 originalGas;
        uint256 optimizedGas;
        uint256 savedGas;
        uint256 timestamp;
        bool isActive;
    }
    
    struct GasMetrics {
        uint256 totalTransactions;
        uint256 totalGasUsed;
        uint256 totalGasSaved;
        uint256 averageGasPerTx;
        uint256 optimizationRate;
        uint256 lastOptimization;
    }
    
    // Cryptographic Parameters
    struct CryptoParams {
        bytes32 hashFunction;
        bytes32 curveParams;
        bytes32 provingSystem;
        uint256 securityLevel;
        uint256 keySize;
        uint256 signatureScheme;
    }
    
    // Integration Structures
    struct SecurityIntegration {
        address securityContract;
        bytes integrationParams;
        bool isActive;
        uint256 lastSync;
        bytes32 syncHash;
    }
    
    // Privacy Configuration
    struct PrivacyConfig {
        uint256 minPrivacyLevel;
        uint256 maxPrivacyLevel;
        uint256 complianceThreshold;
        uint256 auditRetentionPeriod;
        uint256 maxProofSize;
        uint256 maxParticipants;
        bool requireCompliance;
        bool enableAuditTrail;
    }
    
    // Threat Detection
    struct ThreatReport {
        bytes32 threatId;
        address reporter;
        string threatType;
        uint256 severity;
        bytes evidence;
        uint256 timestamp;
        bool isResolved;
        string resolution;
    }
    
    // Quantum Resistance
    struct QuantumSecurity {
        bytes32 postQuantumParams;
        bool quantumResistanceEnabled;
        uint256 quantumSecurityLevel;
        bytes32 quantumSignatureScheme;
        uint256 lastQuantumUpdate;
    }
    
    // Privacy Pool
    struct PrivacyPool {
        bytes32 poolId;
        address token;
        uint256 totalBalance;
        uint256 memberCount;
        bytes32 merkleRoot;
        uint256 lastUpdate;
        bool isActive;
        PrivacyLevel minPrivacyLevel;
    }
    
    // Validation Results
    struct ValidationResult {
        bool isValid;
        bytes32 validationHash;
        uint256 timestamp;
        string errorMessage;
        address validator;
    }
    
    // Batch Operations
    struct BatchOperation {
        bytes32 batchId;
        address initiator;
        bytes32[] operationIds;
        uint256 operationCount;
        uint256 timestamp;
        bool isCompleted;
        uint256 gasUsed;
    }
    
    // Constants
    uint256 constant MAX_PRIVACY_LEVEL = 4;
    uint256 constant DEFAULT_COMPLIANCE_THRESHOLD = 80; // 80%
    uint256 constant DEFAULT_MIN_PARTICIPANTS = 3;
    uint256 constant DEFAULT_MAX_PARTICIPANTS = 10;
    uint256 constant DEFAULT_TIMEOUT_PERIOD = 1 hours;
    uint256 constant MAX_PROOF_SIZE = 2048;
    uint256 constant AUDIT_RETENTION_PERIOD = 365 days;
}
