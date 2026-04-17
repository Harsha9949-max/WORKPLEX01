import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export default function MysteryBonusModal({ isOpen, onClose, onAccept }: Props) {
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours in seconds

  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-[#111111] border border-[#E8B84B]/30 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(232,184,75,0.2)] text-center overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-[#E8B84B]/10 to-transparent pointer-events-none" />

            <motion.div 
              animate={{ 
                rotate: [0, -10, 10, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#E8B84B] to-[#d4a63f] flex items-center justify-center mx-auto mb-6 shadow-[0_10px_30px_rgba(232,184,75,0.4)]"
            >
              <Gift className="w-10 h-10 text-black" />
            </motion.div>

            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Mystery Task!</h2>
            <p className="text-gray-400 text-sm mb-8">Complete in 2 hours → <span className="text-[#E8B84B] font-bold">Rs.75 instant bonus</span></p>

            <div className="bg-black/40 rounded-2xl py-4 mb-8 border border-white/5">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Time Remaining</p>
              <p className="text-2xl font-mono font-black text-white tracking-widest">{formatTime(timeLeft)}</p>
            </div>

            <div className="space-y-3">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAccept}
                className="w-full bg-gradient-to-r from-[#E8B84B] to-[#d4a63f] text-black font-black py-4 rounded-2xl shadow-[0_10px_20px_rgba(232,184,75,0.2)] uppercase tracking-wider"
              >
                Accept Task
              </motion.button>
              <button 
                onClick={onClose}
                className="w-full text-gray-500 text-xs font-bold uppercase tracking-widest py-2 hover:text-white transition-colors"
              >
                Dismiss
              </button>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
