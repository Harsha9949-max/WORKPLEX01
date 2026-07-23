import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, Search, Filter, Clock, CheckCircle, Lock, Crown } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/taskUtils';

export default function TasksScreen() {
   const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');
   const [tasks, setTasks] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const { userData, currentUser } = useAuth();
   const navigate = useNavigate();

   const currentTier = userData?.subscriptionTier || 'scout';
   const tierPower: Record<string, number> = {
      scout: 0,
      hustler: 1,
      brand_partner: 2,
      venture_elite: 3
   };
   const userPower = tierPower[currentTier] ?? 0;

   // Venture Color
   const ventureColor = userData?.venture === 'BuyRix' ? '#3B82F6' : 
                        userData?.venture === 'Vyuma' ? '#8B5CF6' : 
                        userData?.venture === 'Growplex' ? '#00C9A7' : '#E8B84B';

   useEffect(() => {
      if (!userData) return;
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef);

      const unsub = onSnapshot(q, (snap) => {
         const now = Date.now();
         const t = snap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((task: any) => {
               // Ignore archived tasks
               if (task.status === 'archived') return false;
               
               // Expiration timeframe verification
               const expiresVal = task.expiresAt?.toMillis ? task.expiresAt.toMillis() : task.expiresAt;
               if (expiresVal && expiresVal < now) return false;

               // Venture segment checking (matches "All" or worker's exact assigned venture)
               if (task.venture && task.venture !== 'All' && task.venture.toLowerCase() !== userData.venture?.toLowerCase()) {
                  return false;
               }

               // Roles segment checking (matches worker's exact role or "All")
               if (task.targetRoles && task.targetRoles.length > 0) {
                  const matchedRole = task.targetRoles.some((r: string) => 
                     r.toLowerCase() === 'all' || r.toLowerCase() === userData.role?.toLowerCase()
                  );
                  if (!matchedRole) return false;
               }
               
               return true;
            });

         t.sort((a: any, b: any) => {
            const dateA = a.createdAt?.toMillis?.() || 0;
            const dateB = b.createdAt?.toMillis?.() || 0;
            return dateB - dateA;
         });
         setTasks(t);
         setLoading(false);
      });
      return () => unsub();
   }, [userData]);

   const tasksWithLocalStatus = tasks.map((t: any) => {
      const isCompletedLocally = localStorage.getItem(`completed_task_${currentUser?.uid || ''}_${t.id}`) === 'true';
      return {
         ...t,
         status: isCompletedLocally ? 'completed' : t.status
      };
   });

   const filteredTasks = tasksWithLocalStatus.filter(t => {
      if (activeTab === 'pending') return t.status !== 'completed';
      if (activeTab === 'completed') return t.status === 'completed';
      return true;
   });

   return (
      <div className="min-h-screen bg-[#0A0A0A] font-sans pb-28 text-white max-w-2xl mx-auto">
         {/* HEADER */}
         <div className="sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-md z-40 p-4 border-b border-[#2A2A2A]">
            <h1 className="text-[22px] font-black uppercase tracking-tighter mb-4">Missions</h1>
            
            {/* TABS */}
            <div className="flex bg-[#111111] p-1 rounded-xl border border-[#2A2A2A]">
               <button 
                  onClick={() => setActiveTab('pending')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${activeTab === 'pending' ? 'bg-[#2A2A2A] text-white' : 'text-gray-500'}`}
               >
                  Pending
               </button>
               <button 
                  onClick={() => setActiveTab('completed')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${activeTab === 'completed' ? 'bg-[#2A2A2A] text-[#00C9A7]' : 'text-gray-500'}`}
               >
                  Completed
               </button>
            </div>
         </div>

         {/* LIST */}
         <div className="p-4 space-y-4">
            {loading ? (
               <div className="text-center py-10 text-gray-500">Loading missions...</div>
            ) : filteredTasks.length === 0 ? (
               <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-8 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-4">
                     <ClipboardCheck size={32} className="text-gray-600" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">No {activeTab} missions</h3>
                  <p className="text-xs text-gray-500">Check back later for more missions.</p>
               </div>
            ) : (
               <AnimatePresence>
                  {filteredTasks.map(task => {
                     // Determine required tier programmatically based on reward value or title keywords
                     let requiredTier: 'scout' | 'hustler' | 'brand_partner' | 'venture_elite' = 'scout';
                     const reward = task.reward || 50;
                     const title = (task.title || '').toLowerCase();

                     if (reward > 1500 || title.includes('elite') || title.includes('wholesale')) {
                        requiredTier = 'venture_elite';
                      } else if (reward > 500 || title.includes('status') || title.includes('store') || title.includes('mlm')) {
                        requiredTier = 'brand_partner';
                      } else if (reward > 100 || title.includes('catalog') || title.includes('smm') || title.includes('engagement') || title.includes('referral')) {
                        requiredTier = 'hustler';
                      }

                      const taskPower = tierPower[requiredTier] || 0;
                      const isLocked = userPower < taskPower && task.status !== 'completed';

                      return (
                         <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={task.id} 
                            className={`bg-[#111111] border ${task.status === 'completed' ? 'border-[#00C9A7]/30' : 'border-[#2A2A2A]'} rounded-2xl p-4 relative overflow-hidden`}
                         >
                            {/* Locked overlay */}
                            {isLocked && (
                               <div className="absolute inset-0 bg-[#0A0A0C]/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
                                  <div className="w-10 h-10 rounded-full bg-[#E8B84B]/10 border border-[#E8B84B]/30 flex items-center justify-center text-[#E8B84B] mb-2">
                                     <Lock size={16} />
                                  </div>
                                  <h4 className="text-white text-xs font-black uppercase tracking-wider">{requiredTier.replace('_', ' ')} Locked</h4>
                                  <p className="text-[10px] text-gray-400 mt-1 mb-3">Upgrade your workspace tier to unlock this high-yield mission.</p>
                                  <button
                                     onClick={() => navigate('/subscription')}
                                     className="bg-[#E8B84B] text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg cursor-pointer shadow-lg"
                                  >
                                     Upgrade Workspace
                                  </button>
                               </div>
                            )}

                            <div className="flex justify-between items-start mb-3">
                               <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm" style={{ backgroundColor: `${ventureColor}20`, color: ventureColor }}>
                                  {task.venture || userData?.venture}
                               </span>
                               {task.status === 'completed' ? (
                                  <span className="text-[#00C9A7] flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                                     <CheckCircle size={12} /> Done
                                  </span>
                               ) : (
                                  <span className="text-[#F59E0B] flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                                     <Clock size={12} /> 24 Hrs
                                  </span>
                               )}
                            </div>
                            <h3 className="text-white font-bold text-base mb-1 pr-12">{task.title}</h3>
                            <p className="text-gray-400 text-xs line-clamp-2 mb-4 leading-relaxed">{task.description}</p>
                            
                            <div className="flex justify-between items-center pt-3 border-t border-[#2A2A2A]">
                               <span className="text-[#E8B84B] font-black">{formatCurrency(task.reward || 50)} <span className="text-gray-500 text-[10px] font-normal uppercase">Reward</span></span>
                               <button 
                                  onClick={() => !isLocked && navigate(`/tasks/${task.id}`)} 
                                  className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg transition ${
                                     task.status === 'completed' 
                                     ? 'bg-[#0A0A0A] border border-[#2A2A2A] text-gray-400 hover:text-white' 
                                     : 'bg-[#E8B84B] text-black shadow-[0_0_15px_rgba(232,184,75,0.2)] hover:bg-[#E8B84B]/90'
                                  }`}
                               >
                                  {task.status === 'completed' ? 'View Details' : 'Start Mission →'}
                               </button>
                            </div>
                         </motion.div>
                      );
                  })}
               </AnimatePresence>
            )}
         </div>
      </div>
   );
}
