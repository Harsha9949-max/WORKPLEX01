import React, { useState } from 'react';
import { encryptPAN } from '../lib/encryption';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const PANCollectionModal = ({ uid, onClose }) => {
  const [pan, setPan] = useState('');

  const handleSubmit = async () => {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) { toast.error('Invalid PAN'); return; }
    await updateDoc(doc(db, 'users', uid), { pan: encryptPAN(pan), panRequired: false });
    toast.success('PAN submitted successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6">
      <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 max-w-sm w-full space-y-6">
        <h3 className="text-xl font-black uppercase text-amber-500">Income Milestone Reached!</h3>
        <p className="text-sm font-bold text-gray-400">You've earned Rs.2,500+. Submitting your PAN helps avoid tax complication.</p>
        <input className="w-full bg-[#1A1A1A] p-4 rounded-xl font-bold" placeholder="ABCDE1234F" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} />
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 border border-white/10 rounded-xl font-black uppercase text-xs">Skip</button>
          <button onClick={handleSubmit} className="flex-1 py-4 bg-[#E8B84B] text-black rounded-xl font-black uppercase text-xs">Submit PAN</button>
        </div>
      </div>
    </div>
  );
};
