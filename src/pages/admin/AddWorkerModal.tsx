import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Phone, Briefcase, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { associatePhoneWithUid } from '../../utils/phoneDirectory';

// In a real implementation this would use a Firebase Cloud Function to create Auth user without logging in.
// For demo purposes, we will just create the Firestore document.

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  subAdminVenture?: string;
  subAdminId?: string;
}

export default function AddWorkerModal({ isOpen, onClose, subAdminVenture, subAdminId }: AddWorkerModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [venture, setVenture] = useState(subAdminVenture || '');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPhone('');
      setVenture(subAdminVenture || '');
      setRole('');
    }
  }, [isOpen, subAdminVenture]);

  // Available roles based on venture
  const availableRoles = ['Marketer', 'Content Creator'];
  if (venture !== 'Growplex') {
    availableRoles.push('Reseller');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || name.length < 2) return toast.error('Please enter a valid name.');
    if (!email || !email.includes('@')) return toast.error('Please enter a valid email address.');
    if (!phone || phone.length !== 10) return toast.error('Please enter a valid 10-digit phone number.');
    if (!venture) return toast.error('Please select a venture.');
    if (!role) return toast.error('Please select a role.');

    setIsSubmitting(true);

    try {
      // Check if email already exists
      const cleanEmail = email.trim().toLowerCase();
      const emailCheckQ = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const emailCheckSnap = await getDocs(emailCheckQ);
      if (!emailCheckSnap.empty) {
        setIsSubmitting(false);
        return toast.error('A worker with this email address already exists.');
      }
      
      const newUserId = 'worker_' + Math.random().toString(36).substr(2, 9);
      
      await setDoc(doc(db, 'users', newUserId), {
         name,
         email: cleanEmail,
         phone: `+91${phone}`,
         venture: venture,
         role,
         status: 'active',
         createdBy: subAdminId || 'admin_super',
         createdBySubAdmin: !!subAdminId,
         level: 'Bronze',
         joinedAt: serverTimestamp(),
         wallets: {
            earned: 0,
            pending: 50, // Incentive
            bonus: 0,
            savings: 0
         },
         kycDone: false,
         firstTaskDone: false,
         contractSigned: false
      });

      // Let's index the phone number so the directory links to the worker_xx dummy doc temporarily.
      // Once they sign up, EmailFirstAuth.tsx will overwrite/correct the mapping to the actual Auth UID.
      await associatePhoneWithUid(db, phone, newUserId);

      toast.success(`Worker account created! ${name} can now sign up using verification code.`);
      setName('');
      setEmail('');
      setPhone('');
      setRole('');
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-[#111111] border-t border-l border-r sm:border border-[#2A2A2A] rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 relative"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-black text-white">Add New Worker</h2>
              <p className="text-xs text-gray-400 font-medium">Create account on behalf of worker</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition bg-[#1A1A1A] rounded-full">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Full Name</label>
              <div className="relative">
                <UserPlus size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#F59E0B] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter worker's email"
                  required
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#F59E0B] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Phone Number</label>
              <div className="relative flex">
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] border-r-0 rounded-l-xl px-3 py-3 flex items-center text-gray-400 font-mono text-sm">
                   +91
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  maxLength={10}
                  placeholder="10-digit number"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-r-xl text-white pl-3 pr-4 py-3 focus:outline-none focus:border-[#F59E0B] transition-colors font-mono"
                />
              </div>
            </div>

            {!subAdminVenture && (
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Select Venture</label>
                <div className="relative">
                  <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <select
                    value={venture}
                    onChange={(e) => {
                      setVenture(e.target.value);
                      setRole('');
                    }}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#F59E0B] transition-colors appearance-none"
                  >
                    <option value="" disabled>Select a venture...</option>
                    {['BuyRix', 'Vyuma', 'Zaestify', 'Growplex'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                Assign Role {venture ? `in ${venture}` : ''}
              </label>
              <div className="relative">
                <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#F59E0B] transition-colors appearance-none"
                >
                  <option value="" disabled>Select a role...</option>
                  {availableRoles.map(r => (
                     <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#F59E0B] text-black font-black uppercase py-4 rounded-xl mt-6 hover:bg-[#F59E0B]/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
