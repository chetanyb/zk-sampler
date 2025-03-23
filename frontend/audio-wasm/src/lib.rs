use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    // JS imports if needed
}

#[wasm_bindgen]
pub fn reverse(input: Vec<f32>) -> Vec<f32> {
    let mut out = input.clone();
    out.reverse();
    out
}

#[wasm_bindgen]
pub fn pitch_shift(input: Vec<f32>, semitones: i32, sample_rate: usize) -> Vec<f32> {
    // Placeholder: return input as-is
    input
}

#[wasm_bindgen]
pub fn stretch(input: Vec<f32>, factor: f32, sample_rate: usize) -> Vec<f32> {
    // Placeholder: return input as-is
    input
}
