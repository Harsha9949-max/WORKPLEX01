import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, ArrowRight, ShieldAlert, Edit2, Lock } from 'lucide-react';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/taskUtils';
import Confetti from 'react-confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  earnedBalance: number;
}

export default function WithdrawalModal({ isOpen, onClose, earnedBalance }: Props) {
  const { currentUser, userData } = useAuth();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isKycDone = userData?.kyc?.status === 'approved';

  // Handle Close & Reset
  const handleClose = () => {
     onClose();
     setTimeout(() => {
        setStep(1);
        setAmount('');
        setAgreed(false);
     }, 300);
  };

  const handleNextStep1 = () => {
     const val = parseFloat(amount);
     if (val < 200) {
        toast.error('Minimum withdrawal is Rs. 200');
        return;
     }
     if (val > earnedBalance) {
        toast.error('Insufficient available balance');
        return;
     }
     if (!isKycDone && val > 500) { // arbitrary threshold for KYC check
        setStep(3); // KYC Gate
        return;
     }
     setStep(2);
  };

  const handleConfirm = async () => {
    if (!currentUser || !userData) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'withdrawals'), {
        workerId: currentUser.uid,
        workerName: userData.name,
        amount: parseFloat(amount),
        upiId: userData.upiId || 'not-provided@upi',
        status: 'pending',
        type: 'standard',
        requestedAt: serverTimestamp()
      });
      setStep(4);
    } catch (error) {
      toast.error('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-[#111111] border border-[#2A2A2A] rounded-[24px] p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
          >
            {/* Step 1: Amount Entry */}
            {step === 1 && (
              <>
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-[20px] font-black text-white uppercase tracking-tighter">Withdraw Funds</h2>
                   <button onClick={handleClose} className="p-2 bg-[#1A1A1A] rounded-full text-gray-500 hover:text-white transition">
                      <X size={18} />
                   </button>
                </div>
                
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 mb-6 flex justify-between items-center">
                   <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Available Balance</span>
                   <span className="text-[#E8B84B] font-black text-xl">{formatCurrency(earnedBalance)}</span>
                </div>

                <div className="mb-6 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                  <input 
                    type="number"
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white p-4 pl-8 rounded-xl font-black text-2xl focus:border-[#E8B84B] outline-none transition"
                    placeholder="200"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 mb-6">
                   {[500, 1000, 2000].map(val => (
                      <button 
                        key={val} 
                        onClick={() => setAmount(val.toString())}
                        className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-300 py-2 rounded-lg text-xs font-bold transition border border-[#2A2A2A]"
                      >
                         ₹{val}
                      </button>
                   ))}
                   <button 
                     onClick={() => setAmount(earnedBalance.toString())}
                     className="bg-[#E8B84B]/10 hover:bg-[#E8B84B]/20 text-[#E8B84B] border border-[#E8B84B]/30 py-2 rounded-lg text-xs font-bold transition"
                   >
                     MAX
                   </button>
                </div>

                <button 
                  onClick={handleNextStep1}
                  disabled={!amount || parseFloat(amount) < 200 || parseFloat(amount) > earnedBalance}
                  className="w-full bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl disabled:opacity-50 disabled:grayscale transition"
                >
                  Continue Proceed
                </button>
                <p className="text-[10px] text-gray-500 text-center mt-3 uppercase tracking-widest font-bold">Minimum withdrawal: ₹200</p>
              </>
            )}

            {/* Step 2: UPI Confirmation */}
            {step === 2 && (
              <>
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-[20px] font-black text-white uppercase tracking-tighter">Confirm Detail</h2>
                   <button onClick={handleClose} className="p-2 bg-[#1A1A1A] rounded-full text-gray-500 hover:text-white transition">
                      <X size={18} />
                   </button>
                </div>

                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 mb-4 space-y-4">
                   <div className="flex justify-between items-start border-b border-[#2A2A2A] pb-4">
                      <div>
                         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Transfer to UPI</p>
                         <p className="text-white font-medium text-sm">{userData?.upiId || 'Not set'}</p>
                      </div>
                      <button className="text-[#E8B84B] text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:underline">
                         <Edit2 size={12} /> Edit
                      </button>
                   </div>
                   <div className="flex justify-between items-start border-b border-[#2A2A2A] pb-4">
                      <div>
                         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Bank Account</p>
                         <p className="text-white font-medium text-sm flex items-center gap-2">
                           <span className="w-6 h-4 bg-gray-600 rounded-sm"></span>
                           •••• 4021
                         </p>
                      </div>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-400">Amount to Send</span>
                      <span className="text-[#E8B84B] font-black text-xl">{formatCurrency(parseFloat(amount))}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-widest">Processing Fee</span>
                      <span className="text-[#00C9A7] font-bold">Rs. 0 (Free)</span>
                   </div>
                </div>

                <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl p-4 mb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-600 bg-black text-[#E8B84B] focus:ring-[#E8B84B]"
                    />
                    <span className="text-xs text-[#F59E0B]/90 leading-relaxed font-bold tracking-wide">
                      I confirm these details are correct and acknowledge funds represent verified performance.
                    </span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] text-white font-bold uppercase tracking-widest text-[10px] py-4 rounded-xl hover:bg-[#2A2A2A] transition">Back</button>
                  <button 
                    onClick={handleConfirm} 
                    disabled={!agreed || isSubmitting}
                    className="flex-[2] bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl disabled:opacity-50 transition"
                  >
                     {isSubmitting ? 'Processing...' : 'Confirm Withdrawal'}
                  </button>
                </div>
              </>
            )}

            {/* Step 3: KYC Gate */}
            {step === 3 && (
              <div className="text-center py-4">
                 <div className="w-20 h-20 bg-red-500/10 rounded-full flex justify-center items-center mx-auto mb-6 relative">
                    <Lock size={32} className="text-red-500" />
                    <span className="absolute top-0 right-0 w-6 h-6 bg-red-500 rounded-full border-4 border-[#111111] flex items-center justify-center text-white text-[10px] font-black">!</span>
                 </div>
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">KYC Locked</h2>
                 <p className="text-sm text-gray-400 font-medium mb-6">Complete identity verification to unlock higher withdrawals.</p>
                 
                 <div className="bg-[#1A1A1A] rounded-xl p-4 mb-8 text-left border border-[#2A2A2A]">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Requirements</h4>
                    <ul className="space-y-3">
                       <li className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                          <CheckCircle size={16} className="text-[#00C9A7]" /> Valid Govt ID
                       </li>
                       <li className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                          <CheckCircle size={16} className="text-[#00C9A7]" /> Selfie Verification
                       </li>
                       <li className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                          <CheckCircle size={16} className="text-[#00C9A7]" /> Bank/UPI Match
                       </li>
                    </ul>
                 </div>

                 <div className="flex flex-col gap-3">
                    <button className="w-full bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(232,184,75,0.2)]">
                       Complete KYC Now
                    </button>
                    <button onClick={() => setStep(1)} className="w-full text-xs font-bold text-gray-500 uppercase py-2 hover:text-white transition">
                       Go Back
                    </button>
                 </div>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <div className="text-center py-6 relative">
                <Confetti
                  width={400}
                  height={400}
                  recycle={false}
                  numberOfPieces={200}
                  colors={['#E8B84B', '#00C9A7', '#3B82F6', '#8B5CF6']}
                  style={{ position: 'absolute', top: -50, left: 0, zIndex: 0 }}
                />
                <div className="relative z-10 w-24 h-24 bg-[#00C9A7]/10 rounded-full flex justify-center items-center mx-auto mb-6">
                   <CheckCircle className="w-12 h-12 text-[#00C9A7]" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 relative z-10">Withdrawal Requested!</h2>
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 mb-6 inline-block mx-auto">
                   <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Reference ID</p>
                   <p className="text-white font-mono font-bold tracking-wider">WD-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                </div>
                <p className="text-xs text-gray-400 font-bold mb-8">Please allow 24-48hrs processing time.</p>
                
                <button onClick={handleClose} className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-[#2A2A2A] text-white font-black uppercase tracking-widest py-4 rounded-xl transition relative z-10">
                   Back to Wallet
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
