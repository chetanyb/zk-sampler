// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AudioVerifier} from "../src/AudioVerifier.sol";
import {ISP1Verifier} from "@sp1-contracts/ISP1Verifier.sol";

contract MockSP1Verifier is ISP1Verifier {
    function verifyProof(
        bytes32 vkey,
        bytes calldata publicValues,
        bytes calldata proof
    ) external pure override {
        require(vkey != bytes32(0), "Invalid vkey");
        require(publicValues.length > 0, "Invalid public values");
        require(proof.length > 0, "Proof must not be empty");
    }
}

contract AudioVerifierTest is Test {
    AudioVerifier public verifier;
    MockSP1Verifier public mockSp1Verifier;
    bytes32 public constant TEST_VKEY = bytes32(uint256(1));

    event ProofVerified(
        bytes32 indexed originalAudioHash,
        bytes32 indexed transformedAudioHash,
        address indexed signerAddress,
        bool hasSignature,
        bytes proof
    );

    function setUp() public {
        mockSp1Verifier = new MockSP1Verifier();
        verifier = new AudioVerifier(address(mockSp1Verifier), TEST_VKEY);
    }

    function testVerifyProofEmitsEvent() public {
        bytes memory publicValues = abi.encode(
            bytes32("original"),
            bytes32("transformed"),
            bytes32("signer"),
            true
        );
        bytes memory proof = abi.encodePacked("fake-proof");

        vm.expectEmit(true, true, true, true);
        emit ProofVerified(
            bytes32("original"),
            bytes32("transformed"),
            address(uint160(uint256(bytes32("signer")))),
            true,
            proof
        );

        verifier.verifyAudioTransformProof(publicValues, proof);
    }

    function testRealProofVerification() public {
        // Load real proof + public values
        bytes memory publicValues = vm.readFileBinary("proofs/public_values.bin");
        bytes memory proof = vm.readFileBinary("proofs/proof.bin");

        // Decode public inputs
        (
            bytes32 originalAudioHash,
            bytes32 transformedAudioHash,
            bytes32 signerPubKey,
            bool hasSignature
        ) = abi.decode(publicValues, (bytes32, bytes32, bytes32, bool));

        address signerAddress = address(uint160(uint256(signerPubKey)));

        // Expect event
        vm.expectEmit(true, true, true, true);
        emit ProofVerified(
            originalAudioHash,
            transformedAudioHash,
            signerAddress,
            hasSignature,
            proof
        );

        // Execute contract
        verifier.verifyAudioTransformProof(publicValues, proof);

        // Check state for transformed audio
        (bytes32 parent, address signer, bool sig, ) = verifier.getAudioData(transformedAudioHash);
        assertEq(parent, originalAudioHash);
        assertEq(signer, signerAddress);
        assertEq(sig, hasSignature);

        // Check child linkage
        bytes32[] memory children = verifier.getChildren(originalAudioHash);
        bool found = false;
        for (uint256 i = 0; i < children.length; i++) {
            if (children[i] == transformedAudioHash) {
                found = true;
                break;
            }
        }
        assertTrue(found, "Transformed hash not recorded as child");

        // Log values
        emit log_named_bytes32("Original Hash", originalAudioHash);
        emit log_named_bytes32("Transformed Hash", transformedAudioHash);
        emit log_named_address("Signer Address", signerAddress);
        emit log_named_uint("Has Signature", hasSignature ? 1 : 0);
    }
}