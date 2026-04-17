import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import CryptoJS from 'crypto-js';
import { Camera, CreditCard, UserCheck, Shield, ChevronRight, X, Briefcase } from 'lucide-react';
import { calculateProfileCompletion } from '../../lib/cloudFunctions';

const SECRET_KEY = import.meta.env.VITE_KYC_SECRET_KEY || 'HVRS_TEMP_SECRET_KEY_2026';

export default function ProgressiveProfilingWizard({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { currentUser, userData } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [photo, setPhoto] = useState<File | null>(null);
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [upi, setUpi] = useState('');
  const [bank, setBank] = useState('');
  
  if (!isOpen || !userData || !currentUser) return null;

  const totalSteps = userData.role === 'Partner' ? 4 : 3;

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    } else {
      await handleComplete();
    }
  };

  const encryptData = (text: string) => {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const updates: any = {};
      
      // Step 1: Photo
      if (photo) {
        const storageRef = ref(storage, `profiles/${currentUser.uid}/photo.jpg`);
        await uploadBytes(storageRef, photo);
        updates.photoURL = await getDownloadURL(storageRef);
      }

      // Step 2: KYC
      if (aadhaar && pan) {
        updates.aadhaar = encryptData(aadhaar);
        updates.pan = encryptData(pan);
        updates.kycCompletedAt = serverTimestamp();
        updates.kycDeferred = false;
      }

      // Step 3: Finance
      if (upi) updates.upiId = upi;
      if (bank) updates.bankAccount = bank;

      // Update completion % 
      const mockData = { ...userData, ...updates };
      updates.profileCompletion = await calculateProfileCompletion(currentUser.uid, mockData);

      // Trust points calculation is handled safely inside the cloud function equivalent.
      await updateDoc(userRef, updates);
      
      toast.success('Profile updated successfully!');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Error updating profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-white font-black uppercase tracking-widest text-sm">Identity Verification</h3>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white rounded-full">
               <X size={18} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#E8B84B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="text-[#E8B84B]" size={28} />
                  </div>
                  <h4 className="text-white font-bold text-xl mb-2">Upload Photo</h4>
                  <p className="text-gray-400 text-sm">Help us protect your account with a real photo.</p>
                </div>
                
                <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-[#E8B84B]/50 transition-colors cursor-pointer relative">
                  <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  {photo ? (
                     <span className="text-[#E8B84B] font-bold text-sm">Image Selected: {photo.name}</span>
                  ) : (
                     <span className="text-gray-500 text-sm font-bold tracking-widest uppercase">Tap to Select Photo</span>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserCheck className="text-[#10B981]" size={28} />
                  </div>
                  <h4 className="text-white font-bold text-xl mb-2">KYC Details</h4>
                  <p className="text-gray-400 text-sm mb-4">Unlock withdrawals by validating your identity. Data is AES encrypted.</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Aadhaar Number</label>
                    <input 
                      type="text" 
                      value={aadhaar} 
                      onChange={e=>setAadhaar(e.target.value)} 
                      placeholder="Enter 12-digit Aadhaar"
                      className="w-full bg-[#1A1A1D] border border-white/10 text-white px-4 py-3 rounded-xl focus:border-[#10B981] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">PAN Number</label>
                    <input 
                      type="text" 
                      value={pan} 
                      onChange={e=>setPan(e.target.value)} 
                      placeholder="Enter 10-char PAN"
                      className="w-full bg-[#1A1A1D] border border-white/10 text-white px-4 py-3 rounded-xl focus:border-[#10B981] outline-none transition-all uppercase"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[#10B981] text-xs font-bold mt-2 bg-[#10B981]/10 p-2 rounded-lg">
                    <Shield size={14} /> End-to-end Encrypted
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#3B82F6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="text-[#3B82F6]" size={28} />
                  </div>
                  <h4 className="text-white font-bold text-xl mb-2">Payout Details</h4>
                  <p className="text-gray-400 text-sm">Where should we send your earnings?</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">UPI ID (Fastest)</label>
                    <input 
                      type="text" 
                      value={upi} 
                      onChange={e=>setUpi(e.target.value)} 
                      placeholder="name@okbank"
                      className="w-full bg-[#1A1A1D] border border-white/10 text-white px-4 py-3 rounded-xl focus:border-[#3B82F6] outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-widest">
                     <span className="w-1/3 h-px bg-white/10"></span> OR <span className="w-1/3 h-px bg-white/10"></span>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Bank Account</label>
                    <input 
                      type="text" 
                      value={bank} 
                      onChange={e=>setBank(e.target.value)} 
                      placeholder="Enter Account Number"
                      className="w-full bg-[#1A1A1D] border border-white/10 text-white px-4 py-3 rounded-xl focus:border-[#3B82F6] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && userData.role === 'Partner' && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-[#E8B84B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="text-[#E8B84B]" size={28} />
                </div>
                <h4 className="text-white font-bold text-xl mb-2">Shop Setup</h4>
                <p className="text-gray-400 text-sm">As a partner, you can set up a personal store to showcase products.</p>
                
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-left">
                  <p className="text-xs text-gray-400 mb-2">You can do this later from your dashboard.</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/5">
            <button 
              onClick={handleNext}
              disabled={isSubmitting}
              className="w-full bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
            >
              {isSubmitting ? 'Processing...' : (step === totalSteps ? 'Complete Profile' : 'Next Step')}
              {!isSubmitting && step < totalSteps && <ChevronRight size={18} />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
