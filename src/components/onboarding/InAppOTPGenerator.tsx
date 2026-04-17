import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Smartphone, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface InAppOTPGeneratorProps {
  onVerified: (phone: string) => void;
}

export default function InAppOTPGenerator({ onVerified }: InAppOTPGeneratorProps) {
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [userInput, setUserInput] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Generate temporary phone: +91-TEMP-XXXX
    const random4 = Math.floor(1000 + Math.random() * 9000);
    setTempPhone(`+91-TEMP-${random4}`);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(otp);
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    
    setTimeout(() => {
      if (userInput === generatedOTP) {
        toast.success('Phone verified successfully!');
        onVerified(tempPhone);
      } else {
        toast.error('Invalid OTP. Please try again.');
        setIsVerifying(false);
      }
    }, 800);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="bg-yellow-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Verify Phone</h2>
        <p className="text-gray-400">Temporary ID: {tempPhone}</p>
      </div>

      <div className="bg-[#222] border border-yellow-500/30 p-8 rounded-3xl text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2">
          <ShieldCheck className="w-5 h-5 text-yellow-500/30" />
        </div>
        
        <p className="text-gray-400 text-sm mb-4 uppercase tracking-widest font-bold">Your Verification Code</p>
        <div className="text-5xl font-black text-yellow-500 tracking-[0.2em] mb-2 select-all">
          {generatedOTP}
        </div>
        <p className="text-xs text-yellow-500/50">Enter this code below to proceed</p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex justify-center gap-2">
          <input
            type="text"
            maxLength={6}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ''))}
            placeholder="......"
            className="w-full bg-black border border-white/10 rounded-xl py-6 text-center text-3xl font-bold text-white tracking-[0.5em] focus:outline-none focus:border-yellow-500 transition-all placeholder:text-gray-800"
            required
          />
        </div>

        <button
          type="submit"
          disabled={userInput.length !== 6 || isVerifying}
          className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isVerifying ? (
            <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Confirm Verification
              <CheckCircle2 className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500 italic">
        * This is an in-app verification for your temporary workstation ID.
      </p>
    </div>
  );
}
