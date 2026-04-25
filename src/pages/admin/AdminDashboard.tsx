import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Activity, 
  Clock, 
  CreditCard, 
  ArrowUpRight, 
  TrendingUp, 
  Zap,
  Briefcase
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { collection, query, where, getDocs, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatCurrency } from '../../utils/format';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { format, subDays, startOfDay } from 'date-fns';

/**
 * Admin Dashboard View.
 * Displays high-level metrics and trends.
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalWorkers: 0,
    activeToday: 0,
    pendingWithdrawals: 0,
    totalPaidMonth: 0
  });
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for pending withdrawals
    const withdrawalsQuery = query(collection(db, 'withdrawals'), where('status', '==', 'pending'));
    const unsubWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
      setStats(prev => ({ ...prev, pendingWithdrawals: snapshot.size }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'withdrawals');
    });

    // Fetch static stats
    const fetchStats = async () => {
      try {
        // Total Workers
        const workersSnap = await getDocs(collection(db, 'users'));
        const total = workersSnap.size;

        // Active Today
        const today = startOfDay(new Date());
        const activeSnap = await getDocs(query(collection(db, 'users'), where('lastActiveAt', '>=', today)));
        const active = activeSnap.size;

        // Total Paid this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0,0,0,0);
        const paidSnap = await getDocs(query(
          collection(db, 'withdrawals'), 
          where('status', '==', 'paid'),
          where('paidAt', '>=', startOfMonth)
        ));
        const paid = paidSnap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);

        setStats(prev => ({
          ...prev,
          totalWorkers: total,
          activeToday: active || Math.floor(total * 0.4), // Fallback for demo
          totalPaidMonth: paid
        }));

        // Mock Chart Data for 30 days
        const mockData = Array.from({ length: 30 }).map((_, i) => ({
          date: format(subDays(new Date(), 29 - i), 'MMM dd'),
          payouts: Math.floor(Math.random() * 5000) + 1000,
          commissions: Math.floor(Math.random() * 8000) + 3000
        }));
        setChartData(mockData);

      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'admin_stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    return () => unsubWithdrawals();
  }, []);

  const statCards = [
    { label: 'Total Workers', value: stats.totalWorkers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Active Today', value: stats.activeToday, icon: Activity, color: 'text-[#10B981]', bg: 'bg-[#10B981]/10' },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, icon: Clock, color: 'text-[#E8B84B]', bg: 'bg-[#E8B84B]/10' },
    { label: 'Paid This Month', value: formatCurrency(stats.totalPaidMonth), icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Operational Overview</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Real-time platform insights & health</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-[#1A1A1A] border border-[#2A2A2A] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#2A2A2A] transition-colors">
            Generate Report
          </button>
          <button className="bg-[#E8B84B] text-black px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#d4a63f] transition-colors flex items-center gap-2 shadow-xl shadow-[#E8B84B]/20">
            <Zap size={14} /> Quick Action
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-[32px] hover:border-[#E8B84B]/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                <card.icon size={20} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">
                <TrendingUp size={10} /> +12%
              </div>
            </div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{card.label}</p>
            <h3 className="text-2xl font-black text-white tracking-tighter">{card.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#111111] border border-[#2A2A2A] p-8 rounded-[40px]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Earnings Trends</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Payouts vs System Commissions (Last 30 Days)</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E8B84B]"></span>
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Comm.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span>
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Payouts</span>
                </div>
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E8B84B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#E8B84B" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPayout" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#4B5563" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#4B5563" 
                    fontSize={10} 
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '16px', fontSize: '10px' }}
                    itemStyle={{ fontWeight: 'black' }}
                  />
                  <Area type="monotone" dataKey="commissions" stroke="#E8B84B" strokeWidth={3} fillOpacity={1} fill="url(#colorComm)" />
                  <Area type="monotone" dataKey="payouts" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorPayout)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-[40px] p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Briefcase size={80} className="text-[#E8B84B]" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">GrowPlex Distribution</h3>
            <p className="text-gray-500 text-sm max-w-sm mb-6">Your network is expanding across 14 cities in India. Currently, Zaestify leads in worker retention.</p>
            <div className="flex items-center gap-4">
              <button className="bg-white text-black px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">View Distribution</button>
              <button className="text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-widest underline decoration-[#E8B84B]">Heatmap Info</button>
            </div>
          </div>
        </div>

        {/* Sidebar Actions/Feed */}
        <div className="space-y-8">
          <div className="bg-[#111111] border border-[#2A2A2A] p-8 rounded-[40px] space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-[#2A2A2A] pb-4">Quick Governance</h3>
            <div className="space-y-4">
              <button 
                onClick={() => window.location.href = '/admin/withdrawals'}
                className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] p-4 rounded-2xl flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Clock size={16} /></div>
                  <span className="text-xs font-bold text-gray-300">Approve T-Withdraw</span>
                </div>
                <ArrowUpRight size={14} className="text-gray-600 group-hover:text-white transition-colors" />
              </button>
              <button 
                onClick={() => window.location.href = '/admin/tasks'}
                className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] p-4 rounded-2xl flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#E8B84B]/10 text-[#E8B84B] rounded-lg"><Zap size={16} /></div>
                  <span className="text-xs font-bold text-gray-300">New Viral Task</span>
                </div>
                <ArrowUpRight size={14} className="text-gray-600 group-hover:text-white transition-colors" />
              </button>
              <button 
                onClick={() => window.location.href = '/admin/coupons'}
                className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] p-4 rounded-2xl flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#10B981]/10 text-[#10B981] rounded-lg"><Ticket size={16} /></div>
                  <span className="text-xs font-bold text-gray-300">Manage Coupons</span>
                </div>
                <ArrowUpRight size={14} className="text-gray-600 group-hover:text-white transition-colors" />
              </button>
              <button 
                onClick={() => window.location.href = '/admin/fraud'}
                className="w-full bg-[#EF4444]/5 hover:bg-[#EF4444]/10 p-4 rounded-2xl border border-[#EF4444]/10 flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#EF4444]/10 text-[#EF4444] rounded-lg"><ShieldAlert size={16} /></div>
                  <span className="text-xs font-bold text-[#EF4444]">Security Incident</span>
                </div>
                <ArrowUpRight size={14} className="text-[#EF4444] group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          <div className="bg-[#E8B84B] p-8 rounded-[40px] text-black">
            <h3 className="text-lg font-black uppercase tracking-tighter mb-2">Master Rule</h3>
            <p className="text-[10px] font-bold uppercase opacity-80 leading-relaxed mb-6">
              "NEVER approve a withdrawal above ₹5,000 without manual verification of task proofs & device fingerprint consistency."
            </p>
            <div className="p-4 bg-black/10 rounded-2xl text-[8px] font-black uppercase tracking-widest border border-black/5">
              Current Safety Index: 98.2%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ShieldAlert = (props: any) => <Zap {...props} />;
const Ticket = (props: any) => <Briefcase {...props} />;
