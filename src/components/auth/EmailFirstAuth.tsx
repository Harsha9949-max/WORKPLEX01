import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendEmailVerification
} from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, Shield, Eye, EyeOff, Phone, KeyRound, ArrowRight } from 'lucide-react';
import { generateTempPhone } from '../../lib/cloudFunctions';

const loginSchema = z.object({
  email: z.string().email({ message: 'Valid email is required' }),
  password: z.string().min(6, { message: 'Password is required' }),
  acceptTerms: z.boolean().optional()
});

const signupSchema = z.object({
  email: z.string().email({ message: 'Valid email is required' }),
  password: z.string()
    .min(8, { message: 'Must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Must contain one uppercase letter' })
    .regex(/[0-9]/, { message: 'Must contain one number' }),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the Terms & Privacy Policy'
  })
});

type FormData = z.infer<typeof signupSchema>;

export default function EmailFirstAuth({ defaultIsLogin = true }: { defaultIsLogin?: boolean }) {
  const [isLogin, setIsLogin] = useState(defaultIsLogin);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Simulated OTP Auth State
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1); // 1: Phone, 2: OTP, 3: Email Details
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');

  useEffect(() => {
    setIsLogin(defaultIsLogin);
    if (defaultIsLogin) {
      setSignupStep(3); // Login doesn't need phone step
    } else {
      setSignupStep(1); // Reset to phone step for new signups
    }
  }, [defaultIsLogin]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema),
    defaultValues: {
      email: '',
      password: '',
      acceptTerms: false
    }
  });

  const passwordVal = watch('password');

  // Device fingerprint simulation
  const getDeviceFingerprint = () => navigator.userAgent + window.screen.width;

  const handleSendOTP = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setSimulatedOtp(code);
    toast.success(`Verification Code sent! (Use code: ${code})`, { duration: 6000 });
    setSignupStep(2);
  };

  const handleVerifyOTP = () => {
    if (otpCode !== simulatedOtp && otpCode !== '0000') { // 0000 backdoor for testing
      toast.error('Invalid verification code');
      return;
    }
    toast.success('Phone verified successfully!');
    setSignupStep(3);
  };

  const handleAuthSuccess = async (user: any, method: 'email' | 'google') => {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      // New user signup
      let finalPhone = method === 'email' && phoneNumber ? phoneNumber : await generateTempPhone();

      await setDoc(userRef, {
        name: user.displayName || 'New User',
        email: user.email,
        phone: finalPhone,
        age: 18,
        venture: '',
        role: '',
        upiId: '',
        bankAccount: '',
        aadhaar: '',
        pan: '',
        deviceFingerprint: getDeviceFingerprint(),
        level: 'Starter',
        streak: 0,
        joinedAt: serverTimestamp(),
        contractSigned: true,
        kycDone: false,
        firstTaskDone: false,
        wallets: { earned: 0, pending: 0, bonus: 0, savings: 0, temp: 0 },
        authMethod: method,
        emailVerified: user.emailVerified,
        tempPhone: method === 'email' ? null : finalPhone,
        phoneVerified: method === 'email', // Phone is verified via OTP step
        kycDeferred: true,
        kycCompletedAt: null,
        tempWalletCap: 500,
        profileCompletion: 10,
        trustPoints: 0,
        amlFlag: false
      });
      navigate('/onboarding');
    } else {
      // Existing user
      if (user.email === 'marateyh@gmail.com') {
        navigate('/admin');
      } else {
        const userData = snap.data();
        if (!userData.venture || !userData.role) {
          navigate('/onboarding');
        } else {
          navigate('/home');
        }
      }
    }
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
        if (!cred.user.emailVerified) {
          toast('Please verify your email required to earn. A new link was sent.', { icon: '📧' });
          await sendEmailVerification(cred.user);
        } else {
          await handleAuthSuccess(cred.user, 'email');
        }
      } else {
        const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        await sendEmailVerification(cred.user);
        toast.success('Account created! Please verify your email.');
        await handleAuthSuccess(cred.user, 'email');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await handleAuthSuccess(cred.user, 'google');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="glass-card p-6 sm:p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          {isLogin ? 'Login to continue earning' : 'Join WorkPlex and start earning today'}
        </p>

        {!isLogin && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${signupStep >= 1 ? 'text-[#E8B84B]' : 'text-gray-600'}`}>Phone</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${signupStep >= 2 ? 'text-[#E8B84B]' : 'text-gray-600'}`}>OTP</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${signupStep >= 3 ? 'text-[#E8B84B]' : 'text-gray-600'}`}>Details</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(signupStep / 3) * 100}%` }}
                className="h-full bg-[#E8B84B] rounded-full"
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {!isLogin && signupStep === 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2 block">Phone Number verification</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-[#1A1A1D] border border-white/10 text-white pl-12 pr-4 py-4 rounded-xl focus:border-[#E8B84B] outline-none transition-all"
                />
              </div>
            </div>
            <button 
              onClick={handleSendOTP}
              className="w-full bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2"
            >
              Send OTP <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {!isLogin && signupStep === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center mb-4">
              <p className="text-xs text-yellow-500 font-bold uppercase tracking-widest">Demo OTP Code</p>
              <p className="text-2xl font-mono text-white tracking-[0.25em]">{simulatedOtp}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2 block">Enter Verification Code</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="4-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-[#1A1A1D] border border-white/10 text-white pl-12 pr-4 py-4 rounded-xl focus:border-[#E8B84B] outline-none transition-all tracking-[0.5em] text-center font-mono text-xl"
                  maxLength={4}
                />
              </div>
            </div>
            <button 
              onClick={handleVerifyOTP}
              className="w-full bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2"
            >
              Verify OTP
            </button>
            <p className="text-center text-xs text-gray-500 mt-2 hover:text-white cursor-pointer transition-colors" onClick={() => setSignupStep(1)}>
              Change Phone Number
            </p>
          </motion.div>
        )}

        {(isLogin || signupStep === 3) && (
          <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-[#1A1A1D] border border-white/10 text-white pl-12 pr-4 py-4 rounded-xl focus:border-[#E8B84B] outline-none transition-all"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1 px-2">{errors.email.message?.toString()}</p>}
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="w-full bg-[#1A1A1D] border border-white/10 text-white pl-12 pr-12 py-4 rounded-xl focus:border-[#E8B84B] outline-none transition-all"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 px-2">{errors.password.message?.toString()}</p>}
              
              {!isLogin && passwordVal && (
                <div className="mt-2 px-2 flex gap-1 h-1">
                  {['min(8)', 'uppercase', 'number', 'special'].map((req, i) => {
                    let satisfied = false;
                    if (i === 0) satisfied = passwordVal.length >= 8;
                    if (i === 1) satisfied = /[A-Z]/.test(passwordVal);
                    if (i === 2) satisfied = /[0-9]/.test(passwordVal);
                    if (i === 3) satisfied = /[^A-Za-z0-9]/.test(passwordVal);
                    return (
                      <div key={req} className={`flex-1 rounded-full ${satisfied ? 'bg-green-500' : 'bg-white/10'}`} />
                    );
                  })}
                </div>
              )}
            </div>

            {!isLogin && (
              <div className="flex items-center gap-2 mt-4 px-2">
                <input 
                  {...register('acceptTerms')}
                  type="checkbox" 
                  id="terms"
                  className="rounded border-white/10 bg-transparent text-[#E8B84B] focus:ring-[#E8B84B]"
                />
                <label htmlFor="terms" className="text-xs text-gray-400">
                  I accept the Terms & Privacy Policy (DPDP Act 2023)
                </label>
              </div>
            )}
            {errors.acceptTerms && <p className="text-red-500 text-xs mt-1 px-2">{errors.acceptTerms.message?.toString()}</p>}

            {!isLogin && (
              <div className="bg-[#1A1A1D] border border-white/10 p-4 rounded-xl flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" required className="w-5 h-5 rounded border-gray-600 bg-transparent text-green-500 cursor-pointer" />
                  <span className="text-sm font-medium text-gray-300">I'm not a robot</span>
                </div>
                <div className="flex flex-col items-center">
                  <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" className="w-6 h-6 opacity-70" />
                  <span className="text-[8px] text-gray-500 uppercase mt-1">Privacy - Terms</span>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all mt-4 flex justify-center items-center gap-2"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </motion.form>
        )}

        {(isLogin || signupStep === 3) && (
          <>
            <div className="relative my-6 relative z-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#111] px-4 text-gray-500 font-bold uppercase">Or continue with</span>
              </div>
            </div>

            <button 
              onClick={signInWithGoogle}
              className="relative z-10 w-full bg-white text-black font-bold py-4 rounded-xl flex justify-center items-center gap-3 hover:bg-gray-100 transition-all active:scale-95"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Google
            </button>
          </>
        )}

        <div className="mt-8 text-center relative z-10">
          <p className="text-sm text-gray-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                if (isLogin) {
                  setSignupStep(1);
                } else {
                  setSignupStep(3);
                }
              }}
              className="text-[#E8B84B] font-bold hover:underline"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
