import { ethers } from 'ethers';
import audioVerifierABI from './abis/audioVerifier.json';

// Contract addresses (from the environment)
// In production, these should come from environment variables
export const CONTRACTS = {
    // This is the Sepolia address you provided
    AUDIO_VERIFIER_ADDRESS: "0xC2Db579Ad5263b764658640E5C8E8cA4084C4bEE"
};

// Create contract instances
export function getAudioVerifierContract(signerOrProvider: ethers.Signer | ethers.providers.Provider) {
    return new ethers.Contract(
        CONTRACTS.AUDIO_VERIFIER_ADDRESS,
        audioVerifierABI,
        signerOrProvider
    );
}

// Parse binary proof files
export async function readFileAsHex(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const bytes = new Uint8Array(arrayBuffer);
            let hexString = '0x';
            for (let i = 0; i < bytes.length; i++) {
                hexString += bytes[i].toString(16).padStart(2, '0');
            }
            resolve(hexString);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Parse verification results from raw bytes
export function parseVerificationResult(publicValuesHex: string) {
    // Extract the parts from the publicValues bytes
    const originalHash = "0x" + publicValuesHex.substring(2, 66);
    const transformedHash = "0x" + publicValuesHex.substring(66, 130);
    const signerKey = "0x" + publicValuesHex.substring(130, 194);
    const hasSig = publicValuesHex.substring(194) !== "0000000000000000000000000000000000000000000000000000000000000000";

    return {
        originalHash,
        transformedHash,
        signerKey,
        hasSig
    };
}