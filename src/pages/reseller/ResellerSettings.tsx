import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Save, Store, User, Bell, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResellerSettings() {
  const { userData, currentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  
  const [profile, setProfile] = useState({
    name: userData?.name || '',
    phone: userData?.phone || '',
    upiId: userData?.upiId || '',
    bankAccount: userData?.bankAccount || '',
    ifsc: userData?.ifsc || '',
  });

  const [storeDetails, setStoreDetails] = useState({
    tagline: userData?.branding?.tagline || '',
    instagramHandle: userData?.branding?.instagramHandle || '',
    whatsappNumber: userData?.branding?.whatsappNumber || '',
  });

  const [notifications, setNotifications] = useState({
    orderAlerts: true,
    promoEmails: false,
    smsAlerts: true,
  });

  const [policies, setPolicies] = useState({
    returnPolicy: '7 Days Return',
    shippingPolicy: 'Ships in 3-5 Business Days',
  });

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
         ...profile,
         branding: {
            ...userData?.branding,
            ...storeDetails
         },
         settings: {
            notifications,
            policies
         }
      });
      // Try updating partnerShops document too if they have one (assuming uid matches doc id)
      try {
         await updateDoc(doc(db, 'partnerShops', currentUser.uid), {
            'branding.tagline': storeDetails.tagline,
            'branding.instagramHandle': storeDetails.instagramHandle,
            'branding.whatsappNumber': storeDetails.whatsappNumber,
            policies
         });
      } catch (e) {
         // Silently fail if shop doc not found
         console.log(e);
      }
      
      toast.success('Settings updated successfully');
    } catch (e) {
      toast.error('Failed to update settings');
    }
    setSaving(false);
  };

  const tabs = [
     { id: 'account', label: 'Account', icon: User },
     { id: 'store', label: 'Store Details', icon: Store },
     { id: 'policies', label: 'Store Policies', icon: FileText },
     { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-white">Settings</h1>

      <div className="flex border-b border-[#2A2A2A] pb-0 overflow-x-auto scrollbar-hide">
         {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition shrink-0 ${
                     activeTab === tab.id 
                     ? 'border-[#E8B84B] text-[#E8B84B]' 
                     : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
               >
                  <Icon size={16} />
                  {tab.label}
               </button>
            );
         })}
      </div>

      <AnimatePresence mode="wait">
         {activeTab === 'account' && (
            <motion.div key="account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
               <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 space-y-6">
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-[#2A2A2A] pb-4">Personal Info</h2>
                  
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Full Name</label>
                        <input 
                          type="text" 
                          value={profile.name}
                          onChange={e => setProfile({...profile, name: e.target.value})}
                          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Phone</label>
                        <input 
                          type="text" 
                          value={profile.phone}
                          onChange={e => setProfile({...profile, phone: e.target.value})}
                          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]"
                        />
                     </div>
                  </div>
               </div>

               <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 space-y-6">
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-[#2A2A2A] pb-4">Payout Details</h2>
                  <p className="text-xs text-gray-400">Where you want to receive your margins.</p>
                  
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">UPI ID</label>
                        <input 
                          type="text" 
                          value={profile.upiId}
                          onChange={e => setProfile({...profile, upiId: e.target.value})}
                          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]"
                          placeholder="name@upi"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Bank Account No.</label>
                        <input 
                          type="text" 
                          value={profile.bankAccount}
                          onChange={e => setProfile({...profile, bankAccount: e.target.value})}
                          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]"
                          placeholder="Account Number"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">IFSC Code</label>
                        <input 
                          type="text" 
                          value={profile.ifsc}
                          onChange={e => setProfile({...profile, ifsc: e.target.value})}
                          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]"
                          placeholder="IFSC Code"
                        />
                     </div>
                  </div>
               </div>
            </motion.div>
         )}

         {activeTab === 'store' && (
            <motion.div key="store" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 space-y-6">
               <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-[#2A2A2A] pb-4">Store Details</h2>
               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Tagline</label>
                     <input type="text" value={storeDetails.tagline} onChange={e => setStoreDetails({...storeDetails, tagline: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Instagram Handle</label>
                     <input type="text" value={storeDetails.instagramHandle} onChange={e => setStoreDetails({...storeDetails, instagramHandle: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">WhatsApp Contact</label>
                     <input type="text" value={storeDetails.whatsappNumber} onChange={e => setStoreDetails({...storeDetails, whatsappNumber: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]" />
                  </div>
               </div>
            </motion.div>
         )}

         {activeTab === 'policies' && (
            <motion.div key="policies" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 space-y-6">
               <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-[#2A2A2A] pb-4">Store Policies</h2>
               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Return Policy</label>
                     <textarea rows={3} value={policies.returnPolicy} onChange={e => setPolicies({...policies, returnPolicy: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B] resize-none" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Shipping Policy</label>
                     <textarea rows={3} value={policies.shippingPolicy} onChange={e => setPolicies({...policies, shippingPolicy: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B] resize-none" />
                  </div>
               </div>
            </motion.div>
         )}

         {activeTab === 'notifications' && (
            <motion.div key="alerts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 space-y-6">
               <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-[#2A2A2A] pb-4">Notifications</h2>
               <div className="space-y-4">
                  <label className="flex items-center gap-3">
                     <input type="checkbox" checked={notifications.orderAlerts} onChange={e => setNotifications({...notifications, orderAlerts: e.target.checked})} className="w-4 h-4 accent-[#E8B84B]" />
                     <span className="text-sm font-bold text-gray-300">Order Alerts (App & Email)</span>
                  </label>
                  <label className="flex items-center gap-3">
                     <input type="checkbox" checked={notifications.smsAlerts} onChange={e => setNotifications({...notifications, smsAlerts: e.target.checked})} className="w-4 h-4 accent-[#E8B84B]" />
                     <span className="text-sm font-bold text-gray-300">SMS Alerts for Margin Payouts</span>
                  </label>
                  <label className="flex items-center gap-3">
                     <input type="checkbox" checked={notifications.promoEmails} onChange={e => setNotifications({...notifications, promoEmails: e.target.checked})} className="w-4 h-4 accent-[#E8B84B]" />
                     <span className="text-sm font-bold text-gray-300">Promotional Emails & Updates</span>
                  </label>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      <button 
         onClick={handleSave}
         disabled={saving}
         className="w-full py-4 bg-[#E8B84B] text-black font-black uppercase tracking-widest rounded-xl hover:bg-[#E8B84B]/90 transition-colors flex items-center justify-center gap-2 mt-6 shadow-[0_0_20px_rgba(232,184,75,0.2)]"
      >
         <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
      </button>

    </div>
  );
}
