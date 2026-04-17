import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, Wallet, ArrowRight, X } from 'lucide-react';
import ProgressiveProfilingWizard from './ProgressiveProfilingWizard';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function PostFirstEarningModal() {
  const { userData } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    // Trigger condition: First earning achieved but KYC/Profile not yet completed
    if (userData && userData.wallets.temp > 0 && !userData.firstEarningCompleted) {
      setIsOpen(true);
    }
  }, [userData?.wallets.temp, userData?.firstEarningCompleted]);

  if (!isOpen && !showWizard) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <AnimatePresence mode="wait">
        {!showWizard ? (
          <motion.div
            key="modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            className="bg-[#111] border border-yellow-500/30 p-8 sm:p-12 rounded-[2.5rem] max-w-lg w-full text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/20">
              <motion.div 
                className="h-full bg-yellow-500"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 5 }}
              />
            </div>

            <div className="bg-yellow-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-yellow-500/20">
              <PartyPopper className="w-10 h-10 text-black" />
            </div>

            <h2 className="text-3xl font-black text-white mb-4 leading-tight">
              {t('kyc.modalTitle', { amount: userData?.wallets.temp || 0 })}
            </h2>
            <p className="text-gray-400 mb-8 max-w-xs mx-auto">
              {t('kyc.modalSubtitle')}
            </p>

            <div className="space-y-4">
              <button
                onClick={() => setShowWizard(true)}
                className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 group transition-all"
              >
                {t('kyc.completeNow')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-gray-500 text-sm font-bold uppercase tracking-widest hover:text-white transition-colors py-2"
              >
                {t('kyc.skipForNow')}
              </button>
            </div>

            <p className="mt-8 text-[10px] text-gray-600 font-bold uppercase tracking-widest italic">
              * Earnings remain locked in Temp Wallet until KYC is completed.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex justify-center"
          >
            <div className="relative w-full max-w-lg">
              <button 
                onClick={() => setShowWizard(false)}
                className="absolute -top-12 right-0 p-2 text-gray-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              <ProgressiveProfilingWizard 
                role={userData?.role} 
                onComplete={() => {
                  setShowWizard(false);
                  setIsOpen(false);
                }} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
