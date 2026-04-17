import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface Props {
  userData: {
    name: string;
    photoURL: string;
    venture: string;
    role: string;
    streak: number;
    wallets: {
      earned: number;
    };
  };
}

export default function TopBar({ userData }: Props) {
  return (
    <div className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img 
            src={userData.photoURL} 
            alt={userData.name} 
            className="w-12 h-12 rounded-full border-2 border-[#E8B84B] object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00C9A7] rounded-full border-2 border-[#0A0A0A]" />
        </div>
        <div>
          <h1 className="text-white font-bold text-sm truncate max-w-[120px]">{userData.name}</h1>
          <span className="text-[10px] font-medium text-[#E8B84B] bg-[#E8B84B]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {userData.venture} {userData.role}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[#E8B84B] font-black text-lg leading-none">
            {formatCurrency(userData.wallets.earned)}
          </p>
          <p className="text-[10px] text-gray-500 font-medium uppercase mt-1">Total Earned</p>
        </div>

        <motion.div 
          className="flex flex-col items-center justify-center bg-[#1A1A1A] border border-white/5 rounded-xl px-3 py-1.5"
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
          </motion.div>
          <span className="text-xs font-bold text-white leading-none mt-1">{userData.streak}d</span>
        </motion.div>
      </div>
    </div>
  );
}
