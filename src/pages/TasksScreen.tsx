import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, Search, Filter, Clock, CheckCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/taskUtils';

export default function TasksScreen() {
   const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');
   const [tasks, setTasks] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const { userData } = useAuth();
   const navigate = useNavigate();

   // Venture Color
   const ventureColor = userData?.venture === 'BuyRix' ? '#3B82F6' : 
                        userData?.venture === 'Vyuma' ? '#8B5CF6' : 
                        userData?.venture === 'Growplex' ? '#00C9A7' : '#E8B84B';

   useEffect(() => {
      if (!userData) return;
      const tasksRef = collection(db, 'tasks');
      const q = query(
         tasksRef, 
         where('venture', '==', userData.venture),
         orderBy('createdAt', 'desc')
      );

      const unsub = onSnapshot(q, (snap) => {
         const t = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         setTasks(t);
         setLoading(false);
      });
      return () => unsub();
   }, [userData]);

   const filteredTasks = tasks.filter(t => {
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
               <div className="text-center py-10 text-gray-500">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
               <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-8 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-4">
                     <ClipboardCheck size={32} className="text-gray-600" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">No {activeTab} tasks</h3>
                  <p className="text-xs text-gray-500">Check back later for more missions.</p>
               </div>
            ) : (
               <AnimatePresence>
                  {filteredTasks.map(task => (
                     <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={task.id} 
                        className={`bg-[#111111] border ${task.status === 'completed' ? 'border-[#00C9A7]/30' : 'border-[#2A2A2A]'} rounded-2xl p-4 relative overflow-hidden`}
                     >
                        <div className="flex justify-between items-start mb-3">
                           <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm" style={{ backgroundColor: `${ventureColor}20`, color: ventureColor }}>
                              {task.venture || userData.venture}
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
                              onClick={() => navigate(`/tasks/${task.id}`)} 
                              className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg transition ${
                                 task.status === 'completed' 
                                 ? 'bg-[#0A0A0A] border border-[#2A2A2A] text-gray-400 hover:text-white' 
                                 : 'bg-[#E8B84B] text-black shadow-[0_0_15px_rgba(232,184,75,0.2)] hover:bg-[#E8B84B]/90'
                              }`}
                           >
                              {task.status === 'completed' ? 'View Details' : 'Start Task →'}
                           </button>
                        </div>
                     </motion.div>
                  ))}
               </AnimatePresence>
            )}
         </div>
      </div>
   );
}
