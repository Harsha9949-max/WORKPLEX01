import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function ResellerSettings() {
  const { userData, currentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    name: userData?.name || '',
    phone: userData?.phone || '',
    upiId: userData?.upiId || '',
    bankAccount: userData?.bankAccount || '',
    ifsc: userData?.ifsc || '',
  });

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), profile);
      toast.success('Profile updated successfully');
    } catch (e) {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-white">Settings</h1>

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

      <button 
         onClick={handleSave}
         disabled={saving}
         className="w-full py-4 bg-[#E8B84B] text-black font-black uppercase tracking-widest rounded-xl hover:bg-[#E8B84B]/90 transition-colors flex items-center justify-center gap-2"
      >
         <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
      </button>

    </div>
  );
}
