#![no_main]
sp1_zkvm::entrypoint!(main);

use zk_sampler_lib::{
    AudioTransform, AudioTransformInput, AudioProofPublicValues, SignatureData,
    reverse_audio, pitch_shift, time_stretch
};
use sp1_zkvm::{io, syscalls};
use alloy_sol_types::{SolType, private::FixedBytes};

use k256::ecdsa::{Signature, RecoveryId, VerifyingKey};
use sha3::{Keccak256, Digest};

fn hash_audio(samples: &[i16]) -> [u8; 32] {
    let bytes = samples.iter().flat_map(|s| s.to_le_bytes()).collect::<Vec<u8>>();
    let mut state = [
        0x6a09e667u32, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ];

    let mut i = 0;
    while i + 64 <= bytes.len() {
        let mut w = [0u32; 64];
        for j in 0..16 {
            let idx = i + j * 4;
            w[j] = ((bytes[idx] as u32) << 24)
                | ((bytes[idx + 1] as u32) << 16)
                | ((bytes[idx + 2] as u32) << 8)
                | (bytes[idx + 3] as u32);
        }

        syscalls::syscall_sha256_extend(&mut w);
        syscalls::syscall_sha256_compress(&mut w, &mut state);
        i += 64;
    }

    let mut final_block = [0u8; 64];
    let remaining = bytes.len() - i;
    final_block[..remaining].copy_from_slice(&bytes[i..]);
    final_block[remaining] = 0x80;

    let mut w = [0u32; 64];
    if remaining < 56 {
        for j in 0..14 {
            let idx = j * 4;
            w[j] = ((final_block[idx] as u32) << 24)
                | ((final_block[idx + 1] as u32) << 16)
                | ((final_block[idx + 2] as u32) << 8)
                | (final_block[idx + 3] as u32);
        }
        let len_bits = (bytes.len() as u64) * 8;
        w[14] = (len_bits >> 32) as u32;
        w[15] = len_bits as u32;

        syscalls::syscall_sha256_extend(&mut w);
        syscalls::syscall_sha256_compress(&mut w, &mut state);
    } else {
        for j in 0..16 {
            let idx = j * 4;
            w[j] = ((final_block[idx] as u32) << 24)
                | ((final_block[idx + 1] as u32) << 16)
                | ((final_block[idx + 2] as u32) << 8)
                | (final_block[idx + 3] as u32);
        }

        syscalls::syscall_sha256_extend(&mut w);
        syscalls::syscall_sha256_compress(&mut w, &mut state);

        w = [0u32; 64];
        let len_bits = (bytes.len() as u64) * 8;
        w[14] = (len_bits >> 32) as u32;
        w[15] = len_bits as u32;

        syscalls::syscall_sha256_extend(&mut w);
        syscalls::syscall_sha256_compress(&mut w, &mut state);
    }

    let mut result = [0u8; 32];
    for i in 0..8 {
        result[i * 4] = (state[i] >> 24) as u8;
        result[i * 4 + 1] = (state[i] >> 16) as u8;
        result[i * 4 + 2] = (state[i] >> 8) as u8;
        result[i * 4 + 3] = state[i] as u8;
    }
    result
}

fn verify_ethereum_signature(msg: &[u8], sig_data: &SignatureData) -> Option<[u8; 20]> {
    if sig_data.signature.len() != 65 {
        return None;
    }

    let r_s = &sig_data.signature[..64];
    let v = sig_data.signature[64];

    let recovery_id = RecoveryId::from_byte(v - 27)?;
    let signature = Signature::from_slice(r_s).ok()?;

    // Ethereum message prefix hash
    let mut hasher = Keccak256::new();
    hasher.update(b"\x19Ethereum Signed Message:\n32");
    hasher.update(msg);
    let message_hash = hasher.finalize();

    let verifying_key = VerifyingKey::recover_from_prehash(&message_hash, &signature, recovery_id).ok()?;

    // Derive Ethereum address
    let mut hasher = Keccak256::new();
    hasher.update(&verifying_key.to_encoded_point(false).as_bytes()[1..]);
    let hash = hasher.finalize();

    let mut address = [0u8; 20];
    address.copy_from_slice(&hash[12..32]);
    Some(address)
}

pub fn main() {
    let input: AudioTransformInput = io::read();
    let original_hash = hash_audio(&input.audio_data);

    let mut samples = input.audio_data.clone();
    for transform in input.transformations.iter() {
        match transform {
            AudioTransform::Reverse => reverse_audio(&mut samples),
            AudioTransform::Pitch(semitones) => {
                samples = pitch_shift(&samples, *semitones, input.sample_rate as usize);
            },
            AudioTransform::Stretch(factor) => {
                samples = time_stretch(&samples, *factor, input.sample_rate as usize);
            }
        }
    }

    let transformed_hash = hash_audio(&samples);

    let mut signer_bytes = [0u8; 32];
    let mut has_signature = false;


    if let Some(sig_data) = &input.signature_data {
        if let Some(eth_addr) = verify_ethereum_signature(&original_hash, sig_data) {
            signer_bytes[12..].copy_from_slice(&eth_addr);
            has_signature = true;
        }
    }

    let public_values = AudioProofPublicValues {
        original_audio_hash: FixedBytes(original_hash),
        transformed_audio_hash: FixedBytes(transformed_hash),
        signer_public_key: FixedBytes(signer_bytes),
        has_signature,
    };

    let encoded = AudioProofPublicValues::abi_encode(&public_values);
    io::commit_slice(&encoded);
}