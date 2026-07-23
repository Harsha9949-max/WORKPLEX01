import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { TrendingUp, Users, Target, Activity, ChevronDown, Calendar, ArrowUpRight, Award, Zap } from 'lucide-react';

const mockData = [
  { name: 'Mon', tasks: 400, team: 240, total: 640 },
  { name: 'Tue', tasks: 300, team: 139, total: 439 },
  { name: 'Wed', tasks: 550, team: 980, total: 1530 },
  { name: 'Thu', tasks: 278, team: 390, total: 668 },
  { name: 'Fri', tasks: 189, team: 480, total: 669 },
  { name: 'Sat', tasks: 239, team: 380, total: 619 },
  { name: 'Sun', tasks: 349, team: 430, total: 779 },
];

export default function AnalyticsHub() {
  const { userData } = useAuth();
  const [timeRange, setTimeRange] = useState('7D');

  const totalEarned = userData?.wallets?.earned || 0;
  const networkSize = userData?.networkSize || 0; // fallback if not exist
  const successRate = userData?.successRate || 100; // fallback
  const rankName = totalEarned >= 5000 ? 'Gold Pro' : totalEarned >= 2500 ? 'Silver Creator' : 'Bronze Explorer';

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 md:pb-0 font-sans text-white md:p-8">
      <div className="p-4 md:p-0 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Activity className="text-indigo-500" /> Performance Analytics
            </h1>
            <p className="text-sm text-gray-400 font-medium mt-1">Track your growth, task completion, and network performance.</p>
          </div>
          
          <div className="flex bg-[#111111] border border-[#2A2A2A] rounded-xl overflow-hidden p-1">
            {['7D', '1M', '3M', 'ALL'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition ${timeRange === range ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <TrendingUp size={20} className="text-indigo-400 mb-3" />
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Earned</p>
            <p className="text-2xl font-black text-white flex items-center gap-2">
              Rs. {totalEarned.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <Users size={20} className="text-pink-400 mb-3" />
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Network Size</p>
            <p className="text-2xl font-black text-white flex items-center gap-2">
              {networkSize}
            </p>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <Target size={20} className="text-emerald-400 mb-3" />
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Task Success Rate</p>
            <p className="text-2xl font-black text-white">{successRate}%</p>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <Award size={20} className="text-amber-400 mb-3" />
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Current Rank</p>
            <p className="text-xl font-black text-[#F59E0B] uppercase">{rankName}</p>
          </div>
        </div>

        {/* Main Charts Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue Over Time */}
          <div className="lg:col-span-2 bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black uppercase text-white">Revenue Trajectory</h3>
                <p className="text-xs text-gray-500 font-medium">Combined task & network earnings</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Team</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-pink-500"></span> Tasks</span>
              </div>
            </div>
            
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTeam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#333" tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#333" tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderRadius: '12px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="team" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTeam)" />
                  <Area type="monotone" dataKey="tasks" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Engagement Breakdown */}
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black uppercase text-white mb-1">Engagement Breakdown</h3>
              <p className="text-xs text-gray-500 font-medium mb-6">Where your earnings come from</p>
            </div>
            
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockData.slice(0, 5)}>
                  <XAxis dataKey="name" stroke="#333" tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#1A1A1A'}}
                    contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderRadius: '8px' }}
                  />
                  <Bar dataKey="total" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
               <div className="flex justify-between items-center bg-[#1A1A1A] p-3 rounded-xl">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-pink-500"></span> Content Tasks
                 </span>
                 <span className="text-sm font-black text-white">42%</span>
               </div>
               <div className="flex justify-between items-center bg-[#1A1A1A] p-3 rounded-xl">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Network Overrides
                 </span>
                 <span className="text-sm font-black text-white">38%</span>
               </div>
               <div className="flex justify-between items-center bg-[#1A1A1A] p-3 rounded-xl">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Direct Sales
                 </span>
                 <span className="text-sm font-black text-white">20%</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
