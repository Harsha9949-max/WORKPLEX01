import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ArrowUpCircle, Share2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  newLevel: string;
}

export default function LevelUpCelebration({ isOpen, onClose, newLevel }: Props) {
  useEffect(() => {
    if (isOpen) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl"
        >
          <motion.div 
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-md text-center"
          >
            <div className="relative mb-8">
              <motion.div 
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-[#FFD700] blur-[100px] rounded-full"
              />
              <motion.div 
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-[40px] mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(232,184,75,0.4)] relative z-10"
              >
                <ArrowUpCircle size={64} className="text-black" />
              </motion.div>
              
              <motion.div 
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-4 -right-4 text-[#FFD700]"
              >
                <Sparkles size={32} />
              </motion.div>
            </div>

            <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">LEVEL UP!</h1>
            <p className="text-[#FFD700] font-bold text-2xl mb-8 uppercase tracking-widest">You've reached {newLevel}!</p>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">New Perks</p>
                  <p className="text-sm text-white font-bold">Higher Task Limits</p>
                </div>
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                  <Star size={20} fill="currentColor" />
                </div>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Bonus</p>
                  <p className="text-sm text-white font-bold">Rs. 500 Level-Up Reward</p>
                </div>
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                  <Star size={20} fill="currentColor" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={onClose}
                className="w-full bg-[#FFD700] text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#FFD700]/20"
              >
                Continue Journey
              </button>
              <button className="w-full bg-white/5 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
                <Share2 size={18} /> Share Achievement
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
