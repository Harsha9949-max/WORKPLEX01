import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useAI } from '../../hooks/useAI';
import AIReviewStatus from '../ai/AIReviewStatus';
import toast from 'react-hot-toast';

export default function ProofSubmissionModal() {
  const { taskId } = useParams();
  const { currentUser, userData } = useAuth();
  const { callAI, loading: aiLoading } = useAI();
  const navigate = useNavigate();
  const [proofText, setProofText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiStatus, setAiStatus] = useState<'analyzing' | 'rejected' | 'pending_admin' | 'idle'>('idle');
  const [aiReason, setAiReason] = useState('');

  const handleSubmit = async () => {
    if (!taskId || !currentUser || !userData) return;
    if (!proofText && !file) {
      toast.error('Please provide proof text or a file');
      return;
    }

    setAiStatus('analyzing');
    
    // 1. AI Review
    const aiResult = await callAI('reviewProofContent', {
      proofText,
      proofType: file ? 'image' : 'text',
      venture: userData.venture
    }) as { status: string; reason: string } | null;

    if (aiResult?.status === 'rejected') {
      setAiStatus('rejected');
      setAiReason(aiResult.reason);
      toast.error('AI rejected your proof. Please improve it.');
      return;
    }

    setAiStatus('pending_admin');
    if (aiResult) setAiReason(aiResult.reason);

    setUploading(true);
    
    try {
      let proofUrl = '';
      if (file) {
        const storageRef = ref(storage, `proofs/${currentUser.uid}/${taskId}/${Date.now()}.jpg`);
        await uploadBytes(storageRef, file);
        proofUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'taskSubmissions'), {
        taskId,
        workerId: currentUser.uid,
        workerName: userData.name,
        proofUrl,
        proofText,
        status: 'pending',
        aiReview: aiResult || { status: 'pending_admin', reason: 'Manual review only' },
        submittedAt: serverTimestamp(),
        resubmissionCount: 0
      });

      toast.success('Proof submitted successfully!');
      setTimeout(() => navigate('/tasks'), 2000);
    } catch (error) {
      toast.error('Submission failed');
      setAiStatus('idle');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 flex flex-col gap-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-black tracking-tight">Submit Your Proof</h2>
        <p className="text-gray-500 text-sm font-medium">Ensure your proof is clear and relevant to the task.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Proof Text / Link</label>
          <textarea 
            className="w-full bg-[#111111] border border-white/10 rounded-2xl p-4 min-h-[150px] focus:border-[#E8B84B] focus:ring-1 focus:ring-[#E8B84B] outline-none transition-all"
            placeholder="Explain what you did or paste the link here..."
            value={proofText}
            onChange={(e) => setProofText(e.target.value)}
            disabled={uploading || aiLoading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Screenshot (Optional)</label>
          <div className="relative group">
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
              className="hidden" 
              id="file-upload"
              disabled={uploading || aiLoading}
            />
            <label 
              htmlFor="file-upload"
              className="flex items-center justify-center w-full p-8 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-[#E8B84B]/50 hover:bg-white/5 transition-all"
            >
              <span className="text-gray-500 font-bold">{file ? file.name : 'Click to upload screenshot'}</span>
            </label>
          </div>
        </div>
      </div>

      <AIReviewStatus status={aiStatus} reason={aiReason} />

      <button 
        onClick={handleSubmit} 
        disabled={uploading || aiLoading}
        className={`
          w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all
          ${uploading || aiLoading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-[#E8B84B] text-black hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#E8B84B]/20'}
        `}
      >
        {uploading ? 'Uploading...' : aiLoading ? 'AI Reviewing...' : 'Confirm & Submit'}
      </button>
    </div>
  );
}
