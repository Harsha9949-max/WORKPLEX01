import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, CheckCircle, Clock, Copy, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContentCalendar({ venture }: { venture: string }) {
   const [selectedDay, setSelectedDay] = useState(0);
   const currentVenture = venture || 'WorkPlex';
   
   const [days, setDays] = useState<any[]>([]);

   useEffect(() => {
      // Generate missions based on venture
      const vName = currentVenture;
      setDays([
         { 
            day: 'Mon 21', 
            status: 'in-progress', 
            task: `Aesthetic Intro to ${vName}`, 
            type: 'Reel', 
            platform: 'Instagram', 
            due: '3 PM', 
            amount: 450,
            requirements: [
               `Showcase the elegant visual aesthetic of ${vName} in the first 3 seconds`,
               `Keep the transition flow super high-energy and modern`,
               `End with a strong call-to-action redirecting to the shop link`
            ],
            hashtags: [`#${vName}`, '#WFH', '#Creator', '#Aesthetic']
         },
         { day: 'Tue 22', status: 'none', task: null },
         { 
            day: 'Wed 23', 
            status: 'approved', 
            task: `${vName} Key Value Review`, 
            type: 'Shorts', 
            platform: 'YouTube', 
            due: '6 PM', 
            amount: 600,
            requirements: [
               `Highlight at least three unique value propositions of ${vName}`,
               `Speak clearly and record in high-quality lighting`,
               `Embed verified user testimonials in picture-in-picture mode`
            ],
            hashtags: [`#${vName}`, '#ProductReview', '#Value', '#Shorts']
         },
         { day: 'Thu 24', status: 'none', task: null },
         { 
            day: 'Fri 25', 
            status: 'submitted', 
            task: `${vName} Lifestyle Testimonial`, 
            type: 'Reel', 
            platform: 'Instagram', 
            due: '12 PM', 
            amount: 500,
            requirements: [
               `Create a casual day-in-the-life style review`,
               `Demonstrate how ${vName} fits seamlessly into your daily workspace routine`,
               `Add crisp voiceover explaining the major benefits`
            ],
            hashtags: [`#${vName}`, '#DayInTheLife', '#Aesthetic', '#Workflow']
         },
         { day: 'Sat 26', status: 'none', task: null },
         { day: 'Sun 27', status: 'none', task: null },
      ]);
   }, [currentVenture]);

   const getBorderColor = (status: string) => {
      switch(status) {
         case 'approved': return 'border-[#10B981]';
         case 'submitted': return 'border-[#3B82F6]';
         case 'in-progress': return 'border-yellow-500';
         case 'not-started': return 'border-gray-500';
         default: return 'border-[#2A2A2A]';
      }
   };

   const copyText = (text: string) => {
      navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
   };

   return (
      <div className="space-y-6">
         <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {days.map((d, i) => (
               <div 
                  key={i} 
                  onClick={() => d.task && setSelectedDay(i)}
                  className={`min-w-[160px] snap-start bg-[#111111] border-2 rounded-2xl p-4 cursor-pointer transition ${d.task ? getBorderColor(d.status) : 'border-[#2A2A2A] opacity-50'} ${selectedDay === i ? 'bg-[#1A1A1A] scale-[1.02]' : ''}`}
               >
                  <p className="text-white font-bold mb-3">{d.day}</p>
                  {d.task ? (
                     <>
                        <h4 className="text-sm font-bold text-white leading-tight mb-2">{d.task}</h4>
                        <div className="flex flex-col gap-1 mb-4">
                           <span className="text-[10px] text-gray-400 font-bold uppercase">Type: {d.type}</span>
                           <span className="text-[10px] text-gray-400 font-bold uppercase">Target: {d.platform}</span>
                           <span className="text-[10px] text-gray-400 font-bold uppercase">Due: {d.due}</span>
                        </div>
                        <button className="w-full text-[10px] font-black uppercase tracking-widest bg-[#1A1A1A] border border-[#2A2A2A] py-2 rounded-lg text-white hover:bg-[#2A2A2A] transition">
                           {d.status === 'not-started' ? 'Start Creating' : 
                            d.status === 'in-progress' ? 'Continue' : 
                            d.status === 'submitted' ? 'Under Review' : 'Approved ✅'}
                        </button>
                     </>
                  ) : (
                     <div className="h-24 flex items-center justify-center text-gray-600 text-xs font-bold uppercase">
                        No Mission
                     </div>
                  )}
               </div>
            ))}
         </div>

         {/* Creative Brief Panel */}
         {days[selectedDay]?.task && (
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6">
               <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                  <span className="text-pink-500">📋</span> Creative Brief: {days[selectedDay].task}
               </h3>

               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                     <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">What To Create</h4>
                        <ul className="space-y-2 text-sm text-gray-300 font-medium">
                           <li><span className="text-gray-500 w-24 inline-block font-mono">Type:</span> {days[selectedDay].type}</li>
                           <li><span className="text-gray-500 w-24 inline-block font-mono">Platform:</span> {days[selectedDay].platform}</li>
                           <li><span className="text-gray-500 w-24 inline-block font-mono">Reward:</span> Rs.{days[selectedDay].amount}</li>
                        </ul>
                     </div>

                     <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Content Requirements</h4>
                        <ul className="space-y-2 text-sm text-gray-300 font-medium list-disc ml-4">
                           {days[selectedDay].requirements.map((req: string, rIdx: number) => (
                              <li key={rIdx}>{req}</li>
                           ))}
                        </ul>
                     </div>

                     <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Do's & Don'ts</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm font-medium">
                           <ul className="space-y-2 text-gray-300">
                              <li className="flex gap-2"><span className="text-[#10B981]">✅</span> Clear audio</li>
                              <li className="flex gap-2"><span className="text-[#10B981]">✅</span> Native flow</li>
                           </ul>
                           <ul className="space-y-2 text-gray-300">
                              <li className="flex gap-2"><span className="text-red-500">❌</span> Bad lighting</li>
                              <li className="flex gap-2"><span className="text-red-500">❌</span> Competitors</li>
                           </ul>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A] relative">
                        <button 
                           onClick={() => copyText(`Level up your daily lifestyle with ${currentVenture}! 🚀 Checking out their newly launched collection. Highly recommended! #MustHave #Review`)}
                           className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                           <Copy size={16} />
                        </button>
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Caption Template</h4>
                        <p className="text-sm text-gray-300 font-medium leading-relaxed">
                           Level up your daily lifestyle with {currentVenture}! 🚀 Checking out their newly launched collection. Highly recommended! <br/><br/>
                           #WorkPlex #WFH #Creator
                        </p>
                     </div>

                     <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
                        <div className="flex justify-between items-center mb-3">
                           <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hashtags</h4>
                           <button onClick={() => copyText(days[selectedDay].hashtags.join(' '))} className="text-gray-500 hover:text-white"><Copy size={16} /></button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {days[selectedDay].hashtags.map((ht: string, hIdx: number) => (
                              <span key={hIdx} className="bg-[#2A2A2A] text-gray-300 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">{ht}</span>
                           ))}
                        </div>
                     </div>

                     <div className="bg-pink-500/10 border border-pink-500/30 p-4 rounded-xl flex items-center gap-3">
                        <input type="checkbox" className="w-5 h-5 accent-pink-500" id="brief-read" />
                        <label htmlFor="brief-read" className="text-sm font-bold text-pink-300">I have read and understand the creative brief</label>
                     </div>

                     <button 
                        onClick={() => {
                           toast.success('Mission started! Upload your proof once ready in the Portfolio tab.');
                        }}
                        className="w-full bg-[#EC4899] hover:bg-[#D946EF] text-white font-black uppercase tracking-widest py-4 rounded-xl transition shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                     >
                        Start Mission Execution
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
