'use client';

import { AuroraBackground } from '@/components/ui/aurora-background';
import { ShootingStars } from '@/components/ui/shooting-stars';
import { motion } from 'framer-motion';

export default function Home() {
  return (
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black text-white">
        <AuroraBackground>
          <ShootingStars />
          <div className="z-10 text-center px-6">
            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-8xl font-bold mb-6 tracking-tight text-white">
              zkSampler
              <p className="text-4xl text-gray-300 mt-8 mx-auto">
                Prove your sound. Without revealing your secret sauce. Powered by SP1 zkVM.
              </p>
            </motion.h1>

            <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
              <span className="absolute inset-[-1000%] animate-spin-slow bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-6 py-2 text-sm font-medium text-white backdrop-blur-3xl">
              Border Magic
              </span>
            </button>
          </div>
        </AuroraBackground>
      </main>
  );
}
