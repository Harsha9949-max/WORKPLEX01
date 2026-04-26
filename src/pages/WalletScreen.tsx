import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Clock, Gift, Landmark, ArrowRight, History, ShieldAlert, AlertTriangle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useWalletData } from '../hooks/useWalletData';
import { useAuth } from '../context/AuthContext';
import WithdrawalModal from '../components/wallet/WithdrawalModal';
import SkeletonWallet from '../components/wallet/SkeletonWallet';
import toast from 'react-hot-toast';
import ProgressiveProfilingWizard from '../components/profile/ProgressiveProfilingWizard';
import { formatCurrency } from '../utils/taskUtils';
import { format } from 'date-fns';

export default function WalletScreen() {
  const { userData } = useAuth();
  const { wallets, loading } = useWalletData();
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isKycWizardOpen, setIsKycWizardOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (loading || !userData) return <SkeletonWallet />;

  const isKycDone = !!userData.kycCompletedAt;
  const lifetimeEarnings = (wallets.earned || 0) + (wallets.withdrawn || 0);
  
  // Dummy data for transactions
  const dummyTransactions = [
     { id: 1, type: 'credit', amount: 150, desc: 'Task: App Review', date: Date.now() - 86400000, status: 'success' },
     { id: 2, type: 'credit', amount: 50, desc: 'Streak Bonus', date: Date.now() - 172800000, status: 'success' },
     { id: 3, type: 'debit', amount: 500, desc: 'Bank Withdrawal', date: Date.now() - 432000000, status: 'pending' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 pb-24 font-sans text-white max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 pt-2">
         <h1 className="text-[22px] font-bold text-white leading-tight">My Wallet</h1>
         <p className="text-[13px] text-gray-400 mt-1">Track your earnings & withdraw anytime</p>
      </div>

      {/* Hero Balance Card */}
      <div className="bg-gradient-to-br from-[#111111] to-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 mb-6 shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-40 h-40 bg-[#E8B84B] blur-[80px] opacity-10 rounded-full" />
         
         <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Total Withdrawable</p>
         <h2 className="text-[#E8B84B] font-black text-4xl sm:text-5xl mb-4 relative z-10 tracking-tight">
            {formatCurrency(wallets.earned || 0)}
         </h2>
         
         <div className="flex justify-between items-end relative z-10">
            <div>
               <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Lifetime Earnings</p>
               <p className="text-white font-bold text-sm tracking-wide">{formatCurrency(lifetimeEarnings)}</p>
            </div>
            
            <button 
              onClick={() => {
                if (!isKycDone) {
                  toast.error('Please complete KYC to unlock withdrawals.');
                  setIsKycWizardOpen(true);
                  return;
                }
                setIsWithdrawOpen(true);
              }}
              className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${
                isKycDone 
                ? 'bg-[#E8B84B] text-black shadow-[0_0_15px_rgba(232,184,75,0.2)] hover:scale-105 active:scale-95' 
                : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
              }`}
            >
              Withdraw <ArrowRight size={14} />
            </button>
         </div>
      </div>

      {/* Quick Actions (horizontal scroll) */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-4 -mx-4 px-4 scrollbar-hide snap-x">
         <button 
           onClick={() => setIsWithdrawOpen(true)}
           className="min-w-[100px] bg-[#111111] border border-[#2A2A2A] rounded-xl p-3 flex flex-col items-center justify-center gap-2 snap-start hover:border-[#E8B84B]/50 transition"
         >
           <div className="w-10 h-10 rounded-full bg-[#E8B84B]/10 flex items-center justify-center">
              <ArrowRight size={18} className="text-[#E8B84B]" />
           </div>
           <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Withdraw</span>
         </button>
         
         <button 
           onClick={() => setShowHistory(true)}
           className="min-w-[100px] bg-[#111111] border border-[#2A2A2A] rounded-xl p-3 flex flex-col items-center justify-center gap-2 snap-start hover:border-gray-500 transition"
         >
           <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <History size={18} className="text-gray-400" />
           </div>
           <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">History</span>
         </button>

         <button 
           className="min-w-[100px] bg-[#111111] border border-[#2A2A2A] rounded-xl p-3 flex flex-col items-center justify-center gap-2 snap-start hover:border-blue-500/50 transition"
         >
           <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <AlertTriangle size={18} className="text-blue-500" />
           </div>
           <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Statement</span>
         </button>

         <button 
           className="min-w-[100px] bg-[#111111] border border-[#2A2A2A] rounded-xl p-3 flex flex-col items-center justify-center gap-2 snap-start hover:border-purple-500/50 transition"
         >
           <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <ShieldAlert size={18} className="text-purple-500" />
           </div>
           <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Help</span>
         </button>
      </div>

      {/* KYC Warning Check */}
      {!isKycDone && (
         <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-5 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 relative overflow-hidden">
            <div className="flex items-start gap-3 relative z-10">
               <ShieldAlert className="text-[#F59E0B] flex-shrink-0 mt-0.5" size={20} />
               <div className="flex-1">
                  <h3 className="font-bold text-[#F59E0B] text-sm mb-1 uppercase tracking-widest">KYC Required</h3>
                  <p className="text-[#F59E0B]/80 text-xs mb-3 leading-relaxed font-medium">You must verify your identity to withdraw funds over ₹500.</p>
                  
                  <div className="bg-black/30 rounded-xl p-3 border border-[#F59E0B]/20 mb-3">
                     <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                        <span className="text-[#F59E0B]/70">Temp Limit</span>
                        <span className="text-[#F59E0B]">₹{wallets.earned || 0} / ₹500</span>
                     </div>
                     <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                        <div className="h-full bg-[#F59E0B] rounded-full transition-all" style={{ width: `${Math.min(((wallets.earned || 0) / 500) * 100, 100)}%` }} />
                     </div>
                  </div>
                  
                  <button 
                     onClick={() => setIsKycWizardOpen(true)}
                     className="bg-[#F59E0B] text-black w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-[#F59E0B]/90"
                  >
                     Verify Identity Now
                  </button>
               </div>
            </div>
         </motion.div>
      )}

      {/* Performance Commitment Reminder */}
      <div className="bg-black border border-[#F59E0B]/30 rounded-xl p-4 mb-6 flex gap-3 items-start">
         <AlertTriangle size={16} className="text-[#F59E0B] mt-0.5 flex-shrink-0" />
         <p className="text-[#F59E0B]/80 text-[10px] sm:text-xs leading-relaxed font-bold tracking-wide">
           DISCLOSURE: Earnings are based on verified conversions. Pending payouts can be rejected if fraud is detected. This is a commission-based system.
         </p>
      </div>

      {/* Earnings Breakdown */}
      <h3 className="font-bold text-white text-sm mb-3 uppercase tracking-widest">Wallet Breakdown</h3>
      <div className="grid grid-cols-2 gap-3 mb-8">
         <div className="bg-[#111111] border border-green-500/30 p-4 rounded-2xl relative overflow-hidden group hover:border-green-500/60 transition">
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
               <Wallet className="text-green-500" size={16} />
            </div>
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1 mt-4">Available</p>
            <p className="text-xl font-black text-white">{formatCurrency(wallets.earned || 0)}</p>
         </div>
         
         <div className="bg-[#111111] border border-yellow-500/30 p-4 rounded-2xl relative overflow-hidden group hover:border-yellow-500/60 transition">
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
               <Clock className="text-yellow-500" size={16} />
            </div>
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1 mt-4">Pending</p>
            <p className="text-xl font-black text-white">{formatCurrency(wallets.pending || 0)}</p>
            <p className="text-[8px] text-gray-500 mt-1 uppercase">Awaiting approval</p>
         </div>
         
         <div className="bg-[#111111] border border-purple-500/30 p-4 rounded-2xl relative overflow-hidden group hover:border-purple-500/60 transition">
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
               <Gift className="text-purple-500" size={16} />
            </div>
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1 mt-4">Bonuses</p>
            <p className="text-xl font-black text-white">{formatCurrency(wallets.bonus || 0)}</p>
         </div>
         
         <div className="bg-[#111111] border border-blue-500/30 p-4 rounded-2xl relative overflow-hidden group hover:border-blue-500/60 transition">
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
               <Landmark className="text-blue-500" size={16} />
            </div>
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1 mt-4">Savings/Transfer</p>
            <p className="text-xl font-black text-white">{formatCurrency(wallets.savings || 0)}</p>
            <p className="text-[8px] text-gray-500 mt-1 uppercase">Family wallet</p>
         </div>
      </div>

      {/* Transactions Section */}
      <div className="mb-6">
         <div className="flex justify-between items-end mb-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-widest flex items-center gap-2">
               <History size={16} /> Recent Transactions
            </h3>
            <button 
               onClick={() => setShowHistory(!showHistory)}
               className="text-[#E8B84B] text-xs font-bold uppercase tracking-widest"
            >
               {showHistory ? 'Hide' : 'View All'}
            </button>
         </div>
         
         <div className="space-y-3">
            {dummyTransactions.slice(0, showHistory ? 10 : 3).map((txn) => (
               <div key={txn.id} className="bg-[#111111] border border-[#2A2A2A] p-4 rounded-2xl flex items-center justify-between hover:bg-[#1A1A1A] transition">
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-full flex justify-center items-center ${txn.type === 'credit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {txn.type === 'credit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                     </div>
                     <div>
                        <p className="text-white font-bold text-sm">{txn.desc}</p>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">{format(new Date(txn.date), 'dd MMM, hh:mm a')}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className={`font-black tracking-wide ${txn.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                        {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                     </p>
                     <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded mt-1 inline-block ${
                        txn.status === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                     }`}>
                        {txn.status}
                     </span>
                  </div>
               </div>
            ))}
         </div>
      </div>

      <WithdrawalModal 
        isOpen={isWithdrawOpen} 
        onClose={() => setIsWithdrawOpen(false)} 
        earnedBalance={wallets.earned}
      />
      
      {isKycWizardOpen && (
        <ProgressiveProfilingWizard 
          isOpen={isKycWizardOpen} 
          onClose={() => setIsKycWizardOpen(false)} 
        />
      )}
    </div>
  );
}
