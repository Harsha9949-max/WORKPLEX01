import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { UserPlus, Shield, X, Mail, Layers, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Sub-Admin Creation Page.
 * Super Admin tool to delegate venture management.
 */
export default function SubAdminCreation() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [form, setForm] = useState({
    email: '',
    uid: '',
    role: 'SubAdmin' as const,
    assignedVentures: [] as string[]
  });

  const ventures = ['BuyRix', 'Vyuma', 'Zaestify', 'Growplex'];

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const snap = await getDocs(collection(db, 'admins'));
      setAdmins(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'admins');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.uid || form.assignedVentures.length === 0) {
      toast.error('Complete all fields and assign at least one venture');
      return;
    }

    try {
      await setDoc(doc(db, 'admins', form.uid), {
        email: form.email,
        role: form.role,
        assignedVentures: form.assignedVentures,
        createdAt: serverTimestamp()
      });
      toast.success('Sub-Admin access granted! 🛡️');
      setForm({ email: '', uid: '', role: 'SubAdmin', assignedVentures: [] });
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to create sub-admin');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Revoke admin access? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'admins', id));
      toast.success('Access revoked');
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to revoke access');
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter text-center sm:text-left">Governance Delegation</h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1 text-center sm:text-left">Appoint sub-admins to manage specific ventures</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Creation Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#111111] border border-[#2A2A2A] rounded-[40px] p-10 h-fit"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-[#E8B84B]/10 text-[#E8B84B] rounded-2xl">
              <UserPlus size={24} />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Grant Payout Authority</h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Mail size={12} className="text-[#E8B84B]" /> Admin Email Address
              </label>
              <input 
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-5 py-4 rounded-2xl focus:border-[#E8B84B] outline-none text-sm font-bold"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Shield size={12} className="text-[#E8B84B]" /> Firebase UID
              </label>
              <input 
                type="text"
                placeholder="User-specific unique identifier"
                value={form.uid}
                onChange={e => setForm({...form, uid: e.target.value})}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-5 py-4 rounded-2xl focus:border-[#E8B84B] outline-none text-xs font-mono"
                required
              />
              <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-1 ml-1 px-2 py-1 bg-white/5 rounded-lg w-fit italic">
                Get this from Worker Management Profile
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Layers size={12} className="text-[#E8B84B]" /> Assign Ventures
              </label>
              <div className="flex flex-wrap gap-2">
                {ventures.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      const updated = form.assignedVentures.includes(v)
                        ? form.assignedVentures.filter(item => item !== v)
                        : [...form.assignedVentures, v];
                      setForm({...form, assignedVentures: updated});
                    }}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      form.assignedVentures.includes(v)
                        ? 'bg-[#E8B84B] border-[#E8B84B] text-black shadow-lg shadow-[#E8B84B]/20'
                        : 'bg-black border-[#2A2A2A] text-gray-500 hover:border-gray-600'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <button 
                type="submit"
                className="w-full bg-white text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-2xl flex items-center justify-center gap-2 group"
              >
                Appoint Sub-Admin <Shield size={16} className="group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </form>
        </motion.div>

        {/* Admin List */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-[#2A2A2A] pb-4 px-2">Current Hierarchy</h3>
          
          <div className="space-y-4">
            {loading ? (
              <div className="h-20 bg-[#111111] animate-pulse rounded-3xl" />
            ) : admins.length === 0 ? (
              <div className="p-10 text-center bg-[#111111] rounded-[40px] border border-[#2A2A2A]">
                <p className="text-xs font-black text-gray-600 uppercase tracking-widest italic">No sub-admins appointed.</p>
              </div>
            ) : admins.map(admin => (
              <motion.div 
                key={admin.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-[32px] flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8B84B]/10 text-[#E8B84B] flex items-center justify-center font-black">
                    {admin.email?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">{admin.email}</h4>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {admin.assignedVentures?.map((v: string) => (
                        <span key={v} className="text-[8px] font-black text-[#E8B84B] uppercase tracking-widest">#{v}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest mb-0.5">Role</p>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">{admin.role}</p>
                  </div>
                  {admin.email !== 'marateyh@gmail.com' && (
                    <button 
                      onClick={() => handleDelete(admin.id)}
                      className="p-3 bg-[#EF4444]/10 text-[#EF4444] rounded-xl border border-[#EF4444]/10 hover:bg-[#EF4444]/20 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-[#10B981]/5 border border-[#10B981]/10 p-6 rounded-[32px] flex items-center gap-4">
            <div className="p-3 bg-[#10B981]/10 text-[#10B981] rounded-2xl">
              <Check size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest mb-1">Sub-Admin Restriction Active</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                Sub-Admins are automatically limited to ₹500 approval per worker and cannot access Sub-Admin management or Fraud Ban protocols.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
