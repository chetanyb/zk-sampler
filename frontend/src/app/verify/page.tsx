'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { FileUpload } from '@/components/ui/file-upload';
import { CheckCircle, FileText, AlertCircle, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import VerifyWithWallet from '@/components/ui/VerifyWithWallet';

export default function Verify() {
    const router = useRouter();
    const [publicValuesFile, setPublicValuesFile] = useState(null);
    const [proofFile, setProofFile] = useState(null);
    const [publicValuesHex, setPublicValuesHex] = useState('');
    const [proofHex, setProofHex] = useState('');
    const [verificationStatus, setVerificationStatus] = useState(null); // null, 'wallet', 'processing', 'success', 'error'
    const [verificationResult, setVerificationResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [txHash, setTxHash] = useState('');

    // Handle file uploads
    const handlePublicValuesUpload = async (files) => {
        if (files && files.length > 0) {
            const file = files[0];
            setPublicValuesFile(file);

            // Read the file as hex
            try {
                const hex = await readFileAsHex(file);
                setPublicValuesHex(hex);
            } catch (error) {
                console.error("Error reading file:", error);
                setErrorMessage("Error reading the file. Please make sure it's a valid binary file.");
            }
        }
    };

    const handleProofUpload = async (files) => {
        if (files && files.length > 0) {
            const file = files[0];
            setProofFile(file);

            // Read the file as hex
            try {
                const hex = await readFileAsHex(file);
                setProofHex(hex);
            } catch (error) {
                console.error("Error reading file:", error);
                setErrorMessage("Error reading the file. Please make sure it's a valid binary file.");
            }
        }
    };

    // Read binary file as hex string
    const readFileAsHex = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const arrayBuffer = reader.result;
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
    };

    // Verify with wallet
    const verifyProof = () => {
        if (!publicValuesFile || !proofFile) {
            setErrorMessage('Please upload both public values and proof files');
            return;
        }

        setErrorMessage('');
        setVerificationStatus('wallet');
    };

    // Handle verification success
    const handleVerificationSuccess = (result) => {
        setVerificationResult(result);
        setTxHash(result.transactionHash || '');
        setVerificationStatus('success');
    };

    // Handle verification error
    const handleVerificationError = (error) => {
        setErrorMessage(typeof error === 'string' ? error : 'An error occurred during verification');
        setVerificationStatus('error');
    };

    // Reset verification
    const resetVerification = () => {
        setVerificationStatus(null);
        setErrorMessage('');
    };

    // Cancel verification
    const cancelWalletVerification = () => {
        setVerificationStatus(null);
    };

    // Go back to editor
    const goToEditor = () => {
        router.push('/editor');
    };

    return (
        <div className="relative w-full min-h-screen overflow-hidden text-white bg-black">
            <BackgroundBeams />
            <div className="relative z-10 w-full max-w-2xl mx-auto text-center px-4 py-20">
                {/* Heading with animation */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="mb-12"
                >
                    <h1 className="text-5xl font-bold mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-500">
                        zkSampler
                    </h1>
                    <motion.h2
                        className="text-3xl font-medium text-gray-200"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        Proof Verifier <span className="text-violet-400">🔍</span>
                    </motion.h2>
                </motion.div>

                <motion.p
                    className="mb-8 text-lg text-gray-300 max-w-xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    Upload your proof files and verify them on-chain with just a few clicks.
                </motion.p>

                {/* Back to Editor Button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="absolute top-8 left-8"
                >
                    <button
                        onClick={goToEditor}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Editor</span>
                    </button>
                </motion.div>

                {/* File Upload Section */}
                {!verificationStatus && (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                    >
                        <div>
                            <h3 className="text-lg font-medium mb-3 text-gray-200">
                                Public Values (.bin)
                            </h3>
                            <FileUpload
                                onChange={handlePublicValuesUpload}
                                accept=".bin"
                                icon={<FileText className="w-6 h-6 text-purple-400" />}
                                title={publicValuesFile ? publicValuesFile.name : "Upload public_values.bin"}
                            />
                        </div>

                        <div>
                            <h3 className="text-lg font-medium mb-3 text-gray-200">
                                Proof (.bin)
                            </h3>
                            <FileUpload
                                onChange={handleProofUpload}
                                accept=".bin"
                                icon={<FileText className="w-6 h-6 text-indigo-400" />}
                                title={proofFile ? proofFile.name : "Upload proof.bin"}
                            />
                        </div>
                    </motion.div>
                )}

                {/* Error Message */}
                {errorMessage && (
                    <motion.div
                        className="mt-4 p-3 bg-red-900/20 border border-red-700/30 rounded-md text-red-300"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            <span>{errorMessage}</span>
                        </div>
                    </motion.div>
                )}

                {/* Verify Button */}
                {!verificationStatus && publicValuesFile && proofFile && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6"
                    >
                        <button
                            onClick={verifyProof}
                            className="px-8 py-3 font-medium rounded-md overflow-hidden transition-all duration-300 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90"
                        >
                            Verify Proof On-Chain
                        </button>
                    </motion.div>
                )}

                {/* Wallet Verification */}
                <AnimatePresence>
                    {verificationStatus === 'wallet' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="mt-8"
                        >
                            <VerifyWithWallet
                                publicValuesHex={publicValuesHex}
                                proofHex={proofHex}
                                onSuccess={handleVerificationSuccess}
                                onError={handleVerificationError}
                                onCancel={cancelWalletVerification}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Verification Result */}
                {verificationStatus === 'success' && verificationResult && (
                    <motion.div
                        className="mt-8 p-6 bg-green-900/20 backdrop-blur-sm border border-green-700/30 rounded-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-green-400" />
                            </div>
                            <h3 className="text-2xl font-medium text-green-400">Verification Successful!</h3>
                        </div>

                        <div className="mt-6 text-left bg-zinc-900/70 rounded-lg p-4 border border-zinc-800">
                            <div className="grid gap-3">
                                <div>
                                    <div className="text-sm text-gray-400 mb-1">Original Hash:</div>
                                    <div className="font-mono text-sm text-gray-200 break-all">{verificationResult.originalHash}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400 mb-1">Transformed Hash:</div>
                                    <div className="font-mono text-sm text-gray-200 break-all">{verificationResult.transformedHash}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400 mb-1">Signer Key:</div>
                                    <div className="font-mono text-sm text-gray-200 break-all">{verificationResult.signerKey}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400 mb-1">Has Signature:</div>
                                    <div className="font-mono text-sm text-gray-200">{verificationResult.hasSig ? "Yes" : "No"}</div>
                                </div>
                                {txHash && (
                                    <div>
                                        <div className="text-sm text-gray-400 mb-1">Transaction:</div>
                                        <div className="font-mono text-sm text-gray-200 flex items-center gap-2">
                                            <span className="truncate">{txHash}</span>
                                            <a
                                                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-violet-400 hover:text-violet-300"
                                            >
                                                <ArrowUpRight className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-center mt-6">
                            <button
                                onClick={resetVerification}
                                className="px-6 py-2 rounded-md font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-all"
                            >
                                Verify Another Proof
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Error State */}
                {verificationStatus === 'error' && (
                    <motion.div
                        className="mt-8 p-6 bg-red-900/20 backdrop-blur-sm border border-red-700/30 rounded-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-red-400" />
                            </div>
                            <h3 className="text-2xl font-medium text-red-400">Verification Failed</h3>
                        </div>

                        <p className="text-red-300/80 mb-6">
                            {errorMessage || "We encountered an error while trying to verify your proof. Please check your files and try again."}
                        </p>

                        <div className="flex justify-center">
                            <button
                                onClick={resetVerification}
                                className="px-6 py-2 rounded-md font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-all"
                            >
                                Try Again
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}