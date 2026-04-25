import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  MoreVertical, 
  Ban, 
  ShieldCheck, 
  Wallet,
  ArrowUp,
  ArrowDown,
  X,
  Phone,
  Calendar,
  Layers,
  Activity,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/format';
import { format } from 'date-fns';

/**
 * Worker Management Page.
 * Admin view to monitor and manage all platform workers.
 */
export default function WorkerManagement() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVenture, setSelectedVenture] = useState('All');
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  
  const ventures = ['All', 'BuyRix', 'Vyuma', 'Zaestify', 'Growplex'];

  useEffect(() => {
    fetchWorkers();
  }, [selectedVenture]);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'users'), orderBy('joinedAt', 'desc'), limit(50));
      if (selectedVenture !== 'All') {
        q = query(collection(db, 'users'), where('venture', '==', selectedVenture), limit(50));
      }

      const snap = await getDocs(q);
      setWorkers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (worker: any) => {
    try {
      const isSuspended = worker.status === 'suspended';
      await updateDoc(doc(db, 'users', worker.id), {
        status: isSuspended ? 'active' : 'suspended'
      });
      toast.success(`Worker ${isSuspended ? 'activated' : 'suspended'}`);
      fetchWorkers();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleManualAdjustment = async (isAdd: boolean) => {
    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid amount');
      return;
    }

    try {
      const adjustment = isAdd ? amount : -amount;
      
      // Ensure we don't drop wallet balance below zero
      if (!isAdd && (selectedWorker.wallets?.earned || 0) < amount) {
        toast.error('Cannot remove more than the current balance');
        return;
      }

      await updateDoc(doc(db, 'users', selectedWorker.id), {
        'wallets.earned': increment(adjustment)
      });
      toast.success(`Successfully ${isAdd ? 'credited' : 'removed'} ₹${amount} ${isAdd ? 'to' : 'from'} ${selectedWorker.name}`);
      setAdjustmentAmount('');
      setSelectedWorker(null);
      fetchWorkers();
    } catch (error) {
      toast.error('Adjustment failed');
    }
  };

  const filteredWorkers = workers.filter(w => 
    w.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Human Resources</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Manage network access & role progression</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text"
              placeholder="Search by name/phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#111111] border border-[#2A2A2A] text-white pl-12 pr-4 py-2.5 rounded-xl text-xs font-bold w-64 focus:border-[#E8B84B] transition-colors"
            />
          </div>
          <div className="flex bg-[#111111] border border-[#2A2A2A] rounded-xl p-1">
            {ventures.map(v => (
              <button
                key={v}
                onClick={() => setSelectedVenture(v)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedVenture === v ? 'bg-[#E8B84B] text-black' : 'text-gray-500 hover:text-white'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#111111] border border-[#2A2A2A] rounded-[40px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#2A2A2A] bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Worker Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Venture/Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Financials</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-20 bg-white/[0.01]"></td>
                  </tr>
                ))
              ) : filteredWorkers.map((worker) => (
                <tr key={worker.id} className="hover:bg-white/[0.01] transition-colors text-sm">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 flex items-center justify-center text-[#E8B84B] font-bold shadow-lg">
                        {worker.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-white">{worker.name}</p>
                        <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{worker.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">{worker.venture}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-0.5">{worker.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-[#10B981]">{formatCurrency(worker.wallets?.earned || 0)}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Earned</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      worker.status === 'suspended' ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#10B981]/10 text-[#10B981]'
                    }`}>
                      {worker.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedWorker(worker)}
                        className="p-2 hover:bg-[#E8B84B]/10 hover:text-[#E8B84B] rounded-lg text-gray-500 transition-all font-bold"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <button 
                        onClick={() => toggleUserStatus(worker)}
                        className={`p-2 rounded-lg transition-all ${
                          worker.status === 'suspended' ? 'text-[#10B981] bg-[#10B981]/10' : 'text-[#EF4444] bg-[#EF4444]/10'
                        }`}
                        title={worker.status === 'suspended' ? 'Activate' : 'Suspend'}
                      >
                        {worker.status === 'suspended' ? <ShieldCheck size={18} /> : <Ban size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedWorker && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWorker(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-[#111111] border-l border-[#2A2A2A] z-[70] p-8 shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-black text-[#E8B84B] uppercase tracking-tighter">Worker Profile</h3>
                <button onClick={() => setSelectedWorker(null)} className="p-2 hover:bg-white/5 rounded-full text-gray-500"><X size={20} /></button>
              </div>

              <div className="space-y-8">
                {/* Profile Hub */}
                <div className="flex flex-col items-center text-center pb-8 border-b border-[#2A2A2A]">
                  <div className="w-24 h-24 rounded-[32px] bg-[#E8B84B] flex items-center justify-center text-black text-4xl font-black shadow-2xl shadow-[#E8B84B]/20 mb-4">
                    {selectedWorker.name?.charAt(0)}
                  </div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedWorker.name}</h4>
                  <div className="mt-2 flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                    <span className="bg-[#1A1A1A] px-3 py-1 rounded-full border border-white/5">{selectedWorker.venture}</span>
                    <span className="p-1 w-1 h-1 bg-[#2A2A2A] rounded-full"></span>
                    <span className="bg-[#1A1A1A] px-3 py-1 rounded-full border border-white/5">{selectedWorker.level}</span>
                  </div>
                </div>

                {/* Details List */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                      <Phone size={10} className="text-[#E8B84B]" /> Phone
                    </p>
                    <p className="text-sm font-black text-white mt-1">{selectedWorker.phone}</p>
                  </div>
                  <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                      <Calendar size={10} className="text-[#E8B84B]" /> Joined
                    </p>
                    <p className="text-sm font-black text-white mt-1">
                      {selectedWorker.joinedAt ? format(selectedWorker.joinedAt.toDate(), 'dd MMM yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                      <Layers size={10} className="text-[#E8B84B]" /> KYC Status
                    </p>
                    <p className="text-sm font-black text-[#10B981] mt-1">{selectedWorker.kycDone ? 'VERIFIED' : 'PENDING'}</p>
                  </div>
                  <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                      <ShieldCheck size={10} className="text-[#E8B84B]" /> Device ID
                    </p>
                    <p className="text-[10px] font-mono text-gray-400 mt-1 truncate">{selectedWorker.deviceFingerprint}</p>
                  </div>
                </div>

                {/* Wallet Balance */}
                <div className="bg-gradient-to-br from-[#10B981]/20 to-transparent border border-[#10B981]/10 p-6 rounded-[32px] flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#10B981] font-black uppercase tracking-widest opacity-80 mb-1">Total Earned</p>
                    <h5 className="text-3xl font-black text-white tracking-widest">{formatCurrency(selectedWorker.wallets?.earned || 0)}</h5>
                  </div>
                  <Wallet size={40} className="text-[#10B981] opacity-20" />
                </div>

                {/* Manual Wallet Adjustment Action */}
                <div className="space-y-4 pt-4 border-t border-[#2A2A2A]">
                  <h5 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Zap size={14} className="text-[#E8B84B]" /> Manual Wallet Adjustment
                  </h5>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      placeholder="Enter amount ₹"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      className="flex-1 bg-black border border-[#2A2A2A] text-white px-4 py-3 rounded-xl text-sm font-black focus:border-[#E8B84B] transition-colors"
                    />
                    <button 
                      onClick={() => handleManualAdjustment(true)}
                      className="bg-[#10B981] text-black px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                      Credit
                    </button>
                    <button 
                      onClick={() => handleManualAdjustment(false)}
                      className="bg-[#EF4444] text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Adjusted amount will reflect in worker's Earned Wallet.</p>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-4 pt-8 border-t border-[#2A2A2A]">
                  <button 
                    onClick={() => toast.error('Password reset must be performed by worker via Login screen.', { duration: 4000 })}
                    className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2A2A2A] transition-colors"
                  >
                    Reset Password
                  </button>
                  <button 
                    onClick={() => {
                      toggleUserStatus(selectedWorker);
                      setSelectedWorker(null);
                    }}
                    className={`flex-1 border py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                      selectedWorker.status === 'suspended'
                      ? 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/20'
                      : 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444] hover:bg-[#EF4444]/20'
                    }`}
                  >
                    {selectedWorker.status === 'suspended' ? 'ACTIVATE' : 'BAN ACCOUNT'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
