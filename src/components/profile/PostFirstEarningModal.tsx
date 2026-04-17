import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, ShieldAlert } from 'lucide-react';
import ProgressiveProfilingWizard from './ProgressiveProfilingWizard';
import { useAuth } from '../../context/AuthContext';

export default function PostFirstEarningModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [showKycWizard, setShowKycWizard] = useState(false);
  const { userData } = useAuth();
  
  if (!isOpen || !userData) return null;

  return (
    <>
      <AnimatePresence>
        {!showKycWizard && (
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
              className="bg-[#111111] border border-amber-500/20 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col text-center"
            >
              <div className="bg-amber-500/10 p-8 flex flex-col items-center">
                <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20 mb-6 relative">
                  <PartyPopper size={32} className="text-black" />
                  <div className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-black px-2 py-1 rounded-full border border-white/20">1st Earn!</div>
                </div>
                <h3 className="text-white text-2xl font-black uppercase tracking-tighter mb-2">You earned your first commission!</h3>
                <p className="text-gray-400 text-sm">Your earnings are securely placed in your Temp Wallet.</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/5 text-left">
                  <ShieldAlert className="text-amber-500 flex-shrink-0 mt-1" size={18} />
                  <div>
                    <p className="text-white font-bold text-sm">Action Required</p>
                    <p className="text-gray-400 text-xs">Complete KYC verification to unlock withdrawals and move funds to your main wallet.</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button 
                    onClick={() => setShowKycWizard(true)}
                    className="w-full py-4 bg-amber-500 text-black font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform shadow-xl shadow-amber-500/20"
                  >
                    Complete KYC Now
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full py-3 bg-transparent text-gray-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <ProgressiveProfilingWizard 
        isOpen={showKycWizard} 
        onClose={() => {
          setShowKycWizard(false);
          onClose(); // Close the wrapper modal too
        }} 
      />
    </>
  );
}
