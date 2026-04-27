import React from 'react';
import { Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/taskUtils';
import { motion } from 'framer-motion';

interface Props {
  teamSize?: number;
  todayCommission?: number;
  monthCommission?: number;
  inactiveWarning?: boolean;
}

export default function TeamSummaryCard({ teamSize = 0, todayCommission = 0, monthCommission = 0, inactiveWarning }: Props) {
  const navigate = useNavigate();

  return (
    <motion.div 
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       className="w-full relative overflow-hidden rounded-[16px] p-5 mb-6"
       style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(232,184,75,0.1))',
          border: '1px solid rgba(124,58,237,0.4)',
       }}
    >
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-2">
           <Users className="text-[#8B5CF6]" size={20} />
           <span className="text-white font-bold text-base">My Team</span>
        </div>
        <button 
           onClick={() => navigate('/home?tab=team')}
           className="text-[#E8B84B] text-[13px] font-bold flex items-center hover:underline"
        >
           View Full Team <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 relative z-10">
        <div className="flex flex-col">
           <span className="text-white font-bold text-2xl leading-none mb-1">{teamSize}</span>
           <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Members</span>
           <span className="text-gray-500 text-[10px] uppercase tracking-widest mt-1">L1: {teamSize} | L2: 0</span>
        </div>
        <div className="flex flex-col border-l border-[#2A2A2A] pl-3">
           <span className="text-[#E8B84B] font-bold text-2xl leading-none mb-1">{formatCurrency(todayCommission)}</span>
           <span className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">Today's Comm.</span>
           <span className="text-green-500 text-[10px] mt-1 font-bold">↑12%</span>
        </div>
        <div className="flex flex-col border-l border-[#2A2A2A] pl-3">
           <span className="text-[#00C9A7] font-bold text-2xl leading-none mb-1">{formatCurrency(monthCommission)}</span>
           <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">This Month</span>
           <span className="text-gray-500 text-[10px] mt-1 uppercase tracking-widest">{teamSize} active</span>
        </div>
      </div>

      <div className="relative z-10">
        {inactiveWarning ? (
           <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2 flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-xs text-red-500 font-bold uppercase tracking-widest">
                 <span>⚠️ Complete a task to keep your team!</span>
              </div>
              <button 
                onClick={() => navigate('/tasks')}
                className="bg-red-500 text-white px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest"
              >
                 Act Now
              </button>
           </div>
        ) : (
           <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-2.5">
              <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
                 <span>{formatCurrency(monthCommission * 20)} team earnings</span>
                 <span className="text-[#8B5CF6]">Your Comm. {formatCurrency(monthCommission)}</span>
              </div>
              <div className="w-full bg-[#111111] h-1.5 rounded-full overflow-hidden">
                 <div className="bg-[#8B5CF6] h-full rounded-full w-[15%]"></div>
              </div>
           </div>
        )}
      </div>
    </motion.div>
  );
}
