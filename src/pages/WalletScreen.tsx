import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Clock, Gift, Landmark, ArrowRight, History, ShieldAlert } from 'lucide-react';
import { useWalletData } from '../hooks/useWalletData';
import { useAuth } from '../context/AuthContext';
import WalletCard from '../components/wallet/WalletCard';
import WithdrawalModal from '../components/wallet/WithdrawalModal';
import SkeletonWallet from '../components/wallet/SkeletonWallet';
import toast from 'react-hot-toast';
import ProgressiveProfilingWizard from '../components/profile/ProgressiveProfilingWizard';

export default function WalletScreen() {
  const { userData } = useAuth();
  const { wallets, loading } = useWalletData();
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isKycWizardOpen, setIsKycWizardOpen] = useState(false);

  if (loading || !userData) return <SkeletonWallet />;

  const isKycDone = !!userData.kycCompletedAt;

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 pb-24 text-white">
      <h1 className="text-2xl font-bold mb-1">My Wallet</h1>
      <p className="text-gray-400 text-sm mb-8">Track your earnings & withdraw anytime</p>

      {!isKycDone && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-3">
          <div className="flex items-center gap-3 text-amber-500">
            <ShieldAlert size={20} />
            <span className="font-bold text-sm">KYC Required to Withdraw</span>
          </div>
          <div className="bg-black/50 rounded-xl p-3">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-400">Temp Wallet Usage</span>
              <span className="font-bold text-white">₹{wallets.earned || 0} / ₹500</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(((wallets.earned || 0) / 500) * 100, 100)}%` }} />
            </div>
          </div>
          <button 
            onClick={() => setIsKycWizardOpen(true)}
            className="w-full py-2 bg-amber-500 text-black font-bold uppercase text-xs tracking-widest rounded-xl hover:scale-[1.02] transition-all"
          >
            Verify Identity Now
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <WalletCard title={isKycDone ? "Earned" : "Temp Wallet"} balance={wallets.earned} icon={<Wallet />} color="text-green-500" subtitle={isKycDone ? "Available for withdrawal" : "Verify KYC to unlock"} />
        <WalletCard title="Pending" balance={wallets.pending} icon={<Clock />} color="text-yellow-500" subtitle="Awaiting confirmation" />
        <WalletCard title="Bonus" balance={wallets.bonus} icon={<Gift />} color="text-purple-500" subtitle="Signup & streak rewards" />
        <WalletCard title="Savings" balance={wallets.savings} icon={<Landmark />} color="text-blue-500" subtitle="Auto-saved earnings" />
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
        className={`w-full font-bold py-4 rounded-xl mb-4 flex items-center justify-center gap-2 transition-all ${
          isKycDone 
          ? 'bg-[#E8B84B] text-black active:scale-95' 
          : 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/5'
        }`}
      >
        Withdraw Money <ArrowRight size={18} />
      </button>

      <button 
        onClick={() => toast('Transaction history coming soon!', { icon: '📊' })}
        className="w-full bg-[#1A1A1A] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <History size={18} /> Transaction History
      </button>

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
