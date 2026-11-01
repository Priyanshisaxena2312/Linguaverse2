'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TalkingOrbProps {
  isSpeaking: boolean;
  isListening?: boolean;
  volume?: number; // 0-1 normalized level
  className?: string;
  colors?: string[]; // E.g. ['from-blue-500', 'via-primary', 'to-purple-500']
}

export function TalkingOrb({ isSpeaking, isListening, volume = 0, className, colors = ['from-blue-500', 'via-indigo-500', 'to-purple-500'] }: TalkingOrbProps) {
  const intensity = Math.max(volume, (isSpeaking || isListening) ? 0.05 : 0);

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer Glows */}
      {(isSpeaking || isListening) && (
        <>
          <motion.div
            className={cn("absolute inset-0 rounded-full blur-3xl opacity-40 bg-gradient-to-tr", ...colors)}
            animate={{
              scale: 1 + intensity * 0.8,
              opacity: 0.2 + intensity * 0.6,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
        </>
      )}

      {/* Core Orb */}
      <motion.div
        className={cn(
          "relative w-40 h-40 md:w-48 md:h-48 rounded-full shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl border border-white/30 bg-gradient-to-tr",
          isSpeaking || isListening ? "from-black/70 to-black/30" : "from-black/95 to-black/80",
          "flex items-center justify-center overflow-hidden"
        )}
        animate={{
          scale: 1 + intensity * 0.1,
          boxShadow: `0 0 ${20 + intensity * 40}px rgba(255,255,255,${0.1 + intensity * 0.2})`,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.2),_transparent)] pointer-events-none" />
        
        {/* Audio Waveform Visualization */}
        <div className="flex items-center gap-1.5 z-10 h-20">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <motion.div
                    key={i}
                    className="w-2 bg-white/90 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                    animate={{
                        height: 6 + intensity * 60 * (1 - Math.abs(i - 4) / 5),
                        opacity: 0.3 + intensity * 0.7,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                />
            ))}
        </div>
      </motion.div>
    </div>
  );
}
