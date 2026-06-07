import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';

interface Props {
  children: React.ReactNode;
}

/**
 * Route guard for Admin routes.
 * Strictly allows only marateyh@gmail.com and verified Sub-Admins.
 */
export default function AdminRouteGuard({ children }: Props) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (loading) return;
      
      if (!currentUser) {
        setIsAdminAuthorized(false);
        return;
      }

      // Super Admin (Main Owner)
      if (currentUser.email === 'marateyh@gmail.com') {
        setIsAdminAuthorized(true);
        return;
      }

      // Check for Sub-Admin in Firestore
      try {
        const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
        if (adminDoc.exists()) {
          setIsAdminAuthorized(true);
        } else {
          setIsAdminAuthorized(false);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `admins/${currentUser.uid}`);
        setIsAdminAuthorized(false);
      }
    };

    checkAdminStatus();
  }, [currentUser, loading]);

  if (loading || isAdminAuthorized === null) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E8B84B]"></div>
      </div>
    );
  }

  if (!isAdminAuthorized) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white p-6">
        <h1 className="text-6xl font-black text-[#EF4444] mb-4">403</h1>
        <h2 className="text-2xl font-bold mb-6">ACCESS DENIED</h2>
        <p className="text-gray-400 mb-8 text-center max-w-md">
          This section is restricted to authorized WorkPlex administrators only.
          Your access attempt has been logged.
        </p>
        <Navigate to="/home" state={{ from: location }} replace />
      </div>
    );
  }

  return <>{children}</>;
}
