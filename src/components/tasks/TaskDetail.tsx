import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getVentureColor } from '../../utils/taskUtils';
import CountdownTimer from './CountdownTimer';
import { ArrowLeft, Clock, Info, UploadCloud, Link as LinkIcon, FileText, CheckCircle, Camera, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';

export default function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Submission state
  const [proofText, setProofText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<string[]>(['']);
  const [uploading, setUploading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    getDoc(doc(db, 'tasks', taskId)).then(docSnap => {
      if (docSnap.exists()) {
         setTask({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    });
  }, [taskId]);

  const handleSubmit = async () => {
    if (!taskId || !currentUser || !userData || !task) return;
    
    // Validation based on type
    const proofType = task.proofType || 'text';
    const isCC = userData.role === 'Content Creator';

    if (proofType === 'image') {
      if (isCC && files.length === 0) {
        toast.error('Please upload at least one image proof');
        return;
      } else if (!isCC && !file) {
        toast.error('Please upload an image proof');
        return;
      }
    }
    
    if (proofType === 'link') {
      if (isCC) {
        const validLinks = links.filter(l => l.includes('http'));
        if (validLinks.length === 0) {
          toast.error('Please provide at least one valid URL');
          return;
        }
      } else if (!proofText.includes('http')) {
        toast.error('Please provide a valid URL');
        return;
      }
    }
    
    if (proofType === 'text') {
      const wordCount = proofText.trim().split(/\s+/).length;
      if (isCC && wordCount < 100) {
        toast.error('Please provide at least 100 words for content tasks');
        return;
      } else if (!isCC && proofText.trim().length < 10) {
        toast.error('Please provide more details in your text proof');
        return;
      }
    }

    setUploading(true);
    
    try {
      let proofUrl = '';
      let proofUrls: string[] = [];
      const validLinks = isCC ? links.filter(l => l.includes('http')) : [proofText];

      if (proofType === 'image') {
        if (isCC) {
          for (const f of files) {
            const storageRef = ref(storage, `proofs/${currentUser.uid}/${taskId}/${Date.now()}_${f.name}`);
            await uploadBytes(storageRef, f);
            proofUrls.push(await getDownloadURL(storageRef));
          }
          proofUrl = proofUrls[0] || '';
        } else if (file) {
          const storageRef = ref(storage, `proofs/${currentUser.uid}/${taskId}/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          proofUrl = await getDownloadURL(storageRef);
          proofUrls = [proofUrl];
        }
      }

      await addDoc(collection(db, 'taskSubmissions'), {
        taskId,
        workerId: currentUser.uid,
        workerName: userData.name,
        proofUrl,
        proofUrls: isCC && proofType === 'image' ? proofUrls : [],
        proofText: isCC && proofType === 'link' ? validLinks.join('\n') : proofText,
        proofLinks: isCC && proofType === 'link' ? validLinks : [],
        proofType,
        status: 'submitted',
        aiReview: { status: 'pending_admin', reason: 'Manual review pending' },
        submittedAt: serverTimestamp(),
        resubmissionCount: 0
      });

      setShowConfetti(true);
      toast.success('Proof submitted successfully!');
      
      setTimeout(() => {
         navigate('/tasks');
      }, 2000);
      
    } catch (error) {
       console.error("Submission error", error);
       toast.error('Submission failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-4 text-white min-h-screen bg-[#0A0A0A] flex justify-center items-center">Loading task...</div>;
  if (!task) return <div className="p-4 text-white min-h-screen bg-[#0A0A0A] flex justify-center items-center">Task not found</div>;

  const deadline = task.expiresAt instanceof Timestamp ? task.expiresAt.toDate() : (task.deadline || new Date(Date.now() + 86400000));
  const timeDiff = deadline.getTime() - Date.now();
  const isWarning = timeDiff < 2 * 3600 * 1000 && timeDiff > 0; // Less than 2 hours
  const isExpired = timeDiff <= 0;

  const proofType = task.proofType || 'text';
  const isCC = userData?.role === 'Content Creator';

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
        if (files.length < 5) {
           setFiles([...files, e.target.files[0]]);
        } else {
           toast.error('Maximum 5 images allowed');
        }
     }
  };

  const removeFile = (index: number) => {
     setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 pb-32 font-sans relative overflow-x-hidden w-full max-w-2xl mx-auto">
      {/* Confetti Overlay */}
      {showConfetti && (
         <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/80">
            <div className="text-center animate-bounce">
               <div className="text-6xl mb-4">🎉</div>
               <h2 className="text-[#E8B84B] font-black text-2xl uppercase tracking-widest">Task Submitted!</h2>
            </div>
         </div>
      )}

      {/* Header */}
      <button onClick={() => navigate('/tasks')} className="w-10 h-10 bg-[#111111] border border-[#2A2A2A] rounded-full flex items-center justify-center text-gray-400 hover:text-white transition mb-6">
         <ArrowLeft size={20} />
      </button>

      {/* Hero section */}
      <div className="flex flex-col items-center text-center mb-8">
         <span className={`text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest mb-4 bg-opacity-20 border `} style={{ borderColor: getVentureColor(task.venture), color: getVentureColor(task.venture), backgroundColor: `${getVentureColor(task.venture)}20` }}>
           {task.venture || 'WorkPlex'} Task
         </span>
         
         <div className="relative mb-2">
            <div className="absolute inset-0 bg-[#E8B84B] blur-[30px] opacity-20 rounded-full"></div>
            <h1 className="text-[#E8B84B] font-black text-5xl relative z-10">{formatCurrency(task.reward || task.earnAmount)}</h1>
         </div>
         <p className="text-gray-500 font-bold text-xs uppercase tracking-widest flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-[#E8B84B] flex justify-center items-center text-black text-[10px]">₹</div>
            Earned on approval
         </p>
         
         <h2 className="text-2xl font-bold mt-4 leading-tight">{task.title}</h2>
      </div>

      {/* Deadline section */}
      <div className={`bg-[#111111] border rounded-2xl p-5 mb-6 relative overflow-hidden ${isWarning ? 'border-red-500/50' : 'border-[#2A2A2A]'}`}>
         <div className="flex justify-between items-end mb-3 relative z-10">
            <div>
               <p className="text-white font-bold text-sm mb-1">Time Remaining</p>
               {isExpired ? (
                  <p className="text-red-500 font-mono text-2xl font-black">EXPIRED</p>
               ) : (
                  <div className={`font-mono text-3xl font-black tracking-wider ${isWarning ? 'text-red-500 animate-pulse' : 'text-[#E8B84B]'}`}>
                     <CountdownTimer deadline={deadline} />
                  </div>
               )}
            </div>
            <Clock className={isWarning ? 'text-red-500' : 'text-gray-600'} size={32} />
         </div>
         
         {!isExpired && (
            <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden relative z-10">
               <div className={`h-full rounded-full transition-all duration-1000 ${isWarning ? 'bg-red-500' : 'bg-[#E8B84B]'}`} style={{ width: isWarning ? '25%' : '75%' }}></div>
            </div>
         )}
         {isWarning && !isExpired && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-3 relative z-10 text-center">Warning: Less than 2 hours left!</p>}
      </div>

      {/* Instructions section */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 mb-6">
         <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <Info size={18} className="text-[#00C9A7]" /> 
            Instructions
         </h3>
         <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {task.description}
         </div>
      </div>

      {/* Proof Submission Section */}
      {!isExpired && (
         <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 mb-8">
            <h3 className="font-black text-white text-lg mb-4 flex items-center gap-2">
               {proofType === 'image' && <UploadCloud className="text-[#E8B84B]" />}
               {proofType === 'link' && <LinkIcon className="text-[#E8B84B]" />}
               {proofType === 'text' && <FileText className="text-[#E8B84B]" />}
               Submit Proof ({proofType})
            </h3>

            {proofType === 'image' && (
               <div className="space-y-4">
                  {isCC ? (
                     <div className="space-y-3">
                        {files.map((f, i) => (
                           <div key={i} className="flex justify-between items-center bg-[#111111] p-3 rounded-xl border border-[#2A2A2A]">
                              <div className="flex items-center gap-2">
                                 <CheckCircle className="text-[#00C9A7]" size={16} />
                                 <span className="text-sm font-bold text-gray-300 truncate max-w-[200px]">{f.name}</span>
                              </div>
                              <button onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-500 p-1">
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        ))}
                        {files.length < 5 && (
                           <div className="border-2 border-dashed border-[#2A2A2A] rounded-xl hover:border-[#E8B84B] transition bg-[#111111] text-center relative group p-4">
                              <input 
                                 type="file" 
                                 accept="image/*"
                                 onChange={handleAddFile} 
                                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                 disabled={uploading}
                              />
                              <div className="flex items-center justify-center gap-2 opacity-70 group-hover:opacity-100 transition">
                                 <Plus className="text-[#E8B84B]" size={20} />
                                 <span className="text-[#E8B84B] font-bold text-sm">Add Image ({files.length}/5)</span>
                              </div>
                           </div>
                        )}
                     </div>
                  ) : (
                     <div className="border-2 border-dashed border-[#2A2A2A] rounded-xl p-8 hover:border-[#E8B84B] transition bg-[#111111] text-center relative group">
                        <input 
                           type="file" 
                           accept="image/*"
                           onChange={(e) => setFile(e.target.files?.[0] || null)} 
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                           disabled={uploading}
                        />
                        {file ? (
                           <div className="flex flex-col items-center">
                              <CheckCircle className="text-[#00C9A7] mb-2" size={32} />
                              <p className="text-white font-bold">{file.name}</p>
                              <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                           </div>
                        ) : (
                           <div className="flex flex-col items-center opacity-70 group-hover:opacity-100 transition">
                              <Camera className="text-gray-500 mb-3" size={40} />
                              <p className="text-gray-300 font-bold mb-1">Upload Screenshot</p>
                              <p className="text-gray-500 text-xs">Max 2MB (Auto-compressed)</p>
                           </div>
                        )}
                     </div>
                  )}
               </div>
            )}

            {proofType === 'link' && (
               <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{isCC ? 'URL Links' : 'URL Link'}</label>
                  {isCC ? (
                     <div className="space-y-2">
                        {links.map((link, idx) => (
                           <input 
                              key={idx}
                              type="url"
                              placeholder={`https://... (Link ${idx + 1})`}
                              className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:border-[#E8B84B] focus:ring-1 focus:ring-[#E8B84B] outline-none mb-2"
                              value={link}
                              onChange={(e) => {
                                 const newLinks = [...links];
                                 newLinks[idx] = e.target.value;
                                 setLinks(newLinks);
                              }}
                              disabled={uploading}
                           />
                        ))}
                        {links.length < 3 && (
                           <button onClick={() => setLinks([...links, ''])} className="text-xs font-bold text-[#E8B84B] flex items-center gap-1 hover:underline">
                              <Plus size={14} /> Add Another Link
                           </button>
                        )}
                     </div>
                  ) : (
                     <input 
                        type="url"
                        placeholder="https://..."
                        className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:border-[#E8B84B] focus:ring-1 focus:ring-[#E8B84B] outline-none"
                        value={proofText}
                        onChange={(e) => setProofText(e.target.value)}
                        disabled={uploading}
                     />
                  )}
                  {!isCC && proofText.includes('http') && (
                     <a href={proofText} target="_blank" rel="noreferrer" className="text-xs text-[#00C9A7] font-bold hover:underline inline-block mt-1">
                        Preview Link →
                     </a>
                  )}
               </div>
            )}

            {proofType === 'text' && (
               <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex justify-between">
                     <span>Details {isCC && '(Min 100 words)'}</span>
                     <span className={`${isCC ? (proofText.trim().split(/\s+/).length < 100 ? 'text-yellow-500' : 'text-gray-600') : (proofText.length > 500 ? 'text-red-500' : 'text-gray-600')}`}>
                        {isCC ? `${proofText.trim().split(/\s+/).filter(w => w.length > 0).length} / 100 min words` : `${proofText.length} / 500 max chars`}
                     </span>
                  </label>
                  <textarea 
                     rows={6}
                     placeholder={isCC ? "Provide detail about your content..." : "Describe completion..."}
                     className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:border-[#E8B84B] focus:ring-1 focus:ring-[#E8B84B] outline-none resize-none"
                     value={proofText}
                     onChange={(e) => setProofText(e.target.value)}
                     disabled={uploading}
                  />
               </div>
            )}
         </div>
      )}

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 w-full bg-[#111111] border-t border-[#2A2A2A] p-4 flex gap-3 z-40 max-w-2xl mx-auto right-0">
         <button 
           className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] text-white font-bold rounded-xl py-4 flex justify-center items-center text-sm uppercase tracking-widest hover:bg-[#2A2A2A] transition"
           onClick={() => navigate('/tasks')}
           disabled={uploading}
         >
           Cancel
         </button>
         <button 
           className={`flex-[2] bg-[#E8B84B] text-black font-black uppercase tracking-widest rounded-xl py-4 flex justify-center items-center shadow-[0_0_20px_rgba(232,184,75,0.3)] transition ${uploading || isExpired ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-[#E8B84B]/90'}`}
           onClick={handleSubmit}
           disabled={uploading || isExpired}
         >
           {uploading ? (
              <span className="flex items-center gap-2">
                 <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                 Submitting...
              </span>
           ) : isExpired ? 'Expired' : 'Submit Proof'}
         </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #111111; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2A2A2A; 
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
