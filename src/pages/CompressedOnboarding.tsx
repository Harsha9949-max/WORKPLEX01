import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ChevronLeft, Zap, Target, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function CompressedOnboarding() {
  const [step, setStep] = useState(1);
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [venture, setVenture] = useState('');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentUser, userData, loading } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!loading && userData?.venture && userData?.role) {
      navigate('/home');
    }
  }, [userData, loading, navigate]);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindī (हिन्दी)', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil (தமிழ்)', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu (తెలుగు)', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali (বাংলা)', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi (मराठी)', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam (മലയാളം)', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati (ગુજરાતી)', flag: '🇮🇳' },
    { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)', flag: '🇮🇳' }
  ];

  const ventures = [
    { id: 'BuyRix', name: 'BuyRix', tag: 'E-commerce', desc: 'Product reviews & sharing' },
    { id: 'Vyuma', name: 'Vyuma', tag: 'Creator', desc: 'Content & Social Media' },
    { id: 'TrendyVerse', name: 'TrendyVerse', tag: 'Fashion', desc: 'Apparel & Trends' },
    { id: 'Growplex', name: 'Growplex', tag: 'Agency', desc: 'B2B & Digital Marketing' }
  ];

  const roles = [
    { id: 'Marketer', name: 'Marketer', icon: '📈', desc: 'Promote products and earn commissions' },
    { id: 'Content Creator', name: 'Content Creator', icon: '🎥', desc: 'Create videos, write reviews' },
    { id: 'Reseller', name: 'Reseller', icon: '🛍️', desc: 'Sell catalog items directly' },
    { id: 'Partner', name: 'Partner', icon: '🤝', desc: 'Set up a shop and recruit network' }
  ];

  const handleLanguageSelect = (langCode: string) => {
    setPreferredLanguage(langCode);
    i18n.changeLanguage(langCode);
  };

  const handleComplete = async () => {
    console.log("Onboarding: handleComplete triggered", { venture, role, preferredLanguage });
    if (!venture || !role) {
      toast.error('Please select both a venture and a role to proceed.');
      return;
    }

    if (!currentUser) {
      console.error("Onboarding: No current user found");
      toast.error('Auth error. Please login again.');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      console.log("Onboarding: Updating Firestore...");
      await setDoc(userRef, {
        preferredLanguage,
        venture,
        role,
        kycDeferred: true,
        profileCompletion: 20
      }, { merge: true });
      
      console.log("Onboarding: Firestore update successful. Navigating to /home...");
      toast.success('Onboarding complete! 🚀');
      
      // Force navigation
      setTimeout(() => {
        navigate('/home', { replace: true });
      }, 100);
    } catch (error: any) {
      console.error("Onboarding Error:", error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 1) {
       navigate('/');
    } else {
       setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center p-4 pt-10 sm:p-6">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleBack} 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
              <ChevronLeft size={18} />
            </div>
            <span className="text-sm font-medium uppercase tracking-widest">{step === 1 ? 'Back' : 'Previous'}</span>
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-[#E8B84B]' : 'bg-white/20'}`} />
            <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-[#E8B84B]' : 'bg-white/20'}`} />
            <div className={`w-2 h-2 rounded-full ${step >= 3 ? 'bg-[#E8B84B]' : 'bg-white/20'}`} />
          </div>
        </div>

        <div className="glass-card p-6 sm:p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8">
                <div className="w-12 h-12 bg-[#2A2A2A] rounded-2xl flex items-center justify-center mb-4">
                  <Globe className="text-[#E8B84B]" size={24} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Select Language</h2>
                <p className="text-gray-400 text-sm">Choose your preferred language for the app and AI support.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      preferredLanguage === lang.code 
                        ? 'bg-[#E8B84B]/10 border-[#E8B84B] text-white' 
                        : 'bg-[#111] border-white/5 hover:border-white/20 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-bold text-sm tracking-tight">{lang.name}</span>
                  </button>
                ))}
              </div>

              <button 
                disabled={!preferredLanguage}
                onClick={() => setStep(2)}
                className="w-full mt-8 bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next Step
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8">
                <div className="w-12 h-12 bg-[#2A2A2A] rounded-2xl flex items-center justify-center mb-4">
                  <Target className="text-[#E8B84B]" size={24} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Select Venture</h2>
                <p className="text-gray-400 text-sm">Choose your primary focus area to match tasks exactly to your interests.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ventures.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setVenture(v.id)}
                    className={`p-4 rounded-2xl border text-left flex flex-col transition-all ${
                      venture === v.id 
                        ? 'bg-[#E8B84B]/10 border-[#E8B84B]' 
                        : 'bg-[#111] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase text-[#E8B84B] tracking-widest mb-1">{v.tag}</span>
                    <span className="text-white font-black text-lg mb-1">{v.name}</span>
                    <span className="text-gray-500 text-xs">{v.desc}</span>
                  </button>
                ))}
              </div>

              <button 
                disabled={!venture}
                onClick={() => setStep(3)}
                className="w-full mt-8 bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next Step
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8">
                <div className="w-12 h-12 bg-[#2A2A2A] rounded-2xl flex items-center justify-center mb-4">
                  <Zap className="text-[#E8B84B]" size={24} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Select Your Role</h2>
                <p className="text-gray-400 text-sm">How do you predict turning instructions into earnings?</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`p-4 rounded-2xl border text-left flex flex-col transition-all ${
                      role === r.id 
                        ? 'bg-[#E8B84B]/10 border-[#E8B84B]' 
                        : 'bg-[#111] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl mb-2">{r.icon}</span>
                    <span className="text-white font-black text-lg mb-1">{r.name}</span>
                    <span className="text-gray-500 text-xs">{r.desc}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 space-y-4">
                <button 
                  disabled={!role || isSubmitting}
                  onClick={handleComplete}
                  className="w-full bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                >
                  {isSubmitting ? 'Finalizing...' : 'Complete Phase 1'}
                </button>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center mt-4">
                  Identity Verification (KYC) deferred to payout unlocking phase to respect User Time constraints.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
