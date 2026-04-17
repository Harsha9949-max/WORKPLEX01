import React from 'react';
import { motion } from 'framer-motion';
import { getLevelInfo } from '../../constants/gamification';
import { formatCurrency } from '../../utils/format';

interface Props {
  totalEarned: number;
}

export default function LevelProgress({ totalEarned }: Props) {
  const { current, next, min, max } = getLevelInfo(totalEarned);
  const progress = Math.min(((totalEarned - min) / (max - min)) * 100, 100);

  return (
    <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 mb-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Current Level</p>
          <h3 className="text-2xl font-black text-white">{current}</h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Next: {next}</p>
          <p className="text-xs font-black text-[#FFD700]">{formatCurrency(max - totalEarned)} to go</p>
        </div>
      </div>

      <div className="relative h-4 bg-white/5 rounded-full overflow-hidden mb-2">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FFD700] to-[#B8860B] shadow-[0_0_15px_rgba(255,215,0,0.3)]"
        />
        
        {/* Milestone markers */}
        {[25, 50, 75].map((m) => (
          <div 
            key={m} 
            className="absolute top-0 bottom-0 w-0.5 bg-black/20" 
            style={{ left: `${m}%` }} 
          />
        ))}
      </div>

      <div className="flex justify-between text-[10px] font-bold text-gray-600 uppercase tracking-tighter">
        <span>{formatCurrency(min)}</span>
        <span>{formatCurrency(max)}</span>
      </div>
    </div>
  );
}
