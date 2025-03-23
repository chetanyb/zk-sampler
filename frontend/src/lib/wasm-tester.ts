// A utility to test WASM audio processing functions

export async function testWasmFunctions() {
    console.log("Testing WASM functions...");

    try {
        // Import WASM module
        const wasmModule = await import('@/wasm/audio_processor');
        console.log("WASM module loaded:", wasmModule);

        // Initialize WASM
        await wasmModule.default();
        console.log("WASM module initialized");

        // Generate test data - a simple sine wave
        const sampleRate = 44100;
        const frequency = 440; // A4 note frequency
        const duration = 1; // seconds
        const numSamples = sampleRate * duration;

        console.log(`Creating test audio: ${duration}s at ${frequency}Hz, ${numSamples} samples`);

        const testData = new Float32Array(numSamples);
        for (let i = 0; i < numSamples; i++) {
            testData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate);
        }

        console.log("Test data created, first 10 samples:", Array.from(testData.slice(0, 10)));

        // Test reverse function
        console.log("Testing reverse function...");
        const reversedData = wasmModule.reverse(testData);
        console.log("Reverse successful, first 10 samples:", Array.from(reversedData.slice(0, 10)));

        // Test pitch shift function
        console.log("Testing pitch shift function...");
        const pitchShiftedData = wasmModule.pitch_shift(testData, 5, sampleRate); // Shift up 5 semitones
        console.log("Pitch shift successful, first 10 samples:", Array.from(pitchShiftedData.slice(0, 10)));

        // Test stretch function
        console.log("Testing stretch function...");
        const stretchedData = wasmModule.stretch(testData, 0.5, sampleRate); // Stretch to twice the length
        console.log("Stretch successful, first 10 samples:", Array.from(stretchedData.slice(0, 10)));

        // Success
        console.log("All WASM functions tested successfully!");
        return { success: true };

    } catch (error) {
        console.error("WASM test failed:", error);
        return {
            success: false,
            error: error.message,
            stack: error.stack
        };
    }
}

// Add to window for easy access from console
if (typeof window !== 'undefined') {
    // @ts-ignore
    window.testWasmFunctions = testWasmFunctions;
}