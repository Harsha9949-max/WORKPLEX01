import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  increment, 
  serverTimestamp, 
  Timestamp, 
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Plus, 
  Check, 
  X, 
  ExternalLink, 
  Image as ImageIcon, 
  FileText, 
  Link as LinkIcon, 
  Trash2, 
  Edit3, 
  Calendar, 
  Layers, 
  Users, 
  CheckSquare, 
  Clock, 
  TrendingUp, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/format';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';

interface DraftMission {
  id: string;
  title: string;
  description: string;
  reward: number;
}

export default function TaskManagement() {
  // Navigation tab: 'create' for compiling weekly/custom batches, 'review' for validating proofs, 'tracking' for managing existing tasks
  const [activeTab, setActiveTab] = useState<'create' | 'review' | 'tracking'>('create');
  
  // Database States
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [allWorkers, setAllWorkers] = useState<any[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Draft Creation State
  const [timeframeType, setTimeframeType] = useState<'weekly' | 'custom'>('weekly');
  
  // Calculate default Monday and Sunday for the current week
  const today = new Date();
  const defaultStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const defaultEnd = endOfWeek(today, { weekStartsOn: 1 });     // Sunday
  
  const [startDateStr, setStartDateStr] = useState(format(defaultStart, 'yyyy-MM-dd'));
  const [endDateStr, setEndDateStr] = useState(format(defaultEnd, 'yyyy-MM-dd'));
  
  const [selectedVenture, setSelectedVenture] = useState<string>('BuyRix');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['MARKETER']);
  const [draftMissions, setDraftMissions] = useState<DraftMission[]>([]);
  
  // Modal toggle state to insert a single mission to the drafted array
  const [showAddMissionModal, setShowAddMissionModal] = useState(false);
  const [newMissionForm, setNewMissionForm] = useState({
    title: '',
    description: '',
    reward: 100
  });

  // Review & Approval States
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Edit Mission States
  const [editingTask, setEditingTask] = useState<any | null>(null);

  const venturesList = ['BuyRix', 'Vyuma', 'Zaestify', 'Growplex', 'All'];
  const rolesList = ['MARKETER', 'CONTENT CREATOR', 'RESELLER', 'PARTNER'];

  // Subscriptions setup
  useEffect(() => {
    // 1. Pending Submissions
    const submissionsQ = query(collection(db, 'taskSubmissions'), where('status', '==', 'pending'));
    const unsubSubmissions = onSnapshot(submissionsQ, (snapshot) => {
      setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // 2. All Tasks (for tracking)
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
       const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
       setAllTasks(taskList);
    });

    // 3. All Workers (for calculations)
    const unsubWorkers = onSnapshot(collection(db, 'users'), (snapshot) => {
       setAllWorkers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. All Submissions (for analytics)
    const unsubAllSubs = onSnapshot(collection(db, 'taskSubmissions'), (snapshot) => {
       setAllSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubSubmissions();
      unsubTasks();
      unsubWorkers();
      unsubAllSubs();
    };
  }, []);

  // Format Helper to show dates cleanly like: "Week of 08 Jun to 14 Jun"
  const getFormattedTimeframe = () => {
     try {
       const start = new Date(startDateStr);
       const end = new Date(endDateStr);
       return `Week of ${format(start, 'dd MMM')} to ${format(end, 'dd MMM')}`;
     } catch (_) {
       return "Select valid dates";
     }
  };

  // Roles Selector Toggle
  const toggleRoleSelection = (role: string) => {
     if (selectedRoles.includes(role)) {
        if (selectedRoles.length > 1) {
           setSelectedRoles(selectedRoles.filter(r => r !== role));
        } else {
           toast.error("Choose at least one target role.");
        }
     } else {
        setSelectedRoles([...selectedRoles, role]);
     }
  };

  // Add Single Mission to drafting array
  const handleAddMissionToDraft = (e: React.FormEvent) => {
     e.preventDefault();
     if (!newMissionForm.title.trim() || !newMissionForm.description.trim()) {
        toast.error('Please fill in title and description');
        return;
     }
     const newDraft: DraftMission = {
        id: Math.random().toString(36).substr(2, 9),
        title: newMissionForm.title,
        description: newMissionForm.description,
        reward: Number(newMissionForm.reward)
     };
     setDraftMissions([...draftMissions, newDraft]);
     setNewMissionForm({ title: '', description: '', reward: 100 });
     setShowAddMissionModal(false);
     toast.success('Mission added to your draft batch!');
  };

  // Remove Draft Mission
  const removeDraftMission = (id: string) => {
     setDraftMissions(draftMissions.filter(m => m.id !== id));
     toast.success('Draft mission removed');
  };

  // Publish Draft Pack to Firestore
  const handlePublishBatch = async () => {
     if (draftMissions.length === 0) {
        toast.error('Add at least one mission to publish.');
        return;
     }

     const startD = new Date(startDateStr);
     const endD = new Date(endDateStr);
     endD.setHours(23, 59, 59, 999); // absolute end of day

     toast.loading('Publishing missions globally...', { id: 'publish_loader' });

     try {
        for (const mission of draftMissions) {
           await addDoc(collection(db, 'tasks'), {
              title: mission.title,
              description: mission.description,
              reward: mission.reward,
              earningAmount: mission.reward, // Support legacy/alternate reward attributes
              venture: selectedVenture,
              targetRoles: selectedRoles,
              createdAt: serverTimestamp(),
              expiresAt: Timestamp.fromDate(endD),
              timeframe: getFormattedTimeframe(),
              status: 'active'
           });
        }
        
        // Reset Draft parameters
        setDraftMissions([]);
        toast.success(`Published ${draftMissions.length} missions successfully! 🚀`, { id: 'publish_loader' });
        setActiveTab('tracking'); // Redirect to management
     } catch (err) {
        console.error(err);
        toast.error('Failed to deploy batch. Try again.', { id: 'publish_loader' });
     }
  };

  // Approval Process
  const handleApproveSubmission = async (sub: any) => {
     if (isSubmittingApproval) return;
     setIsSubmittingApproval(true);
     
     try {
        await updateDoc(doc(db, 'taskSubmissions', sub.id), { 
           status: 'approved', 
           reviewedAt: serverTimestamp() 
        });

        // Award reward coins to user balance
        const reward = sub.reward || sub.earningAmount || 50;
        await updateDoc(doc(db, 'users', sub.workerId), { 
           'wallets.earned': increment(reward) 
        });

        toast.success(`Submission approved! ${formatCurrency(reward)} credited.`);
        setSelectedSubmission(null);
     } catch (e) {
        toast.error('Failed to approve submission');
     } finally {
        setIsSubmittingApproval(false);
     }
  };

  // Rejection Process
  const handleRejectSubmission = async () => {
     if (!rejectionReason.trim()) {
        toast.error('Rejection reason is required');
        return;
     }
     if (isSubmittingApproval) return;
     setIsSubmittingApproval(true);

     try {
        await updateDoc(doc(db, 'taskSubmissions', selectedSubmission.id), { 
           status: 'rejected', 
           rejectionReason, 
           reviewedAt: serverTimestamp() 
        });
        toast.success('Submission rejected with reason provided');
        setSelectedSubmission(null);
        setRejectionReason('');
     } catch (e) {
        toast.error('Failed to reject submission');
     } finally {
        setIsSubmittingApproval(false);
     }
  };

  // Update Existing task
  const handleSaveTaskEdit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!editingTask) return;
     
     try {
        await updateDoc(doc(db, 'tasks', editingTask.id), {
           title: editingTask.title,
           description: editingTask.description,
           reward: Number(editingTask.reward),
           earningAmount: Number(editingTask.reward),
           venture: editingTask.venture,
           targetRoles: editingTask.targetRoles
        });
        toast.success('Mission settings updated!');
        setEditingTask(null);
     } catch (c) {
        toast.error('Failed to update task settings');
     }
  };

  // Instantly Delete or Archive Task
  const handleDeleteTask = async (taskId: string) => {
     if (!window.confirm('Are you sure you want to delete this mission? This removes it instantly from workers dashboards!')) {
        return;
     }
     try {
        await updateDoc(doc(db, 'tasks', taskId), { status: 'archived' });
        // Alternatively delete completely: await deleteDoc(doc(db, 'tasks', taskId));
        toast.success('Mission deleted & archived successfully.');
     } catch (f) {
        toast.error('Failed to delete mission');
     }
  };

  return (
    <div className="space-y-10 pb-24 p-2 sm:p-6 text-white font-sans max-w-7xl mx-auto">
      {/* 1. STYLISH HEADER BLOCK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-[#2A2A2A]/40">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white flex items-center gap-3">
             MISSION CONTROL
          </h1>
          <p className="text-gray-500 text-xs font-black uppercase tracking-widest mt-1">
             DEPLOY GOALS & VALIDATE PROOF OF EXECUTION
          </p>
        </div>

        {/* TOP RIGHT NAVIGATION BUTTONS ACCORDING TO SCREENSHOT STYLE */}
        <div className="flex items-center gap-4">
          <button 
             onClick={() => setActiveTab('review')}
             className={`px-5 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-2 border transition-all ${
               activeTab === 'review'
                 ? 'bg-[#E8B84B]/10 border-[#E8B84B] text-[#E8B84B] shadow-lg shadow-[#E8B84B]/5'
                 : 'bg-[#111111] border-[#2A2A2A] text-gray-400 hover:border-gray-700'
             }`}
          >
             REVIEW ({submissions.length})
          </button>

          <button 
             onClick={() => setActiveTab('tracking')}
             className={`px-5 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-2 border transition-all ${
               activeTab === 'tracking'
                 ? 'bg-[#E8B84B]/10 border-[#E8B84B] text-[#E8B84B] shadow-lg shadow-[#E8B84B]/5'
                 : 'bg-[#111111] border-[#2A2A2A] text-gray-400 hover:border-gray-700'
             }`}
          >
             TRACKING & MANAGE
          </button>

          <button 
             onClick={() => setActiveTab('create')}
             className={`px-6 py-3 bg-[#E8B84B] text-black hover:bg-[#d6a537] rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-xl shadow-[#E8B84B]/10 flex items-center gap-2 transition-all`}
          >
             <Plus size={16} strokeWidth={3} /> NEW MISSION
          </button>
        </div>
      </div>

      {/* 2. TAB TRANSITION SCENE */}
      <AnimatePresence mode="wait">
         {activeTab === 'create' && (
            <motion.div 
               key="create_section"
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               transition={{ duration: 0.2 }}
               className="bg-[#111111] border border-[#2A2A2A] rounded-[40px] p-6 sm:p-10 max-w-4xl"
            >
               {/* Weekly Pack Config */}
               <div className="flex flex-col sm:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-[#2A2A2A]">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">CREATE WEEKLY MISSION BATCH</h2>
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mt-1">Assign missions for specific days of the current week</p>
                  </div>
                  
                  {/* Calendar / Custom range options */}
                  <div className="flex bg-black p-1 rounded-xl border border-[#2A2A2A] self-start sm:self-auto">
                     <button 
                        type="button"
                        onClick={() => {
                           setTimeframeType('weekly');
                           setStartDateStr(format(defaultStart, 'yyyy-MM-dd'));
                           setEndDateStr(format(defaultEnd, 'yyyy-MM-dd'));
                        }}
                        className={`px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${timeframeType === 'weekly' ? 'bg-[#E8B84B] text-black' : 'text-gray-500 hover:text-gray-300'}`}
                     >
                        WEEKLY CALENDAR
                     </button>
                     <button 
                        type="button"
                        onClick={() => setTimeframeType('custom')}
                        className={`px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${timeframeType === 'custom' ? 'bg-[#E8B84B] text-black' : 'text-gray-500 hover:text-gray-300'}`}
                     >
                        CUSTOM RANGE
                     </button>
                  </div>
               </div>

               {/* Active Timeframe date fields */}
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-1">ACTIVE TIMEFRAME</label>
                     <div className="bg-black border border-[#2A2A2A] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 bg-[#1A1A1A] border border-[#2A2A2A] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-300">
                           <Calendar size={16} className="text-[#E8B84B]" />
                           <span className="tracking-wide">{getFormattedTimeframe()}</span>
                           <button onClick={() => {
                             // reset dates
                             setStartDateStr(format(defaultStart, 'yyyy-MM-dd'));
                             setEndDateStr(format(defaultEnd, 'yyyy-MM-dd'));
                             setTimeframeType('weekly');
                           }} className="text-gray-500 hover:text-red-400 ml-1">×</button>
                        </div>

                        {timeframeType === 'custom' ? (
                           <div className="flex items-center gap-3 w-full sm:w-auto">
                              <input 
                                type="date" 
                                value={startDateStr}
                                onChange={(e) => setStartDateStr(e.target.value)} 
                                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#E8B84B] outline-none"
                              />
                              <span className="text-gray-500 text-xs">to</span>
                              <input 
                                type="date" 
                                value={endDateStr}
                                onChange={(e) => setEndDateStr(e.target.value)} 
                                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#E8B84B] outline-none"
                              />
                           </div>
                        ) : (
                           <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Automatic current week alignment active</span>
                        )}
                     </div>
                  </div>

                  {/* Venture Select & Target Roles select */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                     {/* Venture selecting */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-1">ASSIGN VENTURE</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                           {venturesList.map(v => (
                              <button
                                 key={v}
                                 type="button"
                                 onClick={() => setSelectedVenture(v)}
                                 className={`py-3 rounded-xl text-[10px] font-black uppercase text-center border transition-all ${
                                    selectedVenture === v 
                                      ? 'bg-[#E8B84B] border-[#E8B84B] text-black font-black'
                                      : 'bg-black border-[#2A2A2A] text-gray-500 hover:border-gray-700'
                                 }`}
                              >
                                 {v}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Target Roles selecting */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-1">TARGET ROLES (MULTI-SELECT)</label>
                        <div className="flex flex-wrap gap-2">
                           {rolesList.map(role => {
                              const isSelected = selectedRoles.includes(role);
                              return (
                                 <button
                                    key={role}
                                    type="button"
                                    onClick={() => toggleRoleSelection(role)}
                                    className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                                       isSelected 
                                         ? 'bg-[#E8B84B]/10 border-[#E8B84B] text-[#E8B84B]'
                                         : 'bg-black border-[#2A2A2A] text-gray-500 hover:border-gray-700'
                                    }`}
                                 >
                                    {role}
                                 </button>
                              );
                           })}
                        </div>
                     </div>
                  </div>

                  {/* Dynamic draft missions header */}
                  <div className="pt-8 border-t border-[#2A2A2A]/60 flex items-center justify-between">
                     <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">
                        WEEKLY MISSIONS ({draftMissions.length}/7)
                     </span>
                     <button
                        type="button"
                        onClick={() => setShowAddMissionModal(true)}
                        className="text-[#E8B84B] hover:text-[#d6a537] text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                     >
                        <Plus size={14} strokeWidth={3} /> Add Mission
                     </button>
                  </div>

                  {/* Empty state or display list */}
                  {draftMissions.length === 0 ? (
                     <div 
                        onClick={() => setShowAddMissionModal(true)}
                        className="border-2 border-dashed border-[#2A2A2A] rounded-2xl p-12 text-center text-gray-500 cursor-pointer hover:border-[#E8B84B]/40 hover:text-gray-400 transition"
                     >
                        <p className="text-xs font-semibold uppercase tracking-wider">No missions added. Click "Add Mission" to start building this week's batch.</p>
                     </div>
                  ) : (
                     <div className="space-y-3">
                        {draftMissions.map((m, idx) => (
                           <div key={m.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 flex items-center justify-between gap-4">
                              <div className="space-y-1">
                                 <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black bg-white/10 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">M{idx+1}</span>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">{m.title}</h4>
                                 </div>
                                 <p className="text-xs text-gray-400 leading-relaxed pr-10">{m.description}</p>
                              </div>
                              <div className="flex items-center gap-4 flex-shrink-0">
                                 <span className="text-[#E8B84B] font-black text-xs font-mono">{formatCurrency(m.reward)} reward</span>
                                 <button 
                                    onClick={() => removeDraftMission(m.id)}
                                    className="p-2.5 bg-black hover:bg-red-950/30 text-gray-500 hover:text-red-400 rounded-lg transition"
                                 >
                                    <Trash2 size={16} />
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}

                  {/* Publishing actions bar matching bottom of screenshot */}
                  <div className="pt-8 border-t border-[#2A2A2A]/40 flex flex-col sm:flex-row items-center justify-end gap-4">
                     <button
                        type="button"
                        onClick={() => {
                           if(window.confirm('Discard drafted batch?')) {
                              setDraftMissions([]);
                              toast.success('Batch Cleared');
                           }
                        }}
                        className="w-full sm:w-auto text-[10px] font-black uppercase text-gray-500 hover:text-white tracking-widest px-6 py-4.5 transition-all text-center"
                     >
                        DISCARD DRAFT
                     </button>
                     <button
                        type="button"
                        onClick={handlePublishBatch}
                        className="w-full sm:w-auto bg-[#E8B84B] hover:bg-[#d6a537] text-black text-[10px] font-black uppercase tracking-widest px-8 py-4.5 rounded-2xl shadow-xl shadow-[#E8B84B]/5 transition-all"
                     >
                        PUBLISH WEEKLY MISSIONS
                     </button>
                  </div>
               </div>
            </motion.div>
         )}

         {/* 3. SUBMISSIONS REVIEW TAB */}
         {activeTab === 'review' && (
            <motion.div 
               key="review_section"
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               transition={{ duration: 0.2 }}
               className="space-y-6"
            >
               <div className="bg-[#111111] border border-[#2A2A2A] rounded-3xl p-6 sm:p-10">
                  <h2 className="text-lg font-black text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                     <CheckSquare size={18} className="text-[#E8B84B]" /> UNDER VERIFICATION ({submissions.length})
                  </h2>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-8">Workers' proof attachments submitted for audit & approval</p>

                  {submissions.length === 0 ? (
                     <div className="py-16 text-center text-gray-500 border border-dashed border-[#2A2A2A] rounded-2xl">
                        <Sparkles size={36} className="mx-auto text-gray-700 mb-4 animate-bounce" />
                        <h4 className="font-bold text-white uppercase text-sm tracking-wider">Platform Clear!</h4>
                        <p className="text-xs text-gray-500 mt-1">No pending validations currently waiting check.</p>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {submissions.map((sub) => (
                           <div key={sub.id} className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-5 flex flex-col justify-between hover:border-gray-800 transition">
                              <div className="space-y-3">
                                 <div className="flex items-center justify-between">
                                    <div>
                                       <h4 className="font-bold text-white text-sm uppercase tracking-tight">{sub.taskTitle}</h4>
                                       <span className="text-[9px] font-semibold text-gray-500">BY {sub.workerName} • REWARD: {formatCurrency(sub.reward || sub.earningAmount || 50)}</span>
                                    </div>
                                    <span className="text-[8px] bg-[#E8B84B]/15 text-[#E8B84B] px-2 py-1 rounded font-black uppercase tracking-widest">
                                       PENDING
                                    </span>
                                 </div>
                                 
                                 <p className="text-xs text-gray-400 line-clamp-3 bg-black/30 p-3 rounded-lg border border-white/[0.02]">
                                    <strong>Worker Note: </strong>{sub.notes || "No notes supplied by worker."}
                                 </p>

                                 {sub.proofUrl && (
                                    <a 
                                       href={sub.proofUrl} 
                                       target="_blank" 
                                       rel="noreferrer"
                                       className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline font-semibold"
                                    >
                                       <LinkIcon size={12} /> View Attached Proof Document <ExternalLink size={10} />
                                    </a>
                                 )}
                              </div>

                              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[#2A2A2A]/40">
                                 <button 
                                    onClick={() => handleApproveSubmission(sub)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition"
                                 >
                                    APPROVE
                                 </button>
                                 <button 
                                    onClick={() => setSelectedSubmission(sub)}
                                    className="flex-1 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition"
                                 >
                                    REJECT
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </motion.div>
         )}

         {/* 4. TRACKING & MANAGEMENT TAB */}
         {activeTab === 'tracking' && (
            <motion.div 
               key="tracking_section"
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               transition={{ duration: 0.2 }}
               className="space-y-8"
            >
               {/* Summary cards with general statistics */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#111111] border border-[#2A2A2A] rounded-3xl p-6 flex flex-col justify-between">
                     <div>
                        <span className="text-[10px] text-[#E8B84B] font-black uppercase tracking-widest">ACTIVE MISSION RUNNERS</span>
                        <h3 className="text-3xl font-black mt-2">{allTasks.filter(t => t.status !== 'archived').length}</h3>
                     </div>
                     <p className="text-[10px] text-gray-500 mt-4 uppercase">Deployed goal parameters in current period</p>
                  </div>

                  <div className="bg-[#111111] border border-[#2A2A2A] rounded-3xl p-6 flex flex-col justify-between">
                     <div>
                        <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">SUBMISSIONS AUDITED</span>
                        <h3 className="text-3xl font-black mt-2">{allSubmissions.filter(s => s.status === 'approved').length}</h3>
                     </div>
                     <p className="text-[10px] text-gray-500 mt-4 uppercase">Total cash bonuses credited safely to workers</p>
                  </div>

                  <div className="bg-[#111111] border border-[#2A2A2A] rounded-3xl p-6 flex flex-col justify-between">
                     <div>
                        <span className="text-[10px] text-rose-400 font-black uppercase tracking-widest">COMPLIANCE DEVIATIONS</span>
                        <h3 className="text-3xl font-black mt-2">{allSubmissions.filter(s => s.status === 'rejected').length}</h3>
                     </div>
                     <p className="text-[10px] text-gray-500 mt-4 uppercase">Tasks returned for review due to poor proof quality</p>
                  </div>
               </div>

               {/* Tracking Table component / list of active tasks */}
               <div className="bg-[#111111] border border-[#2A2A2A] rounded-[32px] p-6 sm:p-8">
                  <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">DEPLOYED ACTIVE MISSIONS</h3>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-6">Modify details or delete/archive active assignments instantly</p>

                  {allTasks.filter(t => t.status !== 'archived').length === 0 ? (
                     <div className="text-center py-16 text-gray-500">
                        No active missions. Draft a weekly batch to start deployment.
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 gap-4">
                        {allTasks.filter(t => t.status !== 'archived').map(task => {
                           const taskSubmissions = allSubmissions.filter(s => s.taskId === task.id);
                           const approvedCount = taskSubmissions.filter(s => s.status === 'approved').length;
                           const pendingCount = taskSubmissions.filter(s => s.status === 'pending').length;
                           
                           return (
                              <div key={task.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-gray-800 transition">
                                 <div className="space-y-2 flex-grow">
                                    <div className="flex flex-wrap items-center gap-2">
                                       <span className="text-[9px] font-black bg-[#E8B84B]/15 text-[#E8B84B] px-2 py-0.5 rounded uppercase tracking-widest">{task.venture || 'All Ventures'}</span>
                                       {task.targetRoles && task.targetRoles.map((r: string) => (
                                          <span key={r} className="text-[9px] font-semibold bg-white/5 text-gray-400 px-2 py-0.5 rounded uppercase">{r}</span>
                                       ))}
                                    </div>
                                    <h4 className="text-base font-black text-white hover:text-[#E8B84B] transition-colors">{task.title}</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">{task.description}</p>
                                    
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Timeframe: {task.timeframe || 'Continuous Access'}</p>
                                 </div>

                                 {/* completion tracking stats */}
                                 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 flex-shrink-0">
                                    <div className="bg-black/30 border border-white/[0.03] px-4 py-3 rounded-xl flex gap-4 text-center">
                                       <div>
                                          <span className="block text-[8px] font-black text-emerald-400 uppercase tracking-widest">APPROVED</span>
                                          <span className="text-sm font-extrabold text-white">{approvedCount}</span>
                                       </div>
                                       <div className="border-l border-[#2A2A2A] pl-4">
                                          <span className="block text-[8px] font-black text-amber-500 uppercase tracking-widest">PENDING</span>
                                          <span className="text-sm font-extrabold text-white">{pendingCount}</span>
                                       </div>
                                    </div>

                                    <div className="flex items-center gap-3 self-end sm:self-auto">
                                       <button
                                          onClick={() => setEditingTask(task)}
                                          className="p-3 bg-black hover:bg-[#E8B84B] text-gray-500 hover:text-black rounded-xl transition-all"
                                          title="Edit Mission Details"
                                       >
                                          <Edit3 size={16} />
                                       </button>
                                       <button
                                          onClick={() => handleDeleteTask(task.id)}
                                          className="p-3 bg-black hover:bg-rose-900/40 text-gray-500 hover:text-rose-400 rounded-xl transition"
                                          title="Delete Mission"
                                       >
                                          <Trash2 size={16} />
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  )}
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* 5. MODAL: ADD MISSION DRAFT FORM */}
      {showAddMissionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
             initial={{ scale: 0.95, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-[#111111] border border-[#2A2A2A] rounded-[32px] p-8 w-full max-w-md shadow-2xl shadow-black"
          >
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-white uppercase tracking-widest">New Mission Draft</h3>
                <button 
                  onClick={() => setShowAddMissionModal(false)}
                  className="text-gray-500 hover:text-white"
                >
                   <X size={20} />
                </button>
             </div>

             <form onSubmit={handleAddMissionToDraft} className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Goal / Name</label>
                   <input 
                      type="text" 
                      value={newMissionForm.title}
                      onChange={e => setNewMissionForm({...newMissionForm, title: e.target.value})}
                      placeholder="E.g. Double order verification process"
                      className="w-full bg-black border border-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:border-[#E8B84B] outline-none text-xs text-semibold"
                      required
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Step-by-step Instructions</label>
                   <textarea 
                      rows={4}
                      value={newMissionForm.description}
                      onChange={e => setNewMissionForm({...newMissionForm, description: e.target.value})}
                      placeholder="Define the task and proof submission requirements clearly..."
                      className="w-full bg-black border border-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:border-[#E8B84B] outline-none text-xs text-semibold resize-none"
                      required
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Reward Coin Amount (Rs)</label>
                   <input 
                      type="number" 
                      value={newMissionForm.reward}
                      onChange={e => setNewMissionForm({...newMissionForm, reward: Number(e.target.value)})}
                      className="w-full bg-black border border-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:border-[#E8B84B] outline-none text-xs text-semibold"
                      required
                   />
                </div>

                <button 
                   type="submit"
                   className="w-full bg-[#E8B84B] hover:bg-[#d6a537] text-black font-black uppercase text-[10px] tracking-widest py-4 rounded-xl transition"
                >
                   ADD TO CURRENT BATCH
                </button>
             </form>
          </motion.div>
        </div>
      )}

      {/* 6. MODAL: APPROVAL WITH REJECTION REASON COMPONENT */}
      {selectedSubmission && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-[#111111] border border-[#2A2A2A] rounded-[32px] p-8 w-full max-w-sm shadow-2xl"
            >
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-red-500 uppercase tracking-widest">Rejection Panel</h3>
                  <button onClick={() => setSelectedSubmission(null)} className="text-gray-500 hover:text-white">
                     <X size={20} />
                  </button>
               </div>

               <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Enter the reason why this submittal is being rejected. The worker will see this reason in their Tasks report and can re-submit if needed.
               </p>

               <div className="space-y-4">
                  <textarea 
                     rows={4}
                     value={rejectionReason}
                     onChange={e => setRejectionReason(e.target.value)}
                     placeholder="E.g. Screenshots show incomplete steps. Please upload correct documents."
                     className="w-full bg-black border border-[#2A2A2A] text-white p-4 rounded-2xl text-xs outline-none focus:border-red-500 resize-none font-medium"
                     required
                  />

                  <div className="flex gap-2">
                     <button 
                        onClick={() => setSelectedSubmission(null)}
                        className="flex-1 bg-black border border-[#2A2A2A] text-gray-400 py-3 rounded-xl text-xs font-bold uppercase"
                     >
                        CANCEL
                     </button>
                     <button 
                        onClick={handleRejectSubmission}
                        className="flex-1 bg-red-650 hover:bg-red-600 bg-red-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest"
                     >
                        REJECT PROOF
                     </button>
                  </div>
               </div>
            </motion.div>
         </div>
      )}

      {/* 7. MODAL: EDIT MISSION FORM */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
             initial={{ scale: 0.95, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-[#111111] border border-[#2A2A2A] rounded-[32px] p-8 w-full max-w-md shadow-2xl"
          >
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-white uppercase tracking-widest">Edit Mission</h3>
                <button onClick={() => setEditingTask(null)} className="text-gray-500 hover:text-white">
                   <X size={20} />
                </button>
             </div>

             <form onSubmit={handleSaveTaskEdit} className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black ml-1">Title</label>
                   <input 
                      type="text" 
                      value={editingTask.title}
                      onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                      className="w-full bg-black border border-[#2A2A2A] text-white px-4 py-3 rounded-xl text-xs font-medium outline-none"
                      required
                   />
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black ml-1">Instructions / Description</label>
                   <textarea 
                      rows={4}
                      value={editingTask.description}
                      onChange={e => setEditingTask({...editingTask, description: e.target.value})}
                      className="w-full bg-black border border-[#2A2A2A] text-white px-4 py-3 rounded-xl text-xs font-medium outline-none resize-none"
                      required
                   />
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black ml-1">Earning Reward (Rs)</label>
                   <input 
                      type="number" 
                      value={editingTask.reward || editingTask.earningAmount}
                      onChange={e => setEditingTask({...editingTask, reward: Number(e.target.value)})}
                      className="w-full bg-black border border-[#2A2A2A] text-white px-4 py-3 rounded-xl text-xs font-medium outline-none"
                      required
                   />
                </div>

                <div className="flex gap-2 pt-4">
                   <button 
                      type="button"
                      onClick={() => setEditingTask(null)}
                      className="flex-1 bg-black border border-[#2A2A2A] text-gray-400 py-3.5 rounded-xl uppercase text-xs font-bold"
                   >
                      CANCEL
                   </button>
                   <button 
                      type="submit"
                      className="flex-1 bg-[#E8B84B] text-black py-3.5 rounded-xl uppercase text-xs font-black tracking-wider hover:opacity-90 transition"
                   >
                      SAVE SETTINGS
                   </button>
                </div>
             </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
