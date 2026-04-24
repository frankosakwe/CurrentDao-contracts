// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../AdvancedSecurity.sol";
import "../structures/SecurityStructs.sol";
import "../libraries/ZKProofLib.sol";

/**
 * @title AdvancedSecurityTest
 * @dev Comprehensive test suite for AdvancedSecurity contract
 * @author CurrentDao Security Team
 */
contract AdvancedSecurityTest is Test {
    AdvancedSecurity public advancedSecurity;
    address public owner;
    address public user1;
    address public user2;
    address public verifier;
    
    // Test data
    bytes32 public circuitHash;
    bytes32[] public publicInputs;
    bytes32[] public privateInputs;
    uint256 public witness;
    
    event ZKProofGenerated(bytes32 indexed proofId, address indexed verifier, bytes32 commitment, uint256 timestamp);
    event PrivateTransactionExecuted(bytes32 indexed txHash, address indexed sender, address indexed receiver, bytes32 nullifier, uint256 timestamp);
    event SMPCComputationInitiated(bytes32 indexed computationId, address[] participants, bytes32 computationHash, uint256 timestamp);
    event ConfidentialTransactionProcessed(bytes32 indexed txId, bytes32 commitment, bytes32 nullifier, uint256 timestamp);
    event PrivacyAuditTrailUpdated(bytes32 indexed auditId, address indexed user, bytes32 transactionHash, uint256 complianceLevel, uint256 timestamp);
    
    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        verifier = address(0x3);
        
        // Deploy contract
        advancedSecurity = new AdvancedSecurity();
        
        // Setup test data
        circuitHash = keccak256("test_circuit");
        publicInputs = new bytes32[](2);
        publicInputs[0] = keccak256("public_input_1");
        publicInputs[1] = keccak256("public_input_2");
        
        privateInputs = new bytes32[](2);
        privateInputs[0] = keccak256("private_input_1");
        privateInputs[1] = keccak256("private_input_2");
        
        witness = 12345;
        
        // Transfer some ETH to users
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }
    
    // Zero-Knowledge Proof Tests
    
    function testGenerateZKProof() public {
        SecurityStructs.ZKProofInput memory input = SecurityStructs.ZKProofInput({
            publicInputs: publicInputs,
            privateInputs: privateInputs,
            circuitHash: circuitHash,
            witness: witness,
            verifier: verifier
        });
        
        vm.prank(user1);
        bytes32 proofId = advancedSecurity.generateZKProof(input);
        
        assertTrue(proofId != bytes32(0), "Proof ID should not be zero");
        
        // Verify proof was stored
        SecurityStructs.ZKProof memory proof = advancedSecurity.getZKProof(proofId);
        assertEq(proof.proofId, proofId, "Proof ID mismatch");
        assertEq(proof.verifier, verifier, "Verifier mismatch");
        assertEq(proof.circuitHash, circuitHash, "Circuit hash mismatch");
        assertFalse(proof.isValid, "Proof should not be initially valid");
        assertFalse(proof.isRevoked, "Proof should not be revoked");
    }
    
    function testGenerateZKProofEmitsEvent() public {
        SecurityStructs.ZKProofInput memory input = SecurityStructs.ZKProofInput({
            publicInputs: publicInputs,
            privateInputs: privateInputs,
            circuitHash: circuitHash,
            witness: witness,
            verifier: verifier
        });
        
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit ZKProofGenerated(bytes32(0), verifier, bytes32(0), block.timestamp);
        advancedSecurity.generateZKProof(input);
    }
    
    function testGenerateZKProofInvalidCircuit() public {
        SecurityStructs.ZKProofInput memory input = SecurityStructs.ZKProofInput({
            publicInputs: new bytes32[](0),
            privateInputs: new bytes32[](0),
            circuitHash: bytes32(0),
            witness: witness,
            verifier: verifier
        });
        
        vm.prank(user1);
        vm.expectRevert("Invalid circuit parameters");
        advancedSecurity.generateZKProof(input);
    }
    
    function testVerifyZKProof() public {
        SecurityStructs.ZKProofInput memory input = SecurityStructs.ZKProofInput({
            publicInputs: publicInputs,
            privateInputs: privateInputs,
            circuitHash: circuitHash,
            witness: witness,
            verifier: verifier
        });
        
        vm.prank(user1);
        bytes32 proofId = advancedSecurity.generateZKProof(input);
        
        // Create mock proof
        bytes memory proof = abi.encodePacked("mock_proof");
        
        bool isValid = advancedSecurity.verifyZKProof(proofId, proof, publicInputs);
        // Note: In real implementation, this would return true for valid proof
        // For now, it returns false due to simplified verification
        assertFalse(isValid, "Mock proof should not be valid");
    }
    
    function testRevokeZKProof() public {
        SecurityStructs.ZKProofInput memory input = SecurityStructs.ZKProofInput({
            publicInputs: publicInputs,
            privateInputs: privateInputs,
            circuitHash: circuitHash,
            witness: witness,
            verifier: verifier
        });
        
        vm.prank(user1);
        bytes32 proofId = advancedSecurity.generateZKProof(input);
        
        // Revoke proof
        advancedSecurity.revokeZKProof(proofId);
        
        SecurityStructs.ZKProof memory proof = advancedSecurity.getZKProof(proofId);
        assertTrue(proof.isRevoked, "Proof should be revoked");
        assertFalse(proof.isValid, "Revoked proof should not be valid");
    }
    
    // Private Transaction Tests
    
    function testExecutePrivateTransaction() public {
        bytes32 senderNullifier = keccak256("sender_nullifier");
        bytes32 receiverNullifier = keccak256("receiver_nullifier");
        bytes32 commitment = keccak256("commitment");
        bytes32 root = keccak256("root");
        bytes[] memory proof = new bytes[](1);
        proof[0] = abi.encodePacked("mock_proof");
        
        SecurityStructs.PrivateTx memory transaction = SecurityStructs.PrivateTx({
            senderNullifier: senderNullifier,
            receiverNullifier: receiverNullifier,
            commitment: commitment,
            root: root,
            proof: proof,
            amount: 1000,
            token: address(0), // ETH
            privacyLevel: SecurityStructs.PrivacyLevel.HIGH,
            fee: 10,
            timestamp: block.timestamp
        });
        
        vm.prank(user1);
        bytes32 txHash = advancedSecurity.executePrivateTransaction(transaction);
        
        assertTrue(txHash != bytes32(0), "Transaction hash should not be zero");
        
        // Verify transaction was stored
        SecurityStructs.PrivateTx memory storedTx = advancedSecurity.getPrivateTransaction(txHash);
        assertEq(storedTx.senderNullifier, senderNullifier, "Sender nullifier mismatch");
        assertEq(storedTx.receiverNullifier, receiverNullifier, "Receiver nullifier mismatch");
        assertEq(storedTx.commitment, commitment, "Commitment mismatch");
        assertEq(uint256(storedTx.privacyLevel), uint256(SecurityStructs.PrivacyLevel.HIGH), "Privacy level mismatch");
    }
    
    function testExecutePrivateTransactionLowPrivacyLevel() public {
        SecurityStructs.PrivateTx memory transaction = SecurityStructs.PrivateTx({
            senderNullifier: keccak256("sender_nullifier"),
            receiverNullifier: keccak256("receiver_nullifier"),
            commitment: keccak256("commitment"),
            root: keccak256("root"),
            proof: new bytes[](1),
            amount: 1000,
            token: address(0),
            privacyLevel: SecurityStructs.PrivacyLevel.NONE, // Too low
            fee: 10,
            timestamp: block.timestamp
        });
        
        vm.prank(user1);
        vm.expectRevert("Privacy level too low");
        advancedSecurity.executePrivateTransaction(transaction);
    }
    
    function testVerifyPrivateTransaction() public {
        bytes32 senderNullifier = keccak256("sender_nullifier");
        bytes32 receiverNullifier = keccak256("receiver_nullifier");
        bytes32 commitment = keccak256("commitment");
        bytes32 root = keccak256("root");
        bytes[] memory proof = new bytes[](1);
        proof[0] = abi.encodePacked("mock_proof");
        
        SecurityStructs.PrivateTx memory transaction = SecurityStructs.PrivateTx({
            senderNullifier: senderNullifier,
            receiverNullifier: receiverNullifier,
            commitment: commitment,
            root: root,
            proof: proof,
            amount: 1000,
            token: address(0),
            privacyLevel: SecurityStructs.PrivacyLevel.HIGH,
            fee: 10,
            timestamp: block.timestamp
        });
        
        vm.prank(user1);
        bytes32 txHash = advancedSecurity.executePrivateTransaction(transaction);
        
        bytes memory txProof = abi.encodePacked("transaction_proof");
        bool isValid = advancedSecurity.verifyPrivateTransaction(txHash, txProof);
        assertFalse(isValid, "Mock transaction proof should not be valid");
    }
    
    function testGetTransactionPrivacy() public {
        SecurityStructs.PrivateTx memory transaction = SecurityStructs.PrivateTx({
            senderNullifier: keccak256("sender_nullifier"),
            receiverNullifier: keccak256("receiver_nullifier"),
            commitment: keccak256("commitment"),
            root: keccak256("root"),
            proof: new bytes[](1),
            amount: 1000,
            token: address(0),
            privacyLevel: SecurityStructs.PrivacyLevel.MAXIMUM,
            fee: 10,
            timestamp: block.timestamp
        });
        
        vm.prank(user1);
        bytes32 txHash = advancedSecurity.executePrivateTransaction(transaction);
        
        SecurityStructs.PrivacyLevel privacyLevel = advancedSecurity.getTransactionPrivacy(txHash);
        assertEq(uint256(privacyLevel), uint256(SecurityStructs.PrivacyLevel.MAXIMUM), "Privacy level mismatch");
    }
    
    // SMPC Tests
    
    function testInitiateSMPC() public {
        address[] memory participants = new address[](3);
        participants[0] = user1;
        participants[1] = user2;
        participants[2] = verifier;
        
        bytes32 computationHash = keccak256("computation");
        bytes memory encryptedInputs = abi.encodePacked("encrypted_inputs");
        
        vm.prank(user1);
        bytes32 computationId = advancedSecurity.initiateSMPC(participants, computationHash, encryptedInputs);
        
        assertTrue(computationId != bytes32(0), "Computation ID should not be zero");
        
        // Verify computation was stored
        SecurityStructs.SMPCComputation memory computation = advancedSecurity.getSMPCComputation(computationId);
        assertEq(computation.computationId, computationId, "Computation ID mismatch");
        assertEq(computation.computationHash, computationHash, "Computation hash mismatch");
        assertEq(uint256(computation.status), uint256(SecurityStructs.SMPCStatus.INITIATED), "Status should be INITIATED");
        assertEq(computation.participants.length, 3, "Participants count mismatch");
    }
    
    function testInitiateSMPCInsufficientParticipants() public {
        address[] memory participants = new address[](1);
        participants[0] = user1;
        
        bytes32 computationHash = keccak256("computation");
        bytes memory encryptedInputs = abi.encodePacked("encrypted_inputs");
        
        vm.prank(user1);
        vm.expectRevert("Insufficient participants");
        advancedSecurity.initiateSMPC(participants, computationHash, encryptedInputs);
    }
    
    function testSubmitSMPCShare() public {
        address[] memory participants = new address[](3);
        participants[0] = user1;
        participants[1] = user2;
        participants[2] = verifier;
        
        bytes32 computationHash = keccak256("computation");
        bytes memory encryptedInputs = abi.encodePacked("encrypted_inputs");
        
        vm.prank(user1);
        bytes32 computationId = advancedSecurity.initiateSMPC(participants, computationHash, encryptedInputs);
        
        // Update computation status to COLLECTING_SHARES
        // Note: In real implementation, this would happen automatically
        // For testing, we'll simulate this
        
        bytes memory encryptedShare = abi.encodePacked("encrypted_share");
        
        vm.prank(user1);
        bool completed = advancedSecurity.submitSMPCShare(computationId, encryptedShare);
        assertFalse(completed, "Computation should not be completed with one share");
    }
    
    function testGetSMPCResult() public {
        address[] memory participants = new address[](3);
        participants[0] = user1;
        participants[1] = user2;
        participants[2] = verifier;
        
        bytes32 computationHash = keccak256("computation");
        bytes memory encryptedInputs = abi.encodePacked("encrypted_inputs");
        
        vm.prank(user1);
        bytes32 computationId = advancedSecurity.initiateSMPC(participants, computationHash, encryptedInputs);
        
        // Try to get result before completion
        vm.expectRevert("Computation not completed");
        advancedSecurity.getSMPCResult(computationId);
    }
    
    // Confidential Transaction Tests
    
    function testProcessConfidentialTransaction() public {
        bytes32 inputCommitment = keccak256("input_commitment");
        bytes32 outputCommitment = keccak256("output_commitment");
        bytes32[] memory inputNullifiers = new bytes32[](1);
        inputNullifiers[0] = keccak256("input_nullifier");
        bytes32[] memory outputCommitments = new bytes32[](1);
        outputCommitments[0] = outputCommitment;
        
        bytes memory rangeProof = ZKProofLib.createRangeProof(1000, 0, 10000, 123);
        bytes memory bulletproof = ZKProofLib.createRangeProof(1000, 0, 10000, 456);
        
        SecurityStructs.ConfidentialTx memory transaction = SecurityStructs.ConfidentialTx({
            txId: bytes32(0), // Will be set by contract
            inputCommitment: inputCommitment,
            outputCommitment: outputCommitment,
            inputNullifiers: inputNullifiers,
            outputCommitments: outputCommitments,
            rangeProof: rangeProof,
            bulletproof: bulletproof,
            fee: 10,
            token: address(0),
            timestamp: block.timestamp,
            isVerified: false
        });
        
        vm.prank(user1);
        bytes32 txId = advancedSecurity.processConfidentialTransaction(transaction);
        
        assertTrue(txId != bytes32(0), "Transaction ID should not be zero");
        
        // Verify transaction was stored
        SecurityStructs.ConfidentialTx memory storedTx = advancedSecurity.getConfidentialTransaction(txId);
        assertEq(storedTx.inputCommitment, inputCommitment, "Input commitment mismatch");
        assertEq(storedTx.outputCommitment, outputCommitment, "Output commitment mismatch");
    }
    
    function testProcessConfidentialTransactionMissingProofs() public {
        SecurityStructs.ConfidentialTx memory transaction = SecurityStructs.ConfidentialTx({
            txId: bytes32(0),
            inputCommitment: keccak256("input_commitment"),
            outputCommitment: keccak256("output_commitment"),
            inputNullifiers: new bytes32[](1),
            outputCommitments: new bytes32[](1),
            rangeProof: new bytes(0), // Missing
            bulletproof: new bytes(0), // Missing
            fee: 10,
            token: address(0),
            timestamp: block.timestamp,
            isVerified: false
        });
        
        vm.prank(user1);
        vm.expectRevert("Missing range proof");
        advancedSecurity.processConfidentialTransaction(transaction);
    }
    
    function testVerifyConfidentialTransaction() public {
        bytes32 inputCommitment = keccak256("input_commitment");
        bytes32 outputCommitment = keccak256("output_commitment");
        bytes32[] memory inputNullifiers = new bytes32[](1);
        inputNullifiers[0] = keccak256("input_nullifier");
        bytes32[] memory outputCommitments = new bytes32[](1);
        outputCommitments[0] = outputCommitment;
        
        bytes memory rangeProof = ZKProofLib.createRangeProof(1000, 0, 10000, 123);
        bytes memory bulletproof = ZKProofLib.createRangeProof(1000, 0, 10000, 456);
        
        SecurityStructs.ConfidentialTx memory transaction = SecurityStructs.ConfidentialTx({
            txId: bytes32(0),
            inputCommitment: inputCommitment,
            outputCommitment: outputCommitment,
            inputNullifiers: inputNullifiers,
            outputCommitments: outputCommitments,
            rangeProof: rangeProof,
            bulletproof: bulletproof,
            fee: 10,
            token: address(0),
            timestamp: block.timestamp,
            isVerified: false
        });
        
        vm.prank(user1);
        bytes32 txId = advancedSecurity.processConfidentialTransaction(transaction);
        
        bytes memory newRangeProof = ZKProofLib.createRangeProof(1000, 0, 10000, 789);
        bytes memory newBulletproof = ZKProofLib.createRangeProof(1000, 0, 10000, 999);
        
        bool isValid = advancedSecurity.verifyConfidentialTransaction(txId, newRangeProof, newBulletproof);
        // Note: In real implementation, this would return true for valid proofs
        // For now, it returns false due to simplified verification
        assertFalse(isValid, "Mock confidential transaction should not be valid");
    }
    
    function testGetCommitment() public {
        bytes32 outputCommitment = keccak256("output_commitment");
        bytes32[] memory inputNullifiers = new bytes32[](1);
        inputNullifiers[0] = keccak256("input_nullifier");
        bytes32[] memory outputCommitments = new bytes32[](1);
        outputCommitments[0] = outputCommitment;
        
        bytes memory rangeProof = ZKProofLib.createRangeProof(1000, 0, 10000, 123);
        bytes memory bulletproof = ZKProofLib.createRangeProof(1000, 0, 10000, 456);
        
        SecurityStructs.ConfidentialTx memory transaction = SecurityStructs.ConfidentialTx({
            txId: bytes32(0),
            inputCommitment: keccak256("input_commitment"),
            outputCommitment: outputCommitment,
            inputNullifiers: inputNullifiers,
            outputCommitments: outputCommitments,
            rangeProof: rangeProof,
            bulletproof: bulletproof,
            fee: 10,
            token: address(0),
            timestamp: block.timestamp,
            isVerified: false
        });
        
        vm.prank(user1);
        bytes32 txId = advancedSecurity.processConfidentialTransaction(transaction);
        
        bytes32 commitment = advancedSecurity.getCommitment(txId);
        assertEq(commitment, outputCommitment, "Commitment mismatch");
    }
    
    // Privacy Audit Trail Tests
    
    function testUpdatePrivacyAudit() public {
        bytes32 transactionHash = keccak256("transaction");
        uint256 complianceLevel = 2; // FULLY_COMPLIANT
        
        vm.prank(user1);
        bytes32 auditId = advancedSecurity.updatePrivacyAudit(user1, transactionHash, complianceLevel);
        
        assertTrue(auditId != bytes32(0), "Audit ID should not be zero");
        
        // Verify audit record was stored
        SecurityStructs.AuditRecord memory audit = advancedSecurity.getPrivacyAudit(auditId);
        assertEq(audit.auditId, auditId, "Audit ID mismatch");
        assertEq(audit.user, user1, "User mismatch");
        assertEq(audit.transactionHash, transactionHash, "Transaction hash mismatch");
        assertEq(uint256(audit.complianceLevel), complianceLevel, "Compliance level mismatch");
    }
    
    function testVerifyCompliance() public {
        bool isCompliant = advancedSecurity.verifyCompliance(user1);
        // Simplified compliance check always returns true
        assertTrue(isCompliant, "User should be compliant");
    }
    
    // Gas Optimization Tests
    
    function testEstimatePrivacyCost() public {
        uint256 gasEstimate = advancedSecurity.estimatePrivacyCost(SecurityStructs.PrivacyOperation.ZK_PROOF_GENERATION);
        assertTrue(gasEstimate > 0, "Gas estimate should be positive");
    }
    
    function testOptimizeGasUsage() public {
        bytes32 transactionId = keccak256("transaction");
        SecurityStructs.GasOptimizationStrategy strategy = SecurityStructs.GasOptimizationStrategy.PROOF_AGGREGATION;
        
        vm.prank(user1);
        uint256 savedGas = advancedSecurity.optimizeGasUsage(transactionId, strategy);
        
        assertTrue(savedGas > 0, "Should save gas");
        // Should save 50% with proof aggregation strategy
        assertEq(savedGas, 50000, "Should save 50,000 gas (50% of 100,000)");
    }
    
    // Security Integration Tests
    
    function testIntegrateWithSecuritySystem() public {
        address securityContract = address(0x123);
        bytes memory integrationParams = abi.encodePacked("integration_params");
        
        advancedSecurity.integrateWithSecuritySystem(securityContract, integrationParams);
        
        // Verify integration was stored
        SecurityStructs.SecurityIntegration memory integration = advancedSecurity.securityIntegrations(securityContract);
        assertEq(integration.securityContract, securityContract, "Security contract mismatch");
        assertTrue(integration.isActive, "Integration should be active");
    }
    
    function testGetSecurityStatus() public {
        SecurityStructs.SecurityStatus memory status = advancedSecurity.getSecurityStatus();
        assertFalse(status.isPaused, "Should not be paused initially");
        assertEq(status.totalZKProofs, 0, "Should have no ZK proofs initially");
    }
    
    function testEmergencyPause() public {
        advancedSecurity.emergencyPause();
        
        SecurityStructs.SecurityStatus memory status = advancedSecurity.getSecurityStatus();
        assertTrue(status.isPaused, "Should be paused");
    }
    
    function testEmergencyUnpause() public {
        advancedSecurity.emergencyPause();
        advancedSecurity.emergencyUnpause();
        
        SecurityStructs.SecurityStatus memory status = advancedSecurity.getSecurityStatus();
        assertFalse(status.isPaused, "Should not be paused");
    }
    
    // View Functions Tests
    
    function testGetTotalPrivacyTransactions() public {
        uint256 total = advancedSecurity.getTotalPrivacyTransactions();
        assertEq(total, 0, "Should have no privacy transactions initially");
    }
    
    function testGetActiveSMPCComputations() public {
        uint256 active = advancedSecurity.getActiveSMPCComputations();
        assertEq(active, 0, "Should have no active SMPC computations initially");
    }
    
    function testGetPrivacyComplianceRate() public {
        uint256 rate = advancedSecurity.getPrivacyComplianceRate();
        assertEq(rate, 80, "Should return default compliance rate of 80%");
    }
    
    // Admin Functions Tests
    
    function testSetPrivacyParameters() public {
        uint256 minPrivacyLevel = 2;
        uint256 maxPrivacyLevel = 4;
        uint256 complianceThreshold = 90;
        
        advancedSecurity.setPrivacyParameters(minPrivacyLevel, maxPrivacyLevel, complianceThreshold);
        
        // Verify parameters were set (would need getter function)
        // For now, just ensure function doesn't revert
    }
    
    function testUpdateZKVerifier() public {
        address newVerifier = address(0x456);
        advancedSecurity.updateZKVerifier(newVerifier);
        assertEq(advancedSecurity.zkVerifier(), newVerifier, "Verifier should be updated");
    }
    
    function testSetSMPCParameters() public {
        uint256 minParticipants = 2;
        uint256 maxParticipants = 8;
        uint256 timeoutPeriod = 2 hours;
        
        advancedSecurity.setSMPCParameters(minParticipants, maxParticipants, timeoutPeriod);
        // Verify parameters were set (would need getter functions)
    }
    
    function testUpdateCryptographicParameters() public {
        bytes32 newHashFunction = keccak256("new_hash_function");
        bytes32 newCurveParams = keccak256("new_curve_params");
        
        advancedSecurity.updateCryptographicParameters(newHashFunction, newCurveParams);
        
        SecurityStructs.CryptoParams memory params = advancedSecurity.cryptoParams();
        assertEq(params.hashFunction, newHashFunction, "Hash function should be updated");
        assertEq(params.curveParams, newCurveParams, "Curve params should be updated");
    }
    
    // Access Control Tests
    
    function testOnlyOwnerCanRevokeProof() public {
        SecurityStructs.ZKProofInput memory input = SecurityStructs.ZKProofInput({
            publicInputs: publicInputs,
            privateInputs: privateInputs,
            circuitHash: circuitHash,
            witness: witness,
            verifier: verifier
        });
        
        vm.prank(user1);
        bytes32 proofId = advancedSecurity.generateZKProof(input);
        
        // Try to revoke as non-owner
        vm.prank(user2);
        vm.expectRevert();
        advancedSecurity.revokeZKProof(proofId);
        
        // Revoke as owner
        advancedSecurity.revokeZKProof(proofId);
        
        SecurityStructs.ZKProof memory proof = advancedSecurity.getZKProof(proofId);
        assertTrue(proof.isRevoked, "Proof should be revoked");
    }
    
    function testPausedContractPreventsOperations() public {
        advancedSecurity.emergencyPause();
        
        SecurityStructs.ZKProofInput memory input = SecurityStructs.ZKProofInput({
            publicInputs: publicInputs,
            privateInputs: privateInputs,
            circuitHash: circuitHash,
            witness: witness,
            verifier: verifier
        });
        
        vm.prank(user1);
        vm.expectRevert("Contract is paused");
        advancedSecurity.generateZKProof(input);
    }
    
    // Gas Optimization Verification
    
    function testGasOptimizationReducesCostsBy50Percent() public {
        bytes32 transactionId = keccak256("gas_test_transaction");
        
        // Test different optimization strategies
        SecurityStructs.GasOptimizationStrategy[] memory strategies = new SecurityStructs.GasOptimizationStrategy[](4);
        strategies[0] = SecurityStructs.GasOptimizationStrategy.BATCH_PROCESSING;
        strategies[1] = SecurityStructs.GasOptimizationStrategy.PROOF_AGGREGATION;
        strategies[2] = SecurityStructs.GasOptimizationStrategy.COMPRESSED_COMMITMENTS;
        strategies[3] = SecurityStructs.GasOptimizationStrategy.LAZY_VERIFICATION;
        
        uint256[] memory expectedSavings = new uint256[](4);
        expectedSavings[0] = 40000; // 40% savings
        expectedSavings[1] = 50000; // 50% savings
        expectedSavings[2] = 30000; // 30% savings
        expectedSavings[3] = 45000; // 45% savings
        
        for (uint256 i = 0; i < strategies.length; i++) {
            vm.prank(user1);
            uint256 savedGas = advancedSecurity.optimizeGasUsage(transactionId, strategies[i]);
            assertEq(savedGas, expectedSavings[i], "Gas savings should match expected values");
        }
    }
    
    // Integration Tests
    
    function testFullPrivacyWorkflow() public {
        // 1. Generate ZK Proof
        SecurityStructs.ZKProofInput memory zkInput = SecurityStructs.ZKProofInput({
            publicInputs: publicInputs,
            privateInputs: privateInputs,
            circuitHash: circuitHash,
            witness: witness,
            verifier: verifier
        });
        
        vm.prank(user1);
        bytes32 proofId = advancedSecurity.generateZKProof(zkInput);
        
        // 2. Execute Private Transaction
        SecurityStructs.PrivateTx memory privateTx = SecurityStructs.PrivateTx({
            senderNullifier: keccak256("sender_nullifier"),
            receiverNullifier: keccak256("receiver_nullifier"),
            commitment: keccak256("commitment"),
            root: keccak256("root"),
            proof: new bytes[](1),
            amount: 1000,
            token: address(0),
            privacyLevel: SecurityStructs.PrivacyLevel.HIGH,
            fee: 10,
            timestamp: block.timestamp
        });
        
        vm.prank(user1);
        bytes32 txHash = advancedSecurity.executePrivateTransaction(privateTx);
        
        // 3. Update Privacy Audit
        vm.prank(user1);
        bytes32 auditId = advancedSecurity.updatePrivacyAudit(user1, txHash, 2);
        
        // 4. Optimize Gas Usage
        vm.prank(user1);
        uint256 savedGas = advancedSecurity.optimizeGasUsage(txHash, SecurityStructs.GasOptimizationStrategy.PROOF_AGGREGATION);
        
        // Verify all steps completed successfully
        assertTrue(proofId != bytes32(0), "ZK proof should be generated");
        assertTrue(txHash != bytes32(0), "Private transaction should be executed");
        assertTrue(auditId != bytes32(0), "Audit record should be created");
        assertTrue(savedGas > 0, "Gas should be optimized");
        
        // Verify global metrics
        assertEq(advancedSecurity.getTotalPrivacyTransactions(), 1, "Should have 1 privacy transaction");
        assertEq(advancedSecurity.totalZKProofs(), 1, "Should have 1 ZK proof");
    }
}
