import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  useEffect(() => {
     if (userData?.role === 'Sub-Admin' && !location.pathname.startsWith('/sub-admin')) {
        navigate('/sub-admin', { replace: true });
     }
  }, [userData?.role, location.pathname, navigate]);
  
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
