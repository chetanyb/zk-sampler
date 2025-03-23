use axum::{http::StatusCode, Json, response::{IntoResponse, Response}};
use std::path::PathBuf;
use tracing::info;

use crate::types::ProofResponse;

pub fn load_elf(name: &str) -> Vec<u8> {
    info!("🔧 Loading ELF: {name}");
    let target_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("target/elf-compilation/riscv32im-succinct-zkvm-elf/release");

    std::fs::read(target_dir.join(name))
        .expect("Failed to read ELF file. Did you run `cargo prove build`?")
}

impl ProofResponse {
    pub fn error(message: impl Into<String>) -> Response {
        let response = Self {
            success: false,
            message: message.into(),
            original_audio_hash: "0x".into(),
            transformed_audio_hash: "0x".into(),
            signer_public_key: "0x".into(),
            has_signature: false,
            proof_data: None,
        };

        (StatusCode::BAD_REQUEST, Json(response)).into_response()
    }

    pub fn success(
        original_hash: String,
        transformed_hash: String,
        signer_key: String,
        has_sig: bool,
        proof: Option<crate::types::ProofData>,
    ) -> Response {
        let response = Self {
            success: true,
            message: "Proof generated successfully".to_string(),
            original_audio_hash: original_hash,
            transformed_audio_hash: transformed_hash,
            signer_public_key: signer_key,
            has_signature: has_sig,
            proof_data: proof,
        };

        (StatusCode::OK, Json(response)).into_response()
    }
}