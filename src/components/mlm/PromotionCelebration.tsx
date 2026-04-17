import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, CheckCircle2, Share2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  newRole: string;
}

export default function PromotionCelebration({ isOpen, onClose, newRole }: Props) {
  useEffect(() => {
    if (isOpen) {
      const duration = 3 * 1000;
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
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
        >
          <motion.div 
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-md text-center"
          >
            <motion.div 
              animate={{ 
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 bg-gradient-to-br from-[#E8B84B] to-[#B8860B] rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_50px_rgba(232,184,75,0.3)]"
            >
              <Crown size={48} className="text-black" />
            </motion.div>

            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">CONGRATULATIONS!</h1>
            <p className="text-[#E8B84B] font-bold text-xl mb-8 uppercase tracking-widest">You're now a {newRole}!</p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Your New Benefits</h3>
              {[
                'Earn 5% from team members',
                'Unique referral link unlocked',
                'Team management dashboard',
                'Priority admin support'
              ].map((benefit, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="flex items-center gap-3 text-sm text-gray-300"
                >
                  <CheckCircle2 size={18} className="text-green-500" />
                  <span>{benefit}</span>
                </motion.div>
              ))}
            </div>

            <div className="space-y-3">
              <button 
                onClick={onClose}
                className="w-full bg-[#E8B84B] text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#E8B84B]/20"
              >
                Start Building Your Team <ArrowRight size={20} />
              </button>
              <button className="w-full bg-white/5 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                <Share2 size={18} /> Share Achievement
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
