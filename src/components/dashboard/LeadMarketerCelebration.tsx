import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, Check, ArrowRight } from 'lucide-react';

interface Props {
  onClose: () => void;
  userName: string;
}

export default function LeadMarketerCelebration({ onClose, userName }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col justify-center items-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="bg-gradient-to-br from-[#1A1A1A] to-[#111111] border-2 border-[#E8B84B] rounded-[32px] p-8 w-full max-w-sm flex flex-col items-center text-center shadow-[0_0_80px_rgba(232,184,75,0.4)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#E8B84B] blur-[100px] opacity-20 rounded-full" />
        <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-[#8B5CF6] blur-[80px] opacity-20 rounded-full" />
        
        {/* Animated Crown */}
        <motion.div 
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, -5, 5, 0]
          }} 
          transition={{ repeat: Infinity, duration: 4 }}
          className="w-24 h-24 bg-gradient-to-br from-[#E8B84B] to-yellow-600 rounded-full flex justify-center items-center mb-6 shadow-[0_0_30px_rgba(232,184,75,0.5)] relative z-10"
        >
           <Crown size={48} className="text-black" />
           <Sparkles size={24} className="text-white absolute -top-2 -right-2 animate-pulse" />
        </motion.div>

        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 relative z-10">
          Congratulations!
        </h2>
        <h3 className="text-xl font-bold text-[#E8B84B] mb-4 relative z-10">
          You are now a Lead Marketer
        </h3>
        
        <p className="text-sm text-gray-300 font-medium mb-8 relative z-10 leading-relaxed">
          {userName}, your hard work paid off! You've successfully hit the Rs.50k earnings milestone over 3 active months.
        </p>

        <div className="w-full space-y-3 mb-8 relative z-10 text-left">
           <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">New Perks Unlocked:</p>
           
           <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3">
              <div className="w-6 h-6 rounded-full bg-[#E8B84B]/20 flex items-center justify-center shrink-0">
                 <Check size={12} className="text-[#E8B84B]" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">5% Commission on Level 1 Referrals</span>
           </div>
           
           <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3">
              <div className="w-6 h-6 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center shrink-0">
                 <Check size={12} className="text-[#8B5CF6]" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">3% Commission on Level 2 Referrals</span>
           </div>
           
           <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3">
              <div className="w-6 h-6 rounded-full bg-[#00C9A7]/20 flex items-center justify-center shrink-0">
                 <Check size={12} className="text-[#00C9A7]" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">Team Management & Group Chat</span>
           </div>
        </div>

        <button 
          onClick={onClose}
          className="relative z-10 w-full bg-gradient-to-r from-[#E8B84B] to-yellow-500 text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_4px_20px_rgba(232,184,75,0.4)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
        >
          View Team Dashboard <ArrowRight size={18} />
        </button>
      </motion.div>
    </motion.div>
  );
}
