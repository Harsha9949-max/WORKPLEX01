import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Calendar } from 'lucide-react';
import { formatCurrency, calculateProgress } from '../../utils/format';

interface Props {
  monthlyEarned: number;
  daysActive: number;
}

export default function LeadMarketerProgress({ monthlyEarned, daysActive }: Props) {
  const target = 50000;
  const progress = calculateProgress(monthlyEarned, target);
  const remaining = target - monthlyEarned;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-[#111111] border border-white/5 rounded-2xl p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8B84B]/10 flex items-center justify-center">
            <Crown className="w-6 h-6 text-[#E8B84B]" />
          </div>
          <h3 className="text-white font-bold">Journey to Lead Marketer</h3>
        </div>
        <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
          <Calendar className="w-4 h-4" />
          {daysActive} Days Active
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <p className="text-2xl font-black text-white leading-none">
            {formatCurrency(monthlyEarned)} <span className="text-xs text-gray-500 font-bold uppercase">/ {formatCurrency(target)}</span>
          </p>
          <span className="text-[#E8B84B] font-black text-sm">{progress}%</span>
        </div>
        
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#E8B84B] to-[#d4a63f] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400 leading-relaxed text-center">
        Earn <span className="text-[#E8B84B] font-bold">{formatCurrency(remaining)}</span> more to unlock <span className="text-white font-bold">Lead Marketer</span> benefits!
      </p>
    </motion.div>
  );
}
