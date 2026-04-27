import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle, XCircle, Plus, Calendar, Clock, Eye, Link as LinkIcon, Image as ImageIcon, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubAdminTasks({ venture, subAdminId }: { venture: string, subAdminId: string }) {
   const [activeTab, setActiveTab] = useState('active'); // active, submitted, history
   const [tasks, setTasks] = useState<any[]>([]);
   const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
   
   // Create Task Form State
   const [title, setTitle] = useState('');
   const [description, setDescription] = useState('');
   const [amount, setAmount] = useState('30');
   const [proofType, setProofType] = useState('Image');
   const [proofRequirements, setProofRequirements] = useState('');

   useEffect(() => {
      if (!venture) return;
      const q = query(collection(db, 'tasks'), where('venture', '==', venture));
      const unsubscribe = onSnapshot(q, (snapshot) => {
         const taskList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
         setTasks(taskList);
      });
      return () => unsubscribe();
   }, [venture]);

   const handleCreateTask = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title || !description) return toast.error('Fill required fields');
      
      try {
         await addDoc(collection(db, 'tasks'), {
            title,
            description,
            amount: parseInt(amount),
            venture,
            createdBy: subAdminId,
            createdAt: serverTimestamp(),
            status: 'active',
            proofRequirements,
            proofType,
            targetRoles: venture === 'Growplex' ? ['Promoter', 'Content Creator'] : ['Marketer', 'Content Creator', 'Reseller']
         });
         toast.success('Task created successfully!');
         setIsCreateTaskOpen(false);
         setTitle('');
         setDescription('');
      } catch (err) {
         toast.error('Failed to create task');
      }
   };

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center bg-[#111111] p-4 rounded-2xl border border-[#2A2A2A]">
            <div>
               <h2 className="text-xl font-black text-white uppercase tracking-tight">Task Management</h2>
               <p className="text-xs text-gray-400 font-medium">{venture} tasks only</p>
            </div>
            <button onClick={() => setIsCreateTaskOpen(true)} className="bg-[#F59E0B] text-black text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-[#F59E0B]/90 transition shadow-[0_0_15px_rgba(245,158,11,0.3)]">
               + Create Task
            </button>
         </div>

         {isCreateTaskOpen && (
            <div className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-2xl mb-6">
               <h3 className="text-lg font-bold text-white mb-4">Create Task for {venture}</h3>
               <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Task Title</label>
                     <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#F59E0B]" required />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Description</label>
                     <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#F59E0B]" rows={3} required></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Earning (Rs.)</label>
                        <input type="number" min="15" max="75" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#F59E0B]" required />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Proof Type</label>
                        <select value={proofType} onChange={(e) => setProofType(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#F59E0B]">
                           <option>Image</option>
                           <option>Link</option>
                           <option>Text</option>
                        </select>
                     </div>
                  </div>
                  <div>
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Proof Requirements</label>
                     <textarea value={proofRequirements} onChange={(e) => setProofRequirements(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#F59E0B]" rows={2}></textarea>
                  </div>
                  <div className="flex gap-3 justify-end pt-4">
                     <button type="button" onClick={() => setIsCreateTaskOpen(false)} className="px-6 py-3 rounded-xl border border-[#2A2A2A] text-gray-400 font-bold uppercase transition hover:text-white">Cancel</button>
                     <button type="submit" className="px-6 py-3 rounded-xl bg-[#F59E0B] text-black font-black uppercase transition hover:bg-[#F59E0B]/90">Create Task</button>
                  </div>
               </form>
            </div>
         )}

         <div className="flex border-b border-[#2A2A2A] pb-0">
            {['active', 'submitted', 'history'].map(tab => (
               <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition ${activeTab === tab ? 'border-[#F59E0B] text-[#F59E0B]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
               >
                  {tab}
               </button>
            ))}
         </div>

         <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-gray-300">
                  <thead className="text-xs text-gray-500 uppercase font-black tracking-widest bg-[#1A1A1A]">
                     <tr>
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody>
                     {tasks.map(task => (
                        <tr key={task.id} className="border-t border-[#2A2A2A]">
                           <td className="px-6 py-4 font-bold text-white">{task.title}</td>
                           <td className="px-6 py-4 text-[#E8B84B] font-bold">Rs.{task.amount}</td>
                           <td className="px-6 py-4">{task.proofType}</td>
                           <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-[#10B981]/20 text-[#10B981] text-[10px] uppercase font-bold tracking-widest rounded">{task.status || 'Active'}</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button className="text-xs bg-[#1A1A1A] font-bold text-[#F59E0B] uppercase px-4 py-2 rounded-lg hover:bg-[#F59E0B]/10 transition border border-[#F59E0B]/30">
                                 View Subs
                              </button>
                           </td>
                        </tr>
                     ))}
                     {tasks.length === 0 && (
                        <tr>
                           <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No tasks found.</td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
}
