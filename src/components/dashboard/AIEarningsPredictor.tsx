import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight } from 'lucide-react';

export default function AIEarningsPredictor() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-gradient-to-br from-[#E8B84B] to-[#d4a63f] rounded-2xl p-5 relative overflow-hidden shadow-[0_10px_30px_rgba(232,184,75,0.2)]"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-black" />
        </div>
        <div className="flex-grow">
          <h3 className="text-black font-black text-lg leading-tight">AI Earnings Predictor</h3>
          <p className="text-black/70 text-xs font-bold uppercase tracking-tight">Complete 4 more tasks → earn Rs.450 extra today</p>
        </div>
        <button className="p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors">
          <ArrowRight className="w-5 h-5 text-black" />
        </button>
      </div>
      
      <p className="mt-3 text-[10px] text-black/50 font-bold uppercase tracking-widest text-center">Based on your recent performance</p>
    </motion.div>
  );
}
