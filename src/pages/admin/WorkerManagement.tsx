import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  where, 
  orderBy, 
  limit, 
  Timestamp,
  increment,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { disassociatePhoneWithUid } from '../../utils/phoneDirectory';
import AddWorkerModal from './AddWorkerModal';
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
  Zap,
  Trash2,
  Save,
  Edit,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, safeFormatDate, parseDate } from '../../utils/format';
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
  
  // Add state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Accurate Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState(0);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  const ventures = ['All', 'BuyRix', 'Vyuma', 'Zaestify', 'Growplex'];
  const realVentures = ['BuyRix', 'Vyuma', 'Zaestify', 'Growplex'];

  useEffect(() => {
    setLoading(true);
    
    // Subscribe to client-side Firestore in real-time, matching exactly how stats & other consoles do it
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      const filtered = loaded.filter((w: any) => 
        w.email !== 'marateyh@gmail.com' && 
        w.email !== 'hvrsindustriespvtltd@gmail.com' && 
        w.role?.toLowerCase() !== 'admin'
      );
      
      // Sort client-side to prevent Composite Index requirement
      filtered.sort((a: any, b: any) => {
        const timeA = parseDate(a.joinedAt)?.getTime() || 0;
        const timeB = parseDate(b.joinedAt)?.getTime() || 0;
        return timeB - timeA;
      });
      
      setWorkers(filtered);
      setLoading(false);
    }, (error) => {
      console.warn("onSnapshot failed in WorkerManagement, performing manual load:", error);
      fetchWorkers();
    });

    return () => unsubscribe();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);

    try {
      // 1. Attempt fetching from Backend API
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const result = await res.json();
        // Crucial fix: do NOT treat empty backend auth result as a complete set if DB has items
        if (result.success && Array.isArray(result.workers) && result.workers.length > 0) {
          let loaded = result.workers;
          let filtered = loaded.filter((w: any) => 
            w.email !== 'marateyh@gmail.com' && 
            w.email !== 'hvrsindustriespvtltd@gmail.com' && 
            w.role?.toLowerCase() !== 'admin'
          );
          filtered.sort((a: any, b: any) => {
            const timeA = parseDate(a.joinedAt)?.getTime() || 0;
            const timeB = parseDate(b.joinedAt)?.getTime() || 0;
            return timeB - timeA;
          });
          setWorkers(filtered);
          setLoading(false);
          return;
        }
      }
    } catch (apiErr) {
      console.warn("Backend fetch failed, falling back to client-side Firestore query:", apiErr);
    }

    // 2. Fallback to direct client-side Firestore collection query
    try {
      const snap = await getDocs(collection(db, 'users'));
      let loaded = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      let filtered = loaded.filter((w: any) => 
        w.email !== 'marateyh@gmail.com' && 
        w.email !== 'hvrsindustriespvtltd@gmail.com' && 
        w.role?.toLowerCase() !== 'admin'
      );
      filtered.sort((a: any, b: any) => {
        const timeA = parseDate(a.joinedAt)?.getTime() || 0;
        const timeB = parseDate(b.joinedAt)?.getTime() || 0;
        return timeB - timeA;
      });
      setWorkers(filtered);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (worker: any) => {
    try {
      const isSuspended = worker.status === 'suspended';
      const newStatus = isSuspended ? 'active' : 'suspended';
      
      // Update locally in Firestore first for immediate feedback
      try {
        await updateDoc(doc(db, 'users', worker.id), {
          status: newStatus
        });
      } catch (fsErr) {
        console.warn("Direct Firestore update failed or restricted, relying on backend syncing:", fsErr);
      }

      // Synchronize and force on Firebase Auth via backend API
      await fetch(`/api/admin/update-user/${worker.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      toast.success(`Worker ${isSuspended ? 'activated' : 'suspended'}`);
      
      if (selectedWorker && selectedWorker.id === worker.id) {
        setSelectedWorker({ ...selectedWorker, status: newStatus });
      }

      fetchWorkers();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const deleteUser = async (workerId: string, phone?: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this worker? This action cannot be undone.")) return;
    
    try {
      // Trigger and complete full data/auth/firestore deletion on backend
      await fetch(`/api/admin/delete-user/${workerId}`, { method: 'DELETE' });
      
      // Attempt client-side cleanup just in case or for instant feedback
      try {
        await deleteDoc(doc(db, 'users', workerId));
        if (phone) {
          await disassociatePhoneWithUid(db, phone, workerId);
        }
      } catch (err) {
        console.log("Client-side direct delete skipped or restricted, fully handled by backend:", err);
      }

      toast.success("Worker deleted successfully");
      setSelectedWorker(null);
      fetchWorkers();
    } catch (error) {
      toast.error("Failed to delete worker");
    }
  };

  const openWorkerDetail = (worker: any) => {
    setSelectedWorker(worker);
    setEditForm({
      name: worker.name || '',
      phone: worker.phone || '',
      venture: worker.venture || '',
      role: worker.role || ''
    });
    setIsEditing(false);
  };

  const handleUpdateWorker = async () => {
    try {
      // Update directly in Firestore client-side
      try {
        await updateDoc(doc(db, 'users', selectedWorker.id), {
          name: editForm.name,
          phone: editForm.phone,
          venture: editForm.venture,
          role: editForm.role
        });
      } catch (fsErr) {
        console.warn("Direct Firestore update failed, relying on backend syncing:", fsErr);
      }

      // Synchronize changes on backend (updating Auth profile + Firestore user + phone dir)
      await fetch(`/api/admin/update-user/${selectedWorker.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone,
          venture: editForm.venture,
          role: editForm.role
        })
      });
      
      toast.success("Worker updated successfully");
      
      // Update local state
      setSelectedWorker({
        ...selectedWorker,
        name: editForm.name,
        phone: editForm.phone,
        venture: editForm.venture,
        role: editForm.role
      });
      
      setIsEditing(false);
      fetchWorkers();
    } catch (error) {
      toast.error("Failed to update worker");
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
      
      // Update local state
      setSelectedWorker({
        ...selectedWorker,
        wallets: {
          ...selectedWorker.wallets,
          earned: (selectedWorker.wallets?.earned || 0) + adjustment
        }
      });
      
      fetchWorkers();
    } catch (error) {
      toast.error('Adjustment failed');
    }
  };

  const runAccurateDeepSync = async () => {
    setIsSyncing(true);
    setSyncStep(0);
    setSyncLogs([]);

    const log = (msg: string) => {
      setSyncLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
    };

    try {
      log("Initializing cross-platform directory synchronization...");
      await new Promise(resolve => setTimeout(resolve, 800));

      log("Analyzing active user collection...");
      const userSnap = await getDocs(collection(db, 'users'));
      const totalUsers = userSnap.docs.length;
      log(`Discovered ${totalUsers} total user records in Firestore.`);
      await new Promise(resolve => setTimeout(resolve, 600));

      setSyncStep(1);
      log("Loading task submissions database for deep-payout auditing...");
      const subSnap = await getDocs(collection(db, 'taskSubmissions'));
      const activeSubmissions = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      log(`Analyzing ${activeSubmissions.length} historical task submissions.`);
      await new Promise(resolve => setTimeout(resolve, 600));

      setSyncStep(2);
      log("Retrieving treasury withdrawal requests...");
      const withdrawSnap = await getDocs(collection(db, 'withdrawals'));
      const activeWithdrawals = withdrawSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      log(`Cross-referencing ${activeWithdrawals.length} withdrawal logs.`);
      await new Promise(resolve => setTimeout(resolve, 600));

      setSyncStep(3);
      log("Beginning ledger-reconciliation algorithm for each user...");
      await new Promise(resolve => setTimeout(resolve, 600));
      
      let correctedCount = 0;
      let totalPushed = 0;

      for (const userDoc of userSnap.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        // Skip super admins to protect platform safety
        if (
          userData.email === 'marateyh@gmail.com' || 
          userData.email === 'hvrsindustriespvtltd@gmail.com' || 
          userData.role?.toLowerCase() === 'admin'
        ) {
          continue;
        }

        // 1. Sum up all approved submissions
        const userApprovedSubs = activeSubmissions.filter((s: any) => s.workerId === userId && s.status === 'approved');
        const approvedSum = userApprovedSubs.reduce((acc: number, cur: any) => acc + (parseFloat(cur.earningAmount) || 0), 0);

        // 2. Welcome bonus incentive logic
        const welcomeIncentive = userData.firstTaskDone ? (parseFloat(userData.incentiveAmount) || 0) : 0;

        // 3. Sum up all withdrawals that are paid or pending (deducted initially)
        const userWithdrawals = activeWithdrawals.filter((w: any) => w.uid === userId && (w.status === 'paid' || w.status === 'pending'));
        const withdrawnSum = userWithdrawals.reduce((acc: number, cur: any) => acc + (parseFloat(cur.amount) || 0), 0);

        // Calculated correct earned balance
        const correctEarned = Math.max(0, approvedSum + welcomeIncentive - withdrawnSum);

        // Calculated pending wallet balance (pending submissions + unrevealed welcome bonus if applicable)
        const pendingSubs = activeSubmissions.filter((s: any) => s.workerId === userId && s.status === 'pending');
        const pendingSum = pendingSubs.reduce((acc: number, cur: any) => acc + (parseFloat(cur.earningAmount) || 0), 0);
        const pendingOnboarding = !userData.firstTaskDone ? (parseFloat(userData.incentiveAmount) || 0) : 0;
        const correctPending = pendingSum + pendingOnboarding;

        const currentWallets = userData.wallets || { earned: 0, pending: 0, bonus: 0, savings: 0 };
        
        const driftEarned = Math.abs((currentWallets.earned || 0) - correctEarned);
        const driftPending = Math.abs((currentWallets.pending || 0) - correctPending);

        const walletsObj = {
          earned: correctEarned,
          pending: correctPending,
          bonus: currentWallets.bonus || 0,
          savings: currentWallets.savings || 0
        };

        const updatePayload: any = {
          wallets: walletsObj
        };

        // Cure basic schema drift
        if (!userData.role) updatePayload.role = "Unassigned";
        if (!userData.venture) updatePayload.venture = "Unassigned";
        if (userData.kycDone === undefined) updatePayload.kycDone = false;

        // If drift is spotted or structure was incomplete, force write correction!
        if (driftEarned > 0.01 || driftPending > 0.01 || !userData.wallets || !userData.role || !userData.venture) {
          correctedCount++;
          log(`Resolved drift: ${userData.name || userId} [Diff: Earned ±₹${driftEarned.toFixed(2)}, Pending ±₹${driftPending.toFixed(2)}]`);
          await updateDoc(doc(db, 'users', userId), updatePayload);
        }
        totalPushed++;
      }

      log(`Ledger check completed. Reconciled ${totalPushed} users. Corrected ${correctedCount} drift anomalies.`);
      await new Promise(resolve => setTimeout(resolve, 800));

      setSyncStep(4);
      log("Updating UI state with synchronized Firestore snapshot...");
      
      try {
        await fetch('/api/admin/users');
      } catch (e) {
        console.warn("Backend cache invalidation in background skipped:", e);
      }
      
      await fetchWorkers();
      log("Platform ledger successfully aligned with Firestore absolute states.");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSyncStep(5);
      toast.success("All workers successfully audited & synchronized!");
    } catch (err: any) {
      console.error(err);
      log(`Error during deep sync: ${err.message || String(err)}`);
      toast.error("Deep sync failed");
    }
  };

  const filteredWorkers = workers.filter(w => {
    if (selectedVenture !== 'All' && w.venture !== selectedVenture) {
      return false;
    }
    const term = searchTerm.toLowerCase().trim();
    return (
      !term ||
      w.name?.toLowerCase().includes(term) || 
      w.phone?.includes(term) ||
      w.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Human Resources</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Manage network access & role progression</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <button
            onClick={runAccurateDeepSync}
            disabled={isSyncing}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#E8B84B] to-[#F59E0B] hover:brightness-110 text-black px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 min-h-[40px] border border-[#E8B84B]/20"
          >
            <ShieldCheck size={14} className={`stroke-[3px] ${isSyncing ? "animate-spin text-black" : ""}`} />
            <span>Accurate Sync</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] hover:bg-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 min-h-[40px]"
          >
            <UserPlus size={14} className="stroke-[3px] text-[#E8B84B]" />
            <span>Add Worker</span>
          </button>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text"
                placeholder="Search by name/phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 bg-[#111111] border border-[#2A2A2A] text-white pl-12 pr-4 py-2.5 rounded-xl text-xs font-bold focus:border-[#E8B84B] transition-colors"
              />
            </div>
            <button
              onClick={fetchWorkers}
              disabled={loading}
              className="p-2.5 bg-[#111111] border border-[#2A2A2A] rounded-xl hover:text-white hover:border-[#E8B84B] transition-all flex items-center justify-center text-gray-500 hover:scale-[1.05] active:scale-95 disabled:opacity-50 min-h-[40px] px-3 gap-1.5"
              title="Synchronize and pull latest data"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-[#E8B84B]" : ""} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Sync</span>
            </button>
          </div>
          <div className="flex flex-wrap bg-[#111111] border border-[#2A2A2A] rounded-xl p-1 gap-1">
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
              ) : filteredWorkers.map((worker) => (
                <tr key={worker.id} className="hover:bg-white/[0.01] transition-colors text-sm">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 flex items-center justify-center text-[#E8B84B] font-bold shadow-lg">
                        {worker.name?.charAt(0) || '?'}
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
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-0.5">{worker.role || 'Unassigned'}</span>
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
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openWorkerDetail(worker)}
                        className="px-3 py-1.5 hover:bg-[#E8B84B]/10 hover:text-[#E8B84B] rounded-lg text-gray-400 transition-all font-bold text-xs flex items-center gap-1"
                      >
                         Manage <ChevronRight size={14} />
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
              className="fixed inset-y-0 right-0 w-full max-w-md bg-[#111111] border-l border-[#2A2A2A] z-[70] p-6 md:p-8 shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-[#E8B84B] uppercase tracking-tighter">Worker Profile</h3>
                <button onClick={() => setSelectedWorker(null)} className="p-2 hover:bg-white/5 rounded-full text-gray-500"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                {/* Profile Hub */}
                <div className="flex flex-col items-center text-center pb-6 border-b border-[#2A2A2A] relative">
                   <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className="absolute top-0 right-0 p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit size={16} />
                  </button>

                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-[32px] bg-[#E8B84B] flex items-center justify-center text-black text-3xl md:text-4xl font-black shadow-2xl shadow-[#E8B84B]/20 mb-4">
                    {selectedWorker.name?.charAt(0) || '?'}
                  </div>
                  
                  {isEditing ? (
                    <div className="w-full space-y-3 px-4">
                      <input 
                        type="text" 
                        value={editForm.name} 
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-3 py-2 rounded-lg text-sm text-center font-bold"
                        placeholder="Full Name"
                      />
                      <input 
                        type="text" 
                        value={editForm.phone} 
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-3 py-2 rounded-lg text-sm text-center font-bold"
                        placeholder="Phone Number"
                      />
                      <div className="flex gap-2">
                        <select 
                          value={editForm.venture} 
                          onChange={(e) => setEditForm({...editForm, venture: e.target.value})}
                          className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] text-white px-3 py-2 rounded-lg text-xs font-bold"
                        >
                          <option value="">Select Venture</option>
                          {realVentures.map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                        <input 
                          type="text" 
                          value={editForm.role} 
                          onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                          className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] text-white px-3 py-2 rounded-lg text-xs text-center font-bold"
                          placeholder="Role (e.g. Promoter)"
                        />
                      </div>
                      <button 
                        onClick={handleUpdateWorker}
                        className="w-full flex items-center justify-center gap-2 bg-[#10B981] text-black font-bold uppercase tracking-widest text-[10px] py-2 rounded-lg hover:brightness-110 transition-all mt-2"
                      >
                        <Save size={14} /> Save Changes
                      </button>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">{selectedWorker.name}</h4>
                      <div className="mt-2 flex flex-wrap justify-center items-center gap-2 text-gray-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                        <span className="bg-[#1A1A1A] px-3 py-1 rounded-full border border-white/5">{selectedWorker.venture}</span>
                        <span className="p-1 w-1 h-1 bg-[#2A2A2A] rounded-full"></span>
                        <span className="bg-[#1A1A1A] px-3 py-1 rounded-full border border-white/5">{selectedWorker.role || 'Unassigned'}</span>
                        {selectedWorker.level && (
                          <>
                            <span className="p-1 w-1 h-1 bg-[#2A2A2A] rounded-full"></span>
                            <span className="bg-[#1A1A1A] px-3 py-1 rounded-full border border-white/5">{selectedWorker.level}</span>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Details List */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="p-3 md:p-4 bg-[#1A1A1A] rounded-2xl border border-white/5">
                    <p className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5 md:gap-2">
                      <Phone size={10} className="text-[#E8B84B]" /> Phone
                    </p>
                    <p className="text-xs md:text-sm font-black text-white mt-1 break-all">{selectedWorker.phone}</p>
                  </div>
                  <div className="p-3 md:p-4 bg-[#1A1A1A] rounded-2xl border border-white/5">
                    <p className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5 md:gap-2">
                      <Calendar size={10} className="text-[#E8B84B]" /> Joined
                    </p>
                    <p className="text-xs md:text-sm font-black text-white mt-1">
                      {safeFormatDate(selectedWorker.joinedAt)}
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-[#1A1A1A] rounded-2xl border border-white/5">
                    <p className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5 md:gap-2">
                      <Layers size={10} className="text-[#E8B84B]" /> KYC Status
                    </p>
                    <p className="text-xs md:text-sm font-black text-[#10B981] mt-1">{selectedWorker.kycDone ? 'VERIFIED' : 'PENDING'}</p>
                  </div>
                  <div className="p-3 md:p-4 bg-[#1A1A1A] rounded-2xl border border-white/5">
                    <p className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5 md:gap-2">
                      <ShieldCheck size={10} className="text-[#E8B84B]" /> Device ID
                    </p>
                    <p className="text-[9px] md:text-[10px] font-mono text-gray-400 mt-1 truncate">{selectedWorker.deviceFingerprint || 'Unknown'}</p>
                  </div>
                </div>

                {/* Wallet Balance */}
                <div className="bg-gradient-to-br from-[#10B981]/20 to-transparent border border-[#10B981]/10 p-5 md:p-6 rounded-2xl md:rounded-[32px] flex items-center justify-between">
                  <div>
                    <p className="text-[9px] md:text-[10px] text-[#10B981] font-black uppercase tracking-widest opacity-80 mb-1">Total Earned</p>
                    <h5 className="text-2xl md:text-3xl font-black text-white tracking-widest">{formatCurrency(selectedWorker.wallets?.earned || 0)}</h5>
                  </div>
                  <Wallet size={32} className="text-[#10B981] opacity-20 md:w-10 md:h-10" />
                </div>

                {/* Manual Wallet Adjustment Action */}
                <div className="space-y-3 md:space-y-4 pt-4 border-t border-[#2A2A2A]">
                  <h5 className="text-xs md:text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Zap size={14} className="text-[#E8B84B]" /> Manual Wallet Adjustment
                  </h5>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="number"
                      placeholder="Enter amount ₹"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      className="flex-1 bg-black border border-[#2A2A2A] text-white px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-black focus:border-[#E8B84B] transition-colors"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleManualAdjustment(true)}
                        className="flex-1 sm:flex-none bg-[#10B981] text-black px-3 md:px-4 py-2 md:py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
                      >
                        Credit
                      </button>
                      <button 
                        onClick={() => handleManualAdjustment(false)}
                        className="flex-1 sm:flex-none bg-[#EF4444] text-white px-3 md:px-4 py-2 md:py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Adjusted amount will reflect in worker's Earned Wallet.</p>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-6 md:pt-8 border-t border-[#2A2A2A]">
                  <button 
                    onClick={() => {
                      toggleUserStatus(selectedWorker);
                    }}
                    className={`flex-1 border py-3 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors ${
                      selectedWorker.status === 'suspended'
                      ? 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/20'
                      : 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444] hover:bg-[#EF4444]/20'
                    }`}
                  >
                    {selectedWorker.status === 'suspended' ? 'ACTIVATE WORKER' : 'BAN WORKER'}
                  </button>
                  <button 
                    onClick={() => deleteUser(selectedWorker.id, selectedWorker.phone)}
                    className="flex-1 border border-red-500/20 bg-red-500/10 text-red-500 py-3 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} /> DELETE ACCOUNT
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AddWorkerModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          fetchWorkers();
        }} 
      />

      {/* Accurate Sync Progress Modal */}
      <AnimatePresence>
        {isSyncing && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[90]"
            />
            <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-[32px] p-6 md:p-8 shadow-2xl relative overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#E8B84B] via-[#10B981] to-[#E8B84B]" />
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8B84B]/10 border border-[#E8B84B]/20 flex items-center justify-center text-[#E8B84B]">
                    <Activity className="animate-pulse" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Accurate Deep Sync</h3>
                    <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest mt-0.5">Real-time ledger audit & schema alignment</p>
                  </div>
                </div>

                {/* Steps Progress */}
                <div className="space-y-4 mb-6">
                  {[
                    { label: "User Accounts Scan", desc: "Scan, index, and load worker directory" },
                    { label: "Missions & Submissions Audit", desc: "Tally historical task proof states" },
                    { label: "Treasury Ledger Reconcile", desc: "Audit earnings & payout balances" },
                    { label: "Database Sync & Patch", desc: "Resolve state drift & write corrections" }
                  ].map((step, idx) => {
                    const isDone = syncStep > idx;
                    const isActive = syncStep === idx;
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-2xl border transition-all ${
                          isDone 
                            ? "bg-[#10B981]/5 border-[#10B981]/20 text-[#10B981]" 
                            : isActive 
                            ? "bg-[#E8B84B]/5 border-[#E8B84B]/20 text-[#E8B84B]" 
                            : "bg-white/[0.01] border-white/5 text-gray-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center border ${
                              isDone 
                                ? "border-[#10B981] bg-[#10B981]/10" 
                                : isActive 
                                ? "border-[#E8B84B] bg-[#E8B84B]/10 animate-pulse" 
                                : "border-white/5 bg-white/5"
                            }`}>
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider">{step.label}</p>
                              <p className={`text-[9px] font-bold ${isActive ? 'text-gray-400' : 'text-gray-500'}`}>{step.desc}</p>
                            </div>
                          </div>
                          {isDone ? (
                            <span className="text-[10px] font-black uppercase tracking-widest bg-[#10B981]/10 px-2 py-0.5 rounded-full">OK</span>
                          ) : isActive ? (
                            <div className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8B84B] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E8B84B]"></span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Logging terminal */}
                <div className="bg-black border border-white/5 rounded-2xl p-4 h-36 font-mono text-[9px] overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                  {syncLogs.map((logStr, i) => (
                    <div key={i} className="text-gray-400">
                      <span className="text-gray-600">&gt;</span> {logStr}
                    </div>
                  ))}
                  {syncStep < 4 && (
                    <div className="text-[#E8B84B] animate-pulse">
                      <span className="text-gray-600">&gt;</span> Run deep reconcile calculations...
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Platform Status</span>
                    <p className="text-xs font-black text-white uppercase mt-0.5 flex items-center gap-1.5 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> SECURE
                    </p>
                  </div>
                  {syncStep >= 5 && (
                    <button 
                      onClick={() => setIsSyncing(false)}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#10B981] to-[#059669] text-white hover:brightness-110 rounded-xl text-xs font-black uppercase tracking-widest transition-transform hover:scale-105 active:scale-95"
                    >
                      Understood & Close
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

