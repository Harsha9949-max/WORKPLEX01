import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, addDoc, increment, serverTimestamp, Timestamp, getDoc } from 'firebase/firestore';
import { db, functions } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { Plus, Check, X, ExternalLink, Image as ImageIcon, FileText, Link as LinkIcon, Bot } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import { formatCurrency, safeFormatDate } from '../../utils/format';
import { format } from 'date-fns';
import MissionTracking from '../../components/admin/MissionTracking';

export default function TaskManagement() {
  const [activeTab, setActiveTab] = useState<'create' | 'review' | 'tracking'>('review');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [allWorkers, setAllWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [aiReviewingId, setAiReviewingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'taskSubmissions'), where('status', '==', 'pending'));
    const unsub = onSnapshot(q, (snapshot) => {
      setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (activeTab === 'tracking') {
      const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => setAllTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
      const unsubWorkers = onSnapshot(collection(db, 'users'), (snapshot) => setAllWorkers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
      const unsubAllSubs = onSnapshot(collection(db, 'taskSubmissions'), (snapshot) => setAllSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
      return () => { unsubTasks(); unsubWorkers(); unsubAllSubs(); };
    }
  }, [activeTab]);

  const handleApprove = async (submission: any) => {
    await updateDoc(doc(db, 'taskSubmissions', submission.id), { status: 'approved', reviewedAt: serverTimestamp() });
    await updateDoc(doc(db, 'users', submission.workerId), { 'wallets.earned': increment(submission.earningAmount || 0) });
    toast.success('Approved!');
  };

  const handleReject = async () => {
    await updateDoc(doc(db, 'taskSubmissions', selectedSubmission.id), { status: 'rejected', rejectionReason, reviewedAt: serverTimestamp() });
    toast.success('Rejected');
    setSelectedSubmission(null);
  };

  const handleAIReview = async (submission: any) => {
     setAiReviewingId(submission.id);
     // ... mock AI logic ...
     setAiReviewingId(null);
  };

  return (
    <div className="space-y-8 pb-20 p-8 text-white">
      <h1 className="text-3xl font-black uppercase tracking-tighter">Mission Control</h1>
      
      <div className="flex gap-4">
        {['review', 'tracking', 'create'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2 rounded-xl text-xs font-black uppercase ${activeTab === tab ? 'bg-[#E8B84B] text-black': 'bg-[#111111]'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'create' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#111111] p-8 rounded-3xl">
          <h2 className="text-xl font-black text-white uppercase mb-6">Create New Mission</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await addDoc(collection(db, 'tasks'), {
              title: formData.get('title'),
              description: formData.get('desc'),
              earningAmount: Number(formData.get('amount')),
              createdAt: serverTimestamp(),
              status: 'active'
            });
            toast.success('Mission created!');
          }} className="space-y-4">
            <input name="title" placeholder="Mission Title" className="w-full bg-black p-4 rounded-xl text-white" required />
            <textarea name="desc" placeholder="Description" className="w-full bg-black p-4 rounded-xl text-white" required />
            <input name="amount" type="number" placeholder="Earning Amount" className="w-full bg-black p-4 rounded-xl text-white" required />
            <button type="submit" className="bg-[#E8B84B] text-black px-6 py-3 rounded-xl font-black uppercase text-xs">Create</button>
          </form>
        </motion.div>
      )}

      {activeTab === 'tracking' && (
        <div className="bg-[#111111] p-8 rounded-3xl">
            <h2 className="text-xl font-black text-white uppercase mb-6">Manage Missions</h2>
            <div className="grid grid-cols-1 gap-4">
                {allTasks.map(task => (
                    <div key={task.id} className="bg-[#1A1A1A] p-4 rounded-xl flex justify-between items-center border border-white/5">
                        <div className="text-white">
                            <p className="font-bold">{task.title}</p>
                            <p className="text-xs text-gray-500">{task.description}</p>
                        </div>
                        <button onClick={async () => {
                             await updateDoc(doc(db, 'tasks', task.id), { status: 'archived' });
                             toast.success('Task Archived');
                        }} className="bg-red-900/20 text-red-400 px-4 py-2 rounded-lg font-black text-xs uppercase">Archive</button>
                    </div>
                ))}
            </div>
        </div>
      )}
      
      {activeTab === 'review' && (
        <div className="grid grid-cols-1 gap-4">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-[#111111] p-6 rounded-3xl flex justify-between">
              <div>{sub.taskTitle}</div>
              <div className="flex gap-2">
                <button onClick={() => handleApprove(sub)} className="bg-green-600 px-4 py-2 rounded-lg">Approve</button>
                <button onClick={() => setSelectedSubmission(sub)} className="bg-red-600 px-4 py-2 rounded-lg">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-[#111111] p-8 rounded-3xl w-96">
            <textarea className="w-full bg-black p-4 rounded-xl" onChange={e => setRejectionReason(e.target.value)} placeholder="Reason" />
            <button onClick={handleReject} className="bg-red-600 w-full mt-4 p-4 rounded-xl">Confirm Reject</button>
          </div>
        </div>
      )}
    </div>
  );
}
