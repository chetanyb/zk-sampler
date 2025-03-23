'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { FileUpload } from '@/components/ui/file-upload';
import { EvervaultCard } from '@/components/ui/evervault-card';
import { CustomCard } from "@/components/ui/custom-card";
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalTrigger,
} from '@/components/ui/animated-modal';
import { Sparkles, Music, XCircle } from 'lucide-react';
import WaveSurfer from "wavesurfer.js";
import AudioEditorInterface from '@/components/AudioEditorInterface';

export default function Editor() {
    const [fileName, setFileName] = useState('');
    const [audioURL, setAudioURL] = useState('');
    const [processing, setProcessing] = useState(false);
    const [proofGenerated, setProofGenerated] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const waveformRef = useRef(null);
    const wavesurfer = useRef(null);
    const [audioEffects, setAudioEffects] = useState({
        reverse: false,
        stretch: 1.0,
        pitch: 0,
    });

    // Handle file upload
    const handleFileChange = (files) => {
        if (files && files.length > 0) {
            const file = files[0];
            setFileName(file.name);
            const url = URL.createObjectURL(file);
            setAudioURL(url);
            console.log("File uploaded:", file.name);
        }
    };

    // Initialize WaveSurfer when audioURL changes or when coming back from edit mode
    useEffect(() => {
        const loadWaveSurfer = async () => {
            if (!audioURL || !waveformRef.current || isEditing) {
                return; // Early return if any required element is missing
            }

            try {
                console.log("Initializing WaveSurfer...");

                // Destroy previous instance
                if (wavesurfer.current) {
                    wavesurfer.current.destroy();
                    wavesurfer.current = null;
                }

                // Create new instance with a short delay
                const timeoutId = setTimeout(() => {
                    // Double-check if component is still mounted
                    if (!waveformRef.current || isEditing) {
                        return;
                    }

                    console.log("Creating WaveSurfer instance");
                    try {
                        const ws = WaveSurfer.create({
                            container: waveformRef.current,
                            waveColor: '#64748b',
                            progressColor: '#7c3aed',
                            height: 100,
                            responsive: true,
                            barWidth: 2,
                            cursorWidth: 1,
                            cursorColor: '#ffffff',
                        });

                        ws.on('ready', () => {
                            console.log('WaveSurfer is ready');
                            // Get audio element reference
                            const audioElement = document.querySelector('audio');
                            if (audioElement) {
                                // Sync audio element with wavesurfer
                                const timeUpdateHandler = () => {
                                    if (ws && !ws.isPlaying() &&
                                        Math.abs(ws.getCurrentTime() - audioElement.currentTime) > 0.1) {
                                        ws.seekTo(audioElement.currentTime / audioElement.duration);
                                    }
                                };

                                audioElement.addEventListener('timeupdate', timeUpdateHandler);

                                // Sync wavesurfer with audio element
                                ws.on('seek', () => {
                                    if (audioElement && Math.abs(ws.getCurrentTime() - audioElement.currentTime) > 0.1) {
                                        audioElement.currentTime = ws.getCurrentTime();
                                    }
                                });

                                // Add play/pause handlers
                                ws.on('play', () => {
                                    if (audioElement && audioElement.paused) {
                                        audioElement.play().catch(err => console.error("Error playing audio:", err));
                                    }
                                });

                                ws.on('pause', () => {
                                    if (audioElement && !audioElement.paused) {
                                        audioElement.pause();
                                    }
                                });

                                // Clean up event listener when wavesurfer is destroyed
                                ws.once('destroy', () => {
                                    audioElement.removeEventListener('timeupdate', timeUpdateHandler);
                                });
                            }
                        });

                        ws.on('error', (err) => {
                            console.error('WaveSurfer error:', err);
                        });

                        console.log("Loading audio:", audioURL);
                        ws.load(audioURL);
                        wavesurfer.current = ws;
                    } catch (innerError) {
                        console.error("Error creating WaveSurfer instance:", innerError);
                    }
                }, 300);

                // Clean up the timeout if the component unmounts before it fires
                return () => clearTimeout(timeoutId);
            } catch (error) {
                console.error("Error in WaveSurfer setup:", error);
            }
        };

        loadWaveSurfer();

        // Cleanup function
        return () => {
            if (wavesurfer.current) {
                try {
                    wavesurfer.current.destroy();
                    wavesurfer.current = null;
                } catch (err) {
                    console.error("Error destroying WaveSurfer:", err);
                }
            }
        };
    }, [audioURL, isEditing]);

    const simulateProof = async () => {
        if (!audioURL) {
            console.log("No audio to process");
            return;
        }

        console.log("Starting proof generation");
        setProcessing(true);

        try {
            // Simulate proof generation with a delay
            await new Promise((resolve) => setTimeout(resolve, 2500));
            setProofGenerated(true);
            console.log('Proof generated successfully');
        } catch (error) {
            console.error('Error generating proof:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleSampleClick = () => {
        // With the Modal component, we don't need to manually set modalOpen
        // as it's handled by the component itself
        console.log("Sample button clicked");
    };
    const generateProof = async () => {
        if (!audioURL || !fileName) {
            alert("Missing audio input");
            return;
        }
        try {
            setProcessing(true);
            const formData = new FormData();
            const res = await fetch(audioURL);
            const blob = await res.blob();
            formData.append('audio', blob, fileName);
            formData.append('transformations', JSON.stringify([
                ...(audioEffects.reverse ? ['Reverse'] : [])
            ]));

            const response = await fetch('http://localhost:3001/prove', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (result.success) {
                alert("✅ Proof generated!");
            } else {
                alert("❌ Proof failed");
            }
        } catch (err) {
            console.error("Proof generation error", err);
            alert("Error generating proof");
        } finally {
            setProcessing(false);
        }
    };
    const handleSignClick = () => {
        // This would trigger Privy wallet in a real implementation
        console.log("Sign with Privy wallet");
        setModalOpen(false);

        // Simulate signing process
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            simulateProof();
        }, 2000);
    };

    const handleEditClick = () => {
        setModalOpen(false);
        setIsEditing(true);
    };

    const handleSaveEdit = (effects) => {
        console.log("Applied effects:", effects);

        // Make sure effects object has all required properties
        const safeEffects = {
            reverse: effects?.reverse || false,
            stretch: effects?.speed || 1.0,
            pitch: effects?.pitch || 0,
        };

        // Update audio effects state for displaying badges
        setAudioEffects(safeEffects);

        // THIS IS THE IMPORTANT FIX: Update the audio URL to play the processed audio instead of the original
        if (effects.processedAudioURL) {
            console.log("Updating audio to processed version:", effects.processedAudioURL.substring(0, 50) + "...");
            setAudioURL(effects.processedAudioURL);
        } else {
            console.warn("No processed audio URL was returned");
        }

        setIsEditing(false);

        // Simulate processing and proof generation
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            setProofGenerated(true);
        }, 2000);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        // No manual WaveSurfer initialization here
        // The useEffect hook will handle it
    };

    const resetAll = () => {
        setAudioURL('');
        setFileName('');
        setProofGenerated(false);
        setIsEditing(false);
        setAudioEffects({
            reverse: false,
            stretch: 1.0,
            pitch: 0,
        });

        if (wavesurfer.current) {
            try {
                wavesurfer.current.destroy();
                wavesurfer.current = null;
            } catch (err) {
                console.error("Error destroying WaveSurfer:", err);
            }
        }
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
                        Audio Editor <span className="text-violet-400">🎛️</span>
                    </motion.h2>
                </motion.div>

                <motion.p
                    className="mb-8 text-lg text-gray-300 max-w-xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    Upload your sample, apply secret sauce, generate ZK proof.
                </motion.p>

                {/* Only show FileUpload if no audio has been uploaded yet */}
                {!audioURL && <FileUpload onChange={handleFileChange} />}

                {/* Audio waveform display */}
                {audioURL && !isEditing && (
                    <motion.div
                        className="mt-8 p-4 bg-zinc-900/60 rounded-lg backdrop-blur-sm border border-zinc-800"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-medium text-left text-gray-200">
                                {fileName || "Audio Waveform"}
                            </h3>

                            {audioEffects && (audioEffects.reverse ||
                                (audioEffects.stretch !== undefined && audioEffects.stretch !== 1.0) ||
                                (audioEffects.pitch !== undefined && audioEffects.pitch !== 0)) && (
                                <div className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-violet-500/20 text-violet-300">
                                    <Sparkles className="w-3 h-3" />
                                    <span>Effects Applied</span>
                                </div>
                            )}
                        </div>

                        <div
                            ref={waveformRef}
                            className="w-full h-24 mb-4 bg-zinc-800/50 rounded overflow-hidden"
                        />

                        {/* Audio element with safe event handlers */}
                        <audio
                            controls
                            src={audioURL}
                            className="mb-2 w-full"
                            onPlay={() => {
                                if (wavesurfer.current && typeof wavesurfer.current.play === 'function') {
                                    wavesurfer.current.play();
                                }
                            }}
                            onPause={() => {
                                if (wavesurfer.current && typeof wavesurfer.current.pause === 'function') {
                                    wavesurfer.current.pause();
                                }
                            }}
                            onTimeUpdate={(e) => {
                                const audio = e.target;
                                if (wavesurfer.current &&
                                    audio &&
                                    typeof audio.currentTime === 'number' &&
                                    typeof audio.duration === 'number' &&
                                    audio.duration > 0 &&
                                    typeof wavesurfer.current.getCurrentTime === 'function' &&
                                    typeof wavesurfer.current.seekTo === 'function') {

                                    if (Math.abs(wavesurfer.current.getCurrentTime() - audio.currentTime) > 0.1) {
                                        wavesurfer.current.seekTo(audio.currentTime / audio.duration);
                                    }
                                }
                            }}
                        />

                        {/* Effects badge display with null checks */}
                        {audioEffects && (
                            audioEffects.reverse ||
                            (audioEffects.stretch !== undefined && audioEffects.stretch !== 1.0) ||
                            (audioEffects.pitch !== undefined && audioEffects.pitch !== 0)
                        ) && (
                            <div className="flex flex-wrap gap-2 mt-3 justify-center">
                                {audioEffects.reverse && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">
                                        Reversed
                                    </span>
                                )}
                                {audioEffects.stretch !== undefined && audioEffects.stretch !== 1.0 && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">
                                        Stretch: {audioEffects.stretch.toFixed(2)}x
                                    </span>
                                )}
                                {audioEffects.pitch !== undefined && audioEffects.pitch !== 0 && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">
                                        Pitch: {audioEffects.pitch > 0 ? `+${audioEffects.pitch}` : audioEffects.pitch}
                                    </span>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Audio Editor Interface */}
                <AnimatePresence>
                    {isEditing && (
                        <motion.div
                            className="mt-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            <AudioEditorInterface
                                audioURL={audioURL}
                                fileName={fileName}
                                onSave={handleSaveEdit}
                                onCancel={handleCancelEdit}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sample/Edit button and Modal */}
                {audioURL && !isEditing && !proofGenerated && (
                    <div className="flex flex-col items-center mt-8 gap-4">
                        <Modal open={modalOpen} onOpenChange={setModalOpen}>
                            <ModalTrigger asChild>
                                <div
                                    className="relative px-8 py-3 font-medium rounded-md overflow-hidden transition-all duration-300 cursor-pointer"
                                    onClick={handleSampleClick}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        <span>Sample this</span>
                                    </span>
                                    <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-80" />
                                </div>
                            </ModalTrigger>
                            <ModalBody className="bg-zinc-900 border border-zinc-800">
                                <ModalContent>
                                    <h2 className="text-2xl font-bold text-center mb-6 text-white">Do you want to sign the audio first?</h2>
                                    <div className="flex flex-col md:flex-row gap-6 justify-center items-center mb-6">
                                        <div className="w-full md:w-1/2" onClick={handleSignClick}>
                                            <div className="h-64">
                                                <EvervaultCard text="Sign" className="cursor-pointer" />
                                            </div>
                                            <h3 className="text-lg font-medium mt-3 text-center text-white">Sign with your account</h3>
                                        </div>
                                        <div className="w-full md:w-1/2" onClick={handleEditClick}>
                                            <div className="h-64">
                                                <CustomCard text="Edit" className="cursor-pointer" />
                                            </div>
                                            <h3 className="text-lg font-medium mt-3 text-center text-white">Edit anon</h3>
                                        </div>
                                    </div>
                                </ModalContent>
                            </ModalBody>
                        </Modal>

                        {processing && (
                            <motion.div
                                className="text-zinc-300 mt-4 p-3 rounded-md bg-zinc-800/50 border border-zinc-700 flex items-center gap-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-transparent animate-spin"></div>
                                <span>Processing your sample...</span>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Proof Generated Success Message */}
                {proofGenerated && (
                    <motion.div
                        className="mt-8 p-4 bg-green-900/20 backdrop-blur-sm border border-green-700/30 rounded-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-green-400" />
                            </div>
                            <h3 className="text-xl font-medium text-green-400">Proof Generated!</h3>
                        </div>
                        <p className="text-green-300/80 text-sm mb-4">
                            Your sample has been processed and a zero-knowledge proof has been generated successfully.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
                            <a
                                href={audioURL}
                                download="processed_audio.wav"
                                className="inline-flex items-center gap-2 px-6 py-2 rounded-md font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:opacity-90 transition-all"
                            >
                                <Music className="w-4 h-4" />
                                Download Sample
                            </a>

                            <button
                                onClick={generateProof}
                                className="inline-flex items-center gap-2 px-6 py-2 rounded-md font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 transition-all"
                            >
                                <Sparkles className="w-4 h-4" />
                                Generate Proof
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Reset button */}
                {audioURL && (
                    <div className="mt-6">
                        <button
                            onClick={resetAll}
                            className="text-sm text-gray-400 hover:text-white flex items-center gap-1 mx-auto transition-colors"
                        >
                            <XCircle className="w-4 h-4" />
                            <span>Upload a different file</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}