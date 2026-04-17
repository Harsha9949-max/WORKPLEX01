import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, Activity, CreditCard, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalWorkers: 0,
    activeToday: 0,
    pendingWithdrawals: 0,
    totalPaid: 0
  });

  const data = [
    { name: '1', earnings: 4000 },
    { name: '5', earnings: 3000 },
    { name: '10', earnings: 2000 },
    { name: '15', earnings: 2780 },
    { name: '20', earnings: 1890 },
    { name: '25', earnings: 2390 },
    { name: '30', earnings: 3490 },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        setStats(prev => ({ ...prev, totalWorkers: usersSnap.size }));
        // Mocking other stats for now
        setStats(prev => ({ ...prev, activeToday: Math.floor(usersSnap.size * 0.4), pendingWithdrawals: 12, totalPaid: 45000 }));
      } catch (error) {
        console.error("Error fetching stats", error);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Workers', value: stats.totalWorkers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { title: 'Active Today', value: stats.activeToday, icon: Activity, color: 'text-green-400', bg: 'bg-green-400/10' },
    { title: 'Pending Withdrawals', value: stats.pendingWithdrawals, icon: CreditCard, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { title: 'Total Paid This Month', value: `₹${stats.totalPaid.toLocaleString()}`, icon: DollarSign, color: 'text-[#E8B84B]', bg: 'bg-[#E8B84B]/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <button className="bg-[#E8B84B] text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#d4a63f] transition-colors">
          Approve Withdrawals
        </button>
        <button className="bg-[#1A1A1A] border border-[#2A2A2A] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#2A2A2A] transition-colors">
          Create Task
        </button>
        <button className="bg-[#1A1A1A] border border-[#2A2A2A] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#2A2A2A] transition-colors">
          Send Announcement
        </button>
      </div>

      {/* Chart */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">Earnings Trends (Last 30 Days)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
              <XAxis dataKey="name" stroke="#6B7280" tick={{fill: '#6B7280'}} axisLine={false} tickLine={false} />
              <YAxis stroke="#6B7280" tick={{fill: '#6B7280'}} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', color: '#fff', borderRadius: '0.5rem' }}
                itemStyle={{ color: '#E8B84B' }}
              />
              <Line type="monotone" dataKey="earnings" stroke="#E8B84B" strokeWidth={3} dot={{ r: 4, fill: '#E8B84B', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
