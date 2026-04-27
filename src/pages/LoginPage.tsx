import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import EmailFirstAuth from '../components/auth/EmailFirstAuth';
import { Logo } from '../components/ui/Logo';

export default function LoginPage({ initialIsLogin = true }: { initialIsLogin?: boolean }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl">
        <button 
          onClick={() => navigate('/')} 
          className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
        >
          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-all">
            <ChevronLeft size={18} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Back to Hub</span>
        </button>

        <motion.div
          className="flex flex-col items-center justify-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Logo variant="vertical" size="xl" />
          <p className="mt-4 text-gray-400 text-center text-sm uppercase tracking-widest font-bold">
            Earn From Home • Earn Daily
          </p>
        </motion.div>

        <EmailFirstAuth defaultIsLogin={initialIsLogin} />
      </div>
    </div>
  );
}
