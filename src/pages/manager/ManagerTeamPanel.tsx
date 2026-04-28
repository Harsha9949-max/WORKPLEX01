import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore'; // No where for now, to avoid missing index
import { LineChart, Line, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Users, UserCircle, ChevronDown, CheckCircle, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManagerTeamPanel() {
   const { userData, currentUser } = useAuth();
   const [leads, setLeads] = useState<any[]>([]);
   const [activeTab, setActiveTab] = useState('leads'); // 'leads' or 'commission'

   useEffect(() => {
      // Data fetch will be implemented later
   }, []);

   const [chartData, setChartData] = useState<any[]>([]);

   return (
      <div className="min-h-screen bg-[#0A0A0A] pb-24 md:pb-0 font-sans text-white md:p-8">
         <div className="p-4 md:p-0 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
               <div>
                  <h1 className="text-2xl font-black text-white uppercase tracking-tight">Manager Dashboard 💼</h1>
                  <p className="text-sm text-gray-400 font-medium">Managing {leads.length} Lead Marketers</p>
               </div>
            </div>

            <div className="flex border-b border-[#2A2A2A] pb-0">
               {['leads', 'commission'].map(tab => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition ${activeTab === tab ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                  >
                     {tab === 'leads' ? 'My Leads' : 'Commission Log'}
                  </button>
               ))}
            </div>

            {activeTab === 'leads' ? (
               <>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
               <div className="min-w-[150px] bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Leads</p>
                  <p className="text-2xl font-black text-[#7C3AED]">{leads.length}</p>
               </div>
               <div className="min-w-[150px] bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Members</p>
                  <p className="text-2xl font-black text-white">{userData.teamSize || 0}</p>
               </div>
               <div className="min-w-[150px] bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">This Month</p>
                  <p className="text-2xl font-black text-[#F59E0B]">Rs.{userData.managerCommissionThisMonth || 0}</p>
               </div>
               <div className="min-w-[150px] bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">All-Time</p>
                  <p className="text-2xl font-black text-[#00C9A7]">Rs.{userData.totalEarned || 0}</p>
               </div>
            </div>

            <div className="bg-[#111111] border border-[#2A2A2A] p-4 rounded-2xl h-64">
               <h3 className="text-white font-bold text-sm mb-4">My Commission Last 8 Weeks</h3>
               <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={chartData}>
                     <XAxis dataKey="week" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                     <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                        itemStyle={{ color: '#7C3AED', fontWeight: 'bold' }}
                        formatter={(value) => [`Rs.${value}`, "Commission"]}
                     />
                     <Line type="monotone" dataKey="amount" stroke="#7C3AED" strokeWidth={3} dot={{ fill: '#7C3AED', strokeWidth: 2, r: 4 }} />
                  </LineChart>
               </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
               {leads.map(lead => (
                  <div key={lead.id} className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4">
                     <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-[#1A1A1A] rounded-full border border-[#2A2A2A] flex items-center justify-center text-xl">
                           👑
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-lg">{lead.leadName}</span>
                              <span className="text-[9px] font-black uppercase tracking-widest bg-[#7C3AED]/20 text-[#7C3AED] px-2 py-0.5 rounded">Lead</span>
                           </div>
                           <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-black uppercase tracking-widest bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{lead.venture}</span>
                              
                              <span className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                 <span className={`w-2 h-2 rounded-full ${lead.lastActive < 7 ? 'bg-[#10B981]' : lead.lastActive < 20 ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                                 {lead.lastActive}d ago
                              </span>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 rounded-xl flex flex-col justify-center items-center text-center">
                           <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Team Size</span>
                           <span className="text-lg font-black text-white">{lead.teamSize}</span>
                        </div>
                        <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 rounded-xl flex flex-col justify-center items-center text-center">
                           <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Your 3% Comm.</span>
                           <span className="text-lg font-black text-[#F59E0B]">Rs.{lead.yourCommission}</span>
                        </div>
                     </div>

                     <div className="flex gap-2">
                        <button className="flex-1 text-xs bg-[#1A1A1A] font-bold text-gray-300 uppercase px-4 py-3 rounded-xl hover:bg-[#2A2A2A] transition">View Team</button>
                        <button className="flex-1 text-xs bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30 font-black uppercase px-4 py-3 rounded-xl hover:bg-[#7C3AED]/30 transition">Create Task</button>
                     </div>
                  </div>
               ))}
               
               {leads.length === 0 && (
                  <div className="col-span-full bg-[#111111] border border-[#2A2A2A] rounded-2xl p-12 text-center flex flex-col items-center">
                     <AlertTriangle size={40} className="text-gray-600 mb-4" />
                     <p className="text-white font-bold mb-1">No Leads assigned yet</p>
                     <p className="text-sm text-gray-500">Admin will assign Lead Marketers to your management soon.</p>
                  </div>
               )}
                  </div>
               </>
            ) : (
               <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-[#2A2A2A] flex justify-between items-center">
                     <h3 className="font-bold text-white">Commission Log</h3>
                     <select className="bg-[#1A1A1A] border border-[#2A2A2A] text-xs text-white px-3 py-2 rounded outline-none">
                        <option>All Leads</option>
                        <option>BuyRix Leads</option>
                        <option>Vyuma Leads</option>
                     </select>
                  </div>
                  <table className="w-full text-left text-sm text-gray-300">
                     <thead className="text-[10px] text-gray-500 uppercase font-black tracking-widest bg-[#1A1A1A]">
                        <tr>
                           <th className="px-4 py-3">Date</th>
                           <th className="px-4 py-3">Lead / Worker</th>
                           <th className="px-4 py-3">Task Amt</th>
                           <th className="px-4 py-3 text-[#F59E0B]">Your 3%</th>
                           <th className="px-4 py-3">Status</th>
                        </tr>
                     </thead>
                     <tbody>
                        <tr>
                           <td colSpan={5} className="py-12 text-center text-gray-500">
                              <p className="font-bold">No commission records yet</p>
                              <p className="text-xs">Your leads' completions will appear here.</p>
                           </td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            )}
         </div>
         
         <style>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
         `}</style>
      </div>
   );
}
