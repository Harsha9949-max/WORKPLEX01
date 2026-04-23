import React, { useState, useRef } from 'react';
import { db } from '../../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Step7Agreement({ onNext }) {
  const [scrolled, setScrolled] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const scrollRef = useRef(null);
  const { currentUser } = useAuth();

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 10;
    if (bottom) setScrolled(true);
  };

  const handleSubmit = async () => {
    if (!accepted) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        agreementSigned: {
          agreementVersion: '1.0',
          acceptedAt: serverTimestamp(),
          ipAddress: 'detected',
          deviceFingerprint: 'detected',
          userAgent: navigator.userAgent
        }
      });
      onNext();
    } catch (e) {
      toast.error('Agreement failure');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter">Independent Contractor Agreement</h2>
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="h-64 bg-[#111111] border border-white/10 rounded-2xl p-4 overflow-y-auto text-xs text-gray-400 space-y-4"
      >
        <p className="font-bold text-white uppercase">SECTION 1 — PARTIES: This Independent Contractor Agreement ('Agreement') is entered into between HVRS Innovations ('Company') and the individual completing this registration ('Contractor'), effective from the date of digital acceptance below.</p>
        <p>SECTION 2 — NATURE OF RELATIONSHIP: The Contractor is an independent contractor and not an employee, partner, or agent of the Company. Nothing in this Agreement shall be construed to create an employment relationship. The Company shall not be responsible for withholding income taxes, provident fund contributions, ESI contributions, or any other statutory deductions applicable to employees.</p>
        <p>SECTION 3 — SERVICES: The Contractor agrees to perform digital marketing tasks, content creation, product promotion, and related services as assigned through the WorkPlex platform. The Contractor retains full discretion over work hours, methods, and tools used to complete tasks.</p>
        <p>SECTION 4 — COMPENSATION: The Contractor shall receive commission-based compensation as displayed within the WorkPlex platform. Earnings are performance-based and not guaranteed...</p>
        {/* ... Sections 5-11 implementation ... */}
        <p>SECTION 10 — DISPUTE RESOLUTION: Any disputes arising from this Agreement shall first be resolved through mutual negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration under the Arbitration and Conciliation Act 1996. Governing law: Laws of India. Jurisdiction: Hyderabad, Telangana.</p>
      </div>

      {!scrolled && <p className="text-[10px] text-amber-500 font-black uppercase text-center">Scroll to read full agreement</p>}

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" disabled={!scrolled} checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="accent-[#E8B84B]" />
        <span className="text-sm font-bold text-gray-300">I have READ and AGREE to the Independent Contractor Agreement above</span>
      </label>

      <button onClick={handleSubmit} disabled={!accepted} className="w-full bg-[#E8B84B] disabled:bg-gray-700 text-black py-4 rounded-2xl font-black uppercase">
        Accept Agreement
      </button>
    </div>
  );
}
