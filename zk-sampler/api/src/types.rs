use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Serialize)]
pub struct ProofData {
    pub proof: String,
    pub verification_key: String,
    pub public_values: String,
}

#[derive(Serialize)]
pub struct ProofResponse {
    pub success: bool,
    pub message: String,
    pub original_audio_hash: String,
    pub transformed_audio_hash: String,
    pub signer_public_key: String,
    pub has_signature: bool,
    pub proof_data: Option<ProofData>,
}

#[derive(Deserialize)]
pub struct HexSignatureData {
    pub signature: String,
    pub public_key: String,
}

#[derive(Clone)]
pub struct AppState {
    pub prover: Arc<sp1_sdk::EnvProver>,
    pub elf_data: Arc<Vec<u8>>,
    pub pk: Arc<sp1_sdk::SP1ProvingKey>,
    pub vk: String,
}