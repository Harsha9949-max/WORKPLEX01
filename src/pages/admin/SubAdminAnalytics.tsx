import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function SubAdminAnalytics({ venture }: { venture: string }) {
   
   // Dummy Data for charts
   const revenueData = [
      { name: 'Mon', amount: 1200 },
      { name: 'Tue', amount: 1900 },
      { name: 'Wed', amount: 1500 },
      { name: 'Thu', amount: 2200 },
      { name: 'Fri', amount: 2800 },
      { name: 'Sat', amount: 3500 },
      { name: 'Sun', amount: 3100 },
   ];

   const earnersData = [
      { name: 'Rahul', earned: 4500 },
      { name: 'Priya', earned: 3800 },
      { name: 'Amit', earned: 3200 },
      { name: 'Sneha', earned: 2900 },
   ];

   return (
      <div className="space-y-6 pb-12">
         <div className="flex justify-between items-center bg-[#111111] p-4 rounded-2xl border border-[#2A2A2A]">
            <div>
               <h2 className="text-xl font-black text-white uppercase tracking-tight">{venture} Analytics</h2>
               <p className="text-xs text-gray-400 font-medium">Performance overview</p>
            </div>
            <select className="bg-[#1A1A1A] border border-[#2A2A2A] text-white text-xs px-3 py-2 rounded-lg outline-none">
               <option>Last 7 Days</option>
               <option>This Month</option>
            </select>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
               { label: 'Total Workers', value: '42' },
               { label: 'Active This Week', value: '18', color: 'text-[#10B981]' },
               { label: 'Tasks Completed', value: '156' },
               { label: 'Paid This Month', value: 'Rs.12,450', color: 'text-[#F59E0B]' },
            ].map((stat, i) => (
               <div key={i} className="bg-[#111111] border border-[#2A2A2A] p-4 rounded-2xl flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</span>
                  <span className={`text-2xl font-black ${stat.color || 'text-white'}`}>{stat.value}</span>
               </div>
            ))}
         </div>

         <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-[#111111] border border-[#2A2A2A] p-4 rounded-2xl h-80">
               <h3 className="text-white font-bold text-sm mb-4">Payout Volume</h3>
               <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={revenueData}>
                     <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                     <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                     <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                        itemStyle={{ color: '#F59E0B', fontWeight: 'bold' }}
                     />
                     <Area type="monotone" dataKey="amount" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>

            <div className="bg-[#111111] border border-[#2A2A2A] p-4 rounded-2xl h-80">
               <h3 className="text-white font-bold text-sm mb-4">Top Earners</h3>
               <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={earnersData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" horizontal={false} />
                     <XAxis type="number" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                     <YAxis dataKey="name" type="category" stroke="#bbb" fontSize={12} tickLine={false} axisLine={false} width={60} />
                     <Tooltip 
                        cursor={{fill: '#222'}} 
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                     />
                     <Bar dataKey="earned" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
   );
}
