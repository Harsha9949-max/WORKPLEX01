import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Wallet, User, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

// Mock values for badges 
const hasPendingTasks = true;
const hasPendingRelease = true;
const hasNewBadge = false;

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  const showHomeWarning = userData?.inactiveWarning;

  const tabs = [
    { path: '/home', icon: Home, label: 'Home', badge: showHomeWarning ? 'red' : null },
    { path: '/tasks', icon: ClipboardList, label: 'Tasks', badge: hasPendingTasks ? 'red' : null },
    { path: '/coupon', icon: Tag, label: 'Coupon', badge: null },
    { path: '/wallet', icon: Wallet, label: 'Wallet', badge: hasPendingRelease ? 'yellow' : null },
    { path: '/profile', icon: User, label: 'Profile', badge: hasNewBadge ? 'purple' : null }
  ];
  
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '72px',
      background: '#111111',
      borderTop: '1px solid #2A2A2A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 1000,
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {tabs.map(({ path, icon: Icon, label, badge }) => {
        const isActive = location.pathname === path || (path !== '/home' && location.pathname.startsWith(path + '/'));
        return (
          <button
            key={path}
            onClick={() => {
              if(navigator.vibrate) navigator.vibrate(10);
              navigate(path);
            }}
            className={`relative flex flex-col items-center gap-1 p-2 bg-transparent border-none cursor-pointer transition-colors ${isActive ? 'text-[#E8B84B]' : 'text-gray-500'}`}
          >
            {isActive && (
               <motion.div
                 layoutId="bottomNavIndicator"
                 className="absolute inset-0 bg-[#E8B84B]/10 rounded-2xl"
                 initial={false}
                 transition={{ type: 'spring', stiffness: 300, damping: 30 }}
               />
            )}
            
            <div className="relative z-10">
               <motion.div animate={{ scale: isActive ? 1.1 : 1 }}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
               </motion.div>
               {badge && (
                  <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#111111] ${badge === 'red' ? 'bg-red-500' : badge === 'yellow' ? 'bg-yellow-500' : 'bg-purple-500'}`} />
               )}
            </div>
            
            <span className={`relative z-10 text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
              {label}
            </span>
            
            {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-[#E8B84B] rounded-full" />}
          </button>
        );
      })}
    </nav>
  );
}
