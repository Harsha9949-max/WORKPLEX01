import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Zap, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, 
  Trophy, Target, Flame, ShoppingBag, Video, TrendingUp, 
  Users, Wallet, Clock, ChevronDown, Layers, Briefcase,
  Package, Truck, Store, DollarSign, Calculator, BarChart3,
  Award, Shield, HelpCircle, AlertCircle, XCircle, Share2,
  Check, Percent, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

// 3D Tilt Card Component
const TiltCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={`relative w-full rounded-2xl glass-card p-6 shadow-2xl transition-colors duration-300 hover:border-[#E8B84B]/50 ${className}`}
    >
      <div style={{ transform: "translateZ(20px)" }} className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};

interface FAQProps {
  question: string;
  answer: string;
}

const FAQItem = ({ question, answer }: FAQProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group gap-4"
      >
        <span className="text-base md:text-lg font-bold text-gray-200 group-hover:text-[#E8B84B] transition-colors">
          {question}
        </span>
        <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'bg-[#E8B84B]/20 text-[#E8B84B] rotate-180' : 'text-gray-400'}`}>
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-sm md:text-base text-gray-400 leading-relaxed pl-2 border-l-2 border-[#E8B84B]/30">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser, userData, loading } = useAuth();
  const [cmsData, setCmsData] = useState<any>(null);
  const [dbVentures, setDbVentures] = useState<any[]>([]);
  
  // Interactive Profit Calculator State
  const [calcDailyOrders, setCalcDailyOrders] = useState<number>(5);
  const [calcMarginPerSale, setCalcMarginPerSale] = useState<number>(300);

  const [regConfig, setRegConfig] = useState<any>({
    globalRegistrationEnabled: true,
    blockedVentureIds: [],
    blockedRoles: [],
    quotas: {},
    blockedCombinations: {}
  });

  useEffect(() => {
    if (!loading && currentUser) {
      if (userData) {
        const userRole = userData.role?.toLowerCase() || '';
        const userEmail = currentUser.email?.toLowerCase().trim() || '';

        if (userRole === 'reseller' || userRole === 'partner' || userData.workerType === 'partner') {
          navigate('/reseller/dashboard');
        } else if (userRole === 'sub-admin') {
          navigate('/sub-admin');
        } else if (userRole === 'admin' || userRole === 'superadmin' || userRole === 'super-admin') {
          navigate('/admin');
        } else if (userEmail === 'hvrsindustriespvtltd@gmail.com' || userEmail === 'marateyh@gmail.com') {
          navigate('/admin');
        } else {
          if (!userData.venture || !userData.role) {
            navigate('/onboarding');
          } else {
            navigate('/home');
          }
        }
      } else {
        navigate('/onboarding');
      }
    }
  }, [currentUser, userData, loading, navigate]);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'systemConfig', 'registrationControls'), (snap) => {
      if (snap.exists()) {
        setRegConfig(snap.data());
      }
    });
    return () => unsubConfig();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ventures'), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        setDbVentures(list);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchCMS = async () => {
      try {
        const docRef = doc(db, 'settings', 'landingPage');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setCmsData(snap.data());
        }
      } catch (e: any) {
        console.warn("CMS load fallback initialized.");
      }
    };
    fetchCMS();
  }, []);

  const heroTitle = cmsData?.heroTitle || "START YOUR STARTUP AT ZERO COST\nWITH NO INVENTORY MANAGEMENT";
  const heroSubtitle = cmsData?.heroSubtitle || "Launch your branded digital e-shop in 60 seconds. Set your profit margins, complete daily tasks, and let HVRS fulfill all stock & delivery automatically.";

  const statsWorkersText = cmsData?.statsWorkersText || '50,000+';
  const statsWorkersLabel = cmsData?.statsWorkersLabel || 'Active Resellers & Workers';
  const statsPaidText = cmsData?.statsPaidText || '₹1.2 Crore+';
  const statsPaidLabel = cmsData?.statsPaidLabel || 'Direct Margins Paid Out';
  const statsMissionsText = cmsData?.statsMissionsText || '100% Free';
  const statsMissionsLabel = cmsData?.statsMissionsLabel || 'Zero Stock Investment Required';

  const getVentureIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag': return ShoppingBag;
      case 'Video': return Video;
      case 'TrendingUp': return TrendingUp;
      case 'Users': return Users;
      case 'Target': return Target;
      case 'Flame': return Flame;
      case 'Zap': return Zap;
      case 'Sparkles': return Sparkles;
      case 'Layers': return Layers;
      default: return Briefcase;
    }
  };

  const defaultVentures = [
    { 
      id: 'BUYRIX', 
      title: 'BuyRix E-Store',
      icon: Store, 
      color: 'text-amber-400', 
      bg: 'bg-amber-400/10',
      desc: 'Zero-Inventory Digital & Physical E-Shop. Curate trending products from central suppliers, set your custom profit margins, and share shop links directly.',
      potential: 'Earn ₹1,500 - ₹5,000 / day',
      comingSoon: false
    },
    { 
      id: 'VYUMA', 
      title: 'Vyuma Catalog',
      icon: Package, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-400/10',
      desc: 'Consumer Electronics & Essentials. Add products to your store without buying stock. HVRS handles packing, shipping & Cash on Delivery.',
      potential: 'Earn ₹2,000 - ₹8,000 / day',
      comingSoon: false
    },
    { 
      id: 'GROWPLEX', 
      title: 'GrowPlex SMM',
      icon: TrendingUp, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-400/10',
      desc: 'Digital Growth & SMM Services Reselling. Sell direct social media engagement, audience funnels, and branding packages to business clients.',
      potential: 'Earn ₹3,000 - ₹10,000 / day',
      comingSoon: false
    },
    { 
      id: 'WORKPLEX MISSIONS', 
      title: 'Daily Missions & MLM',
      icon: Target, 
      color: 'text-purple-400', 
      bg: 'bg-purple-400/10',
      desc: 'Earn daily through social promotional tasks, WhatsApp catalog sharing, affiliate campaigns, and passive team leadership override commissions.',
      potential: 'Earn Daily Bonuses + Overrides',
      comingSoon: false
    }
  ];

  const isVentureClosed = (vId: string, vName?: string, isActive?: boolean, isComingSoon?: boolean) => {
    const isBlocked = regConfig?.blockedVentureIds?.some(
      (blockedId: string) => 
        blockedId?.toLowerCase() === vId?.toLowerCase() || 
        blockedId?.toLowerCase() === (vName || vId)?.toLowerCase()
    );
    if (isBlocked) return true;
    if (isActive === false) return true;
    return false;
  };

  const venturesToDisplay = dbVentures.length > 0 
    ? dbVentures.map((v) => {
        const closed = isVentureClosed(v.id, v.name, v.active !== false, !!v.comingSoon);
        return {
          id: v.name?.toUpperCase() || v.id?.toUpperCase(),
          title: v.name || v.id,
          icon: getVentureIcon(v.iconName),
          color: v.color || 'text-amber-400',
          bg: v.bg || 'bg-[#111111]',
          desc: v.desc || '',
          potential: closed ? 'Coming Soon' : (v.potential || 'Coming Soon'),
          comingSoon: closed,
          active: !closed
        };
      })
    : defaultVentures.map((v, i) => {
        const baseV = cmsData?.ventures && cmsData.ventures[i]
          ? { ...v, ...cmsData.ventures[i] }
          : v;
        const closed = isVentureClosed(baseV.id, undefined, baseV.active !== false, !!baseV.comingSoon);
        return {
          ...baseV,
          potential: closed ? 'Coming Soon' : baseV.potential,
          comingSoon: closed
        };
      });

  // Calculate profit estimations
  const calculatedDailyProfit = calcDailyOrders * calcMarginPerSale;
  const calculatedMonthlyProfit = calculatedDailyProfit * 30;

  return (
    <div className="min-h-screen bg-[#070707] text-white overflow-hidden relative selection:bg-[#E8B84B] selection:text-black font-sans">
      {/* Background Ambient Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] opacity-30" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E8B84B]/10 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00C9A7]/10 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-amber-500/5 blur-[160px] rounded-full pointer-events-none" />
      </div>

      {/* 1. Fixed Header Container (Combines Announcement Bar & Nav Header seamlessly) */}
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Top Announcement Bar */}
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border-b border-amber-500/20 py-1 px-3 text-center text-[10px] sm:text-xs font-medium text-amber-200 flex items-center justify-center gap-1.5 backdrop-blur-md">
          <Zap size={12} className="text-[#E8B84B] shrink-0 animate-bounce" />
          <span className="hidden sm:inline"><strong>WorkPlex Partner Platform:</strong> Zero Stock Holding • Zero Warehouse Fee • Instant UPI Payouts</span>
          <span className="sm:hidden font-bold tracking-tight">Zero Stock • Zero Warehouse Fee • Daily Payouts</span>
          <button onClick={() => navigate('/join')} className="underline hover:text-white ml-1 font-bold hidden md:inline">Start Free Startup →</button>
        </div>

        {/* Navigation Header */}
        <nav className="bg-black/90 backdrop-blur-2xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 h-13 sm:h-18 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Logo variant="horizontal" size="sm" onClick={() => navigate('/')} animated />
              <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                Work Platform
              </span>
            </div>
            
            <div className="hidden lg:flex items-center gap-6 text-xs md:text-sm font-semibold text-gray-400">
              <a href="#zero-inventory" className="hover:text-[#E8B84B] transition-colors">Zero-Stock Model</a>
              <a href="#ventures" className="hover:text-[#E8B84B] transition-colors">Ecosystem Ventures</a>
              <a href="#calculator" className="hover:text-[#E8B84B] transition-colors">Profit Calculator</a>
              <a href="#how-it-works" className="hover:text-[#E8B84B] transition-colors">How It Works</a>
              <a href="#about" className="hover:text-[#E8B84B] transition-colors">About</a>
              <a href="#faq" className="hover:text-[#E8B84B] transition-colors">FAQ</a>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <button 
                onClick={() => navigate('/login')} 
                className="text-[11px] sm:text-xs md:text-sm font-bold text-gray-300 hover:text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg hover:bg-white/5 transition"
              >
                Partner Login
              </button>
              <button 
                onClick={() => navigate('/join')}
                className="bg-gradient-to-r from-[#E8B84B] to-[#d4a63f] text-black font-black px-2.5 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-full text-[10px] sm:text-xs hover:scale-105 transition-transform shadow-[0_0_20px_rgba(232,184,75,0.3)] whitespace-nowrap uppercase tracking-wider flex items-center gap-1"
              >
                <span className="hidden xl:inline">Start Your Own Startup For Free</span>
                <span className="xl:hidden">Start Free</span>
                <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="relative z-10 pt-20 sm:pt-32 md:pt-36">
        {/* 3. Hero Section */}
        <section className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-10 pb-10 sm:pb-24 flex flex-col items-center text-center">
          {/* Platform Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-amber-500/10 border border-amber-500/30 mb-3 sm:mb-8 text-amber-300 text-[10px] sm:text-xs md:text-sm font-bold tracking-wide shadow-lg"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E8B84B] shrink-0" />
            <span className="sm:hidden font-bold">Zero-Inventory Micro-Entrepreneurship</span>
            <span className="hidden sm:inline font-bold">Zero-Inventory Micro-Entrepreneurship • Powered by HVRS</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-outfit font-black text-2xl sm:text-4xl md:text-6xl lg:text-7xl uppercase tracking-tight mb-2 sm:mb-6 leading-tight sm:leading-[1.05] max-w-5xl px-1"
          >
            <span className="block sm:hidden">
              START YOUR STARTUP AT <span className="text-[#E8B84B]">ZERO COST</span> WITH NO INVENTORY
            </span>
            <span className="hidden sm:block">
              {heroTitle.split('\n').map((line: string, i: number, arr: any) => (
                <React.Fragment key={i}>
                  {i === arr.length - 1 ? (
                    <span className="block mt-1 sm:mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[#E8B84B] via-yellow-200 to-[#E8B84B] drop-shadow-[0_0_25px_rgba(232,184,75,0.3)]">
                      {line}
                    </span>
                  ) : (
                    <span>{line} </span>
                  )}
                </React.Fragment>
              ))}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xs sm:text-base md:text-xl text-gray-300 font-medium max-w-2xl mb-5 sm:mb-8 leading-relaxed px-2"
          >
            <span className="sm:hidden">
              Launch your digital e-shop in 60s. Set profit margins, complete tasks, and let HVRS fulfill all stock & delivery automatically.
            </span>
            <span className="hidden sm:inline">
              {heroSubtitle}
            </span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full max-w-xs sm:max-w-none px-2 mb-6 sm:mb-12"
          >
            <button 
              onClick={() => navigate('/join')}
              className="w-full sm:w-auto group flex items-center justify-center gap-2 bg-gradient-to-r from-[#E8B84B] via-amber-400 to-[#d4a63f] text-black font-black px-5 py-3 sm:px-8 sm:py-4 rounded-full text-xs sm:text-base md:text-lg hover:scale-105 transition-all shadow-[0_0_35px_rgba(232,184,75,0.4)] uppercase tracking-wider whitespace-nowrap"
            >
              <span>Start Your Startup For Free</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a 
              href="#zero-inventory" 
              className="w-full sm:w-auto text-center px-5 py-2.5 sm:px-8 sm:py-4 rounded-full text-xs sm:text-base font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>How Zero Inventory Works</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </a>
          </motion.div>

          {/* Key Value Props Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6 w-full max-w-5xl bg-white/[0.03] border border-white/10 p-3 sm:p-5 rounded-2xl md:rounded-3xl backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5 p-1.5 sm:p-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#E8B84B]" />
              </div>
              <div className="text-left">
                <p className="text-[10px] sm:text-xs font-black text-white uppercase">₹0 Stock Cost</p>
                <p className="text-[9px] sm:text-[10px] text-gray-400">Zero inventory hold</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-1.5 sm:p-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="text-[10px] sm:text-xs font-black text-white uppercase">HVRS Shipping</p>
                <p className="text-[9px] sm:text-[10px] text-gray-400">Packing & COD</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-1.5 sm:p-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-[10px] sm:text-xs font-black text-white uppercase">Custom Margin</p>
                <p className="text-[9px] sm:text-[10px] text-gray-400">Set your profit</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-1.5 sm:p-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-[10px] sm:text-xs font-black text-white uppercase">Daily Payouts</p>
                <p className="text-[9px] sm:text-[10px] text-gray-400">Direct UPI wallet</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 4. Zero Inventory vs Traditional Business Model Comparison */}
        <section id="zero-inventory" className="w-full bg-gradient-to-b from-transparent via-white/[0.02] to-transparent border-y border-white/5 py-12 sm:py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="text-center mb-8 sm:mb-16">
              <span className="text-[10px] sm:text-xs font-black text-[#E8B84B] uppercase tracking-widest block mb-1">The WorkPlex Advantage</span>
              <h2 className="font-outfit font-black text-2xl sm:text-4xl md:text-6xl uppercase tracking-tight mb-2 sm:mb-4">
                Why WorkPlex is <span className="text-[#00C9A7]">Risk-Free</span>
              </h2>
              <p className="text-gray-400 text-xs sm:text-base max-w-2xl mx-auto px-2">
                Traditional retail forces you to spend lakhs buying inventory upfront with high risk. WorkPlex lets you launch with ₹0 investment.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-8 items-stretch max-w-5xl mx-auto">
              {/* Traditional Business Card */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col justify-between relative overflow-hidden">
                <div>
                  <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                      <XCircle size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h3 className="font-outfit font-black text-base sm:text-xl text-white uppercase">Traditional Retail</h3>
                      <p className="text-[10px] sm:text-xs text-red-400 font-bold">High Risk • Capital Heavy</p>
                    </div>
                  </div>

                  <ul className="space-y-2.5 sm:space-y-4 text-xs sm:text-sm text-gray-300">
                    <li className="flex items-start gap-2.5">
                      <span className="text-red-400 font-bold shrink-0">❌</span>
                      <span><strong>Upfront Stock Purchase:</strong> Requires ₹50k–₹5L capital to buy inventory.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-red-400 font-bold shrink-0">❌</span>
                      <span><strong>Warehouse & Rent Costs:</strong> Storage fees & unsold dead stock losses.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-red-400 font-bold shrink-0">❌</span>
                      <span><strong>Logistics Headaches:</strong> Packing boxes & manual courier shipping.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-red-400 font-bold shrink-0">❌</span>
                      <span><strong>Slow Cash Cycle:</strong> Capital locked in stock for months.</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-4 sm:mt-8 pt-3 border-t border-red-500/20 text-center">
                  <span className="text-[10px] sm:text-xs text-red-400 font-bold uppercase tracking-wider">High Risk of Loss</span>
                </div>
              </div>

              {/* WorkPlex Zero Inventory Card */}
              <div className="bg-gradient-to-b from-[#E8B84B]/10 via-[#111] to-[#0A0A0A] border-2 border-[#E8B84B]/50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-[0_0_40px_rgba(232,184,75,0.15)]">
                {/* Badge */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-[#E8B84B] text-black text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
                  WorkPlex Model
                </div>

                <div>
                  <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#E8B84B]/20 border border-[#E8B84B]/40 flex items-center justify-center text-[#E8B84B] shrink-0">
                      <CheckCircle2 size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h3 className="font-outfit font-black text-base sm:text-xl text-white uppercase">WorkPlex Zero-Inventory</h3>
                      <p className="text-[10px] sm:text-xs text-[#E8B84B] font-bold">100% Free • Zero Capital</p>
                    </div>
                  </div>

                  <ul className="space-y-2.5 sm:space-y-4 text-xs sm:text-sm text-gray-200">
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#00C9A7] font-bold shrink-0">✓</span>
                      <span><strong>₹0 Inventory Holding:</strong> List supplier products in your store for free.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#00C9A7] font-bold shrink-0">✓</span>
                      <span><strong>Custom Profit Margins:</strong> Set your selling price & keep 100% margin.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#00C9A7] font-bold shrink-0">✓</span>
                      <span><strong>Automated HVRS Fulfillment:</strong> HVRS packs, ships & collects COD.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#00C9A7] font-bold shrink-0">✓</span>
                      <span><strong>60s Storefront Setup:</strong> Get custom URL e-shop with WhatsApp orders.</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-4 sm:mt-8 pt-3 border-t border-[#E8B84B]/20 text-center flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-[#E8B84B] font-black uppercase tracking-wider">Zero Risk • Max Profit</span>
                  <button onClick={() => navigate('/join')} className="text-xs font-bold text-white underline hover:text-[#E8B84B]">Get Started →</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Venture Ecosystem Section */}
        <section id="ventures" className="max-w-7xl mx-auto px-3 sm:px-6 py-12 sm:py-20 md:py-28">
          <div className="text-center mb-8 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-black text-[#E8B84B] uppercase tracking-widest block mb-1">Ecosystem Ventures</span>
            <h2 className="font-outfit font-black text-2xl sm:text-4xl md:text-6xl uppercase tracking-tight mb-2 sm:mb-4">
              Choose Your <span className="text-[#E8B84B]">Earning Venture</span>
            </h2>
            <p className="text-gray-400 text-xs sm:text-base max-w-2xl mx-auto px-2">
              WorkPlex offers specialized working avenues depending on your preferences, skills, and target network.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {venturesToDisplay.map((venture, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] flex flex-col transition-all relative overflow-hidden border border-white/10 ${venture.comingSoon ? 'opacity-70 grayscale' : 'group hover:border-[#E8B84B]/50 hover:bg-white/[0.04]'}`}
              >
                {venture.comingSoon && (
                  <div className="absolute inset-0 bg-[#0A0A0A]/70 z-10 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="bg-white text-black font-black uppercase tracking-widest text-[9px] sm:text-xs px-3 py-1.5 rounded-full transform -rotate-6 shadow-2xl">
                      Coming Soon
                    </span>
                  </div>
                )}
                
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${venture.bg} border border-white/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform`}>
                  <venture.icon className={`w-5 h-5 sm:w-7 sm:h-7 ${venture.color}`} />
                </div>

                <h3 className="font-outfit font-black text-lg sm:text-xl md:text-2xl mb-2 sm:mb-3 tracking-wide text-white">{venture.title}</h3>
                
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 flex-grow">
                  {venture.desc}
                </p>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Potential Earnings</p>
                    <p className="text-[#00C9A7] font-black text-xs sm:text-sm">{venture.potential}</p>
                  </div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-[#E8B84B] group-hover:text-black transition-colors">
                    <ArrowUpRight size={14} className="sm:w-4 sm:h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 6. Interactive Profit Calculator */}
        <section id="calculator" className="max-w-5xl mx-auto px-3 sm:px-6 py-10 sm:py-20">
          <div className="bg-gradient-to-br from-[#141414] via-[#0E0E0E] to-[#141414] border-2 border-[#E8B84B]/30 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden sm:block">
              <Calculator size={180} className="text-[#E8B84B]" />
            </div>

            <div className="relative z-10">
              <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#E8B84B]/10 border border-[#E8B84B]/30 text-[#E8B84B] text-[10px] sm:text-xs font-black uppercase tracking-widest">
                  Live Income Estimator
                </span>
                <h2 className="font-outfit font-black text-xl sm:text-3xl md:text-5xl uppercase tracking-tight mt-2 text-white">
                  Calculate Your <span className="text-[#E8B84B]">Zero-Stock Income</span>
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2 px-1">
                  Adjust sales volume and margin to estimate daily & monthly earnings.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 sm:gap-8 items-center bg-[#070707] border border-white/10 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl">
                {/* Sliders */}
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                      <label className="text-[10px] sm:text-xs font-bold text-gray-300 uppercase tracking-wider">Orders Per Day</label>
                      <span className="text-xs sm:text-sm font-black text-[#E8B84B] bg-[#E8B84B]/10 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg border border-[#E8B84B]/30">
                        {calcDailyOrders} Orders / Day
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="50" 
                      value={calcDailyOrders} 
                      onChange={(e) => setCalcDailyOrders(Number(e.target.value))}
                      className="w-full accent-[#E8B84B] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] sm:text-[10px] text-gray-500 mt-1">
                      <span>1 Order</span>
                      <span>25 Orders</span>
                      <span>50 Orders</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                      <label className="text-[10px] sm:text-xs font-bold text-gray-300 uppercase tracking-wider">Profit Margin Per Order</label>
                      <span className="text-xs sm:text-sm font-black text-[#00C9A7] bg-[#00C9A7]/10 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg border border-[#00C9A7]/30">
                        ₹{calcMarginPerSale} / Sale
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="1500" 
                      step="50" 
                      value={calcMarginPerSale} 
                      onChange={(e) => setCalcMarginPerSale(Number(e.target.value))}
                      className="w-full accent-[#00C9A7] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] sm:text-[10px] text-gray-500 mt-1">
                      <span>₹50</span>
                      <span>₹750</span>
                      <span>₹1,500</span>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] sm:text-[11px] text-gray-400">
                    💡 <strong>Tip:</strong> Average products on BuyRix give ₹250 to ₹600 profit margin per item.
                  </div>
                </div>

                {/* Calculation Output Box */}
                <div className="bg-gradient-to-b from-[#181818] to-[#0D0D0D] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center space-y-4 sm:space-y-6">
                  <div>
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Estimated Daily Profit</span>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-black text-[#E8B84B]">
                      ₹{calculatedDailyProfit.toLocaleString()} <span className="text-xs text-gray-400 font-normal">/ day</span>
                    </p>
                  </div>

                  <div className="pt-3 sm:pt-4 border-t border-white/10">
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Estimated Monthly Margin</span>
                    <p className="text-3xl sm:text-4xl md:text-5xl font-black text-[#00C9A7]">
                      ₹{calculatedMonthlyProfit.toLocaleString()} <span className="text-xs text-gray-400 font-normal">/ month</span>
                    </p>
                  </div>

                  <button 
                    onClick={() => navigate('/join')}
                    className="w-full py-2.5 sm:py-3 bg-[#E8B84B] hover:brightness-110 text-black font-black uppercase text-xs md:text-sm tracking-wider rounded-xl transition shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
                  >
                    <span>Start Earning ₹{calculatedMonthlyProfit.toLocaleString()}/Mo</span>
                    <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. How It Works (4 Steps) */}
        <section id="how-it-works" className="w-full bg-white/[0.02] border-y border-white/5 py-12 sm:py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="text-center mb-8 sm:mb-16">
              <span className="text-[10px] sm:text-xs font-black text-[#00C9A7] uppercase tracking-widest block mb-1">4 Simple Steps</span>
              <h2 className="font-outfit font-black text-2xl sm:text-4xl md:text-6xl uppercase tracking-tight mb-2 sm:mb-4">
                How WorkPlex <span className="text-[#00C9A7]">Operates</span>
              </h2>
              <p className="text-gray-400 text-xs sm:text-base">Zero interviews or upfront fees. Start working in 4 minutes.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 relative">
              <div className="hidden md:block absolute top-[2.5rem] left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#E8B84B]/30 to-transparent z-0" />
              
              {[
                { 
                  step: '01', 
                  title: '60s E-Shop', 
                  desc: 'Create free account & choose store handle.', 
                  icon: Store 
                },
                { 
                  step: '02', 
                  title: 'Select Products', 
                  desc: 'Pick products from HVRS catalog & set your price.', 
                  icon: Percent 
                },
                { 
                  step: '03', 
                  title: 'Share & Earn', 
                  desc: 'Share products on WhatsApp & social media.', 
                  icon: Share2 
                },
                { 
                  step: '04', 
                  title: 'HVRS Ships', 
                  desc: 'HVRS delivers COD. Your profit lands in UPI.', 
                  icon: Wallet 
                }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative z-10 flex flex-col items-center text-center bg-[#111111] border border-white/10 p-4 sm:p-6 rounded-xl sm:rounded-2xl hover:border-[#E8B84B]/40 transition"
                >
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#070707] border border-white/10 flex items-center justify-center mb-3 sm:mb-6 relative group">
                    <item.icon className="w-5 h-5 sm:w-7 sm:h-7 text-[#E8B84B]" />
                    <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-[#E8B84B] text-black font-black text-[9px] sm:text-xs flex items-center justify-center border-2 border-black">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs sm:text-lg md:text-xl text-white mb-1 sm:mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-[10px] sm:text-xs leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Working Dashboard Interactive Sneak-Peek */}
        <section className="max-w-7xl mx-auto px-3 sm:px-6 py-12 sm:py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[#00C9A7] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                <BarChart3 size={13} /> Partner Workspace Features
              </div>

              <h2 className="font-outfit font-black text-2xl sm:text-4xl md:text-6xl uppercase tracking-tight leading-tight">
                Complete Control <br className="hidden sm:block" />
                <span className="text-[#00C9A7]">From Your Smartphone</span>
              </h2>
              
              <p className="text-gray-400 text-xs sm:text-base leading-relaxed">
                Everything you need to run a zero-inventory store is packed into your WorkPlex partner portal.
              </p>
              
              <ul className="space-y-2.5 sm:space-y-4 text-xs sm:text-sm">
                {[
                  { title: '1-Click Catalog Imports', desc: 'Browse trending items and import directly into your shop.' },
                  { title: 'WhatsApp Buy Links', desc: 'Send direct buy links with pre-calculated margins.' },
                  { title: 'Team Override Earnings', desc: 'Earn passive override commissions from downline sales.' },
                  { title: 'Daily Missions & Bonuses', desc: 'Complete daily tasks to unlock milestone bonuses.' }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 bg-[#111111] border border-white/5 p-2.5 sm:p-3 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#00C9A7] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm">{item.title}</p>
                      <p className="text-gray-400 text-[10px] sm:text-xs">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <TiltCard>
                <div className="bg-gradient-to-br from-[#161616] to-[#0A0A0A] rounded-xl border border-white/10 p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Mock Partner Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 sm:pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#E8B84B]/20 border border-[#E8B84B] flex items-center justify-center font-black text-[#E8B84B] text-xs sm:text-base">
                        R
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">Your Storefront</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-400">workplex.in/shop/my-store</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[#00C9A7] text-[9px] sm:text-[10px] font-black uppercase">
                      ● Active Store
                    </span>
                  </div>

                  {/* Mock Stats Cards */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="bg-[#0A0A0A] p-2.5 sm:p-3 rounded-xl border border-white/5">
                      <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase">Wallet Balance</p>
                      <p className="text-base sm:text-lg font-black text-[#E8B84B]">₹ 4,850.00</p>
                      <span className="text-[8px] text-emerald-400">UPI Ready</span>
                    </div>

                    <div className="bg-[#0A0A0A] p-2.5 sm:p-3 rounded-xl border border-white/5">
                      <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase">Products Listed</p>
                      <p className="text-base sm:text-lg font-black text-white">12 / 15</p>
                      <span className="text-[8px] text-gray-400">Zero Stock Cost</span>
                    </div>
                  </div>

                  {/* Mock Order Row */}
                  <div className="bg-[#0A0A0A] p-3 rounded-xl border border-white/10 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-white">Order #78491</span>
                      <span className="text-emerald-400 font-bold text-[10px] sm:text-xs">DELIVERED ✓</span>
                    </div>
                    <div className="flex justify-between text-[10px] sm:text-[11px] text-gray-400">
                      <span>Earbuds FAST Wireless</span>
                      <span>Paid: ₹720</span>
                    </div>
                    <div className="pt-1.5 border-t border-white/5 flex justify-between text-xs font-black">
                      <span className="text-gray-400">Your Profit:</span>
                      <span className="text-[#00C9A7]">+ ₹270.00</span>
                    </div>
                  </div>

                  <button onClick={() => navigate('/join')} className="w-full bg-[#E8B84B] text-black font-black py-2.5 sm:py-3 rounded-xl text-xs uppercase tracking-wider">
                    Create Your Store Now →
                  </button>
                </div>
              </TiltCard>
            </motion.div>
          </div>
        </section>

        {/* 9. Live Platform Stats / Wall of Trust */}
        <section className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-white/10 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-white/5 to-transparent"
            >
              <Users className="w-8 h-8 sm:w-12 sm:h-12 text-[#00C9A7] mb-2 sm:mb-3" />
              <h3 className="font-outfit font-black text-2xl sm:text-4xl text-white mb-0.5">{statsWorkersText}</h3>
              <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px] sm:text-xs">{statsWorkersLabel}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-[#E8B84B]/30 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-[#E8B84B]/10 to-transparent"
            >
              <Wallet className="w-8 h-8 sm:w-12 sm:h-12 text-[#E8B84B] mb-2 sm:mb-3" />
              <h3 className="font-outfit font-black text-2xl sm:text-4xl text-[#E8B84B] mb-0.5">{statsPaidText}</h3>
              <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px] sm:text-xs">{statsPaidLabel}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-white/10 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-white/5 to-transparent"
            >
              <ShieldCheck className="w-8 h-8 sm:w-12 sm:h-12 text-indigo-400 mb-2 sm:mb-3" />
              <h3 className="font-outfit font-black text-2xl sm:text-4xl text-white mb-0.5">{statsMissionsText}</h3>
              <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px] sm:text-xs">{statsMissionsLabel}</p>
            </motion.div>
          </div>
        </section>

        {/* 9.5 About WorkPlex Section */}
        <section id="about" className="max-w-7xl mx-auto px-3 sm:px-6 py-12 sm:py-20 border-t border-white/5">
          <div className="text-center mb-8 sm:mb-12">
            <span className="text-[10px] sm:text-xs font-black text-[#E8B84B] uppercase tracking-widest block mb-1">Company & Mission</span>
            <h2 className="font-outfit font-black text-2xl sm:text-4xl md:text-5xl uppercase tracking-tight mb-2">
              About <span className="text-[#E8B84B]">WorkPlex</span> & HVRS
            </h2>
            <p className="text-gray-400 text-xs sm:text-base max-w-2xl mx-auto px-2">
              Empowering 50,000+ micro-entrepreneurs across India with zero-inventory technology, automated supply chains, and transparent daily UPI payouts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#E8B84B] mb-4">
                  <Store size={20} />
                </div>
                <h3 className="font-outfit font-black text-lg text-white uppercase mb-2">The Zero-Stock Model</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  WorkPlex eliminates the financial barrier to starting an e-commerce business. Resellers run custom-branded e-shops without ever spending capital on physical inventory or warehousing.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                ● 100% Capital-Free
              </div>
            </div>

            <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C9A7] mb-4">
                  <Truck size={20} />
                </div>
                <h3 className="font-outfit font-black text-lg text-white uppercase mb-2">HVRS Supply Chain</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  Backed by HVRS Industries Pvt Ltd, our centralized logistics engine manages product quality checks, automated box packing, doorstep courier dispatch, and Cash-on-Delivery collection.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                ● End-to-End Fulfillment
              </div>
            </div>

            <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="font-outfit font-black text-lg text-white uppercase mb-2">Instant UPI Payouts</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  We believe in complete financial transparency. As soon as customer orders complete or promotional tasks are approved, custom profit margins flow directly into your UPI bank account.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                ● Verified Razorpay & UPI
              </div>
            </div>
          </div>
        </section>

        {/* 10. Frequently Asked Questions */}
        <section id="faq" className="max-w-4xl mx-auto px-3 sm:px-6 py-12 sm:py-24">
          <div className="text-center mb-8 sm:mb-12">
            <span className="text-[10px] sm:text-xs font-black text-[#E8B84B] uppercase tracking-widest block mb-1">Got Questions?</span>
            <h2 className="font-outfit font-black text-2xl sm:text-4xl md:text-6xl uppercase tracking-tight mb-2">
              Frequently Asked <span className="text-[#E8B84B]">Questions</span>
            </h2>
            <p className="text-gray-400 text-xs sm:text-base">Everything you need to know about starting your zero-inventory journey.</p>
          </div>

          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 border border-white/10 bg-[#0C0C0C]">
            {[
              { 
                question: "Is there any inventory purchase or upfront stock fee?", 
                answer: "No, absolutely zero. You never buy inventory stock upfront, never pay for a warehouse, and never handle shipping boxes. All products are supplied by HVRS central suppliers. You only set your custom selling price and earn the profit margin when a customer orders." 
              },
              { 
                question: "How do I set my own profit margins?", 
                answer: "When adding a product from the BuyRix catalog to your store, you will see the base wholesale cost (e.g. ₹400). You can set your selling price to whatever you wish (e.g. ₹700). Your customer pays ₹700, HVRS gets ₹400 base cost, and ₹300 profit margin is credited directly to your WorkPlex wallet." 
              },
              { 
                question: "Who handles packaging, shipping, and Cash on Delivery (COD)?", 
                answer: "HVRS Innovations handles 100% of the fulfillment! HVRS packs the order, ships it to your customer's doorstep via top courier partners, and collects Cash on Delivery or prepaid payments." 
              },
              { 
                question: "How and when do I get paid?", 
                answer: "Once an order is delivered or a daily mission is approved, your earnings land in your WorkPlex Wallet. You can request direct payouts to your UPI ID or bank account anytime." 
              },
              { 
                question: "Can I earn by inviting a team of resellers?", 
                answer: "Yes! Depending on your subscription plan tier (Brand Partner or Venture Elite), you unlock multi-tier MLM team override commissions. Whenever partners in your downline sell products or complete missions, you earn passive override commissions." 
              }
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </section>

        {/* 11. Final CTA Banner */}
        <section className="mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-20 mb-8 sm:mb-12 max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-12 md:p-16 text-center relative overflow-hidden bg-gradient-to-b from-[#121212] via-[#0A0A0A] to-[#050505] border-2 border-[#E8B84B]/40 shadow-[0_0_60px_rgba(232,184,75,0.15)]"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-xl h-64 bg-[#E8B84B]/15 blur-[120px] pointer-events-none rounded-full" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#E8B84B]/30 bg-[#E8B84B]/10 text-[#E8B84B] text-[10px] sm:text-xs font-bold mb-4 sm:mb-6">
                <Zap size={13} /> 100% Free Partner Registration
              </div>
              
              <h2 className="font-outfit font-black text-2xl sm:text-5xl md:text-7xl uppercase tracking-tight mb-3 sm:mb-6 leading-tight">
                Start Your <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8B84B] via-yellow-100 to-[#E8B84B]">
                  Zero-Inventory Business
                </span> Today
              </h2>
              
              <p className="text-xs sm:text-base md:text-lg text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
                Join over 50,000 active micro-entrepreneurs earning daily. Create your store in 60 seconds and start setting your profit margins.
              </p>
              
              <button 
                onClick={() => navigate('/join')}
                className="w-full sm:w-auto group relative inline-flex items-center justify-center bg-gradient-to-r from-[#E8B84B] via-amber-400 to-[#d4a63f] text-black font-black px-6 py-3.5 sm:px-10 sm:py-5 rounded-full text-xs sm:text-lg md:text-xl hover:scale-105 transition-all shadow-[0_0_35px_rgba(232,184,75,0.4)] uppercase tracking-wider"
              >
                <span>Start Your Own Startup For Free</span>
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="mt-6 sm:mt-8 flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-[10px] sm:text-xs text-gray-400 font-semibold">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-[#00C9A7]" /> Zero Inventory Cost</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-[#00C9A7]" /> Razorpay & UPI Secured</span>
                <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-[#E8B84B]" /> Automated Delivery</span>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
