import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, Clock, XCircle, ExternalLink, Image as ImageIcon, Video, Type, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContentPortfolio() {
   const [filter, setFilter] = useState('all');
   const [showSubmitModal, setShowSubmitModal] = useState(false);
   const [newTitle, setNewTitle] = useState('');
   const [newType, setNewType] = useState('Reel');
   const [newLink, setNewLink] = useState('');

   const [portfolioItems, setPortfolioItems] = useState<any[]>([]);

   useEffect(() => {
      setPortfolioItems([
         {
            id: '1',
            status: 'approved',
            task: 'Cinematic Brand Teaser',
            type: 'Reel',
            date: '2026-06-21',
            amount: 450,
            icon: Video
         },
         {
            id: '2',
            status: 'approved',
            task: 'Unboxing & First Impression',
            type: 'Video',
            date: '2026-06-18',
            amount: 600,
            icon: Video
         },
         {
            id: '3',
            status: 'pending',
            task: 'Smart Lifestyle Routine',
            type: 'Reel',
            date: '2026-06-25',
            amount: 500,
            icon: Video
         },
         {
            id: '4',
            status: 'rejected',
            task: 'Workspace Stylist Review',
            type: 'Story',
            date: '2026-06-14',
            amount: 400,
            icon: ImageIcon
         }
      ]);
   }, []);

   const filteredItems = filter === 'all' ? portfolioItems : portfolioItems.filter(i => i.status === filter);

   // Dynamic Stats Calculations
   const totalCount = portfolioItems.length;
   const approvedCount = portfolioItems.filter(i => i.status === 'approved').length;
   const pendingCount = portfolioItems.filter(i => i.status === 'pending').length;
   const rejectedCount = portfolioItems.filter(i => i.status === 'rejected').length;
   const approvalRate = totalCount > 0 ? Math.round((approvedCount / (totalCount - pendingCount || 1)) * 100) : 100;

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTitle.trim() || !newLink.trim()) {
         toast.error('Please fill in all fields.');
         return;
      }

      const newItem = {
         id: String(Date.now()),
         status: 'pending',
         task: newTitle,
         type: newType,
         date: new Date().toISOString().split('T')[0],
         amount: 500,
         icon: newType === 'Story' ? ImageIcon : Video
      };

      setPortfolioItems([newItem, ...portfolioItems]);
      setShowSubmitModal(false);
      setNewTitle('');
      setNewLink('');
      toast.success('Content submission logged under review!');
   };

   return (
      <div className="space-y-6">
         {/* Stats Summary Stickyish */}
         <div className="bg-[#111111] p-4 rounded-2xl border border-[#2A2A2A] flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
               <span className="text-white font-bold text-sm">Total: {totalCount}</span>
               <span className="text-[#10B981] font-bold text-sm">✅ {approvedCount}</span>
               <span className="text-yellow-500 font-bold text-sm">⏳ {pendingCount}</span>
               <span className="text-red-500 font-bold text-sm">❌ {rejectedCount}</span>
            </div>
            <div className="flex items-center gap-4">
               <div className="text-[#10B981] bg-[#10B981]/10 px-3 py-1 rounded-lg text-xs font-black tracking-widest">
                  APPROVAL RATE: {approvalRate}%
               </div>
               <button 
                  onClick={() => setShowSubmitModal(true)}
                  className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
               >
                  <Plus size={14} /> Submit Work
               </button>
            </div>
         </div>

         {/* Filters */}
         <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
            {['all', 'approved', 'pending', 'rejected'].map(f => (
               <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition shrink-0 ${filter === f ? 'bg-pink-500/20 text-pink-500 border border-pink-500/40' : 'bg-[#111111] border border-[#2A2A2A] text-gray-500 hover:text-gray-300'}`}
               >
                  {f}
               </button>
            ))}
         </div>

         {/* Grid */}
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => (
               <div key={item.id} className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden cursor-pointer hover:border-gray-500 transition group relative">
                  
                  {/* Status Overlay icon top-right */}
                  <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center bg-[#111111] border border-[#2A2A2A] shadow-lg">
                     {item.status === 'approved' && <CheckCircle size={14} className="text-[#10B981]" />}
                     {item.status === 'pending' && <Clock size={14} className="text-yellow-500" />}
                     {item.status === 'rejected' && <XCircle size={14} className="text-red-500" />}
                  </div>

                  <div className="aspect-square bg-[#1A1A1A] flex items-center justify-center relative">
                     {/* Thumbnail Placeholder */}
                     <item.icon size={32} className="text-gray-600" />
                     
                     <div className="absolute bottom-2 left-2 right-2 text-[9px] uppercase font-bold text-gray-500 bg-[#111]/80 backdrop-blur-sm p-1 rounded text-center">
                        {item.type}
                     </div>
                  </div>

                  <div className="p-3">
                     <h4 className="text-xs font-bold text-white mb-1 truncate">{item.task}</h4>
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 font-mono">{item.date}</span>
                        {item.status === 'approved' && <span className="text-[10px] font-black text-[#E8B84B]">Rs.{item.amount}</span>}
                     </div>
                  </div>
               </div>
            ))}
            
            {filteredItems.length === 0 && (
               <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                  <Camera size={48} className="text-pink-500 mb-4 opacity-50" />
                  <p className="text-white font-bold text-lg mb-1">No content found</p>
                  <p className="text-sm text-gray-500">Complete missions to build your portfolio!</p>
               </div>
            )}
         </div>

         {/* Submit Proof Modal */}
         {showSubmitModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
               <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl w-full max-w-md overflow-hidden relative">
                  <button 
                     onClick={() => setShowSubmitModal(false)}
                     className="absolute top-4 right-4 text-gray-500 hover:text-white"
                  >
                     <X size={20} />
                  </button>

                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                     <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">Submit Content Proof</h3>
                     
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mission / Video Title</label>
                        <input 
                           type="text" 
                           placeholder="e.g. Aesthetic Brand Teaser" 
                           value={newTitle}
                           onChange={(e) => setNewTitle(e.target.value)}
                           className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-white focus:border-pink-500 transition-colors"
                        />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Content Format</label>
                        <select 
                           value={newType}
                           onChange={(e) => setNewType(e.target.value)}
                           className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-white focus:border-pink-500 transition-colors"
                        >
                           <option value="Reel">Reel / Shorts</option>
                           <option value="Video">Full Video</option>
                           <option value="Story">Story Post</option>
                        </select>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Social Link (Instagram/YouTube)</label>
                        <input 
                           type="url" 
                           placeholder="https://instagram.com/reel/..." 
                           value={newLink}
                           onChange={(e) => setNewLink(e.target.value)}
                           className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-white focus:border-pink-500 transition-colors"
                        />
                     </div>

                     <button 
                        type="submit"
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-black uppercase tracking-widest py-4 rounded-xl transition shadow-[0_0_25px_rgba(236,72,153,0.3)]"
                     >
                        Submit Review Application
                     </button>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
}
