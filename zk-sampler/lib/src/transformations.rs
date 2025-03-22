use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum AudioTransform {
    Reverse,
    Pitch(i32),       // semitones
    Stretch(f32),     // factor
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SignatureData {
    pub signature: Vec<u8>,
    pub public_key: Vec<u8>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AudioTransformInput {
    pub audio_data: Vec<i16>,
    pub sample_rate: u32,
    pub transformations: Vec<AudioTransform>,
    pub signature_data: Option<SignatureData>,
}