import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  earnedBalance: number;
}

export default function WithdrawalModal({ isOpen, onClose, earnedBalance }: Props) {
  const { currentUser, userData } = useAuth();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');

  const handleConfirm = async () => {
    if (!currentUser || !userData) return;
    try {
      await addDoc(collection(db, 'withdrawals'), {
        workerId: currentUser.uid,
        workerName: userData.name,
        amount: parseFloat(amount),
        upiId: userData.upiId,
        status: 'pending',
        type: 'standard',
        requestedAt: serverTimestamp()
      });
      toast.success('Withdrawal request submitted!');
      setStep(4);
    } catch (error) {
      toast.error('Submission failed');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#111111] border border-white/10 rounded-3xl p-6 w-full max-w-md"
          >
            {step === 1 && (
              <>
                <h2 className="text-xl font-bold text-white mb-4">Withdraw Money</h2>
                <p className="text-gray-400 text-sm mb-4">Available: Rs. {earnedBalance}</p>
                <input 
                  type="number"
                  className="w-full bg-[#1A1A1A] text-white p-4 rounded-xl mb-4"
                  placeholder="Min Rs. 200"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <button 
                  onClick={() => setStep(2)}
                  disabled={parseFloat(amount) < 200 || parseFloat(amount) > earnedBalance}
                  className="w-full bg-[#E8B84B] text-black font-bold py-4 rounded-xl disabled:opacity-50"
                >
                  Next
                </button>
              </>
            )}
            {step === 2 && (
              <>
                <h2 className="text-xl font-bold text-white mb-4">Confirm UPI</h2>
                <p className="text-gray-400 text-sm mb-4">UPI: {userData?.upiId}</p>
                <button onClick={handleConfirm} className="w-full bg-[#E8B84B] text-black font-bold py-4 rounded-xl">Confirm</button>
              </>
            )}
            {step === 4 && (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Submitted!</h2>
                <button onClick={onClose} className="w-full bg-[#1A1A1A] text-white py-4 rounded-xl mt-4">Done</button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
