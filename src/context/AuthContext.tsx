import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface UserData {
  uid: string;
  name: string;
  phone: string;
  email: string | null;
  photoURL: string;
  age: number;
  venture: string;
  role: string;
  upiId: string;
  bankAccount: string;
  level: string;
  streak: number;
  joinedAt: any;
  contractSigned: boolean;
  kycDone: boolean;
  firstTaskDone: boolean;
  wallets: {
    earned: number;
    pending: number;
    bonus: number;
    savings: number;
    temp?: number;
    withdrawn?: number;
  };
  // Missing fields for Phase 7 and beyond
  profileCompletion?: number;
  trustPoints?: number;
  kycCompletedAt?: any;
  shopSetupDone?: boolean;
  firstEarningModalShown?: boolean;
  lastActiveDate?: any;
  referredBy?: string;
  weeklyEarnings?: number;
  totalEarned?: number;
  teamEarnings?: number;
  workerType?: string;
  fullName?: string;
  ifsc?: string;
  username?: string;
  monthlyEarned?: number;
  activeMonths?: number;
  badges?: string[];
  teamSize?: number;
  directReferrals?: number;
  tasksCompleted?: number;
  firstEarningCompleted?: boolean;
  suspended?: boolean;
  incentiveAmount?: number;
  incentiveRevealed?: boolean;
  inactiveWarning?: boolean;
  inactiveRemainingDays?: number;
  totalLeadCount?: number;
  managerCommissionThisMonth?: number;
  teamCommissionToday?: number;
  teamEarningsThisMonth?: number;
  totalTeamCommission?: number;
  contentStats?: {
    totalSubmitted?: number;
    approvalRate?: number;
    totalApproved?: number;
  };
  kyc?: {
    status?: string;
    url?: string;
    reason?: string;
  };
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Listen to user document
        unsubscribeDoc = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserData({ uid: docSnap.id, ...docSnap.data() } as UserData);
          } else {
            setUserData(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user data:", error);
          setLoading(false);
        });
      } else {
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = null;
        }
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    userData,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
