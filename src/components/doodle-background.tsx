
'use client';

import { motion } from 'framer-motion';
import { PenTool, Book, MessageSquare, Mic, Languages, Sparkles } from 'lucide-react';

const doodles = [
  { icon: PenTool, top: '15%', left: '5%', rotate: 15 },
  { icon: Book, top: '45%', left: '8%', rotate: -10 },
  { icon: MessageSquare, top: '75%', left: '12%', rotate: 20 },
  { icon: Mic, top: '25%', right: '10%', rotate: -15 },
  { icon: Languages, top: '60%', right: '5%', rotate: 10 },
  { icon: Sparkles, top: '85%', right: '15%', rotate: -5 },
  { icon: Book, top: '10%', right: '40%', rotate: 5 },
  { icon: PenTool, bottom: '15%', left: '30%', rotate: -20 },
];

export function DoodleBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-20">
      {doodles.map((Doodle, i) => (
        <motion.div
          key={i}
          className="absolute text-primary/30"
          style={{
            top: Doodle.top,
            left: Doodle.left,
            right: Doodle.right,
            bottom: Doodle.bottom,
          }}
          initial={{ opacity: 0, scale: 0.5, rotate: Doodle.rotate - 20 }}
          whileInView={{ opacity: 1, scale: 1, rotate: Doodle.rotate }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
        >
          <Doodle.icon size={48} strokeWidth={1} />
        </motion.div>
      ))}
    </div>
  );
}
