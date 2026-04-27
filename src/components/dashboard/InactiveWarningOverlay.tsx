import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  onClose: () => void;
  daysRemaining: number;
}

export default function InactiveWarningOverlay({ onClose, daysRemaining }: Props) {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col justify-center items-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#111111] border border-[#EF4444]/40 rounded-3xl p-8 w-full max-w-sm flex flex-col items-center text-center shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-[#EF4444] animate-pulse"></div>
        
        <div className="w-20 h-20 bg-[#EF4444]/10 rounded-full flex justify-center items-center mb-6 relative">
           <AlertTriangle size={40} className="text-[#EF4444]" />
           <motion.div 
             animate={{ scale: [1, 1.2, 1] }} 
             transition={{ repeat: Infinity, duration: 2 }}
             className="absolute inset-0 border-2 border-[#EF4444]/30 rounded-full"
           ></motion.div>
        </div>

        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Leadership at Risk</h2>
        <p className="text-sm text-gray-400 font-medium mb-6">
          You haven't completed any tasks in 30 days. To keep your <span className="text-[#E8B84B]">Lead Marketer</span> status and team commissions, you must complete a task soon.
        </p>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] w-full rounded-2xl p-5 mb-8 flex flex-col items-center">
           <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-[#EF4444]" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Time Remaining</span>
           </div>
           <p className="text-4xl font-black text-[#EF4444]">{daysRemaining} Days</p>
           <p className="text-[10px] text-gray-500 mt-2 font-medium">Until your team is transferred</p>
        </div>

        <div className="flex flex-col w-full gap-3">
           <button 
             onClick={() => {
               onClose();
               navigate('/tasks');
             }}
             className="w-full bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(232,184,75,0.3)] hover:bg-[#E8B84B]/90 transition flex items-center justify-center gap-2"
           >
             <RefreshCw size={18} />
             Complete Task Now
           </button>
           <button 
             onClick={onClose}
             className="w-full text-xs font-bold text-gray-500 uppercase tracking-widest py-3 border border-[#2A2A2A] rounded-xl hover:text-white hover:bg-[#1A1A1A] transition"
           >
             I Understand
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
