import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import EmailFirstAuth from '../components/auth/EmailFirstAuth';

export default function LoginPage({ initialIsLogin = true }: { initialIsLogin?: boolean }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl">
        <button 
          onClick={() => navigate('/')} 
          className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
        >
          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-all">
            <ChevronLeft size={18} />
          </div>
          <span className="text-sm font-medium uppercase tracking-widest">Back to Hub</span>
        </button>

        <EmailFirstAuth defaultIsLogin={initialIsLogin} />
      </div>
    </div>
  );
}
