![zkSampler](https://img.shields.io/badge/zkSampler-%F0%9F%8E%A7%E2%9C%94%EF%B8%8F%20Prove%20your%20sound-black?style=for-the-badge&logo=audacity&logoColor=white)

zkSampler is a zero-knowledge audio sampling proof system that lets you prove you used a particular sample and only applied valid transformations — without revealing the sequence or parameters of those transformations.

This enables verifiable sampling in creative workflows, while preserving artistic privacy and creative freedom.

---

## 🧠 What It Does

zkSampler generates a zero-knowledge proof that:
- You used a specific audio sample.
- You applied only approved operations:
- 🔁 Reverse
- 🎚 Pitch shift (semitones)
- ⏱ Time stretch (scaling factor)
- You did not apply any unauthorized edits to the audio.
- Optionally: You are the authorized signer (e.g. sample owner, licensee).

✅ All without revealing:
- The specific transformations used,
- The order or number of transformations,
- The content of the original sample.

---

## 🧬 Note on Transformations

Currently:

Pitch shifting also affects time/stretch due to underlying DSP implementation.
This will be decoupled in future updates for independent pitch and time control.

---

## 🌍 Why This Is Useful

### ✅ For Artists & Producers
- Prove fair usage of commercial or licensed samples.
- Keep your workflow and style private.

### 🛠 For DAWs & Audio Plugins
- Add transparent traceability to sampling workflows.
- Support for plugin-side zk integration is coming soon.

### 📦 For Sampling Platforms (e.g. Splice)
- Enable proof-backed attribution for sample creators.
- Boost royalty tracking, usage insights, and trust.

### 🤖 In an AI-Generated Audio World
- Anchor transformations in provable logic.
- Enable attribution and originality for synthetic music.

---

## 🔍 Inspiration

zkSampler is inspired by [Attested Image Editor](https://blog.succinct.xyz/tales-from-the-hacker-house-building-an-attested-image-editor/). We bring the same spirit to the world of sound.

---

## 🛠 Features
- ✅ CLI interface for transformation + ZK proof generation
- ✅ Ethereum-based signer verification
- ✅ Output transformed audio + proof artifacts
- 🧪 Execute or Prove modes
- 🎼 WAV I/O support
- 🧾 Outputs:
- out.wav
- proof.bin
- public_values.bin
- verification_key.bin
- output.json

---

## 🚀 Usage Guide

#### 🧰 Prerequisites
- Rust + Cargo
- SP1 SDK
- WAV files in assets/
- cast (for Ethereum signing)

---

#### ⚙️ 1. Local Execution (No Proof)

cargo run --release --bin zk-sampler -- \
--execute \
--input assets/sample.wav \
--output-audio out.wav \
--sample-rate 44100 \
--transform-json transform.json



---

#### 🔐 2. Local Proof Generation

cargo run --release --bin zk-sampler -- \
--prove \
--input assets/sample.wav \
--output proof.bin \
--output-audio out.wav \
--sample-rate 44100 \
--transform-json transform.json \
--signature sample.sig \
--public-key sample.pub

---

#### 📝 3. Sign Audio Hash
```bash
# Get hash of input audio
cargo run --release --bin hash_audio -- assets/sample.wav > audio_hash.txt

# Sign using Foundry's cast (or later via MetaMask/web wallet)
cast sign <HASH> --private-key <PRIVATE_KEY> > sample.sig
```

Save:

- sample.sig → signature file
- sample.pub → public key file

---

#### 📤 4. Decode Public Values

cargo run --release --bin decode_public_values -- public_values.bin

Outputs:
- original_audio_hash
- transformed_audio_hash
- signer_public_key
- has_signature

These can be verified in smart contracts or shared alongside releases.

⸻

📄 Example transform.json
```
[
    "Reverse",
    { "Pitch": 3 },
    { "Stretch": 1.25 }
]

```

⸻

#### 🔮 Coming Soon
- 🌐 Web app to upload, transform, and prove samples with a UI
- 🎚 Plugin (VST/AU) to work inside your DAW
- 🧾 On-chain Solidity verifier
- 🧬 Support for more audio formats and transformations

⸻

#### 🤝 Built With
- SP1 zkVM
- hound (WAV parsing)
- serde, clap, hex
- Ethereum cryptography (k256, cast)
- ABI encoding via alloy_sol_types

---

#### 💬 Questions or Collaborations?

Hit us up if you’re a:
- Sampling platform 🧰
- Plugin dev 🎛
- Music DAO 🎵
- Artist 🔊

I’d love to build with you.

---
