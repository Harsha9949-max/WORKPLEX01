/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import ResellerLayout from './components/reseller/ResellerLayout';
import ResellerDashboard from './pages/reseller/ResellerDashboard';
import ResellerProducts from './pages/reseller/ResellerProducts';
import ResellerOrders from './pages/reseller/ResellerOrders';
import ResellerShop from './pages/reseller/ResellerShop';
import ResellerPerformance from './pages/reseller/ResellerPerformance';
import ResellerEarnings from './pages/reseller/ResellerEarnings';
import ResellerSettings from './pages/reseller/ResellerSettings';
import PartnerRouteGuard from './components/reseller/PartnerRouteGuard';

import { useState, useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

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
import AdminCatalogManager from './pages/admin/AdminCatalogManager';
import AIChatbotWidget from './components/chat/AIChatbotWidget';
import AppLayout from './components/layout/AppLayout';
import { PrivacyPolicy, TermsOfService, CookiePolicy, SecurityPolicy, ContactPage } from './pages/legal/LegalPages';

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
import AdminPartnerOrders from './pages/admin/AdminPartnerOrders';

import OrderSuccessPage from './pages/OrderSuccessPage';

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
      <ScrollToTop />
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

        {/* Protected routes with persistent nav */}
        <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="/home" element={<HomeDashboard />} />
          <Route path="/tasks" element={<TasksScreen />} />
          <Route path="/tasks/:taskId" element={<TaskDetail />} />
          <Route path="/tasks/:taskId/submit" element={<ProofSubmissionModal />} />
          <Route path="/wallet" element={<WalletScreen />} />
          <Route path="/coupon" element={<CouponDashboard />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/team" element={<TeamManagement />} />
          <Route path="/leaderboard" element={<LeaderboardScreen />} />
          <Route path="/chat/:leadId" element={<TeamChatScreen />} />
          <Route path="/catalog" element={<ResellerCatalogPage />} />
          <Route path="/shop-setup" element={<ShopSetupWizard />} />
        </Route>
        
        {/* Phase 7 Admin Panel */}
        <Route path="/admin" element={<AdminRouteGuard><AdminLayout /></AdminRouteGuard>}>
          <Route index element={<AdminDashboard />} />
          <Route path="partner-orders" element={<AdminPartnerOrders />} />
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
        
        {/* Partner Store Routes */}
        <Route path="/shop/:slug" element={<PublicShopPage />} />
        <Route path="/order-success" element={<OrderSuccessPage />} />
        
        {/* Reseller Routes */}
        <Route path="/reseller" element={<PartnerRouteGuard><ResellerLayout /></PartnerRouteGuard>}>
          <Route path="dashboard" element={<ResellerDashboard />} />
          <Route path="products" element={<ResellerProducts />} />
          <Route path="orders" element={<ResellerOrders />} />
          <Route path="my-shop" element={<ResellerShop />} />
          <Route path="performance" element={<ResellerPerformance />} />
          <Route path="earnings" element={<ResellerEarnings />} />
          <Route path="settings" element={<ResellerSettings />} />
        </Route>
        
        {/* Legal Routes */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/security" element={<SecurityPolicy />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
      <Footer />
      <AIChatbotWidget />
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

  static getDerivedStateFromError(error: any) {
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
          <pre className="mt-4 text-sm whitespace-pre-wrap">
            {this.state.error?.toString()}
          </pre>
          <pre className="mt-2 text-xs text-gray-500">
            {this.state.error?.stack}
          </pre>
          <div className="mt-6">
            <p className="text-sm text-gray-400 mb-2">Technical Details:</p>
            <pre className="p-4 bg-[#111] rounded border border-white/10 text-[10px] overflow-auto max-h-60">
              {this.state.error?.code ? `Error Code: ${this.state.error.code}` : 'No additional technical details.'}
            </pre>
          </div>
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
        <AppContent />
      </AuthProvider>
    </GlobalErrorBoundary>
  );
}
