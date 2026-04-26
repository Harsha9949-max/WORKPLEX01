import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '../../hooks/useTasks';
import { useSubmissions } from '../../hooks/useSubmissions';
import TaskCard from './TaskCard';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Filter, Loader2, ClipboardCheck } from 'lucide-react';
import toast from 'react-hot-toast';

type TabStatus = 'All' | 'Pending' | 'Submitted' | 'Approved' | 'Rejected';

export default function TasksScreen() {
  const { tasks, loading: tasksLoading } = useTasks();
  const { submissions, loading: subsLoading } = useSubmissions();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabStatus>('All');

  const processedTasks = useMemo(() => {
    return tasks.map(task => {
      const sub = submissions.find(s => s.taskId === task.id);
      return { ...task, status: sub ? sub.status : 'pending', submissionId: sub?.id };
    });
  }, [tasks, submissions]);

  const { weekLabel } = useMemo(() => {
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    const sunday = endOfWeek(now, { weekStartsOn: 1 });
    return { 
       weekLabel: `Week: ${format(monday, 'dd MMM')} - ${format(sunday, 'dd MMM yyyy')}`
    };
  }, []);

  const counts = useMemo(() => {
    const c = { All: processedTasks.length, Pending: 0, Submitted: 0, Approved: 0, Rejected: 0 };
    processedTasks.forEach(t => {
      if (t.status === 'pending') c.Pending++;
      else if (t.status === 'submitted') c.Submitted++;
      else if (t.status === 'approved') c.Approved++;
      else if (t.status === 'rejected') c.Rejected++;
    });
    return c;
  }, [processedTasks]);

  const filteredTasks = useMemo(() => {
    if (activeTab === 'All') return processedTasks;
    return processedTasks.filter(t => t.status.toLowerCase() === activeTab.toLowerCase());
  }, [processedTasks, activeTab]);

  const handleSkip = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    toast('Task hidden. You can find it later if needed.', { icon: '⏭️' });
  };

  if (tasksLoading || subsLoading) return (
    <div className="p-4 text-white flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 text-[#E8B84B] animate-spin mb-4" />
      <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Tasks</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 pb-24 font-sans text-white max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="flex items-start justify-between mb-6 pt-2">
         <div>
            <h1 className="text-[22px] font-bold text-white leading-tight">This Week's Tasks</h1>
            <p className="text-[13px] text-gray-400 mt-1">{weekLabel}</p>
         </div>
         <button className="w-10 h-10 border border-[#2A2A2A] bg-[#111111] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition">
            <Filter size={18} />
         </button>
      </div>

      {/* STATUS TABS */}
      <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
         {(['All', 'Pending', 'Submitted', 'Approved', 'Rejected'] as TabStatus[]).map(tab => {
            const isActive = activeTab === tab;
            return (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 border ${
                    isActive 
                      ? 'bg-white text-black border-white' 
                      : 'bg-[#111111] text-gray-400 border-[#2A2A2A] hover:bg-[#1A1A1A]'
                 }`}
               >
                 {tab}
                 <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-black/10 text-black' : 'bg-[#2A2A2A] text-gray-300'
                 }`}>
                    {counts[tab]}
                 </span>
               </button>
            );
         })}
      </div>

      {/* TASK LIST */}
      <div className="space-y-4">
         <AnimatePresence mode="popLayout">
            {filteredTasks.length > 0 ? (
               filteredTasks.map(task => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                     <TaskCard 
                        task={task} 
                        status={task.status} 
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        onSkip={task.status === 'pending' ? (e) => handleSkip(e, task.id) : undefined}
                     />
                  </motion.div>
               ))
            ) : (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-10 flex flex-col items-center justify-center text-center mt-8"
               >
                  <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex justify-center items-center mb-4">
                     <ClipboardCheck size={32} className="text-gray-500" />
                  </div>
                  <p className="text-white font-bold text-lg mb-1">No tasks found</p>
                  <p className="text-sm text-gray-500 max-w-[200px]">You don't have any {activeTab.toLowerCase()} tasks right now.</p>
               </motion.div>
            )}
         </AnimatePresence>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
