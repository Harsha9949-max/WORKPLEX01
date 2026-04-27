import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ChevronLeft, Zap, Target, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Logo } from '../components/ui/Logo';

export default function CompressedOnboarding() {
  const [step, setStep] = useState(1);
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [venture, setVenture] = useState('');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const { currentUser, userData, loading } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  useEffect(() => {
    // Keep user here if they haven't picked venture/role
    if (!loading && userData?.venture && userData?.role && !showWelcome) {
      navigate('/home');
    }
  }, [userData, loading, navigate, showWelcome]);

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
    { id: 'BuyRix', name: 'BuyRix', tag: 'E-commerce', desc: 'Product reviews & sharing', active: true },
    { id: 'Vyuma', name: 'Vyuma', tag: 'Creator', desc: 'Content & Social Media', active: true },
    { id: 'Growplex', name: 'Growplex', tag: 'Agency', desc: 'B2B & Digital Marketing', active: true },
    { id: 'Zaestify', name: 'Zaestify', tag: 'Fashion', desc: 'Apparel & Trends', active: false }
  ];

  const getRolesByVenture = (v: string) => {
    switch(v) {
      case 'BuyRix': return [
        { id: 'Marketer', name: 'Marketer', icon: '📈', desc: 'Promote products and earn commissions' },
        { id: 'Content Creator', name: 'Content Creator', icon: '🎥', desc: 'Create videos, write reviews' },
        { id: 'Reseller', name: 'Reseller', icon: '🛍️', desc: 'Sell catalog items directly' }
      ];
      case 'Vyuma': return [
        { id: 'Marketer', name: 'Marketer', icon: '📈', desc: 'Promote content and earn' },
        { id: 'Content Creator', name: 'Content Creator', icon: '🎥', desc: 'Create videos, write reviews' },
        { id: 'Reseller', name: 'Reseller', icon: '🛍️', desc: 'Merch sales' }
      ];
      case 'Growplex': return [
        { id: 'Promoter', name: 'Promoter', icon: '📢', desc: 'Promote B2B services' },
        { id: 'Content Creator', name: 'Content Creator', icon: '🎥', desc: 'Create marketing materials' }
      ];
      default: return [];
    }
  };

  const currentRoles = getRolesByVenture(venture);

  const handleLanguageSelect = (langCode: string) => {
    setPreferredLanguage(langCode);
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
  };

  const handleComplete = async () => {
    if (!venture || !role) {
      toast.error('Please select both a venture and a role to proceed.');
      return;
    }
    if (!currentUser) {
      toast.error('Auth error. Please login again.');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        preferredLanguage,
        venture,
        role,
        kycDeferred: true,
        profileCompletion: 20
      }, { merge: true });
      
      setShowWelcome(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 1) navigate('/');
    else setStep(step - 1);
  };

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-black/95 flex items-center justify-center p-6 z-50 fixed inset-0">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111111] border border-[#E8B84B]/30 rounded-3xl p-8 max-w-sm w-full space-y-6 text-center flex flex-col items-center">
          <Logo variant="vertical" size="xl" />
          <p className="text-gray-400">Your welcome incentive has been credited to your pending wallet.</p>
          <p className="text-xs text-[#E8B84B] font-bold mt-2">Complete your first task to unlock your incentive + earn more!</p>
          <button onClick={() => navigate('/wallet')} className="w-full bg-[#E8B84B] text-black font-black uppercase py-4 rounded-xl mt-6 hover:scale-105 transition-transform min-h-[48px]">
            View My Wallet
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center p-4 pt-10 sm:p-6">
      <div className="mb-8 scale-90">
        <Logo variant="primary" size="md" />
      </div>
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleBack} 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors min-h-[44px]"
          >
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
              <ChevronLeft size={18} />
            </div>
            <span className="text-sm font-medium uppercase tracking-widest">{step === 1 ? 'Back' : 'Previous'}</span>
          </button>
          <div className="flex-1 max-w-[200px] ml-4">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 1 ? 'text-[#E8B84B]' : 'text-gray-600'}`}>Language</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 2 ? 'text-[#E8B84B]' : 'text-gray-600'}`}>Venture</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 3 ? 'text-[#E8B84B]' : 'text-gray-600'}`}>Role</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(step / 3) * 100}%` }}
                className="h-full bg-[#E8B84B] rounded-full"
                transition={{ duration: 0.3 }}
              />
            </div>
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
                <p className="text-gray-400 text-sm">Choose your preferred language for the app.</p>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-6">
                <h2 className="text-red-500 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  ⚠️ IMPORTANT: HOW EARNINGS WORK
                </h2>
                <div className="space-y-4 text-xs font-medium text-gray-300">
                  <div>
                    <p className="text-green-400 font-bold mb-1">✅ You earn ONLY when:</p>
                    <ul className="list-disc pl-4 space-y-1 text-gray-400">
                      <li>Your marketing leads to ACTUAL SALES</li>
                      <li>Customers use YOUR coupon code</li>
                      <li>Your content drives VERIFIED metrics</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-red-400 font-bold mb-1">❌ You DO NOT earn for:</p>
                    <ul className="list-disc pl-4 space-y-1 text-gray-400">
                      <li>Just making an account</li>
                      <li>Clicking links without results</li>
                      <li>Submitting fake proof</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`p-4 rounded-xl border min-h-[48px] text-left flex items-center gap-3 transition-all ${
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
                className="w-full mt-8 min-h-[48px] bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                    disabled={!v.active}
                    onClick={() => {
                      if(!v.active) {
                        toast('Zaestify launching soon! Stay tuned for updates.', { icon: '🚀' });
                        return;
                      }
                      setVenture(v.id);
                      setRole(''); // Reset role when venture changes
                    }}
                    className={`p-4 rounded-2xl border min-h-[100px] text-left flex flex-col transition-all relative overflow-hidden ${
                      !v.active ? 'opacity-70 bg-[#111] border-white/5 cursor-not-allowed grayscale' :
                      venture === v.id 
                        ? 'bg-[#E8B84B]/10 border-[#E8B84B]' 
                        : 'bg-[#111] border-white/5 hover:border-white/20'
                    }`}
                  >
                    {!v.active && (
                      <div className="absolute top-2 right-2 bg-[#E8B84B] text-black text-[9px] font-black uppercase px-2 py-1 rounded-full z-10">
                        Coming Soon
                      </div>
                    )}
                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${v.active ? 'text-[#E8B84B]' : 'text-gray-500'}`}>{v.tag}</span>
                    <span className="text-white font-black text-lg mb-1">{v.name}</span>
                    <span className="text-gray-500 text-xs">{v.desc}</span>
                  </button>
                ))}
              </div>

              <button 
                disabled={!venture}
                onClick={() => setStep(3)}
                className="w-full mt-8 min-h-[48px] bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                <p className="text-gray-400 text-sm">Pick your role in {venture}.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentRoles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`p-4 rounded-2xl border min-h-[100px] text-left flex flex-col transition-all ${
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
                  className="w-full bg-[#E8B84B] min-h-[48px] text-black font-black uppercase tracking-widest py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : 'Complete Signup'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
