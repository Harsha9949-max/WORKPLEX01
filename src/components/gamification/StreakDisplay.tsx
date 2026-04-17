import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Info } from 'lucide-react';

interface Props {
  streak: number;
  lastActiveDate: any;
}

export default function StreakDisplay({ streak, lastActiveDate }: Props) {
  // Calculate days completed this week (Mon-Sun)
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date().getDay(); // 0 is Sunday
  const currentDayIndex = today === 0 ? 6 : today - 1;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111111] border border-white/5 rounded-3xl p-6 mb-6 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-orange-500 blur-xl rounded-full"
            />
            <div className="relative w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Flame className="text-white" size={24} />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-white">{streak} Day Streak</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Keep the fire burning!</p>
          </div>
        </div>
        <button className="p-2 bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
          <Info size={16} />
        </button>
      </div>

      <div className="flex justify-between items-center gap-2">
        {days.map((day, i) => {
          const isPast = i < currentDayIndex;
          const isToday = i === currentDayIndex;
          const isCompleted = isPast || (isToday && streak > 0);

          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div className={`
                w-full h-1.5 rounded-full transition-all duration-500
                ${isCompleted ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'bg-white/5'}
                ${isToday && !isCompleted ? 'animate-pulse bg-white/20' : ''}
              `} />
              <span className={`text-[10px] font-black ${isToday ? 'text-white' : 'text-gray-600'}`}>{day}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
