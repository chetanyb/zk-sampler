use clap::Parser;
use sp1_sdk::{include_elf, ProverClient, SP1Stdin, HashableKey};
use zk_sampler_lib::{AudioTransformInput, AudioTransform, SignatureData, AudioProofPublicValues, reverse_audio, pitch_shift, time_stretch};
use serde::{Deserialize, Serialize};
use std::{fs, env};
use hound;
use hex;
use alloy_sol_types::SolType;

/// The ELF file for the Succinct RISC-V zkVM.
pub const AUDIO_ELF: &[u8] = include_elf!("zk-sampler-program");

#[derive(Parser, Debug)]
#[clap(author, version, about)]
struct Args {
    #[clap(long)]
    execute: bool,

    #[clap(long)]
    prove: bool,

    #[clap(long)]
    input: String,

    #[clap(long)]
    output: String,

    #[clap(long)]
    sample_rate: u32,

    #[clap(long)]
    transform_json: String,

    #[clap(long)]
    signature: Option<String>,

    #[clap(long)]
    public_key: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ProofData {
    proof: String,
    verification_key: String,
    public_values: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AudioProofOutput {
    original_audio_hash: String,
    transformed_audio_hash: String,
    signer_public_key: String,
    has_signature: bool,
    success: bool,
    message: String,
    proof_data: Option<ProofData>,
}

fn main() {
    env::set_var("TRACE_FILE", "audio_editor_profile.json");
    env::set_var("TRACE_SAMPLE_RATE", "100");

    sp1_sdk::utils::setup_logger();
    dotenv::dotenv().ok();

    let args = Args::parse();
    if args.execute == args.prove {
        eprintln!("Error: You must specify either --execute or --prove");
        std::process::exit(1);
    }

    let mut reader = hound::WavReader::open(&args.input).expect("Failed to open input WAV");
    let spec = reader.spec();
    let audio_data: Vec<i16> = reader.samples::<i16>().filter_map(Result::ok).collect();

    let transformations: Vec<AudioTransform> = serde_json::from_str(
        &fs::read_to_string(&args.transform_json).expect("Failed to read transformation JSON")
    ).expect("Invalid transformation JSON");

    let signature_data = match (args.signature.as_ref(), args.public_key.as_ref()) {
        (Some(sig_path), Some(pk_path)) => {
            // Read and clean signature
            let sig_str = fs::read_to_string(sig_path).expect("Failed to read signature file");
            let sig_clean = sig_str.trim().strip_prefix("0x").unwrap_or(sig_str.trim());

            // Read and clean public key
            let pk_str = fs::read_to_string(pk_path).expect("Failed to read public key file");
            let pk_clean = pk_str.trim().strip_prefix("0x").unwrap_or(pk_str.trim());

            println!("🔍 Loaded signature hex: {}", sig_clean);
            println!("🔍 Loaded public key hex: {}", pk_clean);

            let signature = hex::decode(sig_clean).expect("Invalid signature hex");
            let public_key = hex::decode(pk_clean).expect("Invalid public key hex");

            Some(SignatureData { signature, public_key })
        },
        _ => None,
    };

    let input = AudioTransformInput {
        audio_data: audio_data.clone(),
        sample_rate: args.sample_rate,
        transformations: transformations.clone(),
        signature_data,
    };

    let client = ProverClient::from_env();
    let mut stdin = SP1Stdin::new();
    stdin.write(&input);

    let output = if args.execute {
        // Local execution mode (no proof)
        let mut samples = input.audio_data.clone();
        for transform in &input.transformations {
            match transform {
                AudioTransform::Reverse => reverse_audio(&mut samples),
                AudioTransform::Pitch(s) => {
                    samples = pitch_shift(&samples, *s, input.sample_rate as usize);
                },
                AudioTransform::Stretch(f) => {
                    samples = time_stretch(&samples, *f, input.sample_rate as usize);
                }
            }
        }

        let out_spec = hound::WavSpec {
            channels: 1,
            sample_rate: spec.sample_rate,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };
        let mut writer = hound::WavWriter::create(&args.output, out_spec).unwrap();
        for s in samples {
            writer.write_sample(s).unwrap();
        }
        writer.finalize().unwrap();

        println!("✅ Audio transformed (no proof) and saved to {}", args.output);

        AudioProofOutput {
            original_audio_hash: "0x".to_string(),
            transformed_audio_hash: "0x".to_string(),
            signer_public_key: "0x".to_string(),
            has_signature: false,
            success: true,
            message: "Executed without proof.".to_string(),
            proof_data: None,
        }
    } else {
        let (pk, vk) = client.setup(AUDIO_ELF);
        match client.prove(&pk, &stdin).groth16().run() {
        // match client.prove(&pk, &stdin).run() {
            Ok(proof) => {
                client.verify(&proof, &vk).expect("Proof failed verification");

                let public_values = proof.public_values.as_slice();
                println!("🔬 Raw public_values len: {}", public_values.len());
                println!("📦 Raw public_values (hex): 0x{}", hex::encode(public_values));
                let decoded = AudioProofPublicValues::abi_decode(public_values, false)
                    .expect("Failed to decode public values");

                fs::write(&args.output, &proof.bytes()).expect("Failed to write proof");
                fs::write("public_values.bin", public_values).expect("Failed to write public values");
                fs::write("verification_key.bin", vk.bytes32().as_bytes()).expect("Failed to write vk");

                println!("✅ Proof generated and saved.");
                println!("📦 proof.bin, public_values.bin, verification_key.bin");

                AudioProofOutput {
                    original_audio_hash: format!("0x{}", hex::encode(decoded.original_audio_hash.0)),
                    transformed_audio_hash: format!("0x{}", hex::encode(decoded.transformed_audio_hash.0)),
                    signer_public_key: format!("0x{}", hex::encode(decoded.signer_public_key.0)),
                    has_signature: decoded.has_signature,
                    success: true,
                    message: "Proof created successfully".to_string(),
                    proof_data: Some(ProofData {
                        proof: format!("0x{}", hex::encode(proof.bytes())),
                        public_values: format!("0x{}", hex::encode(public_values)),
                        verification_key: vk.bytes32().to_string(),
                    }),
                }
            }
            Err(e) => AudioProofOutput {
                original_audio_hash: "0x".to_string(),
                transformed_audio_hash: "0x".to_string(),
                signer_public_key: "0x".to_string(),
                has_signature: false,
                success: false,
                message: format!("Prover error: {}", e),
                proof_data: None,
            }
        }
    };

    fs::write("output.json", serde_json::to_string_pretty(&output).unwrap())
        .expect("Failed to write output.json");
    println!("{}", serde_json::to_string(&output).unwrap());
}