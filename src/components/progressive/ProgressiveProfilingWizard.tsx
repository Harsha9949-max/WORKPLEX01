import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Wallet, 
  Building2, 
  CheckCircle2, 
  Lock, 
  User as UserIcon, 
  Landmark,
  Store
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../lib/firebase';
import CryptoJS from 'crypto-js';
import toast from 'react-hot-toast';

const KYC_SECRET = 'hvrs-workplex-phase-12-secret'; // Should be from process.env in production

interface ProfileWizardProps {
  onComplete: () => void;
  role?: string;
}

export default function ProgressiveProfilingWizard({ onComplete, role }: ProfileWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    photoURL: '',
    aadhaar: '',
    pan: '',
    bankAccount: '',
    ifsc: '',
    upiId: '',
    shopName: '',
    shopDescription: ''
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const storageRef = ref(storage, `users/${auth.currentUser?.uid}/profile.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, photoURL: url }));
      toast.success('Photo uploaded!');
      setStep(2);
    } catch (error: any) {
      toast.error('Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  const handleKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.aadhaar.length !== 12 || formData.pan.length !== 10) {
      toast.error('Invalid ID formats');
      return;
    }
    setStep(3);
  };

  const handleFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'Partner') {
      setStep(4);
    } else {
      await finalizeProfile();
    }
  };

  const finalizeProfile = async () => {
    setLoading(true);
    try {
      if (!auth.currentUser) return;

      // Encrypt sensitive info
      const kycData = JSON.stringify({
        aadhaar: formData.aadhaar,
        pan: formData.pan
      });
      const encryptedKYC = CryptoJS.AES.encrypt(kycData, KYC_SECRET).toString();

      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        photoURL: formData.photoURL,
        kycEncrypted: encryptedKYC,
        bankDetails: {
          account: formData.bankAccount,
          ifsc: formData.ifsc,
          upiId: formData.upiId
        },
        shop: role === 'Partner' ? {
          name: formData.shopName,
          description: formData.shopDescription
        } : null,
        kycDeferred: false,
        kycCompletedAt: serverTimestamp(),
        profileCompletion: 100,
        trustPoints: 500 // Grant trust points on completion
      });

      toast.success('Profile completed! KYC verified.');
      onComplete();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    enter: { x: 10, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -10, opacity: 0 }
  };

  return (
    <div className="bg-[#111] p-8 rounded-3xl border border-white/10 shadow-3xl max-w-lg w-full">
      <div className="flex justify-between mb-8 overflow-x-auto gap-4 pb-2">
        {[1, 2, 3, 4].map((s) => (
          (s < 4 || role === 'Partner') && (
            <div key={s} className="flex flex-col items-center min-w-[60px]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                s <= step ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/40'
              }`}>
                {s}
              </div>
              <span className={`text-[8px] uppercase font-black ${s <= step ? 'text-yellow-500' : 'text-gray-600'}`}>
                {s === 1 ? 'Photo' : s === 2 ? 'KYC' : s === 3 ? 'Bank' : 'Shop'}
              </span>
            </div>
          )
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Upload Profile Photo</h3>
              <p className="text-gray-400 text-sm">A clear face photo helps building trust with clients.</p>
            </div>
            <label className="block">
              <div className="aspect-square w-48 h-48 mx-auto bg-black border-2 border-dashed border-white/10 rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500/50 transition-all overflow-hidden relative group">
                {formData.photoURL ? (
                  <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-gray-500 group-hover:text-yellow-500" />
                    <span className="text-xs text-gray-600 mt-2 font-bold group-hover:text-gray-400">Click to upload</span>
                  </>
                )}
                {loading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-6 h-6 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </label>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" variants={stepVariants} initial="enter" animate="center" exit="exit">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">KYC Verification</h3>
              <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
                <Lock className="w-3 h-3 text-yellow-500" />
                AES Encrypted & Secure
              </p>
            </div>
            <form onSubmit={handleKYC} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Aadhaar Number</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    maxLength={12}
                    value={formData.aadhaar}
                    onChange={(e) => setFormData(prev => ({ ...prev, aadhaar: e.target.value.replace(/\D/g, '') }))}
                    className="w-full bg-black border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-yellow-500"
                    placeholder="1234 5678 9012"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">PAN Number</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.pan}
                    onChange={(e) => setFormData(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                    className="w-full bg-black border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-yellow-500"
                    placeholder="ABCDE1234F"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold hover:bg-yellow-400">
                Continue to Finance
              </button>
            </form>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" variants={stepVariants} initial="enter" animate="center" exit="exit">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Finance Setup</h3>
              <p className="text-gray-400 text-sm">Where should we send your earnings?</p>
            </div>
            <form onSubmit={handleFinance} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Bank Account Number</label>
                <input
                  type="text"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
                  className="w-full bg-black border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-yellow-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifsc}
                    onChange={(e) => setFormData(prev => ({ ...prev, ifsc: e.target.value.toUpperCase() }))}
                    className="w-full bg-black border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-yellow-500"
                    placeholder="HDFC0001234"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">UPI ID</label>
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData(prev => ({ ...prev, upiId: e.target.value }))}
                    className="w-full bg-black border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-yellow-500"
                    placeholder="user@upi"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold">
                {role === 'Partner' ? 'Continue to Shop Setup' : 'Finalize Profile'}
              </button>
            </form>
          </motion.div>
        )}

        {step === 4 && role === 'Partner' && (
          <motion.div key="step4" variants={stepVariants} initial="enter" animate="center" exit="exit">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Shop Setup</h3>
              <p className="text-gray-400 text-sm">Configure your virtual storefront.</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); finalizeProfile(); }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Shop Name</label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) => setFormData(prev => ({ ...prev, shopName: e.target.value }))}
                  className="w-full bg-black border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-yellow-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Description</label>
                <textarea
                  value={formData.shopDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, shopDescription: e.target.value }))}
                  className="w-full bg-black border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-yellow-500 h-24"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 'Create Shop & Finalize'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
