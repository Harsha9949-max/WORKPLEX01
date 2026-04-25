import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, limit, orderBy, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Components
import TopBar from '../components/dashboard/TopBar';
import CouponCard from '../components/dashboard/CouponCard';
import AIEarningsPredictor from '../components/dashboard/AIEarningsPredictor';
import TaskCard from '../components/dashboard/TaskCard';
import LeadMarketerProgress from '../components/dashboard/LeadMarketerProgress';
import MysteryBonusModal from '../components/dashboard/MysteryBonusModal';
import AnnouncementBanner from '../components/dashboard/AnnouncementBanner';
import SkeletonLoader from '../components/dashboard/SkeletonLoader';
import StreakDisplay from '../components/gamification/StreakDisplay';
import ProfileCompletionBar from '../components/profile/ProfileCompletionBar';
import PostFirstEarningModal from '../components/profile/PostFirstEarningModal';
import AIPredictorBanner from '../components/ai/AIPredictorBanner';
import AIProductPicker from '../components/ai/AIProductPicker';
import LiveEarningsFeed from '../components/viral/LiveEarningsFeed';
import WhatsAppShareModal from '../components/viral/WhatsAppShareModal';
import ReferralQRModal from '../components/viral/ReferralQRModal';
import FamilyTransferModal from '../components/viral/FamilyTransferModal';
import PartnerDashboard from '../components/shop/PartnerDashboard';
import { Share2, QrCode, Heart, TrendingUp, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useNavigate } from 'react-router-dom';

export default function HomeDashboard() {
  const navigate = useNavigate();
  const { currentUser, userData, loading: authLoading } = useAuth();
  const [coupon, setCoupon] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isMysteryModalOpen, setIsMysteryModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [showFirstEarnModal, setShowFirstEarnModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Listen to Coupon Data
  useEffect(() => {
    if (!currentUser || !userData) return;
    const allowedRoles = ['Marketer', 'Content Creator', 'Reseller', 'Promoter'];
    if (!allowedRoles.includes(userData.role)) return;

    const couponRef = doc(db, 'coupons', currentUser.uid);
    const unsubscribe = onSnapshot(couponRef, (doc) => {
      if (doc.exists()) {
        setCoupon({ id: doc.id, ...doc.data() });
      } else {
        // Fallback for demo if no coupon exists yet
        setCoupon({
          code: `${userData.venture.substring(0, 2).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          usageCount: 0,
          isActive: true,
          expiresAt: Timestamp.fromMillis(Date.now() + 24 * 3600 * 1000)
        });
      }
    });

    return () => unsubscribe();
  }, [currentUser, userData]);

  // 2. Listen to Tasks
  useEffect(() => {
    if (!currentUser || !userData) return;

    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('venture', '==', userData.venture),
      where('status', '==', 'active'),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(taskList);
      
      // Demo tasks if empty
      if (taskList.length === 0) {
        setTasks([
          { id: '1', title: 'Share WhatsApp Status', venture: userData.venture, reward: 150, expiresAt: Timestamp.fromMillis(Date.now() + 3600 * 1000) },
          { id: '2', title: 'Product Review Video', venture: userData.venture, reward: 500, expiresAt: Timestamp.fromMillis(Date.now() + 7200 * 1000) },
          { id: '3', title: 'Acquire New Client', venture: userData.venture, reward: 1200, expiresAt: Timestamp.fromMillis(Date.now() + 14400 * 1000) }
        ]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, userData]);

  // 3. Listen to Announcements
  useEffect(() => {
    const annRef = collection(db, 'announcements');
    const q = query(annRef, orderBy('priority', 'desc'), limit(5));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const annList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnnouncements(annList);
      
      // Demo announcements if empty
      if (annList.length === 0) {
        setAnnouncements([
          { id: '1', text: '🚀 New high-paying tasks added to Vyuma!', priority: 1 },
          { id: '2', text: '💰 Weekend Bonus: Earn 2x on all BuyRix tasks.', priority: 2 }
        ]);
      }
    });

    return () => unsubscribe();
  }, []);

  // 4. Mystery Task Trigger
  useEffect(() => {
    if (!loading && Math.random() < 0.15) {
      const timer = setTimeout(() => setIsMysteryModalOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleAcceptTask = (id: string) => {
    navigate(`/tasks/${id}`);
  };

  const handleSkipTask = (id: string) => {
    toast('Task hidden from preview. You can find more in the Task Center.', { icon: '⏭️' });
  };

  const handleAcceptMystery = () => {
    setIsMysteryModalOpen(false);
    toast.success('Mystery Bonus Task Activated! 🎁');
  };

  useEffect(() => {
    if (userData && userData.wallets && userData.wallets.earned > 0 && !userData.kycCompletedAt && !userData.firstEarningModalShown) {
      // Show first earn modal when they have something in earned and no kyc
      setShowFirstEarnModal(true);
    }
  }, [userData]);

  if (authLoading || loading) return <SkeletonLoader />;
  if (!userData) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">User data not found</div>;

  if (userData.role === 'Partner') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-32">
        <TopBar userData={userData} />
        <ProfileCompletionBar />
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <PartnerDashboard />
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-32">
      <TopBar userData={userData} />
      <ProfileCompletionBar />
      
      <LiveEarningsFeed />

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 pt-6 space-y-8"
      >
        <motion.section variants={itemVariants}>
          <StreakDisplay streak={userData.streak || 0} lastActiveDate={userData.lastActiveDate} />
        </motion.section>

        {/* Viral Action Grid */}
        <motion.section variants={itemVariants} className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="bg-[#111111] border border-white/5 rounded-[32px] p-6 flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-green-500/20">
              <Share2 size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Share App</span>
          </button>

          <button 
            onClick={() => setIsQRModalOpen(true)}
            className="bg-[#111111] border border-white/5 rounded-[32px] p-6 flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-teal-500/20">
              <QrCode size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white">My QR</span>
          </button>

          <button 
            onClick={() => setIsTransferModalOpen(true)}
            className="bg-[#111111] border border-white/5 rounded-[32px] p-6 flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
              <Heart size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Family UPI</span>
          </button>

          {userData.referredBy ? (
            <Link 
              to={`/chat/${userData.referredBy}`}
              className="bg-[#111111] border border-white/5 rounded-[32px] p-6 flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-blue-500/20">
                <MessageCircle size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Team Chat</span>
            </Link>
          ) : (
            <Link 
              to="/catalog"
              className="bg-[#111111] border border-white/5 rounded-[32px] p-6 flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[#E8B84B]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 bg-[#E8B84B] rounded-2xl flex items-center justify-center text-black shadow-lg shadow-[#E8B84B]/20">
                <TrendingUp size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Catalog</span>
            </Link>
          )}
        </motion.section>

        <motion.section variants={itemVariants}>
          <AIPredictorBanner 
            pendingTasksCount={tasks.length} 
            avgEarning={150} 
            completionRate={85} 
          />
        </motion.section>

        {/* Coupon Section (Conditional) */}
        {['Marketer', 'Content Creator', 'Reseller', 'Promoter'].includes(userData.role) && coupon && (
          <motion.section variants={itemVariants}>
            <CouponCard coupon={coupon} venture={userData.venture} />
          </motion.section>
        )}

        {/* Reseller Shortcut (Conditional) */}
        {userData.role === 'Reseller' && (
          <motion.section variants={itemVariants} className="space-y-6">
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">Product Catalog</h3>
                <p className="text-gray-400 text-sm">Browse and share products to earn commissions.</p>
              </div>
              <button 
                onClick={() => navigate('/catalog')}
                className="bg-[#E8B84B] text-black font-bold px-6 py-2 rounded-xl"
              >
                Browse
              </button>
            </div>
            <AIProductPicker />
          </motion.section>
        )}

        {/* AI Predictor */}
        <motion.section variants={itemVariants}>
          <AIEarningsPredictor />
        </motion.section>

        {/* Tasks Preview */}
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-white font-black text-xl uppercase tracking-tight">Today's Tasks</h2>
            <button 
              onClick={() => navigate('/tasks')}
              className="text-[#E8B84B] text-xs font-bold uppercase tracking-widest"
            >
              View All
            </button>
          </div>
          
          <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto pb-4 md:pb-0 no-scrollbar">
            {tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onAccept={handleAcceptTask} 
                onSkip={handleSkipTask} 
              />
            ))}
          </div>
        </motion.section>

        {/* Progress Section */}
        <motion.section variants={itemVariants}>
          <LeadMarketerProgress 
            monthlyEarned={userData.wallets.earned} 
            daysActive={7} // Demo value
          />
        </motion.section>
      </motion.main>

      <AnnouncementBanner announcements={announcements} />

      <MysteryBonusModal 
        isOpen={isMysteryModalOpen} 
        onClose={() => setIsMysteryModalOpen(false)}
        onAccept={handleAcceptMystery}
      />

      <WhatsAppShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share WorkPlex"
        shareText={`Start earning from home with WorkPlex! I've already earned Rs.${userData?.wallets?.earned?.toLocaleString()} this month. Join my team here: ${window.location.origin}/join?ref=${currentUser.uid}`}
      />

      <ReferralQRModal 
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        uid={currentUser.uid}
      />

      <FamilyTransferModal 
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        availableBalance={userData?.wallets?.earned || 0}
      />

      <PostFirstEarningModal 
        isOpen={showFirstEarnModal} 
        onClose={() => setShowFirstEarnModal(false)} 
      />

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
