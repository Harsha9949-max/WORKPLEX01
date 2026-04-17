import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Share2, Flame } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  coupon: any;
}

export default function CouponHeroCard({ coupon }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = `Shop on ${coupon.venture}! Use my code ${coupon.code} for a special discount.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#1A1A1A] to-[#111111] border border-white/10 rounded-3xl p-8 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8B84B]/10 blur-[100px] rounded-full" />
      
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-gray-400 font-bold uppercase tracking-widest text-sm">Your Coupon Code</h2>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${coupon.isActive ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400'}`}>
          {coupon.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <span className="text-4xl font-black text-white font-mono tracking-tighter">{coupon.code}</span>
        <button onClick={handleCopy} className="p-3 bg-white/5 rounded-xl hover:bg-white/10">
          {copied ? <Check className="text-green-500" /> : <Copy className="text-gray-400" />}
        </button>
      </div>

      <button 
        onClick={handleShare}
        className="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
      >
        <Share2 /> Share on WhatsApp
      </button>
    </motion.div>
  );
}
