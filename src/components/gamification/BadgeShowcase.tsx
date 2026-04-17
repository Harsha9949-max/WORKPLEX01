import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { BADGES, Badge } from '../../constants/gamification';
import toast from 'react-hot-toast';

interface Props {
  unlockedBadges: string[];
}

export default function BadgeShowcase({ unlockedBadges }: Props) {
  const handleBadgeClick = (badge: Badge, isLocked: boolean) => {
    if (isLocked) {
      toast.error(`Locked: ${badge.condition}`, {
        icon: '🔒',
        style: { borderRadius: '12px', background: '#1A1A1A', color: '#fff' }
      });
    } else {
      toast.success(`${badge.name}: ${badge.description}`, {
        icon: '✨',
        style: { borderRadius: '12px', background: '#1A1A1A', color: '#fff' }
      });
    }
  };

  return (
    <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Achievements</h3>
        <span className="text-xs font-black text-[#FFD700]">{unlockedBadges.length} / {BADGES.length}</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {BADGES.map((badge) => {
          const isUnlocked = unlockedBadges.includes(badge.id);
          const Icon = badge.icon;

          return (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleBadgeClick(badge, !isUnlocked)}
              className={`
                relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-500
                ${isUnlocked 
                  ? 'bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-lg shadow-black' 
                  : 'bg-white/5 border border-transparent opacity-40 grayscale'}
              `}
            >
              {isUnlocked && (
                <motion.div 
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-[#FFD700]/10 blur-xl rounded-full"
                />
              )}
              
              <div className={`
                p-2 rounded-xl
                ${isUnlocked ? 'text-[#FFD700]' : 'text-gray-600'}
              `}>
                <Icon size={24} />
              </div>
              
              {!isUnlocked && (
                <div className="absolute top-2 right-2">
                  <Lock size={10} className="text-gray-600" />
                </div>
              )}

              <span className={`text-[8px] font-black uppercase tracking-tighter text-center px-1 ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                {badge.name}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
