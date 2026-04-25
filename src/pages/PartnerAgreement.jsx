import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function PartnerAgreement({ onAgree }) {
  const { currentUser } = useAuth();
  const [accepted, setAccepted] = useState(false);

  const handleAgree = async () => {
    if (!accepted) return;
    await updateDoc(doc(db, 'users', currentUser.uid), {
      partnerAgreementAccepted: {
        version: '1.0',
        acceptedAt: serverTimestamp(),
        ipAddress: 'detected'
      }
    });
    onAgree();
  };

  return (
    <div className="p-6 bg-[#0A0A0A] text-white min-h-screen">
      <h2 className="text-xl font-black mb-6">Partner Store Agreement</h2>
      <div className="h-64 bg-[#111111] border border-white/10 rounded-2xl p-4 overflow-y-auto text-xs text-gray-400 mb-6">
        <p>1. HVRS Innovations operates as the merchant of record for all transactions on your Partner Store...</p>
        <p>2. HVRS Innovations is not currently registered for GST...</p>
      </div>
      <label className="flex items-center gap-3 mb-6">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="accent-[#E8B84B]" />
        <span className="text-sm">I agree to the terms</span>
      </label>
      <button onClick={handleAgree} disabled={!accepted} className="w-full bg-[#E8B84B] text-black py-4 rounded-xl font-black">Agree & Proceed</button>
    </div>
  );
}
