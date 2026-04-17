import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Clock, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  coupon: {
    code: string;
    usageCount: number;
    expiresAt: any; // Firestore Timestamp
  };
  venture: string;
}

export default function CouponCard({ coupon, venture }: Props) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!coupon.expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = coupon.expiresAt.toDate().getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diff);
      
      if (diff === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [coupon.expiresAt]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const progress = (timeLeft / (24 * 3600)) * 100;
  const isExpiringSoon = timeLeft < 4 * 3600;

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const message = `Shop on ${venture}! Use my exclusive code ${coupon.code} for a special discount: https://workplex.in/${venture.toLowerCase()}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111111] border border-white/5 rounded-2xl p-6 relative overflow-hidden group"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8B84B]/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Your Coupon Code</h3>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-white font-mono tracking-tighter">{coupon.code}</span>
            <button 
              onClick={handleCopy}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-[#00C9A7]" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-[#00C9A7] leading-none">{coupon.usageCount}</p>
          <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Uses Today</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
            <span className={isExpiringSoon ? 'text-red-500' : 'text-gray-500'}>
              {isExpiringSoon ? 'Expiring Soon' : 'Time Remaining'}
            </span>
            <span className={isExpiringSoon ? 'text-red-500' : 'text-[#E8B84B]'}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full rounded-full ${isExpiringSoon ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-[#E8B84B] to-[#d4a63f]'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        <button 
          onClick={handleShare}
          className="w-full bg-[#25D366] hover:bg-[#20bd5b] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Share2 className="w-5 h-5" />
          Share on WhatsApp
        </button>
      </div>
    </motion.div>
  );
}
