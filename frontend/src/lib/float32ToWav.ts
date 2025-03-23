export function float32ToWav(floatSamples: Float32Array, sampleRate: number): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + floatSamples.length * 2);
    const view = new DataView(buffer);

    function writeString(view: DataView, offset: number, str: string) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    }

    // RIFF chunk
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + floatSamples.length * 2, true);
    writeString(view, 8, 'WAVE');

    // fmt subchunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample

    // data subchunk
    writeString(view, 36, 'data');
    view.setUint32(40, floatSamples.length * 2, true);

    for (let i = 0; i < floatSamples.length; i++) {
        let sample = Math.max(-1, Math.min(1, floatSamples[i]));
        view.setInt16(44 + i * 2, sample * 0x7fff, true);
    }

    return buffer;
}