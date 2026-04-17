import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ListTodo, Wallet, User, Trophy } from 'lucide-react';

export default function BottomNav() {
  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: ListTodo, label: 'Tasks', path: '/tasks' },
    { icon: Trophy, label: 'Rank', path: '/leaderboard' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
    { icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-2xl border-t border-white/5 px-6 py-3 pb-6">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center gap-1 transition-all duration-300
              ${isActive ? 'text-[#E8B84B]' : 'text-gray-500 hover:text-gray-300'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`
                  p-1 rounded-xl transition-all duration-300
                  ${isActive ? 'bg-[#E8B84B]/10 scale-110' : ''}
                `}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
