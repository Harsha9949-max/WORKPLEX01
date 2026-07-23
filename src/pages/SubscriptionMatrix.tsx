import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Check, Star, Zap, Crown, Award, ArrowRight,
  TrendingUp, HelpCircle, Lock, ShoppingBag, Send, AlertTriangle,
  QrCode, CreditCard, Landmark, CheckCircle, RefreshCw, Calculator, Network
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';

interface Plan {
  id: 'scout' | 'hustler' | 'brand_partner' | 'venture_elite';
  name: string;
  price: number;
  period: string;
  badge?: string;
  badgeBg?: string;
  icon: any;
  iconColor: string;
  gradient: string;
  desc: string;
  limitDesc: string;
  commissionBump: string;
  features: string[];
  cta: string;
}

function EarningSimulator() {
  const [directInvites, setDirectInvites] = useState(10);
  const [teamSizeMultiplier, setTeamSizeMultiplier] = useState(3); // Avg invites per person
  const [avgTaskEarnings, setAvgTaskEarnings] = useState(500); // Avg weekly earning per user

  const level1Count = directInvites;
  const level2Count = level1Count * teamSizeMultiplier;
  const level3Count = level2Count * teamSizeMultiplier;

  const level1Earn = level1Count * avgTaskEarnings * 0.05; // 5% override
  const level2Earn = level2Count * avgTaskEarnings * 0.03; // 3% override
  const level3Earn = level3Count * avgTaskEarnings * 0.01; // 1% override

  const totalWeekly = level1Earn + level2Earn + level3Earn;

  return (
    <div className="mt-16 bg-[#111111] border border-[#2A2A2A] rounded-3xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
          <Calculator size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Network Earning Simulator</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Project Your Passive Income</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Direct Invites (Level 1)</label>
              <span className="text-xs font-black text-white">{directInvites}</span>
            </div>
            <input 
              type="range" 
              min="1" max="50" 
              value={directInvites} 
              onChange={(e) => setDirectInvites(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Avg Team Growth Rate</label>
              <span className="text-xs font-black text-white">{teamSizeMultiplier}x</span>
            </div>
            <input 
              type="range" 
              min="1" max="10" 
              value={teamSizeMultiplier} 
              onChange={(e) => setTeamSizeMultiplier(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Avg User Earning (Weekly)</label>
              <span className="text-xs font-black text-white">Rs. {avgTaskEarnings}</span>
            </div>
            <input 
              type="range" 
              min="100" max="5000" step="100"
              value={avgTaskEarnings} 
              onChange={(e) => setAvgTaskEarnings(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 relative overflow-hidden">
          <Network className="absolute -right-8 -top-8 w-32 h-32 text-indigo-500/10" />
          
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 relative z-10">Projected Weekly Payout</h3>
          <p className="text-4xl font-black text-white mb-6 relative z-10">Rs. {totalWeekly.toLocaleString()}</p>

          <div className="space-y-3 relative z-10">
            <div className="flex justify-between items-center bg-[#111111] p-3 rounded-xl border border-[#2A2A2A]">
              <div>
                <p className="text-xs font-bold text-white uppercase">Level 1 (5%)</p>
                <p className="text-[10px] text-gray-500">{level1Count} users</p>
              </div>
              <p className="font-bold text-indigo-400">+Rs. {level1Earn.toLocaleString()}</p>
            </div>
            <div className="flex justify-between items-center bg-[#111111] p-3 rounded-xl border border-[#2A2A2A]">
              <div>
                <p className="text-xs font-bold text-white uppercase">Level 2 (3%)</p>
                <p className="text-[10px] text-gray-500">{level2Count} users</p>
              </div>
              <p className="font-bold text-indigo-400">+Rs. {level2Earn.toLocaleString()}</p>
            </div>
            <div className="flex justify-between items-center bg-[#111111] p-3 rounded-xl border border-[#2A2A2A]">
              <div>
                <p className="text-xs font-bold text-white uppercase">Level 3 (1%)</p>
                <p className="text-[10px] text-gray-500">{level3Count} users</p>
              </div>
              <p className="font-bold text-indigo-400">+Rs. {level3Earn.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionMatrix() {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'options' | 'upi' | 'card' | 'processing' | 'success'>('options');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | null>(null);
  const [upiIdInput, setUpiIdInput] = useState('');
  const [cardNumberInput, setCardNumberInput] = useState('');
  const [cardExpiryInput, setCardExpiryInput] = useState('');
  const [cardCvvInput, setCardCvvInput] = useState('');

  const currentTier = userData?.subscriptionTier || 'scout';

  const plans: Plan[] = [
    {
      id: 'scout',
      name: 'Scout Tier',
      price: 0,
      period: 'Forever Free',
      icon: Shield,
      iconColor: 'text-gray-400',
      gradient: 'from-[#1A1A1A] to-[#111111]',
      desc: 'Perfect for beginners starting out with basic gig micro-tasks.',
      limitDesc: 'Payout limit: Up to ₹1,000/week',
      commissionBump: 'Base rates',
      features: [
        'Access to basic promo missions',
        'Standard catalog resale margins',
        'Weekly direct bank payouts',
        'Standard dashboard tracking',
        'Frictionless entry (No verification costs)'
      ],
      cta: 'Current Plan'
    },
    {
      id: 'hustler',
      name: 'Hustler Tier',
      price: 499,
      period: 'per month',
      badge: 'Starter Choice',
      badgeBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      icon: Zap,
      iconColor: 'text-indigo-400',
      gradient: 'from-[#1E1B4B] to-[#111111]',
      desc: 'Accelerate your earnings with basic SMM and custom catalog links.',
      limitDesc: 'Payout limit: Up to ₹5,000/week',
      commissionBump: '10% Commission Bump',
      features: [
        'Access to general SMM campaign tasks',
        'Generate custom referral & catalog links',
        '10% direct reward bonus multiplier',
        'Increased payout ceiling to ₹5,000',
        'Basic live chat support access'
      ],
      cta: 'Upgrade to Hustler'
    },
    {
      id: 'brand_partner',
      name: 'Brand Partner',
      price: 1499,
      period: 'per month',
      badge: 'Best Value / Most Popular',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
      icon: Award,
      iconColor: 'text-emerald-400',
      gradient: 'from-[#064E3B] to-[#0D1511]',
      desc: 'Unlock premium reseller stores, WhatsApp status task access, and network MLM downlines.',
      limitDesc: 'Payout limit: Up to ₹15,000/week',
      commissionBump: '25% Commission Bump',
      features: [
        'Custom white-label storefront (Choose colors, logos)',
        'Unlock high-payout WhatsApp status missions',
        '3-Tier MLM team recruitment (Override commissions)',
        '25% direct reward bonus multiplier',
        'Payout ceiling raised to ₹15,000/week',
        'Early invites to upcoming venture pilot catalogs'
      ],
      cta: 'Partner Now'
    },
    {
      id: 'venture_elite',
      name: 'Venture Elite',
      price: 4999,
      period: 'per month',
      badge: 'Ultimate Power',
      badgeBg: 'bg-[#E8B84B]/10 text-[#E8B84B] border border-[#E8B84B]/20 shadow-[0_0_20px_rgba(232,184,75,0.15)]',
      icon: Crown,
      iconColor: 'text-[#E8B84B]',
      gradient: 'from-[#3B2900] to-[#0F0A00]',
      desc: 'Uncapped potential with direct wholesale pricing and a dedicated sub-admin manager.',
      limitDesc: 'Payout limit: Unlimited / Uncapped',
      commissionBump: '40% Commission Bump',
      features: [
        'Direct bulk-buying / wholesale price privileges',
        '40% direct reward bonus multiplier',
        'Uncapped maximum payout ceiling',
        'Dedicated workspace sub-admin manager assistance',
        'VIP early pilot features & custom catalog request rights',
        'Complete MLM override (unlimited downline branches)'
      ],
      cta: 'Become Elite'
    }
  ];

  const handleOpenPlan = (plan: Plan) => {
    if (plan.id === currentTier) {
      toast('You are currently on this plan!', { icon: 'ℹ️' });
      return;
    }
    setSelectedPlan(plan);
    setCheckoutStep('options');
    setPaymentMethod(null);
  };

  const handleSelectPayment = (method: 'upi' | 'card' | 'netbanking') => {
    setPaymentMethod(method);
    if (method === 'upi') {
      setCheckoutStep('upi');
    } else if (method === 'card') {
      setCheckoutStep('card');
    } else {
      // Netbanking directly triggers simulation
      triggerSimulatedPayment();
    }
  };

  const triggerSimulatedPayment = async () => {
    if (!selectedPlan || !currentUser) return;
    setCheckoutStep('processing');
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      // Update firestore document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        subscriptionTier: selectedPlan.id,
        subscriptionActive: true,
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        subscriptionTxId: 'TXN_' + Math.random().toString(36).substring(2, 12).toUpperCase(),
        level: selectedPlan.id === 'venture_elite' ? 'Legend' : selectedPlan.id === 'brand_partner' ? 'Expert' : 'Rookie'
      });

      setCheckoutStep('success');
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      toast.success(`Welcome to ${selectedPlan.name}!`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update subscription. Please contact support.');
      setCheckoutStep('options');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="text-center max-w-3xl mx-auto space-y-4 py-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8B84B]/10 border border-[#E8B84B]/20 text-xs text-[#E8B84B] font-bold uppercase tracking-wider"
        >
          <Zap size={14} className="animate-pulse" /> SASS Subscription Matrix
        </motion.div>
        
        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight">
          Supercharge Your <span className="text-[#E8B84B] underline decoration-wavy decoration-[#E8B84B]/50">Earning Power</span>
        </h1>
        
        <p className="text-gray-400 text-sm md:text-base leading-relaxed">
          Upgrade your workspace tier to unlock higher payout thresholds, verified commission boosts, custom physical/digital catalogs, and passive MLM downline override commissions.
        </p>

        {/* Current status banner */}
        <div className="mt-4 p-4 rounded-2xl bg-[#111111] border border-white/5 inline-flex flex-col sm:flex-row items-center gap-4 text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#E8B84B]">
              <Crown size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Your Current Status</p>
              <h3 className="text-white font-black text-sm uppercase tracking-wide">
                {plans.find(p => p.id === currentTier)?.name || 'Scout Tier'}
              </h3>
            </div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-white/10" />
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Multipliers</p>
            <p className="text-xs text-[#00C9A7] font-black">
              {currentTier === 'scout' && 'Standard Base Margins'}
              {currentTier === 'hustler' && '10% Commission Multiplier'}
              {currentTier === 'brand_partner' && '25% Multiplier + White label + SMM'}
              {currentTier === 'venture_elite' && '40% Multiplier + Wholesale + MLM Unlimited'}
            </p>
          </div>
        </div>
      </div>

      {/* Subscription cards matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentTier;
          const PlanIcon = plan.icon;
          
          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className={`bg-gradient-to-b ${plan.gradient} rounded-3xl p-6 border flex flex-col justify-between relative overflow-hidden group ${
                isCurrent ? 'border-[#E8B84B]' : 'border-white/5'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute top-4 right-4">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${plan.badgeBg}`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="space-y-6">
                {/* Header */}
                <div className="space-y-3">
                  <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 w-fit ${plan.iconColor}`}>
                    <PlanIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-xl uppercase tracking-wide">{plan.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 min-h-[48px] line-clamp-3 leading-relaxed">{plan.desc}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="py-2 border-y border-white/5 my-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">₹{plan.price}</span>
                    <span className="text-xs text-gray-500 font-medium">/ {plan.period}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono mt-1 font-semibold flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-[#00C9A7]" /> {plan.commissionBump}
                  </p>
                </div>

                {/* Limit tag */}
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                  <p className="text-[11px] font-bold text-gray-300">{plan.limitDesc}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 pt-2">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-300 leading-tight">
                      <Check size={14} className="text-[#00C9A7] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action button */}
              <div className="mt-8 pt-4 border-t border-white/5">
                <button
                  onClick={() => handleOpenPlan(plan)}
                  disabled={isCurrent}
                  className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    isCurrent
                      ? 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed'
                      : plan.id === 'brand_partner'
                      ? 'bg-[#00C9A7] hover:bg-[#00C9A7]/90 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : plan.id === 'venture_elite'
                      ? 'bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-black shadow-[0_0_20px_rgba(232,184,75,0.3)]'
                      : 'bg-white text-black hover:bg-white/90'
                  }`}
                >
                  {isCurrent ? 'ACTIVE PLAN' : plan.cta} <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* RAZORPAY MOCK CHECKOUT MODAL */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D0D11] border border-white/10 rounded-3xl overflow-hidden max-w-md w-full shadow-2xl my-8"
            >
              {/* Header */}
              <div className="bg-[#15151B] p-5 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E8B84B] flex items-center justify-center text-black font-black">
                    WP
                  </div>
                  <div>
                    <h3 className="text-white font-black text-xs uppercase tracking-widest leading-none">WorkPlex Pay</h3>
                    <p className="text-[10px] text-[#E8B84B] font-medium">Secured Razorpay Pipeline</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Order summary banner */}
              <div className="bg-[#181822] p-4 border-b border-white/5 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black">Upgrading workspace to</p>
                  <h4 className="text-white font-black text-sm">{selectedPlan.name}</h4>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-bold">Total Amount</p>
                  <h3 className="text-white font-black text-lg">₹{selectedPlan.price}</h3>
                </div>
              </div>

              {/* Checkout Steps */}
              <div className="p-6">
                {checkoutStep === 'options' && (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Payment Method</p>
                    
                    <div className="space-y-2.5">
                      {/* UPI */}
                      <button 
                        onClick={() => handleSelectPayment('upi')}
                        className="w-full bg-[#111116] border border-white/5 hover:border-indigo-500/50 p-4 rounded-xl flex items-center justify-between text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <QrCode size={18} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">UPI / Instant QR</span>
                            <span className="text-[10px] text-gray-500">Pay via GooglePay, PhonePe, Paytm</span>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-gray-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                      </button>

                      {/* CARD */}
                      <button 
                        onClick={() => handleSelectPayment('card')}
                        className="w-full bg-[#111116] border border-white/5 hover:border-[#E8B84B]/50 p-4 rounded-xl flex items-center justify-between text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#E8B84B]/10 flex items-center justify-center text-[#E8B84B]">
                            <CreditCard size={18} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">Credit / Debit Card</span>
                            <span className="text-[10px] text-gray-500">Supports Mastercard, Visa, RuPay</span>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-gray-500 group-hover:text-[#E8B84B] group-hover:translate-x-1 transition-all" />
                      </button>

                      {/* NET BANKING */}
                      <button 
                        onClick={() => handleSelectPayment('netbanking')}
                        className="w-full bg-[#111116] border border-white/5 hover:border-emerald-500/50 p-4 rounded-xl flex items-center justify-between text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <Landmark size={18} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">NetBanking (Simulated)</span>
                            <span className="text-[10px] text-gray-500">Fast simulated clearance</span>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-gray-600 text-[10px] font-mono mt-6">
                      <Shield size={12} /> SSL 256-Bit Encrypted Payments Guarded by Razorpay
                    </div>
                  </div>
                )}

                {checkoutStep === 'upi' && (
                  <div className="space-y-4">
                    <button onClick={() => setCheckoutStep('options')} className="text-[10px] font-black text-[#E8B84B] uppercase tracking-wider flex items-center gap-1">
                      ← Back to payment options
                    </button>

                    <div className="space-y-4 text-center">
                      <div className="bg-white p-4 rounded-2xl w-40 h-40 mx-auto border border-gray-100 flex flex-col items-center justify-center">
                        {/* Dynamic looking QR */}
                        <div className="w-32 h-32 bg-gray-50 flex items-center justify-center border border-dashed border-gray-300 rounded-lg relative">
                          <QrCode size={80} className="text-black" />
                          <div className="absolute inset-0 bg-black/5 rounded-lg flex items-center justify-center">
                            <span className="bg-[#E8B84B] text-black text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide">TEST NET</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400">Scan this QR code with any UPI app or enter your UPI ID below.</p>

                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Enter UPI ID</label>
                        <input
                          type="text"
                          placeholder="yourname@okhdfcbank"
                          value={upiIdInput}
                          onChange={e => setUpiIdInput(e.target.value)}
                          className="w-full bg-[#111116] border border-white/5 text-white px-4 py-3 rounded-xl text-sm outline-none focus:border-[#E8B84B]"
                        />
                      </div>

                      <button
                        onClick={triggerSimulatedPayment}
                        className="w-full bg-[#E8B84B] text-black py-3.5 rounded-xl text-xs font-black uppercase tracking-wider"
                      >
                        Authorize Simulated Payout ₹{selectedPlan.price}
                      </button>
                    </div>
                  </div>
                )}

                {checkoutStep === 'card' && (
                  <div className="space-y-4">
                    <button onClick={() => setCheckoutStep('options')} className="text-[10px] font-black text-[#E8B84B] uppercase tracking-wider flex items-center gap-1">
                      ← Back to payment options
                    </button>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Card Number</label>
                        <input
                          type="text"
                          placeholder="4111 2222 3333 4444"
                          value={cardNumberInput}
                          onChange={e => setCardNumberInput(e.target.value)}
                          maxLength={19}
                          className="w-full bg-[#111116] border border-white/5 text-white px-4 py-3 rounded-xl text-sm outline-none focus:border-[#E8B84B]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardExpiryInput}
                            onChange={e => setCardExpiryInput(e.target.value)}
                            maxLength={5}
                            className="w-full bg-[#111116] border border-white/5 text-white px-4 py-3 rounded-xl text-sm outline-none focus:border-[#E8B84B]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">CVV</label>
                          <input
                            type="password"
                            placeholder="•••"
                            value={cardCvvInput}
                            onChange={e => setCardCvvInput(e.target.value)}
                            maxLength={3}
                            className="w-full bg-[#111116] border border-white/5 text-white px-4 py-3 rounded-xl text-sm outline-none focus:border-[#E8B84B]"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-2 text-[10px] text-indigo-300">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <span>This is a secure simulation payment playground. Do NOT enter real card numbers. Feel free to use test numbers or any mock digit structure.</span>
                      </div>

                      <button
                        onClick={triggerSimulatedPayment}
                        className="w-full bg-[#E8B84B] text-black py-3.5 rounded-xl text-xs font-black uppercase tracking-wider mt-2"
                      >
                        Authorize Sandbox Card ₹{selectedPlan.price}
                      </button>
                    </div>
                  </div>
                )}

                {checkoutStep === 'processing' && (
                  <div className="space-y-6 py-8 text-center flex flex-col items-center">
                    <RefreshCw className="w-12 h-12 text-[#E8B84B] animate-spin" />
                    <div className="space-y-1">
                      <h4 className="text-white font-bold text-sm">Processing Transaction</h4>
                      <p className="text-xs text-gray-500">Contacting Razorpay simulated merchant relays...</p>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden max-w-[200px]">
                      <div className="bg-[#E8B84B] h-full animate-[loading_3s_ease-in-out_infinite]" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                )}

                {checkoutStep === 'success' && (
                  <div className="space-y-6 py-6 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CheckCircle size={32} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-white font-black text-lg uppercase tracking-wide">WORKSPACE ACTIVATED!</h3>
                      <p className="text-xs text-gray-400">
                        Your account has successfully upgraded to the <span className="text-[#E8B84B] font-bold">{selectedPlan.name}</span>.
                      </p>
                    </div>

                    <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-left space-y-2 font-mono text-[10px]">
                      <div className="flex justify-between text-gray-500">
                        <span>TRANSACTION STATUS</span>
                        <span className="text-emerald-400 font-bold">SUCCESS</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>TRANSACTION ID</span>
                        <span className="text-white">TXN_SANDBOX_{Math.random().toString(36).substring(3, 9).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>DATE & TIMESTAMP</span>
                        <span className="text-white">{new Date().toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPlan(null);
                        // Redirect to home dashboard
                        navigate('/home');
                      }}
                      className="w-full bg-[#00C9A7] text-black py-4 rounded-xl text-xs font-black uppercase tracking-wider"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <EarningSimulator />
    </div>
  );
}
