import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';

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
