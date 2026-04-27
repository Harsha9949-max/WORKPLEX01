import React, { useState } from 'react';
import { Camera, CheckCircle, Clock, XCircle, ExternalLink, Image as ImageIcon, Video, Type } from 'lucide-react';

export default function ContentPortfolio() {
   const [filter, setFilter] = useState('all');

   const portfolioItems = [
      { id: '1', task: 'Unboxing Reel', type: 'video', date: 'Oct 21', status: 'approved', icon: Video, amount: 50 },
      { id: '2', task: 'Lifestyle Shot', type: 'image', date: 'Oct 20', status: 'approved', icon: ImageIcon, amount: 35 },
      { id: '3', task: 'Review Blog', type: 'text', date: 'Oct 22', status: 'pending', icon: Type, amount: 40 },
      { id: '4', task: 'Feature Post', type: 'image', date: 'Oct 18', status: 'rejected', reason: 'Poor lighting', icon: ImageIcon, amount: 0 },
   ];

   const filteredItems = filter === 'all' ? portfolioItems : portfolioItems.filter(i => i.status === filter);

   return (
      <div className="space-y-6">
         {/* Stats Summary Stickyish */}
         <div className="bg-[#111111] p-4 rounded-2xl border border-[#2A2A2A] flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
               <span className="text-white font-bold text-sm">Total: 12</span>
               <span className="text-[#10B981] font-bold text-sm">✅ 9</span>
               <span className="text-yellow-500 font-bold text-sm">⏳ 2</span>
               <span className="text-red-500 font-bold text-sm">❌ 1</span>
            </div>
            <div className="text-[#10B981] bg-[#10B981]/10 px-3 py-1 rounded-lg text-xs font-black tracking-widest">
               APPROVAL RATE: 75%
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
                  <p className="text-sm text-gray-500">Complete tasks to build your portfolio!</p>
               </div>
            )}
         </div>
      </div>
   );
}
