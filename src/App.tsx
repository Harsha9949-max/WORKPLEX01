/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import CompressedOnboarding from './pages/CompressedOnboarding';
import LoginPage from './pages/LoginPage';
import HomeDashboard from './pages/HomeDashboard';
import TasksScreen from './components/tasks/TasksScreen';
import TaskDetail from './components/tasks/TaskDetail';
import ProofSubmissionModal from './components/tasks/ProofSubmissionModal';
import WalletScreen from './pages/WalletScreen';
import CouponDashboard from './pages/CouponDashboard';
import ProfileScreen from './pages/ProfileScreen';
import TeamManagement from './pages/TeamManagement';
import LeaderboardScreen from './pages/LeaderboardScreen';
import PromotionCelebration from './components/mlm/PromotionCelebration';
import LevelUpCelebration from './components/gamification/LevelUpCelebration';
import PublicProfilePage from './pages/PublicProfilePage';
import TeamChatScreen from './pages/TeamChatScreen';
import ResellerCatalogPage from './pages/ResellerCatalogPage';
import ShopSetupWizard from './pages/ShopSetupWizard';
import PublicShopPage from './pages/PublicShopPage';
import AdminCatalogManager from './pages/AdminCatalogManager';
import AIChatbotWidget from './components/chat/AIChatbotWidget';
import { LanguageLockProvider } from './context/LanguageLockContext';
import PostFirstEarningModal from './components/progressive/PostFirstEarningModal';
import { PrivacyPolicy, TermsOfService, CookiePolicy, SecurityPolicy, ContactPage } from './pages/LegalPages';

// Phase 7 Admin Components
import AdminRouteGuard from './components/admin/AdminRouteGuard';
import AdminLayout from './components/admin/AdminLayout';
import Footer from './components/layout/Footer';
import AdminDashboard from './pages/admin/AdminDashboard';
import WorkerManagement from './pages/admin/WorkerManagement';
import TaskManagement from './pages/admin/TaskManagement';
import CouponManagement from './pages/admin/CouponManagement';
import WithdrawalManagement from './pages/admin/WithdrawalManagement';
import SubAdminCreation from './pages/admin/SubAdminCreation';
import FraudAlerts from './pages/admin/FraudAlerts';
import AnnouncementBroadcaster from './pages/admin/AnnouncementBroadcaster';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">Loading...</div>;
  
  if (!currentUser) return <Navigate to="/join" />;
  
  return <>{children}</>;
}

function AppContent() {
  const { userData } = useAuth();
  const [showPromotion, setShowPromotion] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevRole, setPrevRole] = useState<string | null>(null);
  const [prevLevel, setPrevLevel] = useState<string | null>(null);

  useEffect(() => {
    if (userData) {
      if (prevRole && userData.role !== prevRole) {
        if (userData.role === 'Lead Marketer' || userData.role === 'Manager') {
          setShowPromotion(true);
        }
      }
      if (prevLevel && userData.level !== prevLevel) {
        setShowLevelUp(true);
      }
      setPrevRole(userData.role);
      setPrevLevel(userData.level);
    }
  }, [userData, prevRole, prevLevel]);

  return (
    <Router>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#1A1A1A',
          color: '#fff',
          border: '1px solid #2A2A2A',
        }
      }} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join" element={<LoginPage initialIsLogin={false} />} />
        <Route path="/login" element={<LoginPage initialIsLogin={true} />} />
        <Route path="/onboarding" element={<PrivateRoute><CompressedOnboarding /></PrivateRoute>} />
        <Route path="/home" element={<PrivateRoute><HomeDashboard /></PrivateRoute>} />
        <Route path="/tasks" element={<PrivateRoute><TasksScreen /></PrivateRoute>} />
        <Route path="/tasks/:taskId" element={<PrivateRoute><TaskDetail /></PrivateRoute>} />
        <Route path="/tasks/:taskId/submit" element={<PrivateRoute><ProofSubmissionModal /></PrivateRoute>} />
        <Route path="/wallet" element={<PrivateRoute><WalletScreen /></PrivateRoute>} />
        <Route path="/coupon" element={<PrivateRoute><CouponDashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfileScreen /></PrivateRoute>} />
        <Route path="/team" element={<PrivateRoute><TeamManagement /></PrivateRoute>} />
        <Route path="/leaderboard" element={<PrivateRoute><LeaderboardScreen /></PrivateRoute>} />
        
        {/* Phase 7 Admin Panel */}
        <Route path="/admin" element={<AdminRouteGuard><AdminLayout /></AdminRouteGuard>}>
          <Route index element={<AdminDashboard />} />
          <Route path="workers" element={<WorkerManagement />} />
          <Route path="tasks" element={<TaskManagement />} />
          <Route path="coupons" element={<CouponManagement />} />
          <Route path="withdrawals" element={<WithdrawalManagement />} />
          <Route path="catalog" element={<AdminCatalogManager />} />
          <Route path="sub-admins" element={<SubAdminCreation />} />
          <Route path="fraud" element={<FraudAlerts />} />
          <Route path="announcements" element={<AnnouncementBroadcaster />} />
        </Route>
        
        {/* Viral Layer Routes */}
        <Route path="/u/:username" element={<PublicProfilePage />} />
        <Route path="/chat/:leadId" element={<PrivateRoute><TeamChatScreen /></PrivateRoute>} />
        <Route path="/catalog" element={<PrivateRoute><ResellerCatalogPage /></PrivateRoute>} />
        
        {/* Partner Store Routes */}
        <Route path="/shop-setup" element={<PrivateRoute><ShopSetupWizard /></PrivateRoute>} />
        <Route path="/shop/:slug" element={<PublicShopPage />} />
        
        {/* Legal Routes */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/security" element={<SecurityPolicy />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
      <Footer />
      <AIChatbotWidget />
      <PostFirstEarningModal />
      <PromotionCelebration 
        isOpen={showPromotion} 
        onClose={() => setShowPromotion(false)} 
        newRole={userData?.role || ''} 
      />
      <LevelUpCelebration 
        isOpen={showLevelUp} 
        onClose={() => setShowLevelUp(false)} 
        newLevel={userData?.level || ''} 
      />
    </Router>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Global Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-red-500 bg-black min-h-screen">
          <h1 className="text-2xl font-bold">Something went wrong.</h1>
          <pre className="mt-4 text-sm whitespace-pre-wrap">{this.state.error?.toString()}</pre>
          <pre className="mt-2 text-xs text-gray-500">{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <LanguageLockProvider>
          <AppContent />
        </LanguageLockProvider>
      </AuthProvider>
    </GlobalErrorBoundary>
  );
}
