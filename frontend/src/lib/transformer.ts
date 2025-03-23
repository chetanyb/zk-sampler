import { loadWasm, getWasmModule } from './wasm-loader';
import { float32ToWav } from './float32ToWav';

interface TransformOptions {
    reverse: boolean;
    pitch: number;
    stretch: number;
}

export async function applyEffects(
    input: ArrayBuffer,
    sampleRate: number,
    options: TransformOptions
): Promise<{
    transformedBuffer: ArrayBuffer;
    transformationJSON: any[];
}> {
    console.log("applyEffects called with options:", options);
    console.log(`Input buffer type: ${input.constructor.name}, size: ${input.byteLength} bytes`);

    try {
        // Initialize WASM module
        console.log("Loading WASM module...");
        await loadWasm();

        // Get the module with its exported functions
        const wasmModule = getWasmModule();
        console.log("WASM module loaded with exports:", Object.keys(wasmModule).join(", "));

        // Create a new Float32Array from the input ArrayBuffer
        let floatData: Float32Array;

        if (input instanceof ArrayBuffer) {
            console.log("Converting ArrayBuffer to Float32Array");
            floatData = new Float32Array(input);
            // Log a few samples to verify data
            console.log("First 5 samples:", Array.from(floatData.slice(0, 5)).map(s => s.toFixed(4)));
        } else {
            throw new Error(`Invalid input type: ${typeof input}`);
        }

        console.log(`Float32Array created, length: ${floatData.length}`);

        // Record transformations for JSON
        const transformations: any[] = [];

        // Extract functions from module
        const { reverse, pitch_shift, stretch } = wasmModule;

        // Apply reverse effect if requested
        if (options.reverse) {
            console.log("Applying reverse effect...");
            try {
                const originalLength = floatData.length;
                floatData = reverse(floatData);
                console.log(`Reverse applied. Original length: ${originalLength}, New length: ${floatData.length}`);
                console.log("First 5 samples after reverse:", Array.from(floatData.slice(0, 5)).map(s => s.toFixed(4)));
                transformations.push({ Reverse: {} });
            } catch (error) {
                console.error("Error in reverse operation:", error);
                throw new Error(`Reverse operation failed: ${error.message}`);
            }
        }

        // Apply pitch shift if not zero
        if (options.pitch !== 0) {
            console.log(`Applying pitch shift: ${options.pitch} semitones...`);
            try {
                const originalLength = floatData.length;
                floatData = pitch_shift(floatData, options.pitch, sampleRate);
                console.log(`Pitch shift applied. Original length: ${originalLength}, New length: ${floatData.length}`);
                transformations.push({ Pitch: options.pitch });
            } catch (error) {
                console.error("Error in pitch shift operation:", error);
                throw new Error(`Pitch shift operation failed: ${error.message}`);
            }
        }

        // Apply time stretch if not 1.0
        if (options.stretch !== 1.0) {
            console.log(`Applying time stretch: ${options.stretch}x...`);
            try {
                const originalLength = floatData.length;
                floatData = stretch(floatData, options.stretch, sampleRate);
                console.log(`Stretch applied. Original length: ${originalLength}, New length: ${floatData.length}`);
                transformations.push({ Stretch: options.stretch });
            } catch (error) {
                console.error("Error in stretch operation:", error);
                throw new Error(`Stretch operation failed: ${error.message}`);
            }
        }

        // Log if no transformations were applied
        if (transformations.length === 0) {
            console.log("No transformations applied, audio will be unchanged");
        }

        // Convert to WAV format
        console.log("Converting processed audio to WAV format...");
        try {
            const transformedBuffer = float32ToWav(floatData, sampleRate);
            console.log(`WAV conversion complete. Buffer size: ${transformedBuffer.byteLength} bytes`);

            return {
                transformedBuffer,
                transformationJSON: transformations,
            };
        } catch (error) {
            console.error("Error in WAV conversion:", error);
            throw new Error(`WAV conversion failed: ${error.message}`);
        }
    } catch (error) {
        console.error("Error in applyEffects:", error);
        throw error; // Re-throw to be handled by caller
    }
}