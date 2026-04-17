import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, getStatusColor, getVentureColor } from '../../utils/taskUtils';
import CountdownTimer from './CountdownTimer';

interface Props {
  task: any;
  status?: string;
  onClick: () => void;
  key?: React.Key;
}

export default function TaskCard({ task, status, onClick }: Props) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="bg-[#111111] border border-white/5 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:border-white/10 transition-colors"
    >
      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getVentureColor(task.venture)}`}>
            {task.venture}
          </span>
          {status && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${getStatusColor(status)}`}>
              {status}
            </span>
          )}
        </div>
        <h3 className="text-white font-bold text-sm mb-1">{task.title}</h3>
        <p className="text-[#E8B84B] font-black text-lg">{formatCurrency(task.earnAmount)}</p>
      </div>
      
      <div className="text-right">
        <div className="text-xs text-gray-500 font-bold mb-1">
          <CountdownTimer deadline={task.deadline} />
        </div>
      </div>
    </motion.div>
  );
}
