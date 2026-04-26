import React, { useState } from 'react';
import { useCoupon, useCouponUsages } from '../hooks/useCoupon';
import CommissionCalculator from '../components/coupon/CommissionCalculator';
import { formatCurrency } from '../utils/couponUtils';
import { useAuth } from '../context/AuthContext';
import { Copy, Share2, Info, Loader2, MessageCircle, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function CouponDashboard() {
  const { userData } = useAuth();
  const { coupon, loading } = useCoupon();
  const { usages } = useCouponUsages();
  
  const [copied, setCopied] = useState(false);

  const venture = userData?.venture?.toLowerCase() || 'buyrix';
  const isGrowplex = venture === 'growplex';

  const ventureColors: Record<string, string> = {
    buyrix: '#3B82F6',
    vyuma: '#8B5CF6',
    growplex: '#00C9A7'
  };
  const color = ventureColors[venture] || '#E8B84B';

  const handleCopy = () => {
    if (!coupon) return;
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success('Copied! ✓');
    setTimeout(() => setCopied(false), 2000);
  };

  const getWhatsAppText = () => {
    if (!coupon) return '';
    if (isGrowplex) {
      return `Boost your social media with Growplex SMM panel! Use code ${coupon.code} for premium services. Visit: growplex.sbs`;
    }
    if (venture === 'vyuma') {
      return `Discover lifestyle products at Vyuma! Use code ${coupon.code}. Shop: vyuma.shop`;
    }
    return `Shop electronics at BuyRix! Use my code ${coupon.code} for special offer. Shop now: buyrix.in`;
  };

  const shareWhatsApp = () => {
     const text = encodeURIComponent(getWhatsAppText());
     window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${venture.toUpperCase()} Offer`,
          text: getWhatsAppText(),
        });
      } catch (err) {
         console.log(err);
      }
    } else {
      handleCopy();
      toast('Copied to clipboard instead!', { icon: '📋' });
    }
  };

  if (loading) return (
     <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white p-4">
        <Loader2 className="w-8 h-8 text-[#E8B84B] animate-spin mb-4" />
        <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Coupon...</span>
     </div>
  );

  if (!coupon) return (
     <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-center p-6 text-white max-w-md mx-auto">
        <div className="w-20 h-20 bg-[#111111] border border-[#2A2A2A] rounded-full flex justify-center items-center mb-6">
           <Loader2 className="w-8 h-8 text-[#E8B84B] animate-spin" />
        </div>
        <h2 className="text-xl font-bold mb-2">Your coupon code is being generated</h2>
        <p className="text-gray-500 text-sm">Admin will activate it soon. Please check back later.</p>
     </div>
  );

  const totalEarned = usages.reduce((acc, u) => acc + (u.commissionAmount || 0), 0);
  const pending = usages.filter(u => !u.released).reduce((acc, u) => acc + (u.commissionAmount || 0), 0);
  const isActive = coupon.isActive !== false;

  // Simulate usage history for demo
  const sampleUsages = usages.length > 0 ? usages : [
     { id: 1, date: Date.now() - 86400000, product: 'Wireless Earbuds', price: 1500, commissionAmount: 150, released: true },
     { id: 2, date: Date.now() - 3600000, product: 'Smart Watch', price: 2500, commissionAmount: 250, released: false },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 pb-24 font-sans text-white max-w-2xl mx-auto">
      {/* SHARED HEADER */}
      <div className="flex items-center justify-between mb-6 pt-2">
         <h1 className="text-[22px] font-bold text-white leading-tight">My Coupon Code</h1>
         <div className="flex gap-2 items-center">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm" style={{ backgroundColor: `${color}20`, color: color }}>{venture}</span>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isActive ? '#10B981' : '#4B5563' }} />
         </div>
      </div>
      
      {/* HERO COUPON CARD */}
      <div 
         className="relative rounded-[24px] p-6 mb-6 overflow-hidden border"
         style={{ 
            background: `linear-gradient(135deg, ${color}20, #0A0A0A)`, 
            borderColor: `${color}40`,
         }}
      >
         <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-30 rounded-full" style={{ backgroundColor: color }} />
         
         <div className="relative z-10 flex flex-col items-center text-center">
            <span className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-2">Your Code</span>
            
            <div className="flex items-center justify-center gap-3 bg-[#0A0A0A]/50 border border-white/10 px-6 py-4 rounded-xl backdrop-blur-md mb-4 shadow-xl">
               <span className="font-mono text-3xl md:text-4xl font-black text-white tracking-[0.2em]">{coupon.code}</span>
               <button 
                 onClick={handleCopy}
                 className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition text-[#E8B84B]"
               >
                 {copied ? <CheckCircle2 size={24} className="text-green-500" /> : <Copy size={24} />}
               </button>
            </div>

            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border mb-6 flex items-center gap-2 ${isActive ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-gray-800 text-gray-400 border-gray-600'}`}>
               <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
               {isActive ? 'Active' : 'Inactive'}
            </div>

            {/* Share action row */}
            <div className="flex gap-2 w-full max-w-sm justify-center">
               <button onClick={shareWhatsApp} className="flex-1 bg-[#10B981] hover:bg-[#10B981]/90 text-black font-black uppercase tracking-widest text-[10px] py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition">
                  <MessageCircle size={18} /> WhatsApp
               </button>
               <button onClick={handleCopy} className="flex-1 bg-[#111111] hover:bg-[#1A1A1A] border border-[#2A2A2A] text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition">
                  <LinkIcon size={18} /> Copy Link
               </button>
               <button onClick={shareNative} className="flex-1 bg-[#111111] hover:bg-[#1A1A1A] border border-[#2A2A2A] text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition">
                  <Share2 size={18} /> Share
               </button>
            </div>
         </div>
      </div>
      
      {/* STATS GRID */}
      <div className="grid grid-cols-3 gap-3 mb-6">
         {isGrowplex ? (
            <>
               <div className="bg-[#111111] border border-[#2A2A2A] p-3 rounded-xl flex flex-col justify-center">
                 <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Times Used</p>
                 <p className="text-xl font-black text-white">{coupon.usageCount || 0}</p>
               </div>
               <div className="bg-[#111111] border border-[#2A2A2A] p-3 rounded-xl flex flex-col justify-center col-span-2">
                 <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Wallet Last Updated</p>
                 <p className="text-sm font-bold text-gray-300">Admin reviews weekly</p>
                 <p className="text-lg font-black text-[#00C9A7] mt-1">{formatCurrency(userData?.wallets?.earned || 0)}</p>
               </div>
            </>
         ) : (
            <>
               <div className="bg-[#111111] border border-[#2A2A2A] p-4 rounded-xl flex flex-col justify-center items-center text-center">
                 <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Used Today</p>
                 <p className="text-2xl font-black text-white">{coupon.usageCount || 0}</p>
               </div>
               <div className="bg-[#111111] border border-[#2A2A2A] p-4 rounded-xl flex flex-col justify-center items-center text-center">
                 <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Total Earned</p>
                 <p className="text-xl font-black text-[#10B981]">{formatCurrency(totalEarned)}</p>
               </div>
               <div className="bg-[#111111] border border-[#2A2A2A] p-4 rounded-xl flex flex-col justify-center items-center text-center">
                 <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Pending</p>
                 <p className="text-xl font-black text-[#F59E0B]">{formatCurrency(pending)}</p>
                 <p className="text-[8px] text-gray-500 mt-1 uppercase">7-day hold</p>
               </div>
            </>
         )}
      </div>

      {/* GROWPLEX EXTRA INFO */}
      {isGrowplex && (
         <div className="bg-[#00C9A7]/10 border border-[#00C9A7] rounded-xl p-4 mb-6 flex gap-3 text-sm">
            <Info size={24} className="text-[#00C9A7] flex-shrink-0" />
            <p className="text-gray-300 font-medium">
               Your coupon tracks SMM service clients. Admin reviews usage weekly and credits your wallet accordingly. Check your wallet every Monday for updates.
            </p>
         </div>
      )}

      {/* USAGE HISTORY TABLE */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden mb-6">
         <div className="p-4 border-b border-[#2A2A2A]">
            <h3 className="font-bold text-white">Usage History</h3>
         </div>
         {sampleUsages.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm font-medium">No usage recorded yet.</div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#1A1A1A] text-[10px] uppercase tracking-widest text-gray-500">
                     <tr>
                        <th className="px-4 py-3">Date</th>
                        {isGrowplex ? <th className="px-4 py-3">Service</th> : <th className="px-4 py-3">Product</th>}
                        {isGrowplex ? <th className="px-4 py-3 text-right">Uses</th> : <th className="px-4 py-3 text-right">Commission</th>}
                        <th className="px-4 py-3 text-center">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A]">
                     {sampleUsages.map((u, i) => (
                        <tr key={i} className="hover:bg-white/5 transition">
                           <td className="px-4 py-3 text-gray-400">{format(new Date(u.date), 'dd MMM yyyy')}</td>
                           <td className="px-4 py-3 font-medium text-white">{u.product || u.service || 'Unknown'}</td>
                           {isGrowplex ? (
                              <td className="px-4 py-3 text-right font-bold">{u.timesUsed || 1}</td>
                           ) : (
                              <td className="px-4 py-3 text-right text-[#E8B84B] font-bold">{formatCurrency(u.commissionAmount)}</td>
                           )}
                           <td className="px-4 py-3 text-center">
                              {u.released ? (
                                 <span className="text-[10px] bg-green-500/20 text-green-400 font-bold px-2 py-1 rounded">Released</span>
                              ) : (
                                 <span className="text-[10px] bg-yellow-500/20 text-yellow-500 font-bold px-2 py-1 rounded">Held (7 days)</span>
                              )}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>

      {/* COMMISSION CALCULATOR (Hide for Growplex) */}
      {!isGrowplex && (
         <CommissionCalculator />
      )}
    </div>
  );
}
