import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Zap, Crown, Shield, AlertTriangle, ArrowRight, Check, Award, BarChart3, HelpCircle 
} from 'lucide-react';

interface SubscriptionLimitsNoticeProps {
  context?: 'dashboard' | 'products' | 'shop' | 'earnings' | 'general' | 'minimal';
}

export default function SubscriptionLimitsNotice({ context = 'general' }: SubscriptionLimitsNoticeProps) {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [productCount, setProductCount] = useState(0);

  const currentTier = userData?.subscriptionTier || 'scout';

  // Fetch real-time product count for the current reseller
  useEffect(() => {
    if (!currentUser) return;
    const qProducts = query(collection(db, `partnerProducts/${currentUser.uid}/products`));
    const unsub = onSnapshot(qProducts, (snap) => {
      setProductCount(snap.docs.length);
    });
    return () => unsub();
  }, [currentUser]);

  // Define tier limits and benefits
  const tierConfig = {
    scout: {
      name: 'Scout Tier',
      price: 'Free',
      payoutLimit: 1000,
      productLimit: 5,
      commissionBump: 'Base rates',
      nextTier: 'hustler',
      nextTierName: 'Hustler Tier',
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10 border-gray-500/20',
      gradient: 'from-gray-500/10 via-zinc-800/20 to-transparent',
    },
    hustler: {
      name: 'Hustler Tier',
      price: '₹499/mo',
      payoutLimit: 5000,
      productLimit: 15,
      commissionBump: '10% Commission Bump',
      nextTier: 'brand_partner',
      nextTierName: 'Brand Partner',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
      gradient: 'from-indigo-500/10 via-zinc-800/20 to-transparent',
    },
    brand_partner: {
      name: 'Brand Partner',
      price: '₹1499/mo',
      payoutLimit: 15000,
      productLimit: 50,
      commissionBump: '25% Commission Bump',
      nextTier: 'venture_elite',
      nextTierName: 'Venture Elite',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      gradient: 'from-emerald-500/10 via-zinc-800/20 to-transparent',
    },
    venture_elite: {
      name: 'Venture Elite',
      price: '₹4999/mo',
      payoutLimit: Infinity,
      productLimit: Infinity,
      commissionBump: '40% Commission Bump',
      nextTier: null,
      nextTierName: null,
      color: 'text-[#E8B84B]',
      bgColor: 'bg-[#E8B84B]/10 border-[#E8B84B]/20',
      gradient: 'from-[#E8B84B]/10 via-zinc-800/20 to-transparent',
    }
  };

  const currentConfig = tierConfig[currentTier as keyof typeof tierConfig] || tierConfig.scout;

  // Render minimal badge or quick link
  if (context === 'minimal') {
    return (
      <button 
        onClick={() => navigate('/reseller/subscription')}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#E8B84B]/10 to-transparent border border-[#E8B84B]/20 hover:border-[#E8B84B]/50 transition text-left group"
      >
        <Crown size={14} className="text-[#E8B84B] animate-pulse" />
        <div className="text-[10px]">
          <span className="font-black text-white block">Active Plan: {currentConfig.name}</span>
          <span className="text-gray-400 block font-medium group-hover:text-[#E8B84B] transition text-[9px]">Upgrade to scale overrides & payouts →</span>
        </div>
      </button>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${currentConfig.gradient} bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 shadow-xl transition-all hover:border-zinc-700`}>
      {/* Decorative top corner crown */}
      <div className="absolute top-0 right-0 p-4 opacity-10 select-none">
        <Crown size={96} className={currentConfig.color} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-4 flex-1">
          {/* Active Plan Header */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentConfig.bgColor} border`}>
              {currentTier === 'scout' && <Shield size={18} className="text-gray-400" />}
              {currentTier === 'hustler' && <Zap size={18} className="text-indigo-400" />}
              {currentTier === 'brand_partner' && <Award size={18} className="text-emerald-400" />}
              {currentTier === 'venture_elite' && <Crown size={18} className="text-[#E8B84B]" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your Reseller Plan Status</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-white/5 border border-white/10 ${currentConfig.color}`}>
                  {currentConfig.price}
                </span>
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">{currentConfig.name}</h3>
            </div>
          </div>

          {/* Context Specific Limits Visuals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-dashed border-[#2A2A2A] pt-4">
            {/* Limit Item: Payout ceiling */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Weekly Payout Cap</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-black text-white">
                  {currentConfig.payoutLimit === Infinity ? 'Unlimited' : `₹${currentConfig.payoutLimit.toLocaleString()}`}
                </span>
                {currentConfig.payoutLimit !== Infinity && (
                  <span className="text-[9px] text-gray-400 font-bold">/ week</span>
                )}
              </div>
              <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden border border-[#2A2A2A]">
                <div 
                  className={`h-full bg-gradient-to-r from-red-500 to-amber-500`}
                  style={{ width: currentConfig.payoutLimit === Infinity ? '100%' : `${Math.min((1000 / currentConfig.payoutLimit) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[8px] text-gray-500 block">Upgrade to elevate your payout limits.</span>
            </div>

            {/* Limit Item: Product inventory limit */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Products in Shop</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-black text-white">{productCount}</span>
                <span className="text-xs text-gray-500 font-bold">
                  / {currentConfig.productLimit === Infinity ? 'Unlimited' : currentConfig.productLimit}
                </span>
              </div>
              <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden border border-[#2A2A2A]">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-300"
                  style={{ width: currentConfig.productLimit === Infinity ? '100%' : `${Math.min((productCount / currentConfig.productLimit) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[8px] text-gray-500 block">
                {productCount >= currentConfig.productLimit ? (
                  <span className="text-amber-500 font-black">⚠️ Inventory Limit Reached!</span>
                ) : (
                  `You can list ${currentConfig.productLimit === Infinity ? 'unlimited' : currentConfig.productLimit - productCount} more products.`
                )}
              </span>
            </div>

            {/* Limit Item: Feature support / Override */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Network MLM Team Commission</span>
              <div className="flex items-center gap-1 text-xs font-black text-white">
                {currentTier === 'scout' && <span className="text-red-400">🔒 Locked (0 Levels)</span>}
                {currentTier === 'hustler' && <span className="text-red-400">🔒 Locked (0 Levels)</span>}
                {currentTier === 'brand_partner' && <span className="text-[#00C9A7]">✓ Enabled (3-Tier overrides)</span>}
                {currentTier === 'venture_elite' && <span className="text-[#E8B84B]">👑 Enabled (Unlimited team branches)</span>}
              </div>
              <p className="text-[8px] text-gray-400 leading-tight">
                {currentTier === 'scout' || currentTier === 'hustler' 
                  ? 'Upgrade to Brand Partner to earn passive commission override overrides from your team downlines.'
                  : 'Passive MLM overriding override commissions are fully active!'
                }
              </p>
            </div>
          </div>

          {/* Context Specific Custom Upgrade Tips */}
          {context === 'products' && currentConfig.productLimit !== Infinity && (
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex gap-2 items-start mt-2">
              <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[10px] leading-relaxed">
                <p className="font-bold text-white">Product listings are locked to {currentConfig.productLimit} max products on {currentConfig.name}.</p>
                <p className="text-gray-400">Unlock wholesale catalog deals & expand to 15, 50, or unlimited listings by subscribing to higher reseller plan tiers.</p>
              </div>
            </div>
          )}

          {context === 'shop' && (currentTier === 'scout' || currentTier === 'hustler') && (
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 flex gap-2 items-start mt-2">
              <Crown size={14} className="text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-[10px] leading-relaxed">
                <p className="font-bold text-white">White-label branding & custom domain mapping is locked.</p>
                <p className="text-gray-400">Subscribe to <span className="text-emerald-400 font-bold">Brand Partner</span> or higher to unlock custom layouts, branding colors, offloader assets, and remove WorkPlex watermarks entirely!</p>
              </div>
            </div>
          )}

          {context === 'earnings' && currentConfig.payoutLimit !== Infinity && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex gap-2 items-start mt-2">
              <BarChart3 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[10px] leading-relaxed">
                <p className="font-bold text-white">Commission overrides multipliers active: {currentConfig.commissionBump}</p>
                <p className="text-gray-400">Maximize direct margins with Hustler (+10%), Brand Partner (+25%), or Venture Elite (+40%) multiplier bumps.</p>
              </div>
            </div>
          )}
        </div>

        {/* Upgrade Call to Action */}
        {currentConfig.nextTier && (
          <div className="shrink-0 flex flex-col justify-center items-center md:items-end gap-2 border-t md:border-t-0 md:border-l border-[#2A2A2A] pt-4 md:pt-0 md:pl-6">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Next Available Upgrade</span>
            <span className="text-xs font-black text-white">{currentConfig.nextTierName}</span>
            <button 
              onClick={() => navigate('/reseller/subscription')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-400 hover:brightness-110 text-black rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-yellow-500/10 whitespace-nowrap"
            >
              👑 Scale My Store <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
