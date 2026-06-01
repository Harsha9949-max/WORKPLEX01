import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Check, X, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface Task {
  id: string;
  title: string;
  venture: string;
  reward: number;
  expiresAt: any;
}

interface Props {
  task: Task;
  onAccept: (id: string) => void;
  onSkip: (id: string) => void;
  key?: React.Key;
}

export default function TaskCard({ task, onAccept, onSkip }: Props) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = task.expiresAt.toDate().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [task.expiresAt]);

  const isUrgent = timeLeft !== 'Expired' && timeLeft.startsWith('00:');

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-5 flex flex-col min-w-[280px] md:min-w-0"
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-black text-[#00C9A7] bg-[#00C9A7]/10 px-2 py-1 rounded-md uppercase tracking-wider">
          {task.venture}
        </span>
        <div className={`flex items-center gap-1 text-[10px] font-bold ${isUrgent ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
          <Clock className="w-3 h-3" />
          {timeLeft}
        </div>
      </div>

      <h3 className="text-white font-bold text-lg mb-1 line-clamp-1">{task.title}</h3>
      <p className="text-[#E8B84B] font-black text-xl mb-6">{formatCurrency(task.reward)}</p>

      <div className="mt-auto flex gap-2">
        <button 
          onClick={() => onAccept(task.id)}
          className="flex-grow bg-[#10B981] hover:bg-[#059669] text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Check className="w-4 h-4" />
          Accept
        </button>
        <button 
          onClick={() => onSkip(task.id)}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-all active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
