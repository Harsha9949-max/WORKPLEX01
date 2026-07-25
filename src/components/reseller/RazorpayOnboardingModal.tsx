import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  X, 
  ExternalLink, 
  PhoneCall, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles,
  ArrowRight,
  Send
} from 'lucide-react';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  partnerShopName?: string;
  partnerShopSlug?: string;
  onSuccess?: () => void;
}

export default function RazorpayOnboardingModal({ isOpen, onClose, partnerShopName = '', partnerShopSlug = '', onSuccess }: Props) {
  const { currentUser, userData } = useAuth();
  const [activeTab, setActiveTab] = useState<'submit' | 'callback'>('submit');
  const [loading, setLoading] = useState(false);

  // Form State
  const [merchantId, setMerchantId] = useState('');
  const [keyId, setKeyId] = useState('');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [preferredTime, setPreferredTime] = useState('Morning (10 AM - 1 PM)');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmitMerchantDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!merchantId.trim() && !keyId.trim()) {
      toast.error("Please enter your Razorpay Merchant ID or Key ID");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: currentUser.uid,
        uid: currentUser.uid,
        partnerName: userData?.displayName || userData?.fullName || currentUser.email?.split('@')[0] || 'WorkPlex Partner',
        email: email || currentUser.email || '',
        phone: phone || userData?.phone || '',
        shopName: partnerShopName || userData?.branding?.shopName || 'Partner Store',
        shopSlug: partnerShopSlug || userData?.branding?.shopSlug || '',
        type: 'credential_submission',
        merchantId: merchantId.trim(),
        keyId: keyId.trim(),
        notes: notes.trim(),
        status: 'pending_verification',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 1. Create/Update request doc in razorpayRequests collection
      await setDoc(doc(db, 'razorpayRequests', currentUser.uid), payload, { merge: true });

      // 2. Update partnerShops doc
      await updateDoc(doc(db, 'partnerShops', currentUser.uid), {
        razorpayStatus: 'pending_verification',
        razorpayMerchantId: merchantId.trim(),
        razorpayKeyId: keyId.trim(),
        razorpayNotes: notes.trim(),
        razorpayConnected: false
      }).catch(err => console.log(err));

      // 3. Update users doc
      await updateDoc(doc(db, 'users', currentUser.uid), {
        razorpayStatus: 'pending_verification',
        razorpayMerchantId: merchantId.trim(),
        razorpayKeyId: keyId.trim(),
        razorpayNotes: notes.trim(),
        razorpayConnected: false
      }).catch(err => console.log(err));

      toast.success("Razorpay details submitted! Verification is now under process.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error(err.message || "Failed to submit Razorpay details");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!phone.trim()) {
      toast.error("Please enter a valid contact phone number");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: currentUser.uid,
        uid: currentUser.uid,
        partnerName: userData?.displayName || userData?.fullName || currentUser.email?.split('@')[0] || 'WorkPlex Partner',
        email: email || currentUser.email || '',
        phone: phone.trim(),
        shopName: partnerShopName || userData?.branding?.shopName || 'Partner Store',
        shopSlug: partnerShopSlug || userData?.branding?.shopSlug || '',
        type: 'callback_request',
        preferredTime,
        notes: notes.trim(),
        status: 'assistance_requested',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'razorpayRequests', currentUser.uid), payload, { merge: true });

      await updateDoc(doc(db, 'partnerShops', currentUser.uid), {
        razorpayStatus: 'assistance_requested',
        razorpayCallbackPhone: phone.trim(),
        razorpayPreferredTime: preferredTime,
        razorpayConnected: false
      }).catch(() => {});

      await updateDoc(doc(db, 'users', currentUser.uid), {
        razorpayStatus: 'assistance_requested',
        razorpayCallbackPhone: phone.trim(),
        razorpayPreferredTime: preferredTime,
        razorpayConnected: false
      }).catch(() => {});

      toast.success("24-Hour Callback Request submitted! Our team will contact you soon.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Callback error:", err);
      toast.error(err.message || "Failed to request callback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#111111] border border-[#2A2A2A] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#2A2A2A] flex items-center justify-between bg-[#1A1A1A]">
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="text-[#E8B84B]" size={20} /> Connect Razorpay Online Payments
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Enable Google Pay, PhonePe, Cards & NetBanking on your online store.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-all rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Option Tabs */}
        <div className="flex border-b border-[#2A2A2A] bg-[#0D0D0D]">
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex-1 py-3.5 px-4 text-center text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'submit'
                ? 'bg-[#111111] text-[#E8B84B] border-b-2 border-[#E8B84B]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={16} /> Submit Razorpay Merchant ID
          </button>

          <button
            onClick={() => setActiveTab('callback')}
            className={`flex-1 py-3.5 px-4 text-center text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'callback'
                ? 'bg-[#111111] text-[#E8B84B] border-b-2 border-[#E8B84B]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <PhoneCall size={16} /> Request 24h Setup Call
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {activeTab === 'submit' ? (
            <form onSubmit={handleSubmitMerchantDetails} className="space-y-5">
              {/* External Razorpay Link Helper */}
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">Don't have a Razorpay Account yet?</span>
                  <span className="text-[11px] text-gray-400">Create your account on Razorpay's official portal.</span>
                </div>
                <a
                  href="https://easy.razorpay.com/onboarding"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shrink-0"
                >
                  Razorpay Portal <ExternalLink size={12} />
                </a>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Razorpay Merchant ID / Account ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                    placeholder="e.g. acc_xxxxxxxxxxxx or Merchant ID from Razorpay dashboard"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-xl text-xs font-mono outline-none focus:border-[#E8B84B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Razorpay Key ID (Optional if generated)
                  </label>
                  <input
                    type="text"
                    value={keyId}
                    onChange={(e) => setKeyId(e.target.value)}
                    placeholder="e.g. rzp_live_xxxxxxxxxxxxxx"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-xl text-xs font-mono outline-none focus:border-[#E8B84B]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Contact Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#E8B84B]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Contact Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. partner@gmail.com"
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#E8B84B]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes / Business Name</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Registered GST business or Individual merchant account"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#E8B84B]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send size={16} /> {loading ? 'Submitting Details...' : 'Submit Details for WorkPlex Verification'}
                </button>
                <p className="text-[10px] text-gray-500 text-center mt-2">
                  Our WorkPlex team verifies credentials within 24 hours. Your store remains live on COD in the meantime.
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRequestCallback} className="space-y-5">
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-1">
                <p className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                  <PhoneCall size={16} /> 1-on-1 Onboarding Assistance
                </p>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  New to Razorpay or need help with KYC documentation? Our WorkPlex technical onboarding specialist will call you within 24 hours to guide you step-by-step.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Contact Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number for callback"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-xl text-xs outline-none focus:border-[#E8B84B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Preferred Time for Call
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-xl text-xs outline-none focus:border-[#E8B84B]"
                  >
                    <option value="Morning (10 AM - 1 PM)">Morning (10 AM - 1 PM)</option>
                    <option value="Afternoon (1 PM - 5 PM)">Afternoon (1 PM - 5 PM)</option>
                    <option value="Evening (5 PM - 8 PM)">Evening (5 PM - 8 PM)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Any Questions or Details</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="e.g. I need help creating a new Razorpay account or linking UPI"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#E8B84B]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PhoneCall size={16} /> {loading ? 'Submitting Request...' : 'Request 24-Hour Technical Call'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
