import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Save, Store, User, Bell, FileText, CreditCard, CheckCircle2, Sparkles, Clock, PhoneCall, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateDoc, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { associatePhoneWithUid, disassociatePhoneWithUid, checkPhoneDuplicate } from '../../utils/phoneDirectory';
import RazorpayOnboardingModal from '../../components/reseller/RazorpayOnboardingModal';

export default function ResellerSettings() {
  const { userData, currentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  
  const [profile, setProfile] = useState({
    name: userData?.name || '',
    phone: userData?.phone || '',
    upiId: userData?.upiId || '',
    bankAccount: userData?.bankAccount || '',
    ifsc: userData?.ifsc || '',
  });

  const [storeDetails, setStoreDetails] = useState({
    tagline: userData?.branding?.tagline || '',
    instagramHandle: userData?.branding?.instagramHandle || '',
    whatsappNumber: userData?.branding?.whatsappNumber || '',
  });

  const [notifications, setNotifications] = useState({
    orderAlerts: true,
    promoEmails: false,
    smsAlerts: true,
  });

  const [policies, setPolicies] = useState({
    returnPolicy: '7 Days Return',
    shippingPolicy: 'Ships in 3-5 Business Days',
  });

  const [paymentGateway, setPaymentGateway] = useState({
    razorpayConnected: userData?.razorpayConnected || userData?.paymentGateway?.razorpayConnected || false,
    razorpayKeyId: userData?.razorpayKeyId || userData?.paymentGateway?.razorpayKeyId || '',
    razorpayAccountId: userData?.razorpayAccountId || userData?.paymentGateway?.razorpayAccountId || '',
    razorpayStatus: userData?.razorpayStatus || 'none'
  });

  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'partnerShops', currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPaymentGateway({
          razorpayConnected: Boolean(data.razorpayConnected || data.paymentGateway?.razorpayConnected),
          razorpayKeyId: data.razorpayKeyId || data.paymentGateway?.razorpayKeyId || '',
          razorpayAccountId: data.razorpayAccountId || data.paymentGateway?.razorpayAccountId || '',
          razorpayStatus: data.razorpayStatus || (data.razorpayConnected ? 'active' : 'none')
        });
      }
    });
    return () => unsub();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    
    const cleanPhoneInput = profile.phone.replace(/\D/g, '').trim();
    let finalPhone = profile.phone.trim();
    
    if (cleanPhoneInput.length === 10) {
      finalPhone = `+91${cleanPhoneInput}`;
    } else if (cleanPhoneInput.length === 12 && cleanPhoneInput.startsWith('91')) {
      finalPhone = `+${cleanPhoneInput}`;
    } else if (finalPhone.includes('TEMP')) {
       // Allow keeping it temporarily
    } else {
       toast.error('Please enter a valid 10-digit actual mobile number starting with or without +91');
       return;
    }

    setSaving(true);
    try {
      // Duplication check
      if (finalPhone !== userData?.phone && !finalPhone.includes('TEMP')) {
        const isDuplicate = await checkPhoneDuplicate(db, finalPhone, currentUser.email || '');
        if (isDuplicate) {
          toast.error('This phone number is already registered with another account.');
          setSaving(false);
          return;
        }
      }

      await updateDoc(doc(db, 'users', currentUser.uid), {
         ...profile,
         phone: finalPhone,
         razorpayConnected: paymentGateway.razorpayConnected,
         razorpayKeyId: paymentGateway.razorpayKeyId,
         razorpayAccountId: paymentGateway.razorpayAccountId,
         paymentGateway,
         branding: {
            ...userData?.branding,
            ...storeDetails
         },
         settings: {
            notifications,
            policies
         }
      });

      // Update phone directories
      if (finalPhone !== userData?.phone && !finalPhone.includes('TEMP')) {
         if (userData?.phone) {
            await disassociatePhoneWithUid(db, userData.phone, currentUser.uid);
         }
         await associatePhoneWithUid(db, finalPhone, currentUser.uid);
         
         // Notify database/Auth synchronization backend API
         try {
            await fetch(`/api/admin/update-user/${currentUser.uid}`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ phone: finalPhone })
            });
         } catch (apiErr) {
            console.warn("Backend phone sync failed:", apiErr);
         }
      }

      // Try updating partnerShops document too if they have one (assuming uid matches doc id)
      try {
         await updateDoc(doc(db, 'partnerShops', currentUser.uid), {
            'branding.tagline': storeDetails.tagline,
            'branding.instagramHandle': storeDetails.instagramHandle,
            'branding.whatsappNumber': storeDetails.whatsappNumber,
            policies,
            razorpayConnected: paymentGateway.razorpayConnected,
            razorpayKeyId: paymentGateway.razorpayKeyId,
            razorpayAccountId: paymentGateway.razorpayAccountId,
            paymentGateway
         });
      } catch (e) {
         // Silently fail if shop doc not found
         console.log(e);
      }
      
      toast.success('Settings updated successfully');
    } catch (e) {
      toast.error('Failed to update settings');
    }
    setSaving(false);
  };

  const tabs = [
     { id: 'account', label: 'Account', icon: User },
     { id: 'store', label: 'Store Details', icon: Store },
     { id: 'payments', label: 'Payment Gateway', icon: CreditCard },
     { id: 'policies', label: 'Store Policies', icon: FileText },
     { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-white">Settings</h1>

      <div className="flex border-b border-[#2A2A2A] pb-0 overflow-x-auto scrollbar-hide">
         {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition shrink-0 ${
                     activeTab === tab.id 
                     ? 'border-[#E8B84B] text-[#E8B84B]' 
                     : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
               >
                  <Icon size={16} />
                  {tab.label}
               </button>
            );
         })}
      </div>

      <AnimatePresence mode="wait">
         {activeTab === 'account' && (
            <motion.div key="account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
               <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 space-y-6">
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-[#2A2A2A] pb-4">Personal Info</h2>
                  
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Full Name</label>
                        <input 
                          type="text" 
                          value={profile.name}
                          onChange={e => setProfile({...profile, name: e.target.value})}
                          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Phone</label>
                        <input 
                          type="text" 
                          value={profile.phone}
                          onChange={e => setProfile({...profile, phone: e.target.value})}
                          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]"
                        />
                     </div>
                  </div>
               </div>

               <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 space-y-6">
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-[#2A2A2A] pb-4">Payout Details</h2>
                  <p className="text-xs text-gray-400">Where you want to receive your margins.</p>
                  
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">UPI ID</label>
                        <input 
                          type="text" 
                          value={profile.upiId}
                          onChange={e => setProfile({...profile, upiId: e.target.value})}
                          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]"
                          placeholder="name@upi"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Bank Account No.</label>
                        <input 
                          type="text" 
                          value={profile.bankAccount}
                          onChange={e => setProfile({...profile, bankAccount: e.target.value})}
                          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]"
                          placeholder="Account Number"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">IFSC Code</label>
                        <input 
                          type="text" 
                          value={profile.ifsc}
                          onChange={e => setProfile({...profile, ifsc: e.target.value})}
                          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]"
                          placeholder="IFSC Code"
                        />
                     </div>
                  </div>
               </div>
            </motion.div>
         )}

         {activeTab === 'store' && (
            <motion.div key="store" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 space-y-6">
               <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-[#2A2A2A] pb-4">Store Details</h2>
               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Tagline</label>
                     <input type="text" value={storeDetails.tagline} onChange={e => setStoreDetails({...storeDetails, tagline: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Instagram Handle</label>
                     <input type="text" value={storeDetails.instagramHandle} onChange={e => setStoreDetails({...storeDetails, instagramHandle: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">WhatsApp Contact</label>
                     <input type="text" value={storeDetails.whatsappNumber} onChange={e => setStoreDetails({...storeDetails, whatsappNumber: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]" />
                  </div>
               </div>
            </motion.div>
         )}

          {activeTab === 'payments' && (
            <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 space-y-6">
               <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
                  <div>
                     <h2 className="text-sm font-bold text-white uppercase tracking-widest">Razorpay Online Payment Gateway</h2>
                     <p className="text-xs text-gray-400 mt-1">Connect your Razorpay account via WorkPlex to enable instant online checkout.</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                     paymentGateway.razorpayConnected 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                        : paymentGateway.razorpayStatus === 'pending_verification'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : paymentGateway.razorpayStatus === 'assistance_requested'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                  }`}>
                     {paymentGateway.razorpayConnected ? 'Connected & Verified' : paymentGateway.razorpayStatus === 'pending_verification' ? 'Verification Under Process' : paymentGateway.razorpayStatus === 'assistance_requested' ? '24h Call Requested' : 'Only COD Active'}
                  </span>
               </div>

               {/* Banner status */}
               {paymentGateway.razorpayConnected ? (
                  <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-2xl space-y-3">
                     <div className="flex items-center justify-between">
                        <p className="text-xs text-green-400 font-bold flex items-center gap-1.5">
                           <CheckCircle2 size={16} /> Razorpay Account Linked & Verified
                        </p>
                        <span className="text-[10px] font-mono bg-black/40 text-gray-300 px-2.5 py-1 rounded-md border border-white/10">
                           ID: {paymentGateway.razorpayAccountId || 'acc_rzp_workplex_' + currentUser?.uid?.slice(0, 8)}
                        </span>
                     </div>
                     <p className="text-[11px] text-gray-300 leading-relaxed">
                        Online payments are active on your shop. Buyers will see Online Pay (UPI / Cards / NetBanking) and Cash On Delivery (COD) at checkout.
                     </p>
                     
                     <div className="pt-2 flex items-center gap-3">
                        <button 
                           type="button"
                           onClick={() => setIsRazorpayModalOpen(true)}
                           className="text-[11px] font-bold text-[#E8B84B] hover:underline"
                        >
                           Update Credentials
                        </button>
                        <span className="text-gray-600">•</span>
                        <button 
                           type="button"
                           onClick={() => {
                              setPaymentGateway({...paymentGateway, razorpayConnected: false, razorpayStatus: 'none'});
                              toast.success('Razorpay account disconnected. Store switched to Cash On Delivery (COD) mode.');
                           }}
                           className="text-[11px] font-bold text-red-400 hover:text-red-300 underline"
                        >
                           Disconnect Razorpay Account
                        </button>
                     </div>
                  </div>
               ) : paymentGateway.razorpayStatus === 'pending_verification' ? (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl space-y-3">
                     <div className="flex items-center justify-between">
                        <p className="text-xs text-blue-400 font-bold flex items-center gap-1.5">
                           <Clock size={16} className="animate-spin" /> Verification Under Process
                        </p>
                        <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-md">
                           In Review
                        </span>
                     </div>
                     <p className="text-[11px] text-gray-300 leading-relaxed">
                        Your Razorpay details have been submitted to WorkPlex team! Verification team will review and contact you soon. Store operates on Cash On Delivery (COD) mode in the meantime.
                     </p>
                     
                     <div className="pt-2">
                        <button 
                           type="button"
                           onClick={() => setIsRazorpayModalOpen(true)}
                           className="text-[11px] font-bold text-[#E8B84B] hover:underline"
                        >
                           Update Submitted Details
                        </button>
                     </div>
                  </div>
               ) : paymentGateway.razorpayStatus === 'assistance_requested' ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl space-y-3">
                     <div className="flex items-center justify-between">
                        <p className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                           <PhoneCall size={16} className="animate-pulse" /> 24-Hour Call Requested
                        </p>
                        <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-md">
                           Scheduled
                        </span>
                     </div>
                     <p className="text-[11px] text-gray-300 leading-relaxed">
                        Our WorkPlex technical onboarding team will call you on your registered phone within 24 hours to help set up your Razorpay account step-by-step.
                     </p>
                     
                     <div className="pt-2">
                        <button 
                           type="button"
                           onClick={() => setIsRazorpayModalOpen(true)}
                           className="text-[11px] font-bold text-[#E8B84B] hover:underline"
                        >
                           Submit Merchant ID Directly
                        </button>
                     </div>
                  </div>
               ) : (
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-6 rounded-2xl text-center space-y-4">
                     <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[#E8B84B] flex items-center justify-center mx-auto">
                        <Zap size={24} />
                     </div>
                     <div className="space-y-1">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Connect Razorpay Payment Gateway</h3>
                        <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                           Connect your Razorpay account through WorkPlex or request a 24-hour setup call from our technical team.
                        </p>
                     </div>

                     <button
                        type="button"
                        onClick={() => setIsRazorpayModalOpen(true)}
                        className="px-6 py-3.5 bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mx-auto cursor-pointer"
                     >
                        <Zap size={16} /> Connect Razorpay Account
                     </button>
                  </div>
               )}

               {paymentGateway.razorpayConnected && (
                  <div className="flex items-center justify-between p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
                     <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">Online Payment Option on Checkout</span>
                        <span className="text-[11px] text-gray-400">Toggle ON to show Online Pay alongside COD on checkout.</span>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                           type="checkbox" 
                           checked={paymentGateway.razorpayConnected}
                           onChange={(e) => setPaymentGateway({...paymentGateway, razorpayConnected: e.target.checked})}
                           className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E8B84B]"></div>
                     </label>
                  </div>
               )}

               <RazorpayOnboardingModal
                  isOpen={isRazorpayModalOpen}
                  onClose={() => setIsRazorpayModalOpen(false)}
                  partnerShopName={userData?.branding?.shopName}
                  partnerShopSlug={userData?.branding?.shopSlug}
                  onSuccess={() => setIsRazorpayModalOpen(false)}
               />
            </motion.div>
         )}

         {activeTab === 'policies' && (
            <motion.div key="policies" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 space-y-6">
               <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-[#2A2A2A] pb-4">Store Policies</h2>
               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Return Policy</label>
                     <textarea rows={3} value={policies.returnPolicy} onChange={e => setPolicies({...policies, returnPolicy: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B] resize-none" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Shipping Policy</label>
                     <textarea rows={3} value={policies.shippingPolicy} onChange={e => setPolicies({...policies, shippingPolicy: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B] resize-none" />
                  </div>
               </div>
            </motion.div>
         )}

         {activeTab === 'notifications' && (
            <motion.div key="alerts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 space-y-6">
               <h2 className="text-sm font-bold text-white uppercase tracking-widest border-b border-[#2A2A2A] pb-4">Notifications</h2>
               <div className="space-y-4">
                  <label className="flex items-center gap-3">
                     <input type="checkbox" checked={notifications.orderAlerts} onChange={e => setNotifications({...notifications, orderAlerts: e.target.checked})} className="w-4 h-4 accent-[#E8B84B]" />
                     <span className="text-sm font-bold text-gray-300">Order Alerts (App & Email)</span>
                  </label>
                  <label className="flex items-center gap-3">
                     <input type="checkbox" checked={notifications.smsAlerts} onChange={e => setNotifications({...notifications, smsAlerts: e.target.checked})} className="w-4 h-4 accent-[#E8B84B]" />
                     <span className="text-sm font-bold text-gray-300">SMS Alerts for Margin Payouts</span>
                  </label>
                  <label className="flex items-center gap-3">
                     <input type="checkbox" checked={notifications.promoEmails} onChange={e => setNotifications({...notifications, promoEmails: e.target.checked})} className="w-4 h-4 accent-[#E8B84B]" />
                     <span className="text-sm font-bold text-gray-300">Promotional Emails & Updates</span>
                  </label>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      <button 
         onClick={handleSave}
         disabled={saving}
         className="w-full py-4 bg-[#E8B84B] text-black font-black uppercase tracking-widest rounded-xl hover:bg-[#E8B84B]/90 transition-colors flex items-center justify-center gap-2 mt-6 shadow-[0_0_20px_rgba(232,184,75,0.2)]"
      >
         <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
      </button>

    </div>
  );
}
