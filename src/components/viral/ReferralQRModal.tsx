import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Copy } from 'lucide-react';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
}

export default function ReferralQRModal({ isOpen, onClose, uid }: Props) {
  const referralLink = `${window.location.origin}/join?ref=${uid}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  const handleDownload = () => {
    const svg : any = document.getElementById("referral-qr");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `WorkPlex-Referral-QR.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
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
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm bg-[#111111] border border-white/10 rounded-[48px] p-8 overflow-hidden shadow-2xl"
          >
            {/* Animated Gradient Border Overlay */}
            <div className="absolute -inset-1 bg-gradient-to-br from-teal-500/20 via-transparent to-amber-500/20 animate-pulse pointer-events-none" />
            
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-white uppercase tracking-widest">Your Referral QR</h3>
              <button 
                onClick={onClose}
                className="p-2 bg-white/5 rounded-full hover:bg-white/10"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="p-8 bg-white rounded-3xl mb-8 shadow-2xl shadow-teal-500/10 border-4 border-teal-500/20">
                <QRCode 
                  id="referral-qr"
                  value={referralLink}
                  size={200}
                  level="H"
                />
              </div>

              <div className="space-y-4 w-full">
                <button
                  onClick={handleDownload}
                  className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-all group"
                >
                  <span className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Download PNG</span>
                  <Download size={18} className="text-teal-500" />
                </button>

                <button
                  onClick={handleCopyLink}
                  className="w-full bg-teal-500 text-black p-5 rounded-3xl flex items-center justify-between font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>Copy Link</span>
                  <Copy size={18} />
                </button>
              </div>

              <div className="mt-8 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <Share2 size={12} className="text-gray-600" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Scan to join team</span>
                </div>
                <div className="h-1 w-12 bg-gray-800 rounded-full" />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
