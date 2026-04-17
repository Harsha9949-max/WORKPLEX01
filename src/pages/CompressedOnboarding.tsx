import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguageLock, IndianLanguages } from '../context/LanguageLockContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Globe, Target, Zap, CheckCircle2 } from 'lucide-react';
import InAppOTPGenerator from '../components/onboarding/InAppOTPGenerator';

export default function CompressedOnboarding() {
  const [step, setStep] = useState(1);
  const [tempPhone, setTempPhone] = useState('');
  const [venture, setVenture] = useState('');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentUser } = useAuth();
  const { language, setLanguage } = useLanguageLock();
  const navigate = useNavigate();

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

  const handleOTPVerified = (phone: string) => {
    setTempPhone(phone);
    setStep(2);
  };

  const handleLanguageSelect = async (langCode: string) => {
    await setLanguage(langCode);
    setStep(3);
  };

  const handleComplete = async () => {
    if (!venture || !role) {
      toast.error('Please select both a venture and a role');
      return;
    }

    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        tempPhone,
        otpVerified: true,
        venture,
        role,
        profileCompletion: 25,
        kycDeferred: true
      });
      toast.success('Onboarding complete! 🚀');
      navigate('/home');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepVariants = {
    enter: { x: 20, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Progress Bar */}
        <div className="flex justify-between mb-8 px-4">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s}
              className={`h-1 flex-1 mx-1 rounded-full transition-all duration-500 ${
                s <= step ? 'bg-yellow-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <div className="bg-[#111] border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <InAppOTPGenerator onVerified={handleOTPVerified} />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <div className="text-center mb-8">
                  <div className="bg-yellow-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-yellow-500" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Language Lock</h2>
                  <p className="text-gray-400">Select your base language (India Only)</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {IndianLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className="p-4 rounded-2xl bg-black border border-white/5 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all text-left flex items-center gap-3 group"
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="font-bold text-white/80 group-hover:text-white transition-colors">
                        {lang.name}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <div className="text-center mb-8">
                  <div className="bg-yellow-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-yellow-500" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Select Venture</h2>
                  <p className="text-gray-400">Where do you want to build your network?</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {ventures.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setVenture(v.id);
                        setStep(4);
                      }}
                      className={`p-6 rounded-2xl border transition-all text-left flex items-center justify-between group ${
                        venture === v.id 
                          ? 'bg-yellow-500/10 border-yellow-500' 
                          : 'bg-black border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <p className="text-[10px] font-black uppercase text-yellow-500/60 tracking-widest mb-1">{v.tag}</p>
                        <h3 className="text-xl font-bold text-white">{v.name}</h3>
                        <p className="text-gray-500 text-sm mt-1">{v.desc}</p>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-transform ${venture === v.id ? 'text-yellow-500' : 'text-gray-700'}`} />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <div className="text-center mb-8">
                  <div className="bg-yellow-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-yellow-500" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Confirm Role</h2>
                  <p className="text-gray-400">Choose your operational mode in {venture}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-8">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`p-5 rounded-2xl border transition-all text-left flex items-center gap-4 ${
                        role === r.id 
                          ? 'bg-yellow-500/10 border-yellow-500' 
                          : 'bg-black border-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className="text-3xl">{r.icon}</span>
                      <div>
                        <h3 className="text-lg font-bold text-white">{r.name}</h3>
                        <p className="text-gray-500 text-xs">{r.desc}</p>
                      </div>
                      {role === r.id && <CheckCircle2 className="w-5 h-5 text-yellow-500 ml-auto" />}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleComplete}
                  disabled={!role || isSubmitting}
                  className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Enter Dashboard
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-8">
          Powered by HVRS Innovations • Hyderabad, India
        </p>
      </div>
    </div>
  );
}
