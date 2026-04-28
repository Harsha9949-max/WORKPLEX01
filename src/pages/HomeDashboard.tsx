import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Bell, Settings as SettingsIcon, BrainCircuit, TrendingUp, Calendar, Clock, ClipboardCheck, Gift, ChevronRight, Share2, Award, ArrowRight } from 'lucide-react';
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import TeamSummaryCard from '../components/dashboard/TeamSummaryCard';
import TeamDashboard from './TeamDashboard';
import InactiveWarningOverlay from '../components/dashboard/InactiveWarningOverlay';
import { Logo } from '../components/ui/Logo';
import LeadMarketerCelebration from '../components/dashboard/LeadMarketerCelebration';

// Format Helpers
const formatInr = (amount: number) => `Rs.${amount?.toLocaleString('en-IN') || 0}`;

export default function HomeDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userData, loading: authLoading } = useAuth();
  
  const searchParams = new URLSearchParams(location.search);
  const tabFromUrl = searchParams.get('tab') || 'earnings';

  const [activeTab, setActiveTab] = useState(sessionStorage.getItem('homeTab') || tabFromUrl);
  const [showInactiveOverlay, setShowInactiveOverlay] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  useEffect(() => {
     if (tabFromUrl === 'team' || tabFromUrl === 'earnings') {
        setActiveTab(tabFromUrl);
        sessionStorage.setItem('homeTab', tabFromUrl);
     }
  }, [tabFromUrl]);

  useEffect(() => {
     if (userData?.role === 'Sub-Admin') {
        navigate('/sub-admin', { replace: true });
        return;
     }

     if (userData?.inactiveWarning && userData?.role === 'Lead Marketer') {
        if (!sessionStorage.getItem('inactiveWarningShown')) {
           setShowInactiveOverlay(true);
        }
     }
     
     // Celebration logic
     if (userData?.role === 'Lead Marketer' && !sessionStorage.getItem('leadCelebrationShown')) {
        setShowCelebration(true);
     }
  }, [userData, navigate]);

  const [tasks, setTasks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isMysteryModalOpen, setIsMysteryModalOpen] = useState(false);
  const [showMysteryFab, setShowMysteryFab] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Venture config
  const ventureColors: Record<string, string> = {
    buyrix: '#3B82F6',
    vyuma: '#8B5CF6',
    growplex: '#00C9A7',
    zaestify: '#EC4899'
  };

  const getVentureColor = () => {
    if (!userData?.venture) return '#E8B84B';
    return ventureColors[userData.venture.toLowerCase()] || '#E8B84B';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Listen to Tasks
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
      setLoadingTasks(false);
    });

    return () => unsubscribe();
  }, [currentUser, userData]);

  // Listen to Announcements
  useEffect(() => {
    const annRef = collection(db, 'announcements');
    const q = query(annRef, orderBy('priority', 'desc'), limit(5));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  // Mystery Task Trigger
  useEffect(() => {
    if (!authLoading && Math.random() < 0.15) {
      const timer = setTimeout(() => setShowMysteryFab(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

  if (authLoading) return <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">Loading...</div>;
  if (!userData) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">User data not found</div>;

  if (userData.workerType === 'partner' || userData.role === 'Partner' || userData.role === 'Reseller') {
    return <Navigate to="/reseller/dashboard" replace />;
  }

  const streak = userData.streak || 0;
  let streakMessage = "Start your streak today!";
  if (streak > 0 && streak < 7) streakMessage = "Keep the fire burning! 🔥";
  else if (streak === 7) streakMessage = "7-day warrior! Bonus incoming! 💰";
  else if (streak > 7) streakMessage = `Unstoppable! ${streak} days strong!`;

  const ventureColor = getVentureColor();
  
  // Use actual wallet data from userData
  const earningsToday = userData.wallets?.earned || 0;
  const earningsWeek = userData.wallets?.earned || 0; // Keeping it same since we don't track temporal data yet
  const pendingWeek = userData.wallets?.pending || 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 font-sans relative overflow-hidden">
      
      {/* SECTION 1 — STICKY TOP BAR */}
      <header className="sticky top-0 z-40 bg-[#111111] border-b border-[#2A2A2A] px-4 flex flex-col justify-center">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Logo variant="primary" size="sm" animated />
          </div>

          <div 
            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0 mx-2 truncate max-w-[120px] text-center"
            style={
              userData.role === 'Sub-Admin' 
                ? { backgroundColor: '#F59E0B20', color: '#F59E0B', border: '1px solid #F59E0B40' } 
                : userData.role === 'Content Creator'
                ? { backgroundColor: '#EC489920', color: '#EC4899', border: '1px solid #EC489940' }
                : { backgroundColor: `${ventureColor}20`, color: ventureColor, border: `1px solid ${ventureColor}40` }
            }
          >
            {userData.role === 'Sub-Admin' 
              ? `${userData.venture || 'WorkPlex'} Sub-Admin` 
              : userData.role === 'Content Creator'
              ? `📷 ${userData.venture || 'WorkPlex'} Content Creator`
              : `${userData.venture || 'WorkPlex'} ${userData.role === 'Promoter' ? 'Promoter' : userData.role === 'Lead Marketer' ? 'Lead' : 'Marketer'}`}
          </div>

          <div className="flex items-center gap-3 shrink-0">
             <div className="w-8 h-8 rounded-full border-2 border-[#E8B84B] overflow-hidden bg-[#1A1A1A] shrink-0" onClick={() => navigate('/settings')}>
               {userData.photoURL ? (
                  <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full flex justify-center items-center font-bold text-[#E8B84B]">{userData.name?.charAt(0) || 'U'}</div>
               )}
             </div>
             <button className="relative text-gray-400 hover:text-white transition">
               <Bell size={20} />
               {userData?.inactiveWarning && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
             </button>
             <button onClick={() => navigate('/settings')} className="text-gray-400 hover:text-white transition">
               <SettingsIcon size={20} />
             </button>
          </div>
        </div>

        {userData.role === 'Lead Marketer' && (
          <div className="flex bg-[#1A1A1A] rounded-lg p-1 mb-2 border border-[#2A2A2A]">
             <button 
               onClick={() => setActiveTab('earnings')}
               className={`flex-1 text-[11px] font-bold uppercase tracking-widest py-2 rounded-md transition-colors ${activeTab === 'earnings' ? 'bg-[#2A2A2A] text-white' : 'text-gray-500 hover:text-gray-300'}`}
             >
               My Earnings
             </button>
             <button 
               onClick={() => setActiveTab('team')}
               className={`flex-1 text-[11px] font-bold uppercase tracking-widest py-2 rounded-md transition-colors ${activeTab === 'team' ? 'bg-[#2A2A2A] text-[#8B5CF6]' : 'text-gray-500 hover:text-gray-300'}`}
             >
               My Team {userData?.inactiveWarning && '⚠️'}
             </button>
          </div>
        )}
      </header>

      {activeTab === 'team' && userData.role === 'Lead Marketer' ? (
         <TeamDashboard />
      ) : (
         <>
            {/* SECTION 8 — ADMIN ANNOUNCEMENTS TICKER */}
            {announcements.length > 0 && (
              <div className="bg-gradient-to-r from-[#E8B84B]/20 to-[#00C9A7]/20 border-b border-[#E8B84B]/30 overflow-hidden py-2" >
                 <div className="whitespace-nowrap animate-marquee flex gap-8">
                    {announcements.map((ann, i) => (
                       <span key={i} className="text-white text-[13px] font-medium flex items-center gap-2">
                          📢 {ann.text}
                       </span>
                    ))}
                    {/* Duplicate for seamless looping */}
                    {announcements.map((ann, i) => (
                       <span key={`dup-${i}`} className="text-white text-[13px] font-medium flex items-center gap-2">
                          📢 {ann.text}
                       </span>
                    ))}
                 </div>
              </div>
            )}

            <main className="p-4 max-w-5xl mx-auto space-y-6">

              {/* SECTION 2 — HERO STREAK CARD */}
        <section className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-5 relative overflow-hidden">
           {/* Fire particles CSS in global or style tag */}
           <div className="flex justify-between items-start mb-6">
              <div>
                 <div className="flex items-end gap-3 mb-1">
                    <motion.div 
                       animate={{ y: [0, -8, 0] }} 
                       transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                       className="text-5xl drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                    >
                       🔥
                    </motion.div>
                    <div className="flex flex-col">
                       <span className="text-5xl font-black text-[#E8B84B] leading-none mb-1">{streak}</span>
                       <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Day Streak</span>
                    </div>
                 </div>
                 <p className="text-sm text-white font-medium mt-3">{streakMessage}</p>
              </div>
              
              <div className="flex gap-1.5 bg-[#111111] p-2 rounded-xl border border-[#2A2A2A]">
                 {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                    const isCompleted = idx < Math.min(streak, 7);
                    const isToday = idx === Math.min(streak, 6); // Approximation
                    return (
                       <div key={idx} className="flex flex-col items-center gap-1.5">
                          <span className="text-[9px] font-bold text-gray-500">{day}</span>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all
                             ${isCompleted && !isToday ? 'bg-[#E8B84B] text-black scale-100' : ''}
                             ${isToday && !isCompleted ? 'border-2 border-[#E8B84B] text-[#E8B84B] animate-pulse' : ''}
                             ${!isCompleted && !isToday ? 'bg-[#2A2A2A] text-gray-600' : ''}
                          `}>
                             {isCompleted && !isToday && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>

           <div className="w-full bg-[#2A2A2A] h-2 rounded-full overflow-hidden mb-2">
              <div className="bg-[#E8B84B] h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((streak / 7) * 100, 100)}%` }}></div>
           </div>
           <p className="text-[11px] font-bold text-gray-400 text-center uppercase tracking-widest">
              {streak > 0 ? 'Today\'s task done! ✅' : 'Complete a task today to keep your streak!'}
           </p>
        </section>

        {/* SECTION 3 — EARNINGS SNAPSHOT */}
        <section className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x">
           <div className="min-w-[200px] bg-[#111111] border border-[#2A2A2A] p-4 rounded-xl snap-start relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#00C9A7]"></div>
              <div className="flex items-center gap-2 mb-2">
                 <TrendingUp size={16} className="text-[#00C9A7]" />
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Today's Earnings</span>
              </div>
              <p className="text-2xl font-black text-white">{formatInr(earningsToday)}</p>
              <p className="text-[10px] text-[#00C9A7] font-bold mt-1 bg-[#00C9A7]/10 inline-block px-1.5 py-0.5 rounded">Updated today</p>
           </div>

           <div className="min-w-[200px] bg-[#111111] border border-[#2A2A2A] p-4 rounded-xl snap-start relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#E8B84B]"></div>
              <div className="flex items-center gap-2 mb-2">
                 <Calendar size={16} className="text-[#E8B84B]" />
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">This Week</span>
              </div>
              <p className="text-2xl font-black text-white">{formatInr(earningsWeek)}</p>
              <p className="text-[10px] text-gray-400 font-bold mt-1">Keep it up!</p>
           </div>

           <div className="min-w-[200px] bg-[#111111] border border-[#2A2A2A] p-4 rounded-xl snap-start relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#F59E0B]"></div>
              <div className="flex items-center gap-2 mb-2">
                 <Clock size={16} className="text-[#F59E0B]" />
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending</span>
              </div>
              <p className="text-2xl font-black text-[#F59E0B]">{formatInr(pendingWeek)}</p>
              <p className="text-[10px] text-gray-400 font-bold mt-1">Releases in 24-48hrs</p>
           </div>
        </section>

         {userData.role === 'Sub-Admin' && (
            <section className="bg-gradient-to-r from-[#F59E0B]/10 to-[#F59E0B]/5 border border-[#F59E0B]/40 rounded-xl p-4 relative overflow-hidden mt-4">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[#F59E0B] font-bold text-sm tracking-tight flex items-center gap-1.5">
                     🏢 {userData.venture} Overview
                  </h3>
                  <button onClick={() => navigate('/sub-admin')} className="text-[#F59E0B] text-xs font-bold hover:underline flex items-center gap-1">
                     Open Admin <ArrowRight size={14} />
                  </button>
               </div>
               <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="flex flex-col">
                     <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Total Workers</span>
                     <span className="text-lg font-black text-white">42</span>
                  </div>
                  <div className="flex flex-col relative">
                     <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Pending Approval</span>
                     <span className="text-lg font-black text-[#F59E0B]">3</span>
                     <div className="absolute top-0 left-24 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Active Today</span>
                     <span className="text-lg font-black text-[#10B981]">18</span>
                  </div>
               </div>
               <div className="flex justify-between items-center border-t border-[#F59E0B]/20 pt-3">
                  <span className="text-xs text-[#F59E0B] font-medium flex items-center gap-1.5 bg-[#F59E0B]/10 px-2 py-1 rounded">
                     ⚠️ 2 withdrawal requests pending
                  </span>
                  <button onClick={() => navigate('/sub-admin?tab=withdrawals')} className="text-[#F59E0B] text-xs font-bold hover:underline">
                     Review Now
                  </button>
               </div>
            </section>
         )}

         {/* SECTION 3.5 — MANAGEMENT OVERVIEW CARD (MANAGER) */}
         {userData.role === 'Manager' && (
            <section className="bg-gradient-to-r from-[#7C3AED]/10 to-[#7C3AED]/5 border border-[#7C3AED]/40 rounded-xl p-4 relative overflow-hidden mt-4">
               {/* ... (Manager content remains same) */}
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[#7C3AED] font-bold text-sm tracking-tight flex items-center gap-1.5">
                     💼 Management Overview
                  </h3>
                  <button onClick={() => navigate('/manager/team')} className="text-[#7C3AED] text-xs font-bold hover:underline flex items-center gap-1">
                     View All <ArrowRight size={14} />
                  </button>
               </div>
               <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="flex flex-col">
                     <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">My Leads</span>
                     <span className="text-lg font-black text-white">{userData.totalLeadCount || 0}</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Total Members</span>
                     <span className="text-lg font-black text-gray-300">0</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">This Month</span>
                     <span className="text-lg font-black text-[#F59E0B]">Rs.{userData.managerCommissionThisMonth || 0}</span>
                  </div>
               </div>
               <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                     <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Earning 3% from {userData.totalLeadCount || 0} Leads' performance</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                     <div className="h-full bg-[#7C3AED] w-1/3"></div>
                  </div>
               </div>
            </section>
         )}

         {/* SECTION 3.5 — CONTENT SNAPSHOT CARD (CONTENT CREATOR) */}
         {userData.role === 'Content Creator' && (
            <section className="bg-gradient-to-r from-pink-500/10 to-pink-500/5 border border-pink-500/40 rounded-xl p-4 relative overflow-hidden mt-4">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-pink-500 font-bold text-sm tracking-tight flex items-center gap-1.5">
                     📷 Content This Week
                  </h3>
                  <button onClick={() => navigate('/studio')} className="text-pink-500 text-xs font-bold hover:underline flex items-center gap-1">
                     View Studio <ArrowRight size={14} />
                  </button>
               </div>
               <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="flex flex-col">
                     <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Submitted</span>
                     <span className="text-lg font-black text-white">4</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Approved</span>
                     <span className="text-lg font-black text-[#10B981]">2</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Pending</span>
                     <span className="text-lg font-black text-yellow-500">1</span>
                  </div>
               </div>
               <div className="flex justify-between items-center border-t border-pink-500/20 pt-3">
                  <span className="text-xs text-pink-400 font-medium flex items-center gap-1.5 bg-pink-500/10 px-2 py-1 rounded">
                     📋 This week's content brief available
                  </span>
                  <button onClick={() => navigate('/studio')} className="text-pink-500 text-xs font-bold hover:underline bg-pink-500/10 px-3 py-1 rounded">
                     View Brief
                  </button>
               </div>
            </section>
         )}

         {/* SECTION 3.5 — TEAM SUMMARY CARD (LEAD MARKETER) */}
         {userData.role === 'Lead Marketer' && (
            <TeamSummaryCard 
               teamSize={userData.teamSize || 0}
               todayCommission={userData.teamCommissionToday || 0}
               monthCommission={userData.teamEarningsThisMonth || 0}
               inactiveWarning={userData.inactiveWarning}
            />
         )}

        {/* SECTION 4 — AI MOTIVATION BANNER */}
        <section className="relative overflow-hidden rounded-2xl border border-[#E8B84B]/30 p-4" style={{ background: 'linear-gradient(135deg, rgba(232,184,75,0.15), rgba(0,201,167,0.15))' }}>
           <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-[#E8B84B]/20 flex justify-center items-center flex-shrink-0">
                    <BrainCircuit size={24} className="text-[#E8B84B]" />
                 </div>
                 <div>
                    <h4 className="text-[#E8B84B] font-black text-[13px] uppercase tracking-widest mb-1">AI Earnings Predictor</h4>
                    <p className="text-sm text-white font-medium leading-snug">Complete more tasks → earn extra today</p>
                    <p className="text-[10px] text-gray-400 mt-1">Based on your performance</p>
                 </div>
              </div>
              <button onClick={() => navigate('/tasks')} className="flex-shrink-0 w-10 h-10 bg-[#00C9A7] rounded-full flex justify-center items-center text-black shadow-[0_0_15px_rgba(0,201,167,0.4)] hover:bg-[#00C9A7]/90 transition">
                 <ArrowRight size={18} />
              </button>
           </div>
        </section>

        {/* SECTION 5 — TODAY'S TASK PREVIEW */}
        <section className="space-y-4">
           <div className="flex justify-between items-center">
              <h2 className="text-white font-black text-lg">TODAY'S TASKS</h2>
              <button onClick={() => navigate('/tasks')} className="text-[#E8B84B] text-xs font-bold uppercase tracking-widest hover:underline transition">View All →</button>
           </div>

           {loadingTasks ? (
              <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-8 flex justify-center">
                 <div className="w-6 h-6 border-2 border-[#E8B84B] border-t-transparent rounded-full animate-spin" />
              </div>
           ) : tasks.length === 0 ? (
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8 flex flex-col items-center justify-center text-center">
                 <ClipboardCheck size={40} className="text-[#E8B84B]/50 mb-3" />
                 <p className="text-white font-bold">No tasks today &mdash; check back soon!</p>
                 <p className="text-xs text-gray-500 mt-1">New tasks drop every Monday</p>
              </div>
           ) : (
              <div className="space-y-3">
                 {tasks.map(task => (
                    <div key={task.id} className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4 transition-all hover:border-gray-700">
                       <div className="flex justify-between items-center mb-3">
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm" style={{ backgroundColor: `${ventureColor}20`, color: ventureColor }}>{task.venture || userData.venture}</span>
                          <span className="text-[10px] font-mono text-[#00C9A7] font-bold flex items-center gap-1">
                             ⏱ 04:12:00
                          </span>
                       </div>
                       <h3 className="text-white font-bold text-base mb-1 truncate">{task.title}</h3>
                       <p className="text-gray-400 text-xs line-clamp-2 mb-4 leading-relaxed">{task.description}</p>
                       
                       <div className="flex justify-between items-center pt-3 border-t border-[#2A2A2A]">
                          <span className="text-[#E8B84B] font-black">{formatInr(task.reward || 25)} <span className="text-gray-500 text-[10px] font-normal uppercase">Earned</span></span>
                          <div className="flex gap-2">
                             <button className="text-[10px] font-bold text-gray-500 uppercase px-3 py-2 hover:text-white transition">Skip</button>
                             <button onClick={() => navigate(`/tasks/${task.id}`)} className="bg-[#E8B84B] text-black text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-[#E8B84B]/90 transition">Start →</button>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </section>

        {/* SECTION 6 — LEADERBOARD PREVIEW */}
        <section className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 relative overflow-hidden">
           {/* Decor */}
           <Award size={120} className="absolute -right-6 -bottom-6 text-[#1A1A1A] z-0 drop-shadow-xl" />
           <div className="relative z-10 flex flex-col items-center text-center">
              <h3 className="text-white font-black text-lg mb-1">YOUR RANK THIS WEEK</h3>
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm mb-4" style={{ backgroundColor: `${ventureColor}20`, color: ventureColor }}>{userData.venture || 'Global'} Team</span>
              
              <div className="flex flex-col items-center mb-4">
                 <span className="text-5xl font-black text-[#E8B84B] drop-shadow-[0_2px_10px_rgba(232,184,75,0.3)]">#42</span>
                 <span className="text-xs text-gray-400 font-medium">out of 1,284 workers</span>
              </div>

              <div className="w-full bg-[#1A1A1A] rounded-xl p-3 flex justify-around items-end mb-4 border border-[#2A2A2A]">
                 <div className="flex flex-col items-center relative">
                    <span className="text-[10px] font-bold text-gray-400 absolute -top-4">#2</span>
                    <div className="w-8 h-12 bg-gray-600 rounded-t-lg"></div>
                    <span className="text-[9px] font-bold text-white mt-1 truncate w-12 text-center">Rahul</span>
                 </div>
                 <div className="flex flex-col items-center relative">
                    <span className="text-[10px] font-black text-[#E8B84B] absolute -top-5">#1</span>
                    <div className="w-10 h-16 bg-[#E8B84B] rounded-t-lg shadow-[0_0_15px_rgba(232,184,75,0.4)]"></div>
                    <span className="text-[9px] font-bold text-white mt-1 truncate w-12 text-center">Priya</span>
                 </div>
                 <div className="flex flex-col items-center relative">
                    <span className="text-[10px] font-bold text-amber-700 absolute -top-4">#3</span>
                    <div className="w-8 h-10 bg-amber-700 rounded-t-lg"></div>
                    <span className="text-[9px] font-bold text-white mt-1 truncate w-12 text-center">Amit</span>
                 </div>
              </div>

              <button onClick={() => navigate('/leaderboard')} className="text-[#00C9A7] text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:underline">
                 View Full Leaderboard <ChevronRight size={14} />
              </button>
           </div>
        </section>

      </main>

      {/* SECTION 7 — MYSTERY BONUS (CONDITIONAL FAB) */}
      <AnimatePresence>
        {showMysteryFab && (
          <motion.div
            initial={{ opacity: 0, scale: 0, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 50 }}
            className="fixed bottom-20 right-4 z-50"
          >
            <div className="relative">
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-black z-10 shadow-lg">!</span>
              <button 
                onClick={() => {
                  setShowMysteryFab(false);
                  setIsMysteryModalOpen(true);
                }}
                 className="w-16 h-16 bg-[#8B5CF6] text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:scale-105 transition-transform relative group"
              >
                <div className="absolute inset-0 rounded-full border-4 border-[#8B5CF6] animate-ping opacity-30"></div>
                <Gift size={32} className="group-hover:animate-bounce" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MYSTERY MODAL */}
      <AnimatePresence>
        {isMysteryModalOpen && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex justify-center items-center p-4"
           >
             <motion.div
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, y: 20 }}
               className="bg-[#111111] border border-[#8B5CF6]/40 rounded-2xl p-8 w-full max-w-sm flex flex-col items-center text-center shadow-[0_0_50px_rgba(139,92,246,0.2)]"
             >
                <div className="w-20 h-20 bg-[#8B5CF6]/20 rounded-full flex justify-center items-center mb-6">
                   <Gift size={40} className="text-[#8B5CF6] animate-bounce" />
                </div>
                <h2 className="text-2xl font-black text-[#E8B84B] uppercase tracking-tighter mb-2">Mystery Task!</h2>
                <p className="text-sm text-gray-300 font-medium mb-6">A limited time opportunity just appeared.</p>
                
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] w-full rounded-xl p-4 mb-6">
                   <p className="text-[#E8B84B] font-black text-3xl mb-1 pulsing-text">Rs.75</p>
                   <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Instant Bonus</p>
                </div>

                <div className="text-red-500 font-mono text-sm font-bold mb-8">
                   Expires in <span className="animate-pulse">01:59:59</span>
                </div>

                <div className="flex flex-col w-full gap-3">
                   <button 
                     onClick={() => {
                        setIsMysteryModalOpen(false);
                        toast.success('Task Added! Go to Tasks to complete it.');
                     }}
                     className="w-full bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(232,184,75,0.4)] hover:bg-[#E8B84B]/90 transition animate-pulse"
                   >
                     Accept Challenge
                   </button>
                   <button 
                     onClick={() => setIsMysteryModalOpen(false)}
                     className="w-full text-xs font-bold text-gray-500 uppercase py-2 hover:text-white transition"
                   >
                     Decline
                   </button>
                </div>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        .animate-marquee {
           animation: marquee 20s linear infinite;
        }
        @keyframes marquee {
           0% { transform: translateX(0); }
           100% { transform: translateX(-50%); }
        }
        
        .pulsing-text {
           animation: colorPulse 2s infinite;
        }
        @keyframes colorPulse {
           0%, 100% { color: #E8B84B; text-shadow: 0 0 10px rgba(232,184,75,0.5); }
           50% { color: #FFF; text-shadow: 0 0 20px rgba(255,255,255,0.8); }
        }
      `}</style>
      </>
      )}

      {showInactiveOverlay && (
        <InactiveWarningOverlay 
          daysRemaining={userData?.inactiveRemainingDays || 7} 
          onClose={() => {
            setShowInactiveOverlay(false);
            sessionStorage.setItem('inactiveWarningShown', 'true');
          }} 
        />
      )}

      {showCelebration && (
         <LeadMarketerCelebration 
           userName={userData?.name || 'User'}
           onClose={() => {
              setShowCelebration(false);
              sessionStorage.setItem('leadCelebrationShown', 'true');
              setActiveTab('team'); // switch to team tab
           }}
         />
      )}
    </div>
  );
}

