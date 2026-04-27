import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Tag } from 'lucide-react';

export default function SubAdminCoupons({ venture, subAdminId }: { venture: string, subAdminId: string }) {
   const [coupons, setCoupons] = useState<any[]>([]);

   useEffect(() => {
      if (!venture) return;
      const q = query(collection(db, 'coupons'), where('venture', '==', venture));
      const unsubscribe = onSnapshot(q, (snapshot) => {
         setCoupons(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubscribe();
   }, [venture]);

   const toggleCoupon = async (couponId: string, currentStatus: boolean) => {
      try {
         await updateDoc(doc(db, 'coupons', couponId), {
            isActive: !currentStatus,
            [currentStatus ? 'deactivatedAt' : 'activatedAt']: serverTimestamp()
         });
         toast.success(currentStatus ? 'Coupon deactivated' : 'Coupon activated!');
      } catch (err) {
         toast.error('Failed to update coupon');
      }
   };

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center bg-[#111111] p-4 rounded-2xl border border-[#2A2A2A]">
            <div>
               <h2 className="text-xl font-black text-white uppercase tracking-tight">Coupon Management</h2>
               <p className="text-xs text-gray-400 font-medium">Activate codes for {venture} workers</p>
            </div>
         </div>

         <div className="grid gap-4">
            {coupons.map(coupon => (
               <div key={coupon.id} className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#1A1A1A] rounded-xl flex items-center justify-center border border-[#2A2A2A]">
                        <Tag size={20} className="text-[#00C9A7]" />
                     </div>
                     <div>
                        <div className="flex items-center gap-2">
                           <span className="font-mono font-bold text-white tracking-widest">{coupon.code || coupon.id.substring(0, 8).toUpperCase()}</span>
                           <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${coupon.isActive ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-red-500/20 text-red-500'}`}>
                              {coupon.isActive ? 'Active' : 'Inactive'}
                           </span>
                        </div>
                        <span className="text-xs text-gray-400">Worker: {coupon.workerName || 'Unknown'}</span>
                     </div>
                  </div>

                  <div className="flex items-center gap-6">
                     <div className="flex flex-col text-center">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Used Today</span>
                        <span className="text-lg font-black text-white">{coupon.usedToday || 0}</span>
                     </div>
                     <div className="flex flex-col text-center border-l border-[#2A2A2A] pl-6">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Earned</span>
                        <span className="text-lg font-black text-[#00C9A7]">Rs.{coupon.totalCommission || 0}</span>
                     </div>

                     <div className="flex flex-col gap-2 border-l border-[#2A2A2A] pl-6 ml-2">
                        <button 
                           onClick={() => toggleCoupon(coupon.id, coupon.isActive)}
                           className={`text-xs font-bold uppercase px-4 py-2 rounded-lg transition ${coupon.isActive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20'}`}
                        >
                           {coupon.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="text-[10px] text-gray-400 hover:text-white uppercase font-bold tracking-widest">
                           View Usage
                        </button>
                     </div>
                  </div>
               </div>
            ))}
            {coupons.length === 0 && (
               <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-12 text-center text-gray-500">
                  No coupons found for {venture}.
               </div>
            )}
         </div>
      </div>
   );
}
