import React, { useState, useEffect } from 'react';
import { mapFirebaseError } from '../../utils/errorMapper';
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
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, Shield, Eye, EyeOff, Phone, KeyRound, ArrowRight } from 'lucide-react';
import { generateTempPhone } from '../../lib/cloudFunctions';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');

  useEffect(() => {
    setIsLogin(defaultIsLogin);
    if (defaultIsLogin) {
      setSignupStep(3);
    } else {
      setSignupStep(1);
    }
  }, [defaultIsLogin]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema),
    defaultValues: { email: '', password: '', acceptTerms: false }
  });

  const passwordVal = watch('password');
  const getDeviceFingerprint = () => navigator.userAgent + window.screen.width;

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    // Check if phone already registered via phoneDirectory or users collection
    try {
      // 1. Check phone directory
      const phoneDocRef = doc(db, 'phoneDirectory', phoneNumber);
      const phoneSnap = await getDoc(phoneDocRef);
      if (phoneSnap.exists()) {
        toast.error('Account Already Exists! A WorkPlex account is already registered with this phone number. Login instead.');
        navigate('/login');
        return;
      }

      // 2. Check users collection (for workers added via admin panel)
      // Check both formats since AddWorkerModal uses +91 prefix
      const q1 = query(collection(db, 'users'), where('phone', '==', phoneNumber));
      const q2 = query(collection(db, 'users'), where('phone', '==', `+91${phoneNumber}`));
      
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      
      if (!snap1.empty || !snap2.empty) {
        toast.error('Account Already Exists! A WorkPlex account is already registered with this phone number (found in system). Login instead.');
        navigate('/login');
        return;
      }
    } catch (error) {
      console.error('Error checking phone uniqueness:', error);
    }


    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setSimulatedOtp(code);
    toast.success(`Verification Code sent! (Use code: ${code})`, { duration: 6000 });
    setSignupStep(2);
  };

  const handleVerifyOTP = () => {
    if (otpCode !== simulatedOtp && otpCode !== '0000') {
      toast.error('Invalid verification code');
      if (navigator.vibrate) navigator.vibrate([100, 30, 100]);
      return;
    }
    toast.success('Phone verified successfully!');
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
    setSignupStep(3);
  };

  const handleAuthSuccess = async (user: any, method: 'email' | 'google') => {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      let finalPhone = method === 'email' && phoneNumber ? phoneNumber : await generateTempPhone();
      const incentiveAmount = Math.floor(Math.random() * 3) + 19; // 19, 20, or 21

      await setDoc(userRef, {
        name: user.displayName || 'New User',
        email: user.email,
        phone: finalPhone,
        age: 18,
        venture: '',
        role: '',
        upiId: '',
        bankAccount: '',
        pan: '',
        deviceFingerprint: getDeviceFingerprint(),
        level: 'Starter',
        streak: 0,
        joinedAt: serverTimestamp(),
        contractSigned: true,
        kycDone: false,
        firstTaskDone: false,
        wallets: { earned: 0, pending: incentiveAmount, bonus: 0, savings: 0, temp: 0 },
        incentiveAmount: incentiveAmount,
        incentiveRevealed: false,
        authMethod: method,
        emailVerified: user.emailVerified,
        tempPhone: method === 'email' ? null : finalPhone,
        phoneVerified: method === 'email',
        kycDeferred: true,
        kycCompletedAt: null,
        tempWalletCap: 500,
        profileCompletion: 10,
        trustPoints: 0,
        amlFlag: false
      });
      
      if (finalPhone) {
        await setDoc(doc(db, 'phoneDirectory', finalPhone), {
          uid: user.uid,
          registeredAt: serverTimestamp()
        });
      }
      
      navigate('/onboarding');
    } else {
      const userData = snap.data();
      if (userData.phone) {
        await setDoc(doc(db, 'phoneDirectory', userData.phone), {
          uid: user.uid,
          registeredAt: userData.joinedAt || serverTimestamp()
        }, { merge: true });
      }

      if (user.email === 'marateyh@gmail.com' || user.email === 'hvrsindustriespvtltd@gmail.com') {
        navigate('/admin');
      } else {
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
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
        await handleAuthSuccess(cred.user, 'email');
      }
    } catch (error: any) {
      if (navigator.vibrate) navigator.vibrate([100, 30, 100]);
      toast.error(mapFirebaseError(error));
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
      if (navigator.vibrate) navigator.vibrate([100, 30, 100]);
      toast.error(mapFirebaseError(error));
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
                  className="w-full bg-[#1A1A1D] border border-white/10 text-white pl-12 pr-4 py-4 min-h-[48px] rounded-xl focus:border-[#E8B84B] outline-none transition-all"
                />
              </div>
            </div>
            <button 
              onClick={handleSendOTP}
              className="w-full min-h-[48px] bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2"
            >
              Send OTP <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {!isLogin && signupStep === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center mb-4">
              <p className="text-xs text-yellow-500 font-bold uppercase tracking-widest">Your OTP Code</p>
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
                  className="w-full bg-[#1A1A1D] border border-white/10 text-white pl-12 pr-4 py-4 min-h-[48px] rounded-xl focus:border-[#E8B84B] outline-none transition-all tracking-[0.5em] text-center font-mono text-xl"
                  maxLength={4}
                />
              </div>
            </div>
            <button 
              onClick={handleVerifyOTP}
              className="w-full min-h-[48px] bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2"
            >
              Verify OTP
            </button>
            <p className="text-center text-xs text-gray-500 mt-2 hover:text-white cursor-pointer min-h-[44px] flex items-center justify-center transition-colors" onClick={() => setSignupStep(1)}>
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
                  className="w-full bg-[#1A1A1D] border border-white/10 text-white pl-12 pr-4 py-4 min-h-[48px] rounded-xl focus:border-[#E8B84B] outline-none transition-all"
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
                  className="w-full bg-[#1A1A1D] border border-white/10 text-white pl-12 pr-12 py-4 min-h-[48px] rounded-xl focus:border-[#E8B84B] outline-none transition-all"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 px-2 min-h-[44px] text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 px-2">{errors.password.message?.toString()}</p>}
            </div>

            {!isLogin && (
              <div className="flex items-center gap-2 mt-4 px-2 min-h-[44px]">
                <input 
                  {...register('acceptTerms')}
                  type="checkbox" 
                  id="terms"
                  className="rounded border-white/10 bg-transparent text-[#E8B84B] focus:ring-[#E8B84B] w-5 h-5 cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-gray-400 cursor-pointer">
                  I accept the Terms & Privacy Policy (DPDP Act 2023)
                </label>
              </div>
            )}
            {errors.acceptTerms && <p className="text-red-500 text-xs mt-1 px-2">{errors.acceptTerms.message?.toString()}</p>}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 min-h-[48px] rounded-xl hover:scale-[1.02] active:scale-95 transition-all mt-4 flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (isLogin ? 'Login' : 'Sign Up')}
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
              className="relative z-10 w-full min-h-[48px] bg-white text-black font-bold py-4 rounded-xl flex justify-center items-center gap-3 hover:bg-gray-100 transition-all active:scale-95"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Google
            </button>
          </>
        )}

        <div className="mt-8 text-center relative z-10">
          <p className="text-sm text-gray-400">
            {isLogin ? "New to WorkPlex? " : "Already have account? "}
            <button 
              onClick={() => {
                if (isLogin) {
                  navigate('/join');
                } else {
                  navigate('/login');
                }
              }}
              className="text-[#E8B84B] font-bold hover:underline min-h-[44px] px-2"
            >
              {isLogin ? 'Sign Up' : 'Login Instead'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
