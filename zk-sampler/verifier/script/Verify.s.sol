// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {AudioVerifier} from "../src/AudioVerifier.sol";
import {console} from "forge-std/console.sol";
import {ISP1VerifierWithHash} from "@sp1-contracts/ISP1Verifier.sol";

contract Verify is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        string memory root = vm.projectRoot();

        bytes32 vkey = vm.envBytes32("AUDIO_TRANSFORM_VKEY");

        bytes memory publicValues = vm.readFileBinary(string.concat(root, "/proofs/public_values.bin"));
        bytes memory proof = vm.readFileBinary(string.concat(root, "/proofs/proof.bin"));

        address audioVerifierAddr = vm.envAddress("AUDIO_VERIFIER_ADDRESS");
        AudioVerifier verifier = AudioVerifier(audioVerifierAddr);

        require(verifier.audioTransformVKey() == vkey, "Wrong VKEY");

        vm.startBroadcast(deployerPrivateKey);

        (
            bytes32 originalHash,
            bytes32 transformedHash,
            bytes32 signerKey,
            bool hasSig
        ) = verifier.verifyAudioTransformProof(publicValues, proof);

        vm.stopBroadcast();

        console.log("[SUCCESS] On-chain verification complete:");
        console.log("Original Hash:", vm.toString(originalHash));
        console.log("Transformed Hash:", vm.toString(transformedHash));
        console.log("Signer Key:", vm.toString(signerKey));
        console.log("Has Signature:", hasSig);
    }
}