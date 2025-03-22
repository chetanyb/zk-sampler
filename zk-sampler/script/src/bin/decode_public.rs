use clap::Parser;
use zk_sampler_lib::AudioProofPublicValues;
use alloy_sol_types::SolType;
use std::fs;
use hex;

/// CLI to decode public_values.bin from zkSampler proof
#[derive(Parser, Debug)]
struct Args {
    #[clap(long)]
    input: String,
}

fn main() -> anyhow::Result<()> {
    let args = Args::parse();
    let data = fs::read(&args.input)?;
    
    let decoded = AudioProofPublicValues::abi_decode(&data, false)
        .expect("Failed to decode public values");

    println!("🎧 Public Values Decoded:");
    println!("- Original audio hash: 0x{}", hex::encode(decoded.original_audio_hash.0));
    println!("- Transformed audio hash: 0x{}", hex::encode(decoded.transformed_audio_hash.0));
    println!("- Signer address: 0x{}", hex::encode(&decoded.signer_public_key.0[12..]));
    println!("- Has signature: {}", decoded.has_signature);

    Ok(())
}