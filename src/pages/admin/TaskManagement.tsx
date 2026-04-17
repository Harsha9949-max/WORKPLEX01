import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
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
  Info
} from 'lucide-react';
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
    title: '',
    description: '',
    venture: 'BuyRix',
    targetRoles: [] as string[],
    earningAmount: '',
    deadline: '',
    proofType: 'Image',
    assignedTo: 'All'
  });

  const ventures = ['BuyRix', 'Vyuma', 'TrendyVerse', 'Growplex'];
  const roles = ['Marketer', 'Content Creator', 'Reseller', 'Partner'];

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
    if (!taskForm.title || !taskForm.earningAmount || !taskForm.deadline) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      await addDoc(collection(db, 'tasks'), {
        ...taskForm,
        earningAmount: parseFloat(taskForm.earningAmount),
        deadline: Timestamp.fromDate(new Date(taskForm.deadline)),
        status: 'active',
        createdAt: serverTimestamp()
      });
      toast.success('Task broadcasted to workers! 🚀');
      setTaskForm({
        title: '',
        description: '',
        venture: 'BuyRix',
        targetRoles: [],
        earningAmount: '',
        deadline: '',
        proofType: 'Image',
        assignedTo: 'All'
      });
      setActiveTab('review');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleApprove = async (submission: any) => {
    try {
      // 1. Update submission status
      await updateDoc(doc(db, 'taskSubmissions', submission.id), {
        status: 'approved',
        reviewedAt: serverTimestamp()
      });

      // 2. Credit worker's earned wallet
      await updateDoc(doc(db, 'users', submission.workerId), {
        'wallets.earned': increment(submission.earningAmount || 0)
      });

      // 3. Mark task as done for this user in their profile if needed
      // (This logic would be more complex in production, checking multiple submissions)

      toast.success(`Approval successful! ₹${submission.earningAmount} credited to ${submission.workerName}`);
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
          className="bg-[#111111] border border-[#2A2A2A] rounded-[40px] p-10 max-w-4xl"
        >
          <form onSubmit={handleCreateTask} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Task Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Subscribe & Review TrendyVerse App"
                    value={taskForm.title}
                    onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-5 py-3 rounded-2xl focus:border-[#E8B84B] outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Venture</label>
                  <select 
                    value={taskForm.venture}
                    onChange={e => setTaskForm({...taskForm, venture: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-5 py-3 rounded-2xl focus:border-[#E8B84B] outline-none appearance-none"
                  >
                    {ventures.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Target Roles</label>
                  <div className="flex flex-wrap gap-2">
                    {roles.map(role => (
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

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Payout Amount (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={taskForm.earningAmount}
                      onChange={e => setTaskForm({...taskForm, earningAmount: e.target.value})}
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white pl-10 pr-5 py-3 rounded-2xl focus:border-[#E8B84B] outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Deadline Date</label>
                  <input 
                    type="datetime-local" 
                    value={taskForm.deadline}
                    onChange={e => setTaskForm({...taskForm, deadline: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-5 py-3 rounded-2xl focus:border-[#E8B84B] outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Proof Requirement</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Image', 'Link', 'Text'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setTaskForm({...taskForm, proofType: type})}
                        className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          taskForm.proofType === type 
                            ? 'bg-[#1A1A1A] border-[#E8B84B] text-[#E8B84B] shadow-xl' 
                            : 'bg-[#111111] border-[#2A2A2A] text-gray-600 hover:border-gray-500'
                        }`}
                      >
                        {type === 'Image' && <ImageIcon size={18} />}
                        {type === 'Link' && <LinkIcon size={18} />}
                        {type === 'Text' && <FileText size={18} />}
                        <span className="text-[8px] font-black uppercase tracking-widest">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Task Instructions</label>
              <textarea 
                rows={4}
                placeholder="Detailed steps for the worker to complete the task successfully..."
                value={taskForm.description}
                onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-5 py-4 rounded-[24px] focus:border-[#E8B84B] outline-none resize-none"
                required
              />
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
                Broadcast Task
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
