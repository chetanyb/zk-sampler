'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export default function AudioEditorInterface({
  audioURL,
  fileName,
  onSave,
  onCancel
}) {
  // State for audio editing parameters
  const [reverse, setReverse] = useState(false);
  const [speedSliderValue, setSpeedSliderValue] = useState(0.5); // 0.5 represents 1.0x (middle)
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Convert logarithmic slider value to actual speed
  useEffect(() => {
    // Map 0-1 slider value to 0.1-10.0 speed using logarithmic scale
    // When slider is at 0.5 (middle), speed should be 1.0
    const actualSpeed = 0.1 * Math.pow(100, speedSliderValue);
    setSpeed(actualSpeed);
  }, [speedSliderValue]);

  // Function to handle save and apply effects
  const handleApplyEffects = () => {
    setIsProcessing(true);

    // Simulate processing time
    setTimeout(() => {
      // In a real implementation, we would process the audio here
      // For now, we just pass the parameters to the parent component
      onSave({
        reverse,
        speed: speed,
        pitch,
        // We would normally pass the processed audio here
        processedAudioURL: audioURL
      });
      setIsProcessing(false);
    }, 1500);
  };

  // Custom switch component
  const CustomSwitch = ({ checked, onChange }) => {
    return (
      <div
        className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${checked ? 'bg-violet-600' : 'bg-zinc-700'}`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-1'}`}
          style={{ top: '2px' }}
        />
      </div>
    );
  };

  // Custom tab interface
  const CustomTabs = () => {
    return (
      <div className="w-full mb-6">
        <div className="flex border-b border-zinc-800">
          <button
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'basic' ? 'text-white border-b-2 border-violet-500' : 'text-zinc-400 hover:text-zinc-200'}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Effects
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'advanced' ? 'text-white border-b-2 border-violet-500' : 'text-zinc-400 hover:text-zinc-200'}`}
            onClick={() => setActiveTab('advanced')}
          >
            Advanced
          </button>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full bg-zinc-900/90 backdrop-blur-md rounded-xl border border-zinc-800 p-6 shadow-xl"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Edit Sample</h2>
        <div className="text-sm text-zinc-400">{fileName}</div>
      </div>

      <CustomTabs />

      {activeTab === 'basic' && (
        <div className="space-y-6">
          {/* Reverse Effect */}
          <div className="effect-control">
            <div className="flex justify-between items-center mb-2">
              <label className="text-white font-medium">Reverse</label>
              <CustomSwitch
                checked={reverse}
                onChange={setReverse}
              />
            </div>
            <div className="text-sm text-zinc-400">
              {reverse ? "Audio will play backwards" : "Audio will play normally"}
            </div>
          </div>

          {/* Speed Effect */}
          <div className="effect-control">
            <div className="flex justify-between items-center mb-2">
              <label className="text-white font-medium">Speed</label>
              <span className="text-zinc-300 text-sm">{speed.toFixed(2)}x</span>
            </div>
            <div className="my-4">
              <Slider
                defaultValue={[0.5]} // 0.5 is the middle value (representing 1.0x speed)
                min={0}
                max={1}
                step={0.01}
                onValueChange={(values) => setSpeedSliderValue(values[0])}
                aria-label="Speed"
              />
              <div className="flex justify-between text-xs text-zinc-500 mt-2">
                <span>Longer (0.1x)</span>
                <span className="font-medium text-zinc-300">Original (1.0x)</span>
                <span>Shorter (10.0x)</span>
              </div>
            </div>
          </div>

          {/* Pitch Effect */}
          <div className="effect-control">
            <div className="flex justify-between items-center mb-2">
              <label className="text-white font-medium">Pitch</label>
              <span className="text-zinc-300 text-sm">{pitch > 0 ? `+${pitch}` : pitch} semitones</span>
            </div>
            <div className="my-4">
              <Slider
                defaultValue={[pitch]}
                min={-48}
                max={48}
                step={1}
                onValueChange={(values) => setPitch(values[0])}
                aria-label="Pitch"
              />
              <div className="flex justify-between text-xs text-zinc-500 mt-2">
                <span>Lower (-48)</span>
                <span>Original (0)</span>
                <span>Higher (+48)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'advanced' && (
        <div className="bg-zinc-800/50 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px]">
          <Sparkles className="w-10 h-10 text-zinc-400 mb-4" />
          <p className="text-zinc-300 text-center">Advanced effects coming soon!</p>
          <p className="text-zinc-500 text-sm text-center mt-2">
            Future updates will include filters, EQ, and more
          </p>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-zinc-700 rounded-md text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>

        <button
          onClick={handleApplyEffects}
          disabled={isProcessing}
          className="relative px-6 py-2 rounded-md overflow-hidden group disabled:opacity-50"
        >
          <span className="relative z-10 flex items-center justify-center gap-2 text-white">
            {isProcessing ? "Processing..." : "Apply Effects"}
            {isProcessing && (
              <div className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-transparent animate-spin"></div>
            )}
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-80 group-hover:opacity-90 transition-opacity" />
        </button>
      </div>
    </motion.div>
  );
}
