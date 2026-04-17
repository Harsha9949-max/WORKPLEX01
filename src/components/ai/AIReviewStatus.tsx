import React from 'react';
import { motion } from 'framer-motion';
import { Bot, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  status: 'analyzing' | 'rejected' | 'pending_admin' | 'idle';
  reason?: string;
}

export default function AIReviewStatus({ status, reason }: Props) {
  if (status === 'idle') return null;

  const config = {
    analyzing: {
      icon: Loader2,
      color: 'text-teal-400',
      bgColor: 'bg-teal-400/10',
      borderColor: 'border-teal-400/20',
      text: '🤖 AI Analyzing Quality...',
      animate: true
    },
    rejected: {
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/20',
      text: 'Rejected by AI',
      animate: false
    },
    pending_admin: {
      icon: CheckCircle2,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/20',
      text: 'Passed AI Review → Pending Admin',
      animate: false
    }
  };

  const current = config[status as keyof typeof config];
  const Icon = current.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col gap-3 p-4 rounded-2xl border ${current.bgColor} ${current.borderColor} transition-all duration-500`}
    >
      <div className="flex items-center gap-3">
        <div className={`${current.color} ${current.animate ? 'animate-spin' : ''}`}>
          <Icon size={20} />
        </div>
        <span className={`text-sm font-black uppercase tracking-tight ${current.color}`}>
          {current.text}
        </span>
      </div>

      {reason && (
        <div className="flex gap-2 items-start bg-black/20 p-3 rounded-xl">
          <AlertCircle size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-400 font-medium leading-relaxed">
            {reason}
          </p>
        </div>
      )}
    </motion.div>
  );
}
