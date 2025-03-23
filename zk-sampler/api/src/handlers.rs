use axum::{ extract::State, response::Response };
use tracing::info;
use std::{ path::PathBuf };
use sp1_sdk::{SP1Stdin};
use axum::extract::Multipart;
use tokio::fs;

use crate::types::{AppState, ProofData, ProofResponse, HexSignatureData};
use zk_sampler_lib::{AudioTransform, AudioTransformInput, SignatureData, AudioProofPublicValues, reverse_audio, pitch_shift, time_stretch};
use alloy_sol_types::SolType;

pub async fn health_check() -> &'static str {
    "OK"
}

pub async fn prove_local(State(state): State<AppState>) -> Response {
    info!("🧪 Running /prove-local test route");

    let input_path = PathBuf::from("../assets/sample.wav");
    let transform_json_path = PathBuf::from("../transform.json");

    // Load WAV
    let mut reader = hound::WavReader::open(&input_path).unwrap();
    let spec = reader.spec();
    let audio_data: Vec<i16> = reader.samples::<i16>().filter_map(Result::ok).collect();

    // Load transformations
    let raw_json = fs::read_to_string(&transform_json_path).await.unwrap();
    let transformations: Vec<AudioTransform> = serde_json::from_str(&raw_json).unwrap();

    // Optional: load signature
    let signature = fs::read_to_string("sample.sig").await.unwrap_or_default();
    let pubkey = fs::read_to_string("sample.pub").await.unwrap_or_default();
    let signature_data = if !signature.trim().is_empty() && !pubkey.trim().is_empty() {
        Some(SignatureData {
            signature: hex::decode(signature.trim().trim_start_matches("0x")).unwrap(),
            public_key: hex::decode(pubkey.trim().trim_start_matches("0x")).unwrap(),
        })
    } else {
        None
    };

    let input = AudioTransformInput {
        audio_data: audio_data.clone(),
        sample_rate: spec.sample_rate,
        transformations: transformations.clone(),
        signature_data,
    };

    // Apply transformations for output
    let mut transformed = input.audio_data.clone();
    for transform in &input.transformations {
        match transform {
            AudioTransform::Reverse => reverse_audio(&mut transformed),
            AudioTransform::Pitch(p) => {
                transformed = pitch_shift(&transformed, *p, input.sample_rate as usize);
            },
            AudioTransform::Stretch(f) => {
                transformed = time_stretch(&transformed, *f, input.sample_rate as usize);
            }
        }
    }

    let mut stdin = SP1Stdin::new();
    stdin.write(&input);

    let proof_result = state.prover.prove(&state.pk, &stdin).groth16().run();

    match proof_result {
        Ok(proof) => {
            let public_values = proof.public_values.as_slice();
            let decoded = AudioProofPublicValues::abi_decode(public_values, false).unwrap();
            ProofResponse::success(
                format!("0x{}", hex::encode(decoded.original_audio_hash.0)),
                format!("0x{}", hex::encode(decoded.transformed_audio_hash.0)),
                format!("0x{}", hex::encode(decoded.signer_public_key.0)),
                decoded.has_signature,
                Some(ProofData {
                    proof: format!("0x{}", hex::encode(proof.bytes())),
                    public_values: format!("0x{}", hex::encode(public_values)),
                    verification_key: state.vk.clone(),
                }),
            )
        }
        Err(e) => ProofResponse::error(format!("❌ Prover failed: {e}")),
    }
}

pub async fn generate_proof(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Response {
    let mut audio_data: Option<Vec<i16>> = None;
    let mut sample_rate = 44100u32;
    let mut transformations: Option<Vec<AudioTransform>> = None;
    let mut signature_data: Option<SignatureData> = None;

    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap().to_string();

        match name.as_str() {
            "audio" => {
                let bytes = field.bytes().await.unwrap();
                let cursor = std::io::Cursor::new(bytes);
                let mut reader = hound::WavReader::new(cursor).unwrap();
                sample_rate = reader.spec().sample_rate;
                audio_data = Some(reader.samples::<i16>().filter_map(Result::ok).collect());
            }
            "transformations" => {
                let json = field.text().await.unwrap();
                transformations = Some(serde_json::from_str(&json).unwrap());
            }
            "signature_data" => {
                let json = field.text().await.unwrap();
                let sig: HexSignatureData = serde_json::from_str(&json).unwrap();
                signature_data = Some(SignatureData {
                    signature: hex::decode(sig.signature.trim_start_matches("0x")).unwrap(),
                    public_key: hex::decode(sig.public_key.trim_start_matches("0x")).unwrap(),
                });
            }
            _ => {
                tracing::warn!("Unexpected field: {}", name);
            }
        }
    }

    if audio_data.is_none() || transformations.is_none() {
        return ProofResponse::error("Missing required fields: `audio` and `transformations`".to_string());
    }

    let input = AudioTransformInput {
        audio_data: audio_data.unwrap(),
        sample_rate,
        transformations: transformations.unwrap(),
        signature_data,
    };

    let mut stdin = SP1Stdin::new();
    stdin.write(&input);
    let proof_result = state.prover.prove(&state.pk, &stdin).groth16().run();

    match proof_result {
        Ok(proof) => {
            let public_values = proof.public_values.as_slice();
            let decoded = AudioProofPublicValues::abi_decode(public_values, false).unwrap();

            ProofResponse::success(
                format!("0x{}", hex::encode(decoded.original_audio_hash.0)),
                format!("0x{}", hex::encode(decoded.transformed_audio_hash.0)),
                format!("0x{}", hex::encode(decoded.signer_public_key.0)),
                decoded.has_signature,
                Some(ProofData {
                    proof: format!("0x{}", hex::encode(proof.bytes())),
                    public_values: format!("0x{}", hex::encode(public_values)),
                    verification_key: state.vk.clone(),
                }),
            )
        }
        Err(e) => ProofResponse::error(format!("❌ Prover failed: {e}")),
    }
}