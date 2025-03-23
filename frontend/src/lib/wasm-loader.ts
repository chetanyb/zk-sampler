// Enhanced WASM loader with better error handling and diagnostics

let wasmInitPromise: Promise<any> | null = null;
let wasmModule: any = null;
let initializationError: Error | null = null;

// Check if WebAssembly is supported
const isWebAssemblySupported = () => {
    try {
        if (typeof WebAssembly === 'object' &&
            typeof WebAssembly.instantiate === 'function' &&
            typeof WebAssembly.compile === 'function') {

            // Try to create a simple module
            const module = new WebAssembly.Module(new Uint8Array([
                0x00, 0x61, 0x73, 0x6d, // WASM magic bytes
                0x01, 0x00, 0x00, 0x00  // WASM version
            ]));

            if (module instanceof WebAssembly.Module) {
                return { supported: true, error: null };
            }
            return { supported: false, error: "WebAssembly.Module check failed" };
        }
        return { supported: false, error: "WebAssembly object not available" };
    } catch (e) {
        return { supported: false, error: e.message };
    }
};

export async function loadWasm() {
    if (wasmInitPromise) {
        return wasmInitPromise;
    }

    console.log("Starting WASM initialization");

    // Check WebAssembly support first
    const wasmSupport = isWebAssemblySupported();
    if (!wasmSupport.supported) {
        const error = new Error(`WebAssembly not supported in this browser: ${wasmSupport.error}`);
        console.error(error);
        initializationError = error;
        return Promise.reject(error);
    }

    wasmInitPromise = new Promise(async (resolve, reject) => {
        try {
            // Dynamically import the init function from wasm-pack
            console.log("Importing WASM module from '@/wasm/audio_processor'");

            // Alternative loading method using explicit path
            // First try the standard import approach
            try {
                const module = await import("@/wasm/audio_processor");
                console.log("WASM module imported successfully", module);
                wasmModule = module;

                // Initialize the module
                await module.default();
                console.log("✅ WASM audio_processor initialized successfully");

                // Test function availability
                if (!module.reverse || !module.pitch_shift || !module.stretch) {
                    throw new Error("Missing required WASM functions. Available exports: " +
                        Object.keys(module).join(", "));
                }

                resolve(module);
            } catch (importError) {
                console.error("Standard import failed:", importError);

                // Try with a more explicit path as a fallback
                try {
                    const alternativeModule = await import("/src/wasm/audio_processor");
                    console.log("WASM module imported via alternative path");
                    wasmModule = alternativeModule;
                    await alternativeModule.default();
                    console.log("✅ WASM audio_processor initialized via alternative path");
                    resolve(alternativeModule);
                } catch (alternativeError) {
                    console.error("Alternative import also failed:", alternativeError);
                    throw new Error(`Failed to import WASM module: ${importError.message}`);
                }
            }
        } catch (e) {
            console.error("❌ Failed to init WASM:", e);
            initializationError = e;
            reject(e);
        }
    });

    return wasmInitPromise;
}

// Get the current WASM module or throw if not initialized
export function getWasmModule() {
    if (!wasmModule) {
        if (initializationError) {
            throw new Error(`WASM module not initialized due to previous error: ${initializationError.message}`);
        }
        throw new Error("WASM module not initialized yet. Call loadWasm() first.");
    }
    return wasmModule;
}

// Helper to test if WASM functions are working
export async function testWasmFunctionality() {
    try {
        await loadWasm();
        const module = getWasmModule();

        // Create a small test array
        const testArray = new Float32Array(10);
        for (let i = 0; i < 10; i++) {
            testArray[i] = i / 10;
        }

        console.log("Testing reverse function with:", testArray);
        const reversed = module.reverse(testArray);
        console.log("Reverse result:", reversed);

        return {
            success: true,
            testData: testArray,
            reversedData: reversed
        };
    } catch (error) {
        console.error("WASM functionality test failed:", error);
        return {
            success: false,
            error: error.message
        };
    }
}