import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Users, TrendingUp, Activity, DollarSign, Search, MessageCircle, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { formatCurrency } from '../utils/taskUtils';

const donutColors = ['#8B5CF6', '#3B82F6'];

export default function TeamDashboard() {
   const { currentUser, userData } = useAuth();
   const [members, setMembers] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [filter, setFilter] = useState('all');
   const [searchQuery, setSearchQuery] = useState('');

   useEffect(() => {
      if (!currentUser) return;
      
      const unsub = onSnapshot(collection(db, `teams/${currentUser.uid}/members`), (snap) => {
         const m = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         setMembers(m);
         setLoading(false);
      });
      return () => unsub();
   }, [currentUser]);

   const activeMembers = members.filter(m => m.isActive);
   const l1Count = members.filter(m => m.level === 1).length;
   const l2Count = members.filter(m => m.level === 2).length;

   const commissionData = [
      { name: 'Level 1 (5%)', value: 1200 },
      { name: 'Level 2 (3%)', value: 450 }
   ];

   const weeklyData = [
      { name: 'Mon', comm: 120 }, { name: 'Tue', comm: 200 }, { name: 'Wed', comm: 150 },
      { name: 'Thu', comm: 80 }, { name: 'Fri', comm: 250 }, { name: 'Sat', comm: 110 }, { name: 'Sun', comm: 300 }
   ];

   const filteredMembers = members.filter(m => {
      if (!m.memberName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filter === 'level1') return m.level === 1;
      if (filter === 'level2') return m.level === 2;
      if (filter === 'active') return m.isActive;
      if (filter === 'inactive') return !m.isActive;
      return true;
   });

   return (
      <div className="pb-24">
         {/* PART A: TEAM OVERVIEW */}
         <div className="p-4 bg-[#111111] border-b border-[#2A2A2A]">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <h2 className="text-[22px] font-black text-white">My Team 👥</h2>
                  <p className="text-[13px] text-gray-500 font-bold uppercase tracking-widest">You + your referral network</p>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => window.location.href = `/chat/${currentUser?.uid}`} className="bg-[#E8B84B] text-black w-10 h-10 rounded-xl flex items-center justify-center hover:bg-yellow-500 transition">
                     <MessageCircle size={18} />
                  </button>
                  <button className="border border-[#E8B84B] text-[#E8B84B] px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#E8B84B]/10 transition">
                     Invite
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
               <div className="bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 p-4 rounded-2xl relative overflow-hidden">
                  <Users size={16} className="text-[#8B5CF6] mb-2" />
                  <span className="text-[12px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Total Members</span>
                  <span className="text-[28px] font-black text-white leading-none block mb-1">{members.length}</span>
                  <span className="text-[11px] text-[#8B5CF6] font-bold">L1: {l1Count} direct | L2: {l2Count} indirect</span>
               </div>
               
               <div className="bg-[#E8B84B]/10 border border-[#E8B84B]/30 p-4 rounded-2xl relative overflow-hidden">
                  <TrendingUp size={16} className="text-[#E8B84B] mb-2" />
                  <span className="text-[12px] text-gray-400 font-bold uppercase tracking-widest block mb-1">This Month Comm.</span>
                  <span className="text-[28px] font-black text-white leading-none block mb-1">{formatCurrency(userData?.teamEarningsThisMonth || 0)}</span>
                  <span className="text-[11px] text-[#E8B84B] font-bold">↑12% from last month</span>
               </div>

               <div className="bg-[#00C9A7]/10 border border-[#00C9A7]/30 p-4 rounded-2xl relative overflow-hidden">
                  <Activity size={16} className="text-[#00C9A7] mb-2" />
                  <span className="text-[12px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Active This Week</span>
                  <span className="text-[28px] font-black text-white leading-none block mb-1">{activeMembers.length}</span>
                  <span className="text-[11px] text-[#F59E0B] font-bold cursor-pointer">
                     {members.length - activeMembers.length} inactive members ⚠️
                  </span>
               </div>

               <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/30 p-4 rounded-2xl relative overflow-hidden">
                  <DollarSign size={16} className="text-[#3B82F6] mb-2" />
                  <span className="text-[12px] text-gray-400 font-bold uppercase tracking-widest block mb-1">All-Time Comm.</span>
                  <span className="text-[28px] font-black text-white leading-none block mb-1">{formatCurrency(userData?.totalTeamCommission || 0)}</span>
                  <span className="text-[11px] text-[#3B82F6] font-bold">Since join</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
               <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4">
                  <h3 className="text-sm font-black text-white mb-4 uppercase tracking-widest">Commission Sources</h3>
                  <div className="flex items-center">
                     <div className="w-[120px] h-[120px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie data={commissionData} dataKey="value" innerRadius={40} outerRadius={55} paddingAngle={5}>
                                 {commissionData.map((_, i) => <Cell key={`cell-${i}`} fill={donutColors[i % donutColors.length]} />)}
                              </Pie>
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="flex-1 ml-4 space-y-3">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-[#8B5CF6]"></span>
                              <span className="text-xs text-gray-400 font-bold">Level 1 (5%)</span>
                           </div>
                           <span className="text-white font-bold text-sm">{formatCurrency(1200)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-[#3B82F6]"></span>
                              <span className="text-xs text-gray-400 font-bold">Level 2 (3%)</span>
                           </div>
                           <span className="text-white font-bold text-sm">{formatCurrency(450)}</span>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 hidden md:block">
                  <h3 className="text-sm font-black text-white mb-4 uppercase tracking-widest">Team Commission This Week</h3>
                  <div className="h-[120px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData}>
                           <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                           <Bar dataKey="comm" fill="url(#colorComm)" radius={[4, 4, 0, 0]} />
                           <defs>
                              <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1}/>
                                 <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                              </linearGradient>
                           </defs>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>
         </div>

         {/* PART B: MEMBER LIST */}
         <div className="p-4">
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
               {['all', 'level1', 'level2', 'active', 'inactive', 'atRisk'].map(f => (
                  <button 
                     key={f} 
                     onClick={() => setFilter(f)}
                     className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${filter === f ? 'bg-[#E8B84B] text-black' : 'bg-[#111111] border border-[#2A2A2A] text-gray-500 hover:text-gray-300'}`}
                  >
                     {f === 'level1' ? 'Level 1' : f === 'level2' ? 'Level 2' : f}
                  </button>
               ))}
            </div>

            <div className="relative mb-6">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
               <input 
                  type="text" 
                  placeholder="Search member name..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-[#8B5CF6] outline-none transition"
               />
            </div>

            {loading ? (
               <div className="text-center py-10 text-gray-500">Loading team...</div>
            ) : filteredMembers.length === 0 ? (
               <div className="text-center py-10">
                  <Users size={48} className="text-[#2A2A2A] mx-auto mb-4" />
                  <p className="text-white font-bold mb-2">No team members found</p>
                  <p className="text-xs text-gray-500 mb-4">Share your referral link to build your team!</p>
                  <button className="bg-[#E8B84B] text-black text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl">Share Referral Link</button>
               </div>
            ) : (
               <div className="space-y-4">
                  {filteredMembers.map(member => (
                     <div key={member.id} className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 relative">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border-2 border-[#2A2A2A] flex items-center justify-center font-bold text-gray-400 shrink-0 relative">
                              {member.memberName?.charAt(0) || 'M'}
                              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111111] ${member.isActive ? 'bg-[#00C9A7]' : 'bg-[#EF4444]'}`}></span>
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="text-white font-bold text-sm truncate">{member.memberName}</h4>
                              <div className="flex gap-2 mt-1">
                                 <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-[#1A1A1A] px-1.5 py-0.5 rounded">L{member.level} {member.level === 1 ? 'Direct' : 'Indirect'}</span>
                                 <span className="text-[9px] font-black uppercase tracking-widest text-[#E8B84B] bg-[#E8B84B]/10 px-1.5 py-0.5 rounded">{member.memberVenture || 'Venture'}</span>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                           <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-2 text-center">
                              <span className="text-white font-black text-sm block">{member.tasksCompleted || 0}</span>
                              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Tasks Done</span>
                           </div>
                           <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-2 text-center">
                              <span className="text-white font-black text-sm block">{formatCurrency(member.totalEarnings || 0)}</span>
                              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Earned</span>
                           </div>
                           <div className="bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-lg p-2 text-center">
                              <span className="text-[#8B5CF6] font-black text-sm block">{formatCurrency(member.commissionEarned || 0)}</span>
                              <span className="text-[9px] text-[#8B5CF6] font-bold uppercase tracking-widest">Your Comm.</span>
                           </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[#2A2A2A]">
                           <span className="text-[#F59E0B] text-[10px] font-bold uppercase tracking-widest">Last active 3 days ago</span>
                           <div className="flex gap-2">
                              <button className="text-[10px] font-black uppercase tracking-widest text-[#00C9A7] border border-[#00C9A7]/30 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-[#00C9A7]/10 transition">
                                 <MessageCircle size={12} /> WhatsApp
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
   );
}
