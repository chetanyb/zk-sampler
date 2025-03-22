use rubato::{FftFixedInOut, Resampler};

/// Reverses the audio in-place
pub fn reverse_audio(samples: &mut [i16]) {
    samples.reverse();
}

pub fn pitch_shift(samples: &[i16], semitones: i32, sample_rate: usize) -> Vec<i16> {
    let pitch_factor = 2f32.powf(-semitones as f32 / 12.0);
    resample(samples, pitch_factor, sample_rate)
}

pub fn time_stretch(samples: &[i16], rate: f32, sample_rate: usize) -> Vec<i16> {
    if rate <= 0.0 {
        eprintln!("❌ Invalid stretch rate: {}", rate);
        return samples.to_vec();
    }
    resample(samples, 1.0 / rate, sample_rate)
}

fn resample(samples: &[i16], factor: f32, sample_rate: usize) -> Vec<i16> {
    let input_f32: Vec<f32> = samples.iter().map(|&s| s as f32 / i16::MAX as f32).collect();
    let nch = 1;
    let chunk_size = 24000;
    let output_sample_rate = (sample_rate as f32 * factor).round() as usize;

    let mut resampler = match FftFixedInOut::<f32>::new(
        sample_rate,
        output_sample_rate,
        chunk_size,
        nch,
    ) {
        Ok(r) => r,
        Err(e) => {
            eprintln!("❌ Failed to create resampler: {}", e);
            return samples.to_vec();
        }
    };

    let mut output_f32 = vec![];

    let required = resampler.input_frames_next();
    let mut i = 0;

    while i < input_f32.len() {
        let chunk_end = usize::min(i + required, input_f32.len());
        let mut chunk: Vec<f32> = input_f32[i..chunk_end].to_vec();

        if chunk.len() < required {
            chunk.resize(required, 0.0); // Pad to match required size
        }

        match resampler.process(&[chunk], None) {
            Ok(resampled) => {
                output_f32.extend_from_slice(&resampled[0]);
            },
            Err(e) => {
                eprintln!("❌ Resampling error: {}", e);
                return samples.to_vec();
            }
        }

        i += required;
    }

    output_f32
        .iter()
        .map(|&s| (s * i16::MAX as f32).clamp(i16::MIN as f32, i16::MAX as f32) as i16)
        .collect()
}