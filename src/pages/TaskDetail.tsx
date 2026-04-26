import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, Info, UploadCloud, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { formatCurrency } from '../utils/taskUtils';

export default function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submissionType, setSubmissionType] = useState<'link' | 'image' | 'text'>('link');
  const [proofData, setProofData] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    const fetchTask = async () => {
      const docRef = doc(db, 'tasks', taskId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setTask({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    };
    fetchTask();
  }, [taskId]);

  const handleSubmitProof = async () => {
    if (!proofData.trim()) {
      toast.error('Please provide proof of completion');
      return;
    }
    setIsSubmitting(true);
    try {
      // Dummy submission logic handling.
      // E.g., updating the task or a subcollection
      await setDoc(doc(db, `tasks/${taskId}/submissions`, currentUser!.uid), {
        workerId: currentUser!.uid,
        workerName: userData?.name,
        type: submissionType,
        proof: proofData,
        status: 'pending_review',
        submittedAt: new Date()
      });
      // Optionally update task status locally
      setTask({ ...task, status: 'completed' }); // optimistic UI
      toast.success('Task submitted successfully!');
      setTimeout(() => navigate('/tasks'), 1500);
    } catch (error) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">Loading task...</div>;
  if (!task) return <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">Task not found</div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans pb-28 text-white max-w-2xl mx-auto">
      {/* HEADER */}
      <div className="sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-md z-40 p-4 border-b border-[#2A2A2A] flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-[#111111] border border-[#2A2A2A] rounded-full hover:bg-[#1A1A1A] transition">
          <ArrowLeft size={18} className="text-gray-400" />
        </button>
        <h1 className="text-[16px] font-black uppercase tracking-tighter truncate">{task.title}</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Task Hero */}
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#111111] border border-[#2A2A2A] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
             <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#E8B84B] mb-1 block">Reward</span>
                <span className="text-4xl font-black text-white">{formatCurrency(task.reward || 50)}</span>
             </div>
             <div className="flex items-center gap-1.5 bg-[#0A0A0A] border border-[#2A2A2A] px-3 py-1.5 rounded-full">
                <Clock size={12} className="text-[#F59E0B]" />
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{task.status === 'completed' ? 'Done' : '24 Hrs Left'}</span>
             </div>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2 leading-tight">{task.title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed">{task.description}</p>
        </div>

        {/* Steps / Requirements */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
              <Info size={14} /> Requirements
           </h3>
           <ul className="space-y-3">
              {(task.steps || ['Post on Instagram story', 'Tag the brand handle', 'Keep it active for 24h']).map((step: string, idx: number) => (
                 <li key={idx} className="flex gap-3 text-sm text-gray-300 font-medium">
                    <span className="shrink-0 w-5 h-5 bg-[#1A1A1A] text-[#E8B84B] rounded-full flex items-center justify-center text-[10px] font-black border border-[#2A2A2A]">{idx + 1}</span>
                    <span className="mt-0.5">{step}</span>
                 </li>
              ))}
           </ul>
        </div>

        {/* Proof Submission */}
        {task.status !== 'completed' ? (
           <div className="bg-[#111111] border border-[#E8B84B]/30 rounded-2xl p-5 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#E8B84B]" />
              <h3 className="text-sm font-black uppercase tracking-widest text-white mb-1 mt-2">Submit Proof</h3>
              <p className="text-xs text-gray-400 mb-4">Provide proof to claim your reward.</p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                 <button onClick={() => setSubmissionType('link')} className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition ${submissionType === 'link' ? 'bg-[#E8B84B]/10 border-[#E8B84B] text-[#E8B84B]' : 'bg-[#1A1A1A] border-[#2A2A2A] text-gray-500'}`}>Link</button>
                 <button onClick={() => setSubmissionType('image')} className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition ${submissionType === 'image' ? 'bg-[#E8B84B]/10 border-[#E8B84B] text-[#E8B84B]' : 'bg-[#1A1A1A] border-[#2A2A2A] text-gray-500'}`}>Image</button>
                 <button onClick={() => setSubmissionType('text')} className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition ${submissionType === 'text' ? 'bg-[#E8B84B]/10 border-[#E8B84B] text-[#E8B84B]' : 'bg-[#1A1A1A] border-[#2A2A2A] text-gray-500'}`}>Text</button>
              </div>

              {submissionType === 'link' && (
                 <input 
                   type="url" 
                   placeholder="https://instagram.com/p/..." 
                   value={proofData}
                   onChange={e => setProofData(e.target.value)}
                   className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3 text-sm text-white focus:border-[#E8B84B] outline-none transition mb-4"
                 />
              )}
              {submissionType === 'image' && (
                 <div className="w-full bg-[#0A0A0A] border border-dashed border-[#2A2A2A] rounded-xl p-6 flex flex-col items-center justify-center mb-4 hover:border-[#E8B84B] transition cursor-pointer">
                    <UploadCloud size={24} className="text-gray-500 mb-2" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tap to upload proof</span>
                 </div>
              )}
              {submissionType === 'text' && (
                 <textarea 
                   rows={3} 
                   placeholder="Describe how you completed the task..."
                   value={proofData}
                   onChange={e => setProofData(e.target.value)}
                   className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3 text-sm text-white focus:border-[#E8B84B] outline-none transition mb-4 resize-none"
                 />
              )}

              <button 
                 onClick={handleSubmitProof}
                 disabled={isSubmitting}
                 className="w-full bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl disabled:opacity-50 hover:bg-[#E8B84B]/90 transition"
              >
                 {isSubmitting ? 'Submitting...' : 'Mark as Done'}
              </button>
           </div>
        ) : (
           <div className="bg-[#00C9A7]/10 border border-[#00C9A7]/30 rounded-2xl p-5 text-center flex flex-col items-center">
              <CheckCircle size={32} className="text-[#00C9A7] mb-2" />
              <h3 className="text-sm font-black uppercase tracking-widest text-white mb-1">Task Completed</h3>
              <p className="text-xs text-[#00C9A7]/80">Proof submitted successfully. Awaiting approval or reward credited.</p>
           </div>
        )}
      </div>
    </div>
  );
}
