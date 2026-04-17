import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatCurrency, getVentureColor } from '../../utils/taskUtils';
import CountdownTimer from './CountdownTimer';
import { ArrowLeft, Info, Camera, Link as LinkIcon, FileText } from 'lucide-react';

export default function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<any>(null);

  useEffect(() => {
    if (!taskId) return;
    getDoc(doc(db, 'tasks', taskId)).then(doc => {
      if (doc.exists()) setTask({ id: doc.id, ...doc.data() });
    });
  }, [taskId]);

  if (!task) return <div className="p-4 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 pb-24">
      <button onClick={() => navigate(-1)} className="mb-6"><ArrowLeft /></button>
      
      <div className="text-center mb-8">
        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${getVentureColor(task.venture)}`}>
          {task.venture}
        </span>
        <h1 className="text-2xl font-bold mt-2">{task.title}</h1>
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 text-center mb-6">
        <p className="text-gray-400 text-sm mb-2">Earn on approval</p>
        <p className="text-[#E8B84B] font-black text-5xl">{formatCurrency(task.earnAmount)}</p>
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 mb-6">
        <h2 className="font-bold mb-2 flex items-center gap-2"><Info size={18} /> Instructions</h2>
        <p className="text-gray-400 text-sm">{task.description}</p>
      </div>

      <button 
        className="w-full bg-[#E8B84B] text-black font-bold py-4 rounded-xl"
        onClick={() => navigate(`/tasks/${taskId}/submit`)}
      >
        Submit Proof
      </button>
    </div>
  );
}
