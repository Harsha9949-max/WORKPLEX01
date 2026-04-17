import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Copy, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareText: string;
}

export default function WhatsAppShareModal({ isOpen, onClose, title, shareText }: Props) {
  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareText);
    toast.success('Share text copied to clipboard!');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-[32px] p-8 overflow-hidden shadow-2xl"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-green-500/20 blur-[80px] rounded-full" />
            
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white">{title}</h3>
                <p className="text-gray-500 text-sm font-medium">Spread the word and earn more!</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="bg-black/40 rounded-2xl p-4 mb-8 border border-white/5">
              <p className="text-sm text-gray-300 italic leading-relaxed">
                "{shareText}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleWhatsAppShare}
                className="flex flex-col items-center justify-center gap-3 bg-[#25D366]/10 border border-[#25D366]/20 p-6 rounded-3xl hover:bg-[#25D366]/20 transition-all group"
              >
                <div className="w-12 h-12 bg-[#25D366] rounded-2xl flex items-center justify-center shadow-lg shadow-[#25D366]/20 group-hover:scale-110 transition-transform">
                  <MessageCircle size={24} className="text-white" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-[#25D366]">WhatsApp</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center justify-center gap-3 bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group"
              >
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Copy size={24} className="text-white" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Copy Link</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-6 py-4 text-xs font-black text-gray-600 uppercase tracking-widest hover:text-gray-400 transition-colors"
            >
              Maybe Later
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
