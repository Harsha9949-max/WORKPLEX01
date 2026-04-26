import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PartnerRouteGuard({ children }: { children: React.ReactNode }) {
  const { userData, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white font-bold">Loading...</div>;
  }

  // Allow admins or users who specifically have workerType as partner
  // Note: if your system gives them workerType = 'partner', check for it.
  if (userData?.role === 'admin' || userData?.workerType === 'partner') {
    return <>{children}</>;
  }

  // Redirect non-partners to the main dash
  return <Navigate to="/home" />;
}
