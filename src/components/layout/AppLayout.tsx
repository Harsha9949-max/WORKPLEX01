import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Wallet, Trophy, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const tabs = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/tasks', icon: ClipboardList, label: 'Tasks' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/leaderboard', icon: Trophy, label: 'Rank' },
    { path: '/profile', icon: User, label: 'Profile' }
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
      {tabs.map(({ path, icon: Icon, label }) => {
        const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
        return (
          <button
            key={path}
            onClick={() => {
              if(navigator.vibrate) navigator.vibrate(10);
              navigate(path);
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 16px',
              color: isActive ? '#E8B84B' : '#6B7280'
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
            <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400 }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default function AppLayout() {
  const location = useLocation();
  
  // Pages that show bottom nav:
  const showNavPages = [
    '/home', '/tasks', '/wallet', '/profile', '/leaderboard', '/coupon', '/team-chat'
  ];
  
  const showNav = showNavPages.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0A0A0A', paddingTop: 'env(safe-area-inset-top)' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: showNav ? 'calc(72px + env(safe-area-inset-bottom))' : 'env(safe-area-inset-bottom)' }}>
        <Outlet />
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}
