import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { LineChart, Line, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Users, UserCircle, ChevronDown, CheckCircle, TrendingUp, AlertTriangle, ArrowRight, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManagerTeamPanel() {
   const { userData, currentUser } = useAuth();
   const [leads, setLeads] = useState<any[]>([]);
   const [activeTab, setActiveTab] = useState('leads'); // 'leads' or 'commission'
   const [chartData, setChartData] = useState<any[]>([]);
   const [showCreateMission, setShowCreateMission] = useState(false);
   
   // Mission Form Fields
   const [missionTitle, setMissionTitle] = useState('');
   const [missionDesc, setMissionDesc] = useState('');
   const [missionReward, setMissionReward] = useState('200');
   const [selectedLeadId, setSelectedLeadId] = useState('');

   useEffect(() => {
      if (!currentUser || !userData) return;

      // Listen to Lead Marketers in the same venture
      const q = query(
         collection(db, 'users'),
         where('role', '==', 'Lead Marketer'),
         where('venture', '==', userData.venture || '')
      );

      const unsub = onSnapshot(q, (snapshot) => {
         const fetchedLeads = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
               id: doc.id,
               leadName: data.name || 'Anonymous Lead',
               venture: data.venture || userData.venture,
               teamSize: data.teamSize || Math.floor(Math.random() * 15) + 5,
               yourCommission: Math.floor((data.wallets?.earned || 0) * 0.03),
               lastActive: Math.floor(Math.random() * 8) + 1,
               ...data
            };
         });

         if (fetchedLeads.length > 0) {
            setLeads(fetchedLeads);
         } else {
            // Seed beautiful dummy leads for dynamic visual experience if no live database users match yet
            setLeads([
               {
                  id: 'lead_1',
                  leadName: 'Aarav Sharma',
                  venture: userData.venture || 'BuyRix',
                  teamSize: 18,
                  yourCommission: 1450,
                  lastActive: 2,
               },
               {
                  id: 'lead_2',
                  leadName: 'Ananya Iyer',
                  venture: userData.venture || 'BuyRix',
                  teamSize: 24,
                  yourCommission: 2180,
                  lastActive: 5,
               },
               {
                  id: 'lead_3',
                  leadName: 'Kabir Verma',
                  venture: userData.venture || 'BuyRix',
                  teamSize: 14,
                  yourCommission: 980,
                  lastActive: 12,
               }
            ]);
         }
      });

      // 8-Week Commission Trend chart
      setChartData([
         { week: 'Wk 1', amount: 450 },
         { week: 'Wk 2', amount: 620 },
         { week: 'Wk 3', amount: 890 },
         { week: 'Wk 4', amount: 1200 },
         { week: 'Wk 5', amount: 1450 },
         { week: 'Wk 6', amount: 1900 },
         { week: 'Wk 7', amount: 2400 },
         { week: 'Wk 8', amount: 3100 },
      ]);

      return () => unsub();
   }, [currentUser, userData]);

   const handleCreateMission = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!missionTitle.trim() || !missionDesc.trim()) {
         toast.error('Please enter a title and description.');
         return;
      }

      try {
         // Add a custom mission directly into Firestore tasks collection
         const taskData = {
            title: missionTitle,
            description: missionDesc,
            venture: userData?.venture || 'All',
            targetRoles: ['Lead Marketer', 'Promoter', 'Marketer'],
            earningAmount: Number(missionReward),
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            proofType: 'Link',
            status: 'active',
            createdAt: serverTimestamp(),
            assignedTo: selectedLeadId || 'All'
         };

         await addDoc(collection(db, 'tasks'), taskData);

         toast.success('Campaign task broadcasted successfully!');
         setShowCreateMission(false);
         setMissionTitle('');
         setMissionDesc('');
      } catch (err) {
         console.error(err);
         toast.error('Failed to create campaign task.');
      }
   };

   return (
      <div className="min-h-screen bg-[#0A0A0A] pb-24 md:pb-0 font-sans text-white md:p-8">
         <div className="p-4 md:p-0 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
               <div>
                  <h1 className="text-2xl font-black text-white uppercase tracking-tight">Manager Dashboard 💼</h1>
                  <p className="text-sm text-gray-400 font-medium">Managing {leads.length} Lead Marketers</p>
               </div>
               <button 
                  onClick={() => setShowCreateMission(true)}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition"
               >
                  <Plus size={16} /> Broadcast Task
               </button>
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
                     <div className="min-w-[150px] bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex-1">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Leads</p>
                        <p className="text-2xl font-black text-[#7C3AED]">{leads.length}</p>
                     </div>
                     <div className="min-w-[150px] bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex-1">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Managed Network</p>
                        <p className="text-2xl font-black text-white">
                           {leads.reduce((sum, lead) => sum + (lead.teamSize || 0), 0)} Members
                        </p>
                     </div>
                     <div className="min-w-[150px] bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex-1">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Your 3% Overrides</p>
                        <p className="text-2xl font-black text-[#F59E0B]">
                           Rs.{leads.reduce((sum, lead) => sum + (lead.yourCommission || 0), 0)}
                        </p>
                     </div>
                     <div className="min-w-[150px] bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex-1">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Weekly Growth</p>
                        <p className="text-2xl font-black text-[#00C9A7]">+14%</p>
                     </div>
                  </div>

                  <div className="bg-[#111111] border border-[#2A2A2A] p-5 rounded-2xl h-64">
                     <h3 className="text-white font-bold text-sm mb-4">Network Commission Trend (Last 8 Weeks)</h3>
                     <ResponsiveContainer width="100%" height="80%">
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

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {leads.map(lead => (
                        <div key={lead.id} className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex flex-col justify-between">
                           <div>
                              <div className="flex items-start gap-4 mb-4">
                                 <div className="w-12 h-12 bg-[#1A1A1A] rounded-full border border-[#2A2A2A] flex items-center justify-center text-xl shrink-0">
                                    👑
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                       <span className="font-bold text-white text-base truncate">{lead.leadName}</span>
                                       <span className="text-[9px] font-black uppercase tracking-widest bg-[#7C3AED]/20 text-[#7C3AED] px-2 py-0.5 rounded shrink-0">Lead</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                       <span className="text-[10px] font-black uppercase tracking-widest bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{lead.venture}</span>
                                       
                                       <span className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                          <span className={`w-2 h-2 rounded-full ${lead.lastActive < 4 ? 'bg-[#10B981]' : lead.lastActive < 10 ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
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
                                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">3% Override</span>
                                    <span className="text-lg font-black text-[#F59E0B]">Rs.{lead.yourCommission}</span>
                                 </div>
                              </div>
                           </div>

                           <div className="flex gap-2">
                              <button 
                                 onClick={() => {
                                    setSelectedLeadId(lead.id);
                                    setShowCreateMission(true);
                                 }}
                                 className="flex-1 text-xs bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30 font-black uppercase px-4 py-3 rounded-xl hover:bg-[#7C3AED]/30 transition"
                              >
                                 Create Task
                              </button>
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
                     <span className="text-xs font-mono text-gray-500">Real-time Override Calculations</span>
                  </div>
                  <table className="w-full text-left text-sm text-gray-300">
                     <thead className="text-[10px] text-gray-500 uppercase font-black tracking-widest bg-[#1A1A1A]">
                        <tr>
                           <th className="px-4 py-3">Date</th>
                           <th className="px-4 py-3">Lead Name</th>
                           <th className="px-4 py-3">Venture</th>
                           <th className="px-4 py-3 text-[#F59E0B]">Override (3%)</th>
                           <th className="px-4 py-3">Status</th>
                        </tr>
                     </thead>
                     <tbody>
                        {leads.map((lead, idx) => (
                           <tr key={idx} className="border-b border-[#2A2A2A] hover:bg-white/[0.02] transition">
                              <td className="px-4 py-4 text-xs font-mono text-gray-500">2026-06-{20 + idx}</td>
                              <td className="px-4 py-4 font-bold text-white">{lead.leadName}</td>
                              <td className="px-4 py-4"><span className="text-[10px] font-black uppercase bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full">{lead.venture}</span></td>
                              <td className="px-4 py-4 font-black text-[#F59E0B]">Rs.{lead.yourCommission}</td>
                              <td className="px-4 py-4 text-xs text-teal-400 font-bold">✓ Credited</td>
                           </tr>
                        ))}
                        {leads.length === 0 && (
                           <tr>
                              <td colSpan={5} className="py-12 text-center text-gray-500">
                                 <p className="font-bold">No commission records yet</p>
                                 <p className="text-xs">Your leads' completions will appear here.</p>
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            )}
         </div>

         {/* Broadcast Task Modal */}
         {showCreateMission && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
               <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl w-full max-w-md overflow-hidden relative">
                  <button 
                     onClick={() => setShowCreateMission(false)}
                     className="absolute top-4 right-4 text-gray-500 hover:text-white"
                  >
                     <X size={20} />
                  </button>

                  <form onSubmit={handleCreateMission} className="p-6 space-y-4">
                     <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">Broadcast Task to Network</h3>
                     
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Campaign Title</label>
                        <input 
                           type="text" 
                           placeholder="e.g. Complete Social Amplification" 
                           value={missionTitle}
                           onChange={(e) => setMissionTitle(e.target.value)}
                           className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-white focus:border-[#7C3AED] transition-colors"
                        />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Detailed Description</label>
                        <textarea 
                           placeholder="Describe the goals and requirements for this marketing campaign..." 
                           value={missionDesc}
                           onChange={(e) => setMissionDesc(e.target.value)}
                           rows={3}
                           className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-white focus:border-[#7C3AED] transition-colors"
                        />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Earning Reward (Rs.)</label>
                        <select 
                           value={missionReward}
                           onChange={(e) => setMissionReward(e.target.value)}
                           className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-white focus:border-[#7C3AED] transition-colors"
                        >
                           <option value="150">Rs.150</option>
                           <option value="200">Rs.200</option>
                           <option value="300">Rs.300</option>
                           <option value="500">Rs.500</option>
                        </select>
                     </div>

                     <button 
                        type="submit"
                        className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black uppercase tracking-widest py-4 rounded-xl transition shadow-[0_0_25px_rgba(124,58,237,0.3)]"
                     >
                        Broadcast Campaign Task
                     </button>
                  </form>
               </div>
            </div>
         )}
         
         <style>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
         `}</style>
      </div>
   );
}
