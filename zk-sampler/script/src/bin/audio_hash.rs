use hound;
use sha2::{Sha256, Digest};
use std::{fs::File, io::Write};
use clap::Parser;
use hex;

/// CLI to hash WAV files like SP1 ZK circuit
#[derive(Parser, Debug)]
struct Args {
    #[clap(long)]
    input: String,

    #[clap(long)]
    output: Option<String>,
}

fn main() -> anyhow::Result<()> {
    let args = Args::parse();

    // Read the WAV file as i16 samples
    let mut reader = hound::WavReader::open(&args.input)?;
    let samples: Vec<i16> = reader.samples::<i16>().filter_map(Result::ok).collect();

    // Convert to bytes (LE, 2 bytes per sample)
    let bytes: Vec<u8> = samples.iter()
        .flat_map(|s| s.to_le_bytes())
        .collect();

    // Hash the bytes using standard SHA256 (same as SP1 syscall)
    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let result = hasher.finalize();

    let hex_hash = hex::encode(result);
    println!("0x{}", hex_hash);

    if let Some(out_path) = args.output {
        let mut f = File::create(out_path)?;
        writeln!(f, "0x{}", hex_hash)?;
    }

    Ok(())
}