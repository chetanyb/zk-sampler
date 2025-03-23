// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {AudioVerifier} from "../src/AudioVerifier.sol";
import {SP1Verifier} from "@sp1-contracts/v4.0.0-rc.3/SP1VerifierGroth16.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        bytes32 vkey = vm.envBytes32("AUDIO_TRANSFORM_VKEY");

        console.log("Deploying with verification key:", vm.toString(vkey));
        console.log("Deployer address:", vm.addr(deployerPrivateKey));

        vm.startBroadcast(deployerPrivateKey);

        SP1Verifier sp1Verifier = new SP1Verifier();
        console.log("SP1Verifier deployed at:", address(sp1Verifier));

        AudioVerifier audioVerifier = new AudioVerifier(address(sp1Verifier), vkey);
        console.log("AudioVerifier deployed at:", address(audioVerifier));

        vm.stopBroadcast();
    }
}