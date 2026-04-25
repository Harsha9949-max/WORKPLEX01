import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '../../hooks/useTasks';
import { useSubmissions } from '../../hooks/useSubmissions';
import TaskCard from './TaskCard';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronDown, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TasksScreen() {
  const { tasks, loading: tasksLoading } = useTasks();
  const { submissions, loading: subsLoading } = useSubmissions();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Pull to refresh simulation
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    if(navigator.vibrate) navigator.vibrate(10);
    setIsRefreshing(true);
    // Simulate network delay over real-time setup
    await new Promise(r => setTimeout(r, 800));
    setIsRefreshing(false);
  };

  const processedTasks = useMemo(() => {
    return tasks.map(task => {
      const sub = submissions.find(s => s.taskId === task.id);
      return { ...task, status: sub ? sub.status : 'pending', submissionId: sub?.id };
    });
  }, [tasks, submissions]);

  const { thisWeekTasks, otherTasks, weekLabel } = useMemo(() => {
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    const sunday = endOfWeek(now, { weekStartsOn: 1 });
    
    // Sort logic, prioritizing tasks for current week
    const thisWeek: any[] = [];
    const other: any[] = [];
    
    processedTasks.forEach(t => {
      if (t.isWeeklyBatch && t.weekStartDate) {
         const taskStart = t.weekStartDate.toDate();
         // simple heuristic check if it matches current week
         if (taskStart.getFullYear() === monday.getFullYear() && 
             taskStart.getMonth() === monday.getMonth() && 
             Math.abs(taskStart.getDate() - monday.getDate()) < 3) {
            thisWeek.push(t);
         } else {
            other.push(t);
         }
      } else {
         other.push(t);
      }
    });

    return { 
       thisWeekTasks: thisWeek, 
       otherTasks: other,
       weekLabel: `Week: ${format(monday, 'dd MMM')} - ${format(sunday, 'dd MMM yyyy')}`
    };
  }, [processedTasks]);

  const groupedThisWeek = useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const groups: Record<string, any[]> = {};
    days.forEach(d => groups[d] = []);
    
    thisWeekTasks.forEach(t => {
       const day = t.dayAssigned || 'Monday';
       if(groups[day]) groups[day].push(t);
       else groups[day] = [t];
    });
    return groups;
  }, [thisWeekTasks]);

  if (tasksLoading || subsLoading) return (
    <div className="p-4 text-white flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 text-[#E8B84B] animate-spin mb-4" />
      <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t('common.loading')}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 pb-24 text-white">
      {/* Pull down area */}
      <div 
        className="text-center pb-4 pt-2 text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
        onClick={handleRefresh}
      >
        {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin mx-auto text-[#E8B84B]" /> : '↓ Pull or Click to refresh'}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-black uppercase tracking-tighter mb-1 relative inline-block">
          {t('tasks.this_week')}
          <motion.div 
            className="absolute -bottom-1 left-0 h-1 bg-[#E8B84B]" 
            initial={{ width: 0 }} 
            animate={{ width: '100%' }} 
            transition={{ delay: 0.2 }}
          />
        </h1>
        <div className="flex items-center gap-2 text-gray-400 mt-3 text-xs font-bold uppercase tracking-widest bg-white/5 inline-flex px-3 py-1.5 rounded-lg border border-white/10">
          <CalendarIcon size={14} className="text-[#E8B84B]" />
          {weekLabel}
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {Object.entries(groupedThisWeek).filter(([_, tasks]) => tasks.length > 0).map(([day, tasks]) => (
          <div key={day} className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden">
             <button 
               onClick={() => setExpandedDay(expandedDay === day ? null : day)}
               className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-white/5 to-transparent hover:from-white/10 transition-colors"
             >
               <div className="flex items-center gap-3">
                 <h3 className="font-bold text-sm text-[#E8B84B] uppercase tracking-widest">{day}</h3>
                 <span className="bg-black border border-[#2A2A2A] px-2 py-0.5 rounded text-[10px] font-black text-gray-400">{tasks.length}</span>
               </div>
               <ChevronDown size={16} className={`text-gray-500 transition-transform ${expandedDay === day ? 'rotate-180' : ''}`} />
             </button>
             <AnimatePresence>
               {(expandedDay === day || tasks.length <= 1) && (
                 <motion.div 
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="p-3 pt-0 space-y-2 max-h-[500px] overflow-y-auto no-scrollbar"
                 >
                   <div className="h-2" />
                   {tasks.map((task: any) => (
                     <div key={task.id} className={task.status === 'approved' ? 'opacity-50 grayscale' : ''}>
                       <TaskCard 
                         task={task} 
                         status={task.status}
                         onClick={() => navigate(`/tasks/${task.id}`)}
                       />
                     </div>
                   ))}
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        ))}
        {thisWeekTasks.length === 0 && (
           <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-8 text-center">
              <CalendarIcon size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="font-bold text-gray-300">{t('tasks.no_tasks')}</p>
              <p className="text-xs text-gray-500 mt-1">Check back later or explore other sections.</p>
           </div>
        )}
      </div>

      {otherTasks.length > 0 && (
        <div className="space-y-4">
           <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
             <div className="w-1 h-1 bg-[#E8B84B] rounded-full" />
             Other Backlog Tasks
           </h2>
           {otherTasks.map(task => (
             <TaskCard 
               key={task.id} 
               task={task} 
               status={task.status}
               onClick={() => navigate(`/tasks/${task.id}`)}
             />
           ))}
        </div>
      )}
    </div>
  );
}
