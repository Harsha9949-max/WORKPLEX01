import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function SubAdminWithdrawals({ venture, subAdminId }: { venture: string, subAdminId: string }) {
   const [withdrawals, setWithdrawals] = useState<any[]>([]);
   const [filter, setFilter] = useState('pending'); // pending, approved, rejected
   const [todayApproved, setTodayApproved] = useState(0);

   useEffect(() => {
      if (!venture) return;
      const q = query(collection(db, 'withdrawals'), where('venture', '==', venture));
      const unsubscribe = onSnapshot(q, (snapshot) => {
         const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
         setWithdrawals(list);
         
         // Calculate simple daily approved for this SubAdmin (dummy calculation for now)
         const approvedAmt = list.filter(w => w.status === 'approved' && w.approvedBy === subAdminId).reduce((sum, w) => sum + (w.amount || 0), 0);
         setTodayApproved(approvedAmt);
      });
      return () => unsubscribe();
   }, [venture, subAdminId]);

   const filteredWithdrawals = withdrawals.filter(w => w.status === filter);

   const handleApprove = async (withdrawal: any) => {
      try {
         await updateDoc(doc(db, 'withdrawals', withdrawal.id), {
            status: 'approved',
            approvedBy: subAdminId,
            approvedAt: serverTimestamp(),
            approvedBySubAdmin: true
         });

         // In real app, trigger logic to deduct from wallet
         toast.success(`Withdrawal of Rs.${withdrawal.amount} approved!`);
      } catch (err) {
         toast.error('Failed to approve withdrawal');
      }
   };

   const handleForwardToAdmin = async (withdrawal: any) => {
      try {
         await updateDoc(doc(db, 'withdrawals', withdrawal.id), {
            status: 'forwarded_to_admin',
            forwardedBy: subAdminId,
            forwardedAt: serverTimestamp()
         });
         toast.success('Forwarded to main admin successfully.');
      } catch (err) {
         toast.error('Failed to forward');
      }
   };

   const handleReject = async (withdrawalId: string) => {
      try {
         await updateDoc(doc(db, 'withdrawals', withdrawalId), {
            status: 'rejected',
            rejectedBy: subAdminId,
            rejectedAt: serverTimestamp()
         });
         toast.success('Withdrawal rejected. Funds returned to worker (dummy).');
      } catch (err) {
         toast.error('Failed to reject');
      }
   };

   return (
      <div className="space-y-6">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111111] p-4 rounded-2xl border border-[#2A2A2A]">
            <div>
               <h2 className="text-xl font-black text-white uppercase tracking-tight">Withdrawal Requests</h2>
               <p className="text-xs text-gray-400 font-medium italic">You can approve up to Rs.500 per request</p>
            </div>
            <div className="bg-[#1A1A1A] px-4 py-2 rounded-xl border border-[#F59E0B]/30 min-w-[200px]">
               <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  <span>Your approved today</span>
                  <span className="text-[#F59E0B]">Rs.{todayApproved} / Rs.500 limit</span>
               </div>
               <div className="w-full h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <div className="h-full bg-[#F59E0B]" style={{ width: `${Math.min((todayApproved / 500) * 100, 100)}%` }}></div>
               </div>
            </div>
         </div>

         <div className="flex gap-2">
            {['pending', 'approved', 'rejected', 'forwarded_to_admin'].map(tab => (
               <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition ${filter === tab ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40' : 'bg-[#111111] border border-[#2A2A2A] text-gray-500 hover:text-gray-300'}`}
               >
                  {tab.replace(/_/g, ' ')}
               </button>
            ))}
         </div>

         <div className="grid gap-4">
            {filteredWithdrawals.map(w => (
               <div key={w.id} className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                  {w.amount > 500 && w.status === 'pending' && (
                     <div className="absolute top-0 right-0 bg-red-500/20 text-red-500 border-l border-b border-red-500/30 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-bl-lg">
                        ⚠️ Above your limit
                     </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                     <div className="w-12 h-12 bg-[#1A1A1A] rounded-full border border-[#2A2A2A] flex items-center justify-center font-bold text-[#10B981]">
                        {w.workerName?.charAt(0) || w.userId?.charAt(0) || 'U'}
                     </div>
                     <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-white text-lg">{w.workerName || 'Unknown Worker'}</span>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">Role: {w.workerRole || 'Worker'} | {w.venture || venture}</span>
                        <div className="mt-2 text-[11px] font-mono text-gray-500">UPI: {w.upiId || 'Not provided'}</div>
                     </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                     <div className="text-2xl font-black text-white">Rs.{w.amount}</div>
                     {w.status === 'pending' && (
                        <div className="flex gap-2">
                           <button onClick={() => handleReject(w.id)} className="text-[10px] bg-[#1A1A1A] font-bold text-red-500 uppercase px-4 py-2 rounded-lg hover:bg-red-500/10 transition">Reject</button>
                           {w.amount <= 500 ? (
                              <button onClick={() => handleApprove(w)} className="text-[10px] bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981] font-black uppercase px-6 py-2 rounded-lg hover:bg-[#10B981]/30 transition">Approve</button>
                           ) : (
                              <button onClick={() => handleForwardToAdmin(w)} className="text-[10px] bg-[#F59E0B]/20 border border-[#F59E0B]/30 text-[#F59E0B] font-black uppercase px-4 py-2 rounded-lg hover:bg-[#F59E0B]/30 transition">Forward to Admin</button>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            ))}
            {filteredWithdrawals.length === 0 && (
               <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-12 text-center text-gray-500">
                  No {filter.replace('_', ' ')} withdrawals found.
               </div>
            )}
         </div>
      </div>
   );
}
