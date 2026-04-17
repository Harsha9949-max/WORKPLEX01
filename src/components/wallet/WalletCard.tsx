import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/walletUtils';

interface Props {
  title: string;
  balance: number;
  icon: React.ReactNode;
  color: string;
  subtitle: string;
}

export default function WalletCard({ title, balance, icon, color, subtitle }: Props) {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="bg-[#111111] border border-white/5 rounded-2xl p-6 shadow-xl"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color.replace('text', 'bg')}/10`}>
        {React.cloneElement(icon as React.ReactElement, { className: `w-6 h-6 ${color}` })}
      </div>
      <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">{title}</h3>
      <p className={`text-3xl font-black ${color}`}>{formatCurrency(balance)}</p>
      <p className="text-gray-500 text-xs mt-2">{subtitle}</p>
    </motion.div>
  );
}
