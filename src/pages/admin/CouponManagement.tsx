import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { 
  Ticket, 
  ToggleLeft, 
  ToggleRight, 
  Eye, 
  Search, 
  History,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/format';

/**
 * Coupon Management Page.
 * Control worker's primary distribution tool.
 */
export default function CouponManagement() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'coupons'));
    const unsub = onSnapshot(q, (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'coupons');
    });

    return () => unsub();
  }, []);

  const toggleCouponStatus = async (coupon: any) => {
    try {
      const newStatus = !coupon.isActive;
      await updateDoc(doc(db, 'coupons', coupon.id), {
        isActive: newStatus,
        expiresAt: newStatus ? Timestamp.fromMillis(Date.now() + 24 * 3600 * 1000) : coupon.expiresAt
      });
      toast.success(`Coupon ${newStatus ? 'Activated' : 'Paused'}`);
    } catch (error) {
      toast.error('Failed to toggle status');
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.workerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Distribution Access</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Control active promo nodes & earnings potential</p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text"
            placeholder="Search coupon/worker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#111111] border border-[#2A2A2A] text-white pl-12 pr-4 py-2.5 rounded-xl text-xs font-bold w-64 focus:border-[#E8B84B] transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-[#111111] animate-pulse rounded-[32px]" />
          ))
        ) : filteredCoupons.length === 0 ? (
          <div className="col-span-full bg-[#111111] border border-[#2A2A2A] rounded-[40px] p-20 flex flex-col items-center text-center">
            <Ticket size={48} className="text-gray-700 mb-6" />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">No Coupons Registered</h3>
            <p className="text-gray-500 text-sm mt-1">Coupons appear here once workers complete onboarding.</p>
          </div>
        ) : filteredCoupons.map((coupon, idx) => (
          <motion.div
            key={coupon.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className={`bg-[#111111] border border-[#2A2A2A] rounded-[32px] p-6 relative overflow-hidden group hover:border-[#E8B84B]/20 transition-all ${!coupon.isActive ? 'opacity-60 grayscale' : ''}`}
          >
            {/* Background Accent */}
            <div className={`absolute -top-12 -right-12 w-24 h-24 blur-3xl rounded-full opacity-20 pointer-events-none ${
              coupon.isActive ? 'bg-[#E8B84B]' : 'bg-gray-500'
            }`} />

            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${coupon.isActive ? 'bg-[#E8B84B]/10 text-[#E8B84B]' : 'bg-white/5 text-gray-500'}`}>
                  <Ticket size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tighter">{coupon.code}</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{coupon.venture}</p>
                </div>
              </div>
              <button 
                onClick={() => toggleCouponStatus(coupon)}
                className={`p-2 rounded-xl transition-all ${
                  coupon.isActive ? 'text-[#10B981]' : 'text-gray-500'
                }`}
              >
                {coupon.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-[#2A2A2A]">
              <div>
                <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Worker</p>
                <p className="text-xs font-black text-white truncate">{coupon.workerName}</p>
              </div>
              <div>
                <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Uses Today</p>
                <p className="text-xs font-black text-white">{coupon.usesToday || 0}</p>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Lifetime Earnings</p>
                <p className="text-sm font-black text-[#10B981]">{formatCurrency(coupon.totalEarned || 0)}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-gray-400 hover:text-white transition-all">
                  <Eye size={16} />
                </button>
                <button className="p-2.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-gray-400 hover:text-white transition-all">
                  <History size={16} />
                </button>
              </div>
            </div>

            {!coupon.isActive && (
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                <div className="bg-black/80 px-4 py-2 rounded-xl border border-white/10 text-[8px] font-black text-white uppercase tracking-widest shadow-2xl">
                  Node Deactivated
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Global Controls */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-[40px] p-8 mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E8B84B]/10 flex items-center justify-center text-[#E8B84B]">
            <TrendingUp size={28} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Coupon Yield Analysis</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Average earnings per active node: <span className="text-[#10B981]">₹245.00</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#E8B84B] bg-[#E8B84B]/10 px-4 py-2 rounded-full border border-[#E8B84B]/20">
            <AlertCircle size={14} /> Total 24h Yield: ₹12,450
          </div>
          <button className="bg-white text-black px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">Reset All Usage</button>
        </div>
      </div>
    </div>
  );
}
