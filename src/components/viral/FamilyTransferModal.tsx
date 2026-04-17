import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
}

export default function FamilyTransferModal({ isOpen, onClose, availableBalance }: Props) {
  const { currentUser } = useAuth();
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 100 || numAmount > 10000) {
      toast.error('Amount must be between Rs.100 and Rs.10,000');
      return;
    }

    if (numAmount > availableBalance) {
      toast.error('Insufficient available balance');
      return;
    }

    if (!upiId.includes('@')) {
      toast.error('Invalid UPI ID');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'familyTransfers'), {
        senderId: currentUser.uid,
        recipientUpi: upiId,
        amount: numAmount,
        status: 'pending',
        type: 'family_transfer',
        createdAt: serverTimestamp()
      });

      setSuccess(true);
      toast.success('Transfer request submitted!');
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setUpiId('');
        setAmount('');
      }, 2000);
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error('Failed to process transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden"
          >
            {success ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20"
                >
                  <CheckCircle2 size={40} className="text-black" />
                </motion.div>
                <h3 className="text-2xl font-black text-white mb-2">Request Sent!</h3>
                <p className="text-gray-500 text-sm">Your family transfer is pending admin approval.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white">Family Transfer</h3>
                    <p className="text-gray-500 text-sm font-bold flex items-center gap-1">
                      <CreditCard size={14} /> Available: Rs.{availableBalance.toLocaleString()}
                    </p>
                  </div>
                  <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Recipient UPI ID</label>
                    <input
                      type="text"
                      required
                      placeholder="family@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-green-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Amount (Rs.)</label>
                    <input
                      type="number"
                      required
                      min="100"
                      max="10000"
                      placeholder="Min 100"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-2xl font-black focus:border-green-500 outline-none transition-all"
                    />
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-gray-400 leading-relaxed uppercase font-bold tracking-tight">
                      Withdrawals take 24-48h to process. Transfers attract 0% fee for family members.
                    </p>
                  </div>

                  <button
                    disabled={loading}
                    className="w-full bg-green-500 text-black py-5 rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Send size={18} />
                        Confirm Transfer
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
