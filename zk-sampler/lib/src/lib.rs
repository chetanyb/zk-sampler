use alloy_sol_types::sol;

mod dsp;
mod transformations;

pub use dsp::{reverse_audio, pitch_shift, time_stretch};
pub use transformations::{AudioTransform, AudioTransformInput, SignatureData};

sol! {
    struct AudioProofPublicValues {
        bytes32 original_audio_hash;
        bytes32 transformed_audio_hash;
        bytes32 signer_public_key;
        bool has_signature;
    }
}