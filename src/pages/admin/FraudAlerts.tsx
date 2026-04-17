import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { 
  ShieldAlert, 
  UserX, 
  Trash2, 
  History, 
  Smartphone, 
  Fingerprint, 
  AlertCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

/**
 * Fraud Alerts Management.
 * Monitoring and resolving security flags.
 */
export default function FraudAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'fraudAlerts'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fraudAlerts');
    });

    return () => unsub();
  }, []);

  const handleAction = async (alert: any, action: 'dismiss' | 'suspend' | 'ban') => {
    try {
      if (action === 'dismiss') {
        await updateDoc(doc(db, 'fraudAlerts', alert.id), { status: 'dismissed' });
        toast.success('Alert dismissed');
      } else if (action === 'suspend') {
        await updateDoc(doc(db, 'users', alert.workerId), { status: 'suspended' });
        await updateDoc(doc(db, 'fraudAlerts', alert.id), { status: 'resolved_suspended' });
        toast.success('Worker account suspended');
      } else if (action === 'ban') {
        // Permanent Ban Logic
        await updateDoc(doc(db, 'users', alert.workerId), { status: 'suspended', isBanned: true });
        await updateDoc(doc(db, 'fraudAlerts', alert.id), { status: 'resolved_banned' });
        toast.success('Worker permanently banned');
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const pendingAlerts = alerts.filter(a => a.status === 'pending');

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Security Perimeter</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Monitor & mitigate platform abuse in real-time</p>
        </div>

        <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 px-5 py-3 rounded-2xl flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-[#EF4444] font-black uppercase tracking-widest">Active Flags</p>
            <p className="text-sm font-black text-white">{pendingAlerts.length} Threats</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EF4444]/20 flex items-center justify-center text-[#EF4444]">
            <Zap size={16} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="h-64 bg-[#111111] animate-pulse rounded-[40px]" />
        ) : pendingAlerts.length === 0 ? (
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-[40px] p-20 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-[32px] flex items-center justify-center text-green-500 mb-6">
              <ShieldCheck size={40} />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Perimeter Secure</h3>
            <p className="text-gray-500 text-sm mt-1">No unresolved fraud alerts detected.</p>
          </div>
        ) : (
          pendingAlerts.map((alert, idx) => (
            <motion.div 
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#111111] border border-[#EF4444]/20 rounded-[40px] p-8 flex flex-col lg:flex-row items-center justify-between gap-10 group hover:border-[#EF4444]/40 transition-all relative overflow-hidden"
            >
              {/* Alert Ribbon */}
              <div className="absolute top-0 left-0 w-1 h-full bg-[#EF4444]" />

              <div className="flex items-center gap-10 flex-1">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-[#EF4444]/10 rounded-[32px] flex items-center justify-center relative shadow-2xl shadow-[#EF4444]/10 group-hover:scale-105 transition-transform">
                    <ShieldAlert size={36} className="text-[#EF4444]" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full border-4 border-[#111111] animate-pulse"></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                      High Sensitivity Flag <span className="text-[10px] bg-red-600 text-white px-3 py-1 rounded-full">{alert.fraudScore?.toFixed(0)}% Match</span>
                    </h4>
                    <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-tight">Worker ID: <span className="text-white font-black">{alert.workerId || 'Anonymized'}</span></p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {alert.indicators?.map((ind: string) => (
                      <span key={ind} className="px-3 py-1.5 bg-black rounded-lg border border-[#2A2A2A] text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        {ind === 'Multiple Devices' ? <Smartphone size={10} /> : <Fingerprint size={10} />}
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-[#2A2A2A] pt-8 lg:pt-0 lg:pl-10">
                <div className="text-center hidden xl:block">
                  <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Flagged At</p>
                  <p className="text-xs font-black text-white uppercase">{alert.createdAt ? format(alert.createdAt.toDate(), 'HH:mm | dd MMM') : 'N/A'}</p>
                </div>

                <div className="flex items-center gap-3 flex-1 lg:flex-none">
                  <button 
                    onClick={() => handleAction(alert, 'dismiss')}
                    className="flex-1 lg:flex-none px-6 py-3 bg-[#1A1A1A] text-gray-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Dismiss
                  </button>
                  <button 
                    onClick={() => handleAction(alert, 'suspend')}
                    className="flex-1 lg:flex-none px-6 py-3 bg-[#E8B84B]/10 text-[#E8B84B] border border-[#E8B84B]/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E8B84B]/20 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={16} /> Suspend
                  </button>
                  <button 
                    onClick={() => handleAction(alert, 'ban')}
                    className="flex-1 lg:flex-none px-6 py-3 bg-[#EF4444] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl shadow-[#EF4444]/20 flex items-center justify-center gap-2"
                  >
                    <UserX size={16} /> Permanent Ban
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Global Safety Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        <div className="bg-[#111111] border border-[#2A2A2A] p-8 rounded-[40px] flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Smartphone size={28} />
          </div>
          <div>
            <h4 className="text-lg font-black text-white uppercase tracking-tighter">Device Proliferation</h4>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Average 1.4 devices per active worker.</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-[#2A2A2A] p-8 rounded-[40px] flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
            <AlertCircle size={28} />
          </div>
          <div>
            <h4 className="text-lg font-black text-white uppercase tracking-tighter">Self-Promotion Attempts</h4>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Blocked 45 attempts this hour.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
