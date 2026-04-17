import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ChevronRight, AlertTriangle, X } from 'lucide-react';
import ProgressiveProfilingWizard from './ProgressiveProfilingWizard';

export default function ProfileCompletionBar() {
  const { userData } = useAuth();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    if (userData && userData.profileCompletion < 80) {
      const storedCount = parseInt(localStorage.getItem('workplex_login_count') || '0', 10);
      const newCount = storedCount + 1;
      localStorage.setItem('workplex_login_count', newCount.toString());
      
      // We assume this runs roughly once per app load/login
      if (newCount % 3 === 0) {
        setShowReminder(true);
      }
    }
  }, [userData?.profileCompletion]);

  if (!userData || userData.profileCompletion >= 100) return null;

  const pct = userData.profileCompletion || 10;
  
  const getMissingItems = () => {
    const missing = [];
    if (!userData.kycCompletedAt) missing.push('KYC');
    if (!userData.photoURL) missing.push('Photo');
    if (!userData.bankAccount && !userData.upiId) missing.push('Bank');
    if (userData.role === 'Partner' && !userData.shopSetupDone) missing.push('Shop Config');
    return missing.join(', ');
  };

  return (
    <>
      <AnimatePresence>
        {showReminder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1A1A1A] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden text-center max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-amber-500/10 p-6 flex flex-col items-center relative">
                <button onClick={() => setShowReminder(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4 text-amber-500">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Profile Incomplete</h3>
                <p className="text-gray-400 text-sm">Your profile is only {pct}% complete. Earn 50 Trust Points and unlock Priority Support by hitting 80%!</p>
              </div>
              <div className="p-6">
                <button 
                  onClick={() => {
                    setShowReminder(false);
                    setIsWizardOpen(true);
                  }}
                  className="w-full bg-[#E8B84B] text-black font-black uppercase tracking-widest py-3 rounded-xl hover:scale-[1.02] transition-transform mb-3"
                >
                  Complete Profile Now
                </button>
                <button 
                  onClick={() => setShowReminder(false)}
                  className="text-xs text-gray-500 font-bold uppercase tracking-widest hover:text-white transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setIsWizardOpen(true)}
        className="mx-4 mt-6 mb-2 bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 cursor-pointer hover:border-amber-500/50 transition-colors group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <ShieldCheck size={64} className="text-amber-500" />
        </div>
        
        <div className="flex justify-between items-center mb-3 relative z-10">
          <div>
            <h4 className="text-white font-bold flex items-center gap-2">
              Profile Setup <span className="text-amber-500">{pct}%</span>
            </h4>
            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mt-1">
              Missing: {getMissingItems()}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-amber-500 group-hover:bg-amber-500/10 transition-colors">
            <ChevronRight size={16} />
          </div>
        </div>

        <div className="w-full h-1.5 bg-black rounded-full overflow-hidden relative z-10">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-amber-500 rounded-full"
          />
        </div>
        
        {(userData.trustPoints || 0) > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest relative z-10">
            <ShieldCheck size={12} /> {userData.trustPoints} Trust Points Validated
          </div>
        )}
      </motion.div>

      <ProgressiveProfilingWizard 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
      />
    </>
  );
}
