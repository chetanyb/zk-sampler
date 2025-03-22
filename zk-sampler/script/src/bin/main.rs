use clap::Parser;
use hound::{WavReader, WavWriter, WavSpec, SampleFormat};
use zk_sampler_lib::{reverse_audio, pitch_shift, time_stretch};

#[derive(Parser, Debug)]
#[command(name = "zk-sampler")]
#[command(about = "CLI for zk-audio sampler transforms")]
struct Args {
    /// Input WAV file path
    #[arg(short, long)]
    input: String,

    /// Output WAV file path
    #[arg(short, long)]
    output: String,

    /// Reverse the audio
    #[arg(long)]
    reverse: bool,

    /// Pitch shift in semitones (can be negative)
    #[arg(long)]
    pitch: Option<i32>,

    /// Time stretch factor (e.g., 0.5 for 2x speed)
    #[arg(long)]
    stretch: Option<f32>,
}

fn main() -> anyhow::Result<()> {
    let args = Args::parse();

    // Load WAV file
    let mut reader = WavReader::open(&args.input)?;
    let spec = reader.spec();
    let sample_rate = spec.sample_rate as usize;

    let mut samples: Vec<i16> = reader.samples::<i16>().filter_map(Result::ok).collect();

    // Apply transformations
    if args.reverse {
        println!("Applying reverse...");
        reverse_audio(&mut samples);
    }

    if let Some(semitones) = args.pitch {
        println!("Applying pitch shift: {} semitones...", semitones);
        samples = pitch_shift(&samples, semitones, sample_rate);
    }

    if let Some(rate) = args.stretch {
        println!("Applying time stretch: {}x...", rate);
        samples = time_stretch(&samples, rate, sample_rate);
    }

    // Save output
    let out_spec = WavSpec {
        channels: 1,
        sample_rate: spec.sample_rate,
        bits_per_sample: 16,
        sample_format: SampleFormat::Int,
    };

    let mut writer = WavWriter::create(&args.output, out_spec)?;
    for s in samples {
        writer.write_sample(s)?;
    }
    writer.finalize()?;

    println!("Saved transformed audio to {}", args.output);
    Ok(())
}