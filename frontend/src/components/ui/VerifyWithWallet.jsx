'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

// Contract address
const AUDIO_VERIFIER_ADDRESS = "0xC2Db579Ad5263b764658640E5C8E8cA4084C4bEE";

// Helper function to parse verification result
function parseVerificationResult(publicValuesHex) {
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

export default function SimpleMetaMaskVerify({ publicValuesHex, proofHex, onSuccess, onError, onCancel }) {
    const [account, setAccount] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const [hasMetaMask, setHasMetaMask] = useState(false);

    // Check if MetaMask is available
    useEffect(() => {
        if (typeof window !== 'undefined' && window.ethereum) {
            setHasMetaMask(true);
        }
    }, []);

    // Connect to MetaMask
    const connectWallet = async () => {
        if (!window.ethereum) {
            setError('MetaMask is not installed. Please install MetaMask to continue.');
            return;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(accounts[0]);
            setError('');
        } catch (err) {
            setError('Failed to connect wallet: ' + (err.message || 'Unknown error'));
        }
    };

    // Handle verification
    const handleVerify = async () => {
        if (!account) {
            setError('Please connect your wallet first');
            return;
        }

        try {
            setIsVerifying(true);
            setError('');

            console.log('Starting verification with:', {
                publicValues: publicValuesHex.substring(0, 66) + '...',
                proof: proofHex.substring(0, 66) + '...'
            });

            // Create the function call data
            // This is a simplified example - in a real app, you'd use ethers.js or a similar library
            const functionSignature = '0xf8340a5c'; // First 4 bytes of keccak256("verifyAudioTransformProof(bytes,bytes)")

            // For this demo, we'll just simulate success
            // In a real implementation, you would send the actual transaction

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // For demo purposes, parse the result from public values directly
            const result = parseVerificationResult(publicValuesHex);

            // Generate a fake transaction hash
            const txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');

            onSuccess({
                ...result,
                transactionHash: txHash
            });
        } catch (err) {
            console.error('Verification error:', err);
            setError(err.message || 'Failed to verify proof');
            onError(err.message || 'Failed to verify proof');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="p-6 bg-zinc-900/60 rounded-lg backdrop-blur-sm border border-zinc-800">
            <h3 className="text-xl font-medium text-gray-200 mb-4">Verify Proof On-Chain</h3>

            {!hasMetaMask && (
                <div className="mb-6 text-center p-4 bg-amber-900/20 border border-amber-700/30 rounded">
                    <p className="text-amber-300">
                        MetaMask is not installed. Please install MetaMask to verify proofs on-chain.
                    </p>
                    <a
                        href="https://metamask.io/download/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                    >
                        Install MetaMask
                    </a>
                </div>
            )}

            {hasMetaMask && !account && (
                <div className="flex justify-center mb-6">
                    <button
                        onClick={connectWallet}
                        className="px-6 py-3 font-medium rounded-md bg-orange-600 text-white hover:bg-orange-700 transition-colors flex items-center gap-2"
                    >
                        <span>Connect MetaMask</span>
                    </button>
                </div>
            )}

            {account && (
                <div className="mb-6 text-center">
                    <p className="text-green-400 text-sm">Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}</p>
                </div>
            )}

            {error && (
                <div className="mb-6 text-left bg-red-900/20 border border-red-700/30 rounded p-3 flex items-center gap-2">
                    <AlertCircle className="text-red-400 w-5 h-5 flex-shrink-0" />
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                    onClick={handleVerify}
                    disabled={!account || isVerifying}
                    className={`px-6 py-3 font-medium rounded-md overflow-hidden transition-all duration-300 bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center gap-2 ${(!account || isVerifying) ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
                >
                    {isVerifying ? (
                        <>
                            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                            <span>Verifying...</span>
                        </>
                    ) : (
                        <span>Verify Proof</span>
                    )}
                </button>

                <button
                    onClick={onCancel}
                    disabled={isVerifying}
                    className={`px-6 py-3 font-medium rounded-md bg-zinc-800 text-white transition-all ${isVerifying ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-700'}`}
                >
                    Cancel
                </button>
            </div>

            <div className="mt-4 text-xs text-center text-gray-500">
                <p>*Demo mode: This will simulate verification for demo purposes.</p>
            </div>
        </div>
    );
}