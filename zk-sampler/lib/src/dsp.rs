use rubato::{FftFixedInOut, Resampler};

/// Reverses the audio in-place
pub fn reverse_audio(samples: &mut [i16]) {
    samples.reverse();
}

pub fn pitch_shift(samples: &[i16], semitones: i32, sample_rate: usize) -> Vec<i16> {
    let pitch_factor = 2f32.powf(semitones as f32 / 12.0);
    resample(samples, pitch_factor, sample_rate)
}

pub fn time_stretch(samples: &[i16], rate: f32, sample_rate: usize) -> Vec<i16> {
    resample(samples, 1.0 / rate, sample_rate)
}

fn resample(samples: &[i16], factor: f32, sample_rate: usize) -> Vec<i16> {
    let input: Vec<f32> = samples.iter().map(|&s| s as f32).collect();
    let nch = 1;
    let chunk_size = 24000;

    let mut resampler = FftFixedInOut::<f32>::new(
        sample_rate,
        (sample_rate as f32 * factor) as usize,
        chunk_size,
        nch,
    ).unwrap();

    let mut output = vec![];

    for chunk in input.chunks(chunk_size) {
        let mut padded_chunk = chunk.to_vec();
        while padded_chunk.len() < chunk_size {
            padded_chunk.push(0.0);
        }

        let result = resampler.process(&[padded_chunk], None).unwrap();
        for sample in &result[0] {
            output.push(*sample as i16);
        }
    }

    output
}