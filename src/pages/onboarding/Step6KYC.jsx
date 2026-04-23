import React, { useState } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Step6KYC({ onNext, updateData }) {
  const [kyc, setKyc] = useState({ pan: '', bankAccount: '', upiId: '', ifsc: '' });

  const validate = () => {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(kyc.pan)) { toast.error('Invalid PAN Number'); return false; }
    if (!/^\d{9,18}$/.test(kyc.bankAccount)) { toast.error('Invalid Bank Account'); return false; }
    if (!/^[\w.-]+@[\w.-]+$/.test(kyc.upiId)) { toast.error('Invalid UPI ID'); return false; }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(kyc.ifsc)) { toast.error('Invalid IFSC Code'); return false; }
    return true;
  };

  const handleNext = () => {
    if (validate()) {
      updateData({ kyc: { ...kyc, kycDone: true, kycCompletedAt: new Date() } });
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Identity Verification</h2>
      <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Required for payment processing and tax compliance</p>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase text-gray-500">PAN Card Number</label>
          <input className="w-full bg-[#111111] border border-white/10 rounded-2xl p-4 font-bold" value={kyc.pan} onChange={(e) => setKyc({...kyc, pan: e.target.value.toUpperCase()})} placeholder="ABCDE1234F" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-gray-500">Bank Account Number</label>
          <input className="w-full bg-[#111111] border border-white/10 rounded-2xl p-4 font-bold" value={kyc.bankAccount} onChange={(e) => setKyc({...kyc, bankAccount: e.target.value})} placeholder="9-18 digits" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-gray-500">UPI ID</label>
          <input className="w-full bg-[#111111] border border-white/10 rounded-2xl p-4 font-bold" value={kyc.upiId} onChange={(e) => setKyc({...kyc, upiId: e.target.value})} placeholder="name@upi" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-gray-500">IFSC Code</label>
          <input className="w-full bg-[#111111] border border-white/10 rounded-2xl p-4 font-bold" value={kyc.ifsc} onChange={(e) => setKyc({...kyc, ifsc: e.target.value.toUpperCase()})} placeholder="ABCD0123456" />
        </div>
      </div>

      <button onClick={handleNext} className="w-full bg-[#E8B84B] text-black py-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2">
        Verify & Continue <ArrowRight size={18} />
      </button>
      <p className="text-[10px] text-gray-600 font-bold text-center">Your data is encrypted and used only for financial compliance.</p>
    </div>
  );
}
