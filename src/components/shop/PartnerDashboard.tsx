import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  TrendingUp, 
  Package, 
  Timer, 
  ExternalLink, 
  DollarSign, 
  Share2,
  ChevronRight,
  Plus,
  Settings,
  ArrowUpRight,
  Briefcase
} from 'lucide-react';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';

export default function PartnerDashboard() {
  const { userData, currentUser } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingMargin: 0,
    activeProducts: 0
  });

  useEffect(() => {
    if (!currentUser) return;

    // 1. Listen to Shop Data
    const unsubShop = onSnapshot(doc(db, 'partnerShops', currentUser.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setShop(data);
        setStats(prev => ({ ...prev, totalSales: data.totalSales || 0 }));
      }
    });

    // 2. Listen to Orders
    if (shop?.shopSlug) {
      const q = query(
        collection(db, 'partnerOrders'), 
        where('shopSlug', '==', shop.shopSlug)
      );
      
      const unsubOrders = onSnapshot(q, (snap) => {
        let orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        orders.sort((a: any, b: any) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;
          return dateB - dateA;
        });
        orders = orders.slice(0, 5);
        
        setRecentOrders(orders);
        
        const pending = (orders as unknown as any[]).reduce((acc, curr) => curr.marginStatus === 'holding' ? acc + (curr.totalPartnerMargin || curr.totalMargin || 0) : acc, 0);
        setStats(prev => ({ ...prev, pendingMargin: pending }));
      });

      return () => {
        unsubShop();
        unsubOrders();
      };
    }

    return () => unsubShop();
  }, [currentUser, shop?.shopSlug]);

  const copyShopLink = () => {
    if (!shop?.shopSlug) return;
    const url = `${window.location.origin}/shop/${shop.shopSlug}`;
    navigator.clipboard.writeText(url);
    toast.success('Shop link copied! 🚀');
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Partner Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Partner Portal</h1>
            <div className="px-2 py-0.5 bg-teal-500 rounded text-[8px] font-black text-black">BETA</div>
          </div>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{shop?.shopName || 'Initializing Store...'}</p>
        </div>
        <button className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-gray-400">
          <Settings size={20} />
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-teal-500 to-teal-700 p-6 rounded-[40px] shadow-xl shadow-teal-500/20 text-black relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <TrendingUp size={48} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Total Sales</p>
          <h2 className="text-3xl font-black tracking-tighter">{formatCurrency(stats.totalSales)}</h2>
          <div className="mt-4 flex items-center gap-1.5 bg-black/10 px-2 py-1 rounded-full w-fit">
            <ArrowUpRight size={12} />
            <span className="text-[8px] font-black uppercase tracking-widest">Store Live</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-[#111111] p-6 rounded-[40px] border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Timer size={48} className="text-white" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-gray-500">Pending Margin</p>
          <h2 className="text-3xl font-black text-white tracking-tighter">{formatCurrency(stats.pendingMargin)}</h2>
          <p className="mt-2 text-[8px] font-bold text-teal-500/60 uppercase tracking-widest">7-Day Retention</p>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="p-2 bg-white/5 rounded-[40px] border border-white/5 flex gap-2">
        <button 
          onClick={copyShopLink}
          className="flex-1 bg-white p-5 rounded-[32px] flex items-center justify-center gap-3 text-black font-black uppercase tracking-widest text-[10px]"
        >
          <Share2 size={16} /> Share Shop
        </button>
        <button className="flex-1 bg-[#1A1A1A] p-5 rounded-[32px] flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest text-[10px] border border-white/10">
          <Plus size={16} className="text-teal-500" /> Manage Stock
        </button>
      </div>

      {/* Shop Info Card */}
      <div className="bg-[#111111] rounded-[48px] border border-white/5 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={shop?.logo} className="w-16 h-16 rounded-[24px] object-cover border border-white/10 shadow-xl" />
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">{shop?.shopName}</h3>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">/shop/{shop?.shopSlug}</p>
              </div>
            </div>
            <a 
              href={`/shop/${shop?.shopSlug}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-4 bg-teal-500/10 rounded-2xl text-teal-500 hover:bg-teal-500 hover:text-black transition-all"
            >
              <ExternalLink size={20} />
            </a>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {['Active', 'Verified', 'SSL'].map(label => (
              <div key={label} className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mx-auto mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Recent Sales</h3>
          <button className="text-[10px] font-black text-teal-500 uppercase tracking-widest flex items-center gap-1">
            View All <ChevronRight size={12} />
          </button>
        </div>

        <div className="space-y-3">
          {recentOrders.length === 0 ? (
            <div className="bg-[#111111] border border-white/5 rounded-[40px] p-12 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto text-gray-700 mb-4">
                <ShoppingBag size={32} />
              </div>
              <p className="text-xs font-black text-gray-600 uppercase tracking-widest">No sales yet. Start sharing!</p>
            </div>
          ) : (
            recentOrders.map(order => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-[#111111] border border-white/5 p-5 rounded-[32px] flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    order.status === 'delivered' ? 'bg-green-500/10 text-green-500' : 'bg-teal-500/10 text-teal-500'
                  }`}>
                    <Package size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-tight">{order.customerDetails.name}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{order.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-[8px] font-black text-teal-500 uppercase tracking-widest">Profit: {formatCurrency(order.totalPartnerMargin)}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Upgrade Banner */}
      <div className="bg-gradient-to-r from-teal-500/20 to-transparent p-8 rounded-[48px] border border-teal-500/10 flex items-center justify-between">
        <div className="space-y-2">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Scale Your Shop</h3>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest max-w-[200px]">Unlock automated FB ads integration & wholesale inventory.</p>
        </div>
        <div className="w-14 h-14 bg-teal-500 rounded-full flex items-center justify-center text-black">
          <Briefcase size={24} />
        </div>
      </div>
    </div>
  );
}
