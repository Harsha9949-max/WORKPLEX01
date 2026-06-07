import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Phone, Briefcase, Mail, ShieldCheck, Activity } from 'lucide-react';
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
  onWorkerFound?: (worker: any) => void;
}

export default function AddWorkerModal({ isOpen, onClose, subAdminVenture, subAdminId, onWorkerFound }: AddWorkerModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [venture, setVenture] = useState(subAdminVenture || '');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingWorker, setExistingWorker] = useState<any | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPhone('');
      setVenture(subAdminVenture || '');
      setRole('');
      setExistingWorker(null);
    }
  }, [isOpen, subAdminVenture]);

  // Available roles based on venture
  const availableRoles = ['Marketer', 'Content Creator'];
  if (venture !== 'Growplex') {
    availableRoles.push('Reseller');
  }

  React.useEffect(() => {
    // Synchronously reset existing worker state immediately on email change
    setExistingWorker(null);

    const checkEmailFn = async () => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length < 5) {
        return;
      }
      setIsCheckingEmail(true);
      try {
        const emailCheckQ = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const emailCheckSnap = await getDocs(emailCheckQ);
        if (!emailCheckSnap.empty) {
          const docData = emailCheckSnap.docs[0];
          // Double-check the email input hasn't changed while this async request was in flight
          if (email.trim().toLowerCase() === cleanEmail) {
            setExistingWorker({ id: docData.id, ...docData.data() });
          }
        }
      } catch (err) {
        console.error("Error verifying email registration:", err);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      checkEmailFn();
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    
    // Only block if existingWorker state is populated AND matches the current input email
    if (existingWorker && existingWorker.email?.trim().toLowerCase() === cleanEmail) {
      return toast.error('A worker with this email address already exists. See profile details above.');
    }
    if (!name || name.length < 2) return toast.error('Please enter a valid name.');
    if (!email || !email.includes('@')) return toast.error('Please enter a valid email address.');
    if (!phone || phone.length !== 10) return toast.error('Please enter a valid 10-digit phone number.');
    if (!venture) return toast.error('Please select a venture.');
    if (!role) return toast.error('Please select a role.');

    setIsSubmitting(true);

    try {
      // Re-verify strictly right before creation
      const emailCheckQ = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const emailCheckSnap = await getDocs(emailCheckQ);
      if (!emailCheckSnap.empty) {
        setIsSubmitting(false);
        const docData = emailCheckSnap.docs[0];
        setExistingWorker({ id: docData.id, ...docData.data() });
        return toast.error('A worker with this email address already exists. Details are displayed below.');
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
          className="bg-[#111111] border-t border-l border-r sm:border border-[#2A2A2A] rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto"
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
                {isCheckingEmail && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Activity className="animate-spin text-[#F59E0B]" size={16} />
                  </div>
                )}
              </div>

              <AnimatePresence>
                {existingWorker && existingWorker.email?.trim().toLowerCase() === email.trim().toLowerCase() && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-3 p-4 bg-[#E8B84B]/10 border border-[#E8B84B]/20 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] bg-[#E8B84B] text-black px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                        Registered Worker Details
                      </span>
                      <span className="text-[8px] font-mono text-gray-500">ID: {existingWorker.id.substring(0, 10)}...</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-black text-white uppercase">{existingWorker.name || 'Anonymous'}</p>
                      <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <Phone size={10} className="text-gray-500" /> +91 {existingWorker.phone?.replace('+91', '') || 'No Phone Registered'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] font-bold uppercase tracking-wider">
                      <div className="bg-[#1A1A1A] p-2 rounded-xl border border-white/5">
                        <p className="text-[8px] text-gray-500 mb-0.5">Venture / Role</p>
                        <p className="text-white font-extrabold">{existingWorker.venture || 'N/A'} • {existingWorker.role || 'N/A'}</p>
                      </div>
                      <div className="bg-[#1A1A1A] p-2 rounded-xl border border-white/5">
                        <p className="text-[8px] text-gray-500 mb-0.5">Status / Level</p>
                        <p className="text-white font-extrabold">{existingWorker.status || 'Active'} • {existingWorker.level || 'Bronze'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] font-bold uppercase tracking-wider">
                      <div className="bg-[#1C2A22] p-2 rounded-xl border border-[#10B981]/15">
                        <p className="text-[8px] text-[#10B981]/70 mb-0.5">Earned Balance</p>
                        <p className="text-[#10B981] font-extrabold">₹{existingWorker.wallets?.earned || 0}</p>
                      </div>
                      <div className="bg-[#2A2418] p-2 rounded-xl border border-[#F59E0B]/15">
                        <p className="text-[8px] text-[#F59E0B]/70 mb-0.5">Pending Balance</p>
                        <p className="text-[#F59E0B] font-extrabold">₹{existingWorker.wallets?.pending || 0}</p>
                      </div>
                    </div>

                    {onWorkerFound && (
                      <button
                        type="button"
                        onClick={() => {
                          onWorkerFound(existingWorker);
                          onClose();
                        }}
                        className="w-full bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-black py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all mt-1 flex items-center justify-center gap-1.5 active:scale-95 shadow-md border border-[#E8B84B]/20 animate-pulse"
                      >
                        <ShieldCheck size={14} className="stroke-[3px]" />
                        <span>Manage Selected Profile</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Full Name</label>
              <div className="relative">
                <UserPlus size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  disabled={!!existingWorker}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#F59E0B] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                  disabled={!!existingWorker}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-r-xl text-white pl-3 pr-4 py-3 focus:outline-none focus:border-[#F59E0B] transition-colors font-mono disabled:opacity-30 disabled:cursor-not-allowed"
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
                    disabled={!!existingWorker}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#F59E0B] transition-colors appearance-none disabled:opacity-30 disabled:cursor-not-allowed"
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
                  disabled={!!existingWorker}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#F59E0B] transition-colors appearance-none disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Select a role...</option>
                  {availableRoles.map(r => (
                     <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {existingWorker && existingWorker.email?.trim().toLowerCase() === email.trim().toLowerCase() ? (
              <div className="text-center p-3.5 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl text-[10px] font-black uppercase text-[#EF4444] tracking-widest animate-pulse">
                Email address is already in use
              </div>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || isCheckingEmail}
                className="w-full bg-[#F59E0B] text-black font-black uppercase py-4 rounded-xl mt-6 hover:bg-[#F59E0B]/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Account'}
              </button>
            )}
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
