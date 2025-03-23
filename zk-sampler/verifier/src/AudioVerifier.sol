// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISP1Verifier} from "@sp1-contracts/ISP1Verifier.sol";

contract AudioVerifier {
    address public verifier;
    bytes32 public audioTransformVKey;

    struct AudioData {
        bytes32[] children;
        bytes32 parent;
        address signerAddress;
        bool hasSignature;
    }

    mapping(bytes32 => AudioData) public audioData;

    event ProofVerified(
        bytes32 indexed originalAudioHash,
        bytes32 indexed transformedAudioHash,
        address indexed signerAddress,
        bool hasSignature,
        bytes proof
    );

    constructor(address _verifier, bytes32 _audioTransformVKey) {
        verifier = _verifier;
        audioTransformVKey = _audioTransformVKey;
    }

    function getAudioData(bytes32 hash) public view returns (
        bytes32 parent,
        address signerAddress,
        bool hasSignature,
        bytes32[] memory children
    ) {
        AudioData storage data = audioData[hash];
        return (data.parent, data.signerAddress, data.hasSignature, data.children);
    }

    function getChildren(bytes32 hash) public view returns (bytes32[] memory) {
        return audioData[hash].children;
    }

    function verifyAudioTransformProof(
        bytes calldata _publicValues,
        bytes calldata _proofBytes
    ) public returns (
        bytes32 originalAudioHash,
        bytes32 transformedAudioHash,
        bytes32 signerPublicKey,
        bool hasSignature
    ) {
        ISP1Verifier(verifier).verifyProof(
            audioTransformVKey,
            _publicValues,
            _proofBytes
        );

        (originalAudioHash, transformedAudioHash, signerPublicKey, hasSignature) =
        abi.decode(_publicValues, (bytes32, bytes32, bytes32, bool));

        address signerAddress = address(uint160(uint256(signerPublicKey)));

        audioData[transformedAudioHash].parent = originalAudioHash;
        audioData[transformedAudioHash].signerAddress = signerAddress;
        audioData[transformedAudioHash].hasSignature = hasSignature;

        audioData[originalAudioHash].children.push(transformedAudioHash);

        emit ProofVerified(
            originalAudioHash,
            transformedAudioHash,
            signerAddress,
            hasSignature,
            _proofBytes
        );
    }
}