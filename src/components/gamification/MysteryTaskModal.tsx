import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Zap, ArrowRight, Clock } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export default function MysteryTaskModal({ isOpen, onClose, onAccept }: Props) {
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours in seconds

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

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
            exit={{ scale: 0.8, y: 20 }}
            className="w-full max-w-md bg-gradient-to-br from-[#1A1A1A] to-[#111111] border-2 border-purple-500/30 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)]"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/5 rounded-xl text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-purple-500/20"
            >
              <Gift size={40} className="text-white" />
            </motion.div>

            <h2 className="text-3xl font-black text-white text-center mb-2 tracking-tighter uppercase">Mystery Task!</h2>
            <p className="text-purple-400 font-bold text-center mb-8 uppercase tracking-widest text-sm">Limited Time High Reward</p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-red-500 font-black animate-pulse">
                <Clock size={18} />
                <span>EXPIRES IN: {formatTime(timeLeft)}</span>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Instant Reward</p>
                <p className="text-4xl font-black text-white">{formatCurrency(150)}</p>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-xs text-teal-500 font-bold uppercase tracking-widest bg-teal-500/10 py-2 rounded-full">
                <Zap size={14} />
                <span>Priority Approval</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 bg-white/5 text-gray-400 font-bold py-4 rounded-xl hover:bg-white/10 transition-colors"
              >
                Decline
              </button>
              <button 
                onClick={onAccept}
                className="flex-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              >
                Accept Task <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
