import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  getDoc,
  doc, 
  setDoc,  
  updateDoc, 
  serverTimestamp,
  addDoc,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { 
  Plus, 
  Check, 
  X, 
  ExternalLink, 
  Image as ImageIcon, 
  FileText, 
  Link as LinkIcon,
  Filter,
  Users,
  Calendar,
  IndianRupee,
  Zap,
  Info,
  Bot
} from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/format';
import { format } from 'date-fns';

/**
 * Task Management Page.
 * Handles task creation and submission approvals.
 */
export default function TaskManagement() {
  const [activeTab, setActiveTab] = useState<'create' | 'review'>('review');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form State
  const [taskForm, setTaskForm] = useState({
    venture: 'BuyRix',
    targetRoles: [] as string[],
    weekDateStr: format(new Date(), 'yyyy-MM-dd'),
    tasks: [] as any[]
  });

  const getRolesByVenture = (venture: string) => {
    switch (venture) {
      case 'BuyRix': return ['Marketer', 'Content Creator', 'Reseller'];
      case 'Vyuma': return ['Marketer', 'Content Creator', 'Reseller'];
      case 'Growplex': return ['Promoter', 'Content Creator'];
      case 'Zaestify': return [];
      default: return [];
    }
  };

  const getNextMonday = () => {
    const d = new Date();
    d.setDate(d.getDate() + (1 - d.getDay() + 7) % 7 || 7);
    return format(d, 'yyyy-MM-dd');
  };

  const [weekSelectorObj, setWeekSelectorObj] = useState(() => {
    const monday = new Date();
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      monday,
      sunday,
      weekNumber: getWeekNumber(monday),
      assignedWeek: `${monday.getFullYear()}-W${getWeekNumber(monday)}`,
      label: `Week of ${format(monday, 'dd MMM')} to ${format(sunday, 'dd MMM')}`
    };
  });

  function getWeekNumber(d: Date) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return weekNo;
  }

  const handleWeekChange = (offset: number) => {
    setWeekSelectorObj(prev => {
      const newMonday = new Date(prev.monday);
      newMonday.setDate(newMonday.getDate() + offset * 7);
      const newSunday = new Date(newMonday);
      newSunday.setDate(newMonday.getDate() + 6);
      return {
        monday: newMonday,
        sunday: newSunday,
        weekNumber: getWeekNumber(newMonday),
        assignedWeek: `${newMonday.getFullYear()}-W${getWeekNumber(newMonday)}`,
        label: `Week of ${format(newMonday, 'dd MMM')} to ${format(newSunday, 'dd MMM')}`
      };
    });
  };

  const ventures = ['BuyRix', 'Vyuma', 'Growplex'];

  useEffect(() => {
    const q = query(collection(db, 'taskSubmissions'), where('status', '==', 'pending'));
    const unsub = onSnapshot(q, (snapshot) => {
      setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'taskSubmissions');
    });

    return () => unsub();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (taskForm.tasks.length === 0) {
      toast.error('Please add at least one task');
      return;
    }
    if (taskForm.targetRoles.length === 0) {
       toast.error('Please select at least one role');
       return;
    }

    try {
      const batchRequests = taskForm.tasks.map((taskItem: any) => {
        return addDoc(collection(db, 'tasks'), {
          ...taskItem,
          venture: taskForm.venture,
          targetRoles: taskForm.targetRoles,
          status: 'active',
          weekNumber: weekSelectorObj.weekNumber,
          weekStartDate: Timestamp.fromDate(weekSelectorObj.monday),
          weekEndDate: Timestamp.fromDate(weekSelectorObj.sunday),
          assignedWeek: weekSelectorObj.assignedWeek,
          isWeeklyBatch: true,
          createdAt: serverTimestamp()
        });
      });
      await Promise.all(batchRequests);

      // Create an announcement
      await addDoc(collection(db, 'announcements'), {
          title: `New tasks available!`,
          content: `New tasks are available for ${taskForm.venture} this week!`,
          targetAudience: 'By Venture',
          targetVenture: taskForm.venture,
          type: 'info',
          createdAt: serverTimestamp(),
          authorId: 'system',
          authorName: 'System'
      });

      toast.success('Weekly Task Batch broadcasted! 🚀');
      setTaskForm({
        venture: 'BuyRix',
        targetRoles: [],
        weekDateStr: format(new Date(), 'yyyy-MM-dd'),
        tasks: []
      });
      setActiveTab('review');
    } catch (error) {
      toast.error('Failed to create tasks');
    }
  };

  const addTaskToBatch = () => {
    if (taskForm.tasks.length >= 7) {
      toast.error('Maximum 7 tasks per week');
      return;
    }
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    setTaskForm({
      ...taskForm,
      tasks: [...taskForm.tasks, {
        title: '',
        description: '',
        earningAmount: '',
        dayAssigned: days[taskForm.tasks.length % 7],
        proofType: 'Image'
      }]
    });
  };

  const updateTaskInBatch = (index: number, field: string, value: any) => {
     const newTasks = [...taskForm.tasks];
     newTasks[index] = { ...newTasks[index], [field]: value };
     setTaskForm({ ...taskForm, tasks: newTasks });
  };
  
  const removeTaskFromBatch = (index: number) => {
     setTaskForm({ ...taskForm, tasks: taskForm.tasks.filter((_, i) => i !== index) });
  };

  const handleApprove = async (submission: any) => {
    try {
      const userRef = doc(db, 'users', submission.workerId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : null;

      let extraUpdate = {};
      
      if (userData && !userData.firstTaskDone) {
        // Unlock welcome incentive
        extraUpdate = {
          firstTaskDone: true,
          'wallets.earned': increment((submission.earningAmount || 0) + (userData.incentiveAmount || 0)),
          'wallets.pending': increment(-(userData.incentiveAmount || 0)),
          incentiveRevealed: true
        };
      } else {
        extraUpdate = {
          'wallets.earned': increment(submission.earningAmount || 0)
        };
      }

      // 1. Update submission status
      await updateDoc(doc(db, 'taskSubmissions', submission.id), {
        status: 'approved',
        reviewedAt: serverTimestamp()
      });

      // 2. Credit worker's earned wallet & trigger first task logic
      await updateDoc(userRef, extraUpdate);

      toast.success(`Approval successful! ₹${submission.earningAmount} credited to ${submission.workerName}`);
      if (userData && !userData.firstTaskDone) {
        // Create an announcement/notification for the worker
        await addDoc(collection(db, 'announcements'), {
          title: 'Welcome Incentive Unlocked!',
          content: 'Your Welcome Incentive has been unlocked and added to your earned wallet. Keep up the great work!',
          targetAudience: 'By Worker',
          targetWorkerId: submission.workerId,
          type: 'success',
          createdAt: serverTimestamp(),
          authorId: 'system',
          authorName: 'System'
        });
        toast(`Unlocked Welcome Incentive for ${submission.workerName}!`, { icon: '🎁' });
      }
    } catch (error) {
      toast.error('Approval failed');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      await updateDoc(doc(db, 'taskSubmissions', selectedSubmission.id), {
        status: 'rejected',
        rejectionReason,
        reviewedAt: serverTimestamp()
      });
      toast.success('Submission rejected');
      setSelectedSubmission(null);
      setRejectionReason('');
    } catch (error) {
      toast.error('Rejection failed');
    }
  };

  const [aiReviewingId, setAiReviewingId] = useState<string | null>(null);

  const handleAIReview = async (submission: any) => {
    setAiReviewingId(submission.id);
    const reviewProofContent = httpsCallable(functions, 'reviewProofContent');
    try {
      const result: any = await reviewProofContent({
        proofText: submission.proofData,
        proofType: submission.proofType,
        venture: submission.venture || 'General' // Provide fallback if missing
      });

      const data = result.data;
      if (data.status === 'rejected') {
        setSelectedSubmission(submission);
        setRejectionReason(`AI Auto-Reject: ${data.reason}`);
        toast('AI rejected the proof. Please review reason.', { icon: '🤖' });
      } else {
        toast.success(`AI Note: ${data.reason}`, { icon: '🤖' });
      }
    } catch (error) {
      console.error(error);
      toast.error('AI Review failed to process');
    } finally {
      setAiReviewingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Mission Control</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Deploy goals & validate proof of execution</p>
        </div>

        <div className="flex bg-[#111111] border border-[#2A2A2A] rounded-2xl p-1.5 self-start">
          <button 
            onClick={() => setActiveTab('review')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === 'review' ? 'bg-[#E8B84B] text-black shadow-lg shadow-[#E8B84B]/20' : 'text-gray-500 hover:text-white'
            }`}
          >
            Review ({submissions.length})
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === 'create' ? 'bg-[#E8B84B] text-black shadow-lg shadow-[#E8B84B]/20' : 'text-gray-500 hover:text-white'
            }`}
          >
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111111] border border-[#2A2A2A] rounded-[40px] p-6 md:p-10 max-w-4xl"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[#2A2A2A] pb-6">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Create Weekly Task Batch</h2>
              <p className="text-gray-500 text-xs mt-1">Assign tasks for specific days of the week</p>
            </div>
            <div className="flex items-center gap-4 bg-[#1A1A1A] p-2 rounded-2xl border border-[#2A2A2A]">
               <button onClick={() => handleWeekChange(-1)} className="p-2 hover:bg-[#2A2A2A] rounded-xl"><Plus className="rotate-45" size={16} /></button>
               <span className="text-xs font-bold text-white">{weekSelectorObj.label}</span>
               <button onClick={() => handleWeekChange(1)} className="p-2 hover:bg-[#2A2A2A] rounded-xl"><Plus size={16} /></button>
            </div>
          </div>

          <form onSubmit={handleCreateTask} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Venture</label>
                <select 
                  value={taskForm.venture}
                  onChange={e => {
                    const newVenture = e.target.value;
                    setTaskForm({...taskForm, venture: newVenture, targetRoles: []});
                  }}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-5 py-3 rounded-2xl focus:border-[#E8B84B] outline-none appearance-none"
                >
                  {ventures.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Target Roles</label>
                <div className="flex flex-wrap gap-2">
                  {getRolesByVenture(taskForm.venture).map((role: string) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        const updated = taskForm.targetRoles.includes(role) 
                          ? taskForm.targetRoles.filter(r => r !== role)
                          : [...taskForm.targetRoles, role];
                        setTaskForm({...taskForm, targetRoles: updated});
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        taskForm.targetRoles.includes(role) 
                          ? 'bg-[#E8B84B] border-[#E8B84B] text-black shadow-lg shadow-[#E8B84B]/20' 
                          : 'bg-[#1A1A1A] border-[#2A2A2A] text-gray-500 hover:border-gray-600'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Weekly Tasks ({taskForm.tasks.length}/7)</label>
                 <button type="button" onClick={addTaskToBatch} className="text-xs font-bold text-[#E8B84B] flex items-center gap-1"><Plus size={14} /> Add Task</button>
               </div>
               
               {taskForm.tasks.map((taskItem, idx) => (
                  <div key={idx} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 space-y-4 relative">
                     <button type="button" onClick={() => removeTaskFromBatch(idx)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500"><X size={16} /></button>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Task Title</label>
                          <input type="text" value={taskItem.title} onChange={e => updateTaskInBatch(idx, 'title', e.target.value)} required className="w-full bg-[#111111] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-xl text-sm outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Day Assigned</label>
                          <select value={taskItem.dayAssigned} onChange={e => updateTaskInBatch(idx, 'dayAssigned', e.target.value)} className="w-full bg-[#111111] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-xl text-sm outline-none">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Payout (₹)</label>
                          <input type="number" value={taskItem.earningAmount} onChange={e => updateTaskInBatch(idx, 'earningAmount', parseFloat(e.target.value))} required className="w-full bg-[#111111] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-xl text-sm outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Proof Type</label>
                          <select value={taskItem.proofType} onChange={e => updateTaskInBatch(idx, 'proofType', e.target.value)} className="w-full bg-[#111111] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-xl text-sm outline-none">
                            {['Image', 'Link', 'Text'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Instructions</label>
                        <textarea rows={2} value={taskItem.description} onChange={e => updateTaskInBatch(idx, 'description', e.target.value)} required className="w-full bg-[#111111] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-xl text-sm outline-none resize-none" />
                     </div>
                  </div>
               ))}
               {taskForm.tasks.length === 0 && (
                 <div className="text-center py-10 border border-dashed border-[#2A2A2A] rounded-2xl text-gray-500 text-sm">
                    No tasks added. Click "Add Task" to start building this week's batch.
                 </div>
               )}
            </div>

            <div className="pt-6 border-t border-[#2A2A2A] flex justify-end gap-4">
              <button 
                type="button" 
                onClick={() => setActiveTab('review')}
                className="px-8 py-3 text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors"
              >
                Discard Draft
              </button>
              <button 
                type="submit"
                className="bg-[#E8B84B] text-black px-12 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-[#E8B84B]/20"
              >
                Publish Week's Tasks
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div className="h-64 bg-[#111111] animate-pulse rounded-[40px]" />
          ) : submissions.length === 0 ? (
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-[40px] p-20 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center text-gray-700 mb-6">
                <Check size={40} />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Queue is Clear</h3>
              <p className="text-gray-500 text-sm mt-1">No pending task submissions for review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {submissions.map((sub, idx) => (
                <motion.div 
                  key={sub.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[#111111] border border-[#2A2A2A] rounded-[32px] p-6 hover:border-gray-700 transition-all flex flex-col md:flex-row items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#E8B84B]">
                      {sub.proofType === 'Image' ? <ImageIcon size={20} /> : sub.proofType === 'Link' ? <LinkIcon size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">{sub.taskTitle}</h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Submitted by <span className="text-[#E8B84B]">{sub.workerName}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Earning</p>
                      <p className="text-sm font-black text-[#10B981]">{formatCurrency(sub.earningAmount || 0)}</p>
                    </div>
                    <div className="text-center border-l border-[#2A2A2A] pl-8">
                      <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Timestamp</p>
                      <p className="text-xs font-bold text-white">{sub.submittedAt ? format(sub.submittedAt.toDate(), 'HH:mm | dd MMM') : 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleAIReview(sub)}
                      disabled={aiReviewingId === sub.id}
                      className="px-4 py-2.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {aiReviewingId === sub.id ? <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : <Bot size={14} />}
                      AI Review
                    </button>
                    <button 
                      onClick={() => {
                        if(sub.proofType === 'Link' || sub.proofType === 'Image') {
                          window.open(sub.proofData, '_blank');
                        } else {
                          toast(sub.proofData, { icon: '📝', duration: 5000 });
                        }
                      }}
                      className="px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] text-gray-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                      <ExternalLink size={12} /> View Proof
                    </button>
                    <button 
                      onClick={() => handleApprove(sub)}
                      className="px-4 py-2.5 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#10B981]/20 transition-all flex items-center gap-2"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button 
                      onClick={() => setSelectedSubmission(sub)}
                      className="px-4 py-2.5 bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#EF4444]/20 transition-all flex items-center gap-2"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSubmission(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#111111] border border-[#2A2A2A] p-8 rounded-[40px] z-[90] shadow-2xl"
            >
              <h3 className="text-xl font-black text-[#EF4444] uppercase tracking-tighter mb-4">Rejection Protocol</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Task submission for <span className="text-white font-black underline">{selectedSubmission.taskTitle}</span> is being discarded. Please specify the invalidity reason.
              </p>
              
              <div className="space-y-4">
                <textarea 
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. Broken link, Blurry screenshot, Wrong task performed..."
                  className="w-full bg-black border border-[#2A2A2A] text-white px-5 py-4 rounded-2xl text-xs font-bold focus:border-[#EF4444] outline-none resize-none"
                />
                
                <div className="flex gap-4 pt-2">
                  <button 
                    onClick={() => setSelectedSubmission(null)}
                    className="flex-1 bg-white/5 text-gray-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleReject}
                    className="flex-1 bg-[#EF4444] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-[#EF4444]/20"
                  >
                    Confirm Reject
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
