import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Palette, Calendar as CalendarIcon, Image as ImageIcon, Tag, ArrowRight, ExternalLink, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ContentCalendar from './ContentCalendar';
import ContentPortfolio from './ContentPortfolio';
import CouponDashboard from '../../pages/CouponDashboard'; // Assuming we re-use existing
import ContentStudioGuide from './ContentStudioGuide';

export default function ContentStudio() {
   const { userData } = useAuth();
   const [activeTab, setActiveTab] = useState('calendar');

   return (
      <div className="min-h-screen bg-[#0A0A0A] pb-24 font-sans text-white md:p-8">
         <div className="p-4 md:p-0 max-w-7xl mx-auto space-y-6">
            <div>
               <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  Content Studio <Palette className="text-pink-500" size={24} />
               </h1>
               <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#EC4899' }}>
                  {userData?.venture || 'WorkPlex'} Content Creator
               </p>
            </div>

            <ContentStudioGuide />

            <div className="flex border-b border-[#2A2A2A] pb-0 overflow-x-auto scrollbar-hide">
               {[
                  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
                  { id: 'portfolio', label: 'Portfolio', icon: ImageIcon },
                  { id: 'coupon', label: 'Coupon', icon: Tag },
               ].map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition shrink-0 ${
                        activeTab === tab.id 
                        ? 'border-pink-500 text-pink-500' 
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                     }`}
                  >
                     <tab.icon size={16} />
                     {tab.label}
                  </button>
               ))}
            </div>

            <div className="mt-4">
               {activeTab === 'calendar' && <ContentCalendar venture={userData?.venture || ''} />}
               {activeTab === 'portfolio' && <ContentPortfolio />}
               {activeTab === 'coupon' && (
                  <div className="bg-[#111111] rounded-2xl border border-[#2A2A2A] p-4">
                     {/* We inject the CouponDashboard component but we might need to adjust props if any or use it directly */}
                     <CouponDashboard />
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
