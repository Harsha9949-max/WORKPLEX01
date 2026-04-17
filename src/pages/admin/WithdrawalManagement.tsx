import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDoc,
  serverTimestamp,
  getDocs,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { useAuth } from '../../context/AuthContext';
import { 
  CreditCard, 
  Check, 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  IndianRupee,
  History,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/format';
import { format, startOfDay } from 'date-fns';

/**
 * Withdrawal Management Page.
 * Strictly controlled financial portal for worker payouts.
 */
export default function WithdrawalManagement() {
  const { currentUser } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [isAdmin, setIsAdmin] = useState<any>(null);
  
  const DAILY_CAP = 50000;
  const SUB_ADMIN_LIMIT = 500;

  useEffect(() => {
    const q = query(collection(db, 'withdrawals'), where('status', '==', 'pending'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setWithdrawals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'withdrawals');
    });

    const fetchAdminRole = async () => {
      if (!currentUser) return;
      if (currentUser.email === 'marateyh@gmail.com') {
        setIsAdmin({ role: 'SuperAdmin' });
      } else {
        const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
        if (adminDoc.exists()) setIsAdmin(adminDoc.data());
      }
    };

    const calculateDailyTotal = async () => {
      const today = startOfDay(new Date());
      const q = query(
        collection(db, 'withdrawals'), 
        where('status', '==', 'paid'), 
        where('paidAt', '>=', Timestamp.fromDate(today))
      );
      const snap = await getDocs(q);
      const total = snap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
      setDailyTotal(total);
    };

    fetchAdminRole();
    calculateDailyTotal();
    return () => unsub();
  }, [currentUser]);

  const handleApprove = async (withdrawal: any) => {
    // 1. Safety Checks
    if (dailyTotal + withdrawal.amount > DAILY_CAP) {
      toast.error('Global Daily Cap (₹50,000) reached. Postpone to tomorrow.');
      return;
    }

    if (isAdmin?.role === 'SubAdmin' && withdrawal.amount > SUB_ADMIN_LIMIT) {
      toast.error(`Permission Denied: Sub-Admins cannot approve > ₹${SUB_ADMIN_LIMIT}`);
      return;
    }

    try {
      // 2. Trigger Razorpay via Cloud Function (Simulated)
      // In production: await fetch('/api/razorpay/payout', { ... })
      
      // 3. Update Status
      await updateDoc(doc(db, 'withdrawals', withdrawal.id), {
        status: 'paid',
        paidAt: serverTimestamp(),
        processedBy: currentUser?.uid
      });

      // 4. Record Transaction for Worker (Phase 7 extension point)
      
      toast.success(`Payout of ₹${withdrawal.amount} processed for ${withdrawal.name}!`);
      setDailyTotal(prev => prev + withdrawal.amount);
    } catch (error) {
      toast.error('Payout failed');
    }
  };

  const handleReject = async (withdrawal: any) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;

    try {
      await updateDoc(doc(db, 'withdrawals', withdrawal.id), {
        status: 'rejected',
        rejectionReason: reason,
        processedBy: currentUser?.uid
      });

      // Return funds to wallet (Manual Credit Logic)
      await updateDoc(doc(db, 'users', withdrawal.uid), {
        'wallets.earned': increment(withdrawal.amount)
      });

      toast.success('Withdrawal rejected. Funds returned to worker.');
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const capPercentage = (dailyTotal / DAILY_CAP) * 100;
  const isApproachingCap = capPercentage >= 90;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Treasury Control</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Manage system liquidity & payout distribution</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
          >
            <History size={14} /> Refresh Ledger
          </button>
          <div className="bg-[#111111] border border-[#2A2A2A] px-5 py-3 rounded-2xl flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Global Daily Cap</p>
              <p className="text-sm font-black text-white">{formatCurrency(DAILY_CAP)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#E8B84B]/10 flex items-center justify-center text-[#E8B84B]">
              <Info size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Cap Progress */}
      <div className={`p-8 rounded-[40px] border transition-all ${
        isApproachingCap ? 'bg-[#EF4444]/10 border-[#EF4444]/30' : 'bg-[#111111] border-[#2A2A2A]'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Zap size={20} className={isApproachingCap ? 'text-[#EF4444]' : 'text-[#10B981]'} />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Payout Volume: {formatCurrency(dailyTotal)}</h3>
          </div>
          <span className={`text-xs font-black ${isApproachingCap ? 'text-[#EF4444]' : 'text-gray-500'}`}>
            {capPercentage.toFixed(1)}% Consumed
          </span>
        </div>
        <div className="h-4 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${capPercentage}%` }}
            className={`h-full rounded-full ${isApproachingCap ? 'bg-[#EF4444]' : 'bg-[#10B981]'}`}
          />
        </div>
        {isApproachingCap && (
          <p className="mt-4 text-[10px] text-[#EF4444] font-black uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle size={12} /> DANGER: Approaching daily global liquidity limit. Pause non-critical approvals.
          </p>
        )}
      </div>

      <div className="bg-[#111111] border border-[#2A2A2A] rounded-[40px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#2A2A2A] bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Worker</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">UPI Destination</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Requested</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-20 bg-white/[0.01]"></td>
                  </tr>
                ))
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto text-gray-700 mb-4">
                      <CreditCard size={32} />
                    </div>
                    <p className="text-xs font-black text-gray-600 uppercase tracking-widest">No pending withdrawals in treasury.</p>
                  </td>
                </tr>
              ) : withdrawals.map((w, idx) => (
                <tr key={w.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#E8B84B]/10 text-[#E8B84B] flex items-center justify-center font-bold text-xs capitalize">
                        {w.name?.charAt(0)}
                      </div>
                      <p className="text-xs font-black text-white uppercase tracking-tight">{w.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-black text-[#10B981]">{formatCurrency(w.amount)}</span>
                  </td>
                  <td className="px-6 py-5">
                    <code className="text-[10px] font-mono font-bold text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5">
                      {w.upiId}
                    </code>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      {w.createdAt ? format(w.createdAt.toDate(), 'HH:mm | dd MMM') : 'N/A'}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleReject(w)}
                        className="p-2.5 rounded-xl bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/10 hover:bg-[#EF4444]/20 transition-all"
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                      <button 
                        onClick={() => handleApprove(w)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-[#10B981]/20"
                      >
                        <Check size={14} /> Approve Payout
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Protocol Banner */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-6 rounded-[32px] flex items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">Razorpay Payout Protocol</h4>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
            All approved payouts are processed via WorkPlex Master Merchant Account. Funds will reflect in worker's UPI ID within 2–24 hours based on bank clearance.
          </p>
        </div>
      </div>
    </div>
  );
}
