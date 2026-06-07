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
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { associatePhoneWithUid, checkPhoneDuplicate } from '../../utils/phoneDirectory';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, Shield, Eye, EyeOff, Phone, KeyRound, ArrowRight, User } from 'lucide-react';
import { generateTempPhone } from '../../lib/cloudFunctions';
import { useTranslation } from 'react-i18next';

// 1. Unified Signup step
const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Valid email is required' }),
  phone: z.string().regex(/^[0-9]{10}$/, { message: 'Must be exactly 10 digits' }),
  password: z.string()
    .min(8, { message: 'Must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Must contain one uppercase letter' })
    .regex(/[0-9]/, { message: 'Must contain one number' }),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms'
  })
});

const loginSchema = z.object({
  email: z.string().email({ message: 'Valid email is required' }),
  password: z.string().min(6, { message: 'Password is required' })
});

export default function EmailFirstAuth({ defaultIsLogin = true }: { defaultIsLogin?: boolean }) {
  const [isLogin, setIsLogin] = useState(defaultIsLogin);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Signup Steps: 1 = Details, 2 = Verify OTP
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);
  const [errorPopup, setErrorPopup] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  
  // Stored state between steps
  const [signupData, setSignupData] = useState<any>(null);
  const [otpCode, setOtpCode] = useState('');

  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    setIsLogin(defaultIsLogin);
    if (defaultIsLogin) {
      setSignupStep(1); 
    } else {
      setSignupStep(1);
    }
  }, [defaultIsLogin]);

  const { register: registerSignup, handleSubmit: handleSubmitSignup, formState: { errors: signupErrors } } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', acceptTerms: false }
  });

  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: loginErrors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const getDeviceFingerprint = () => navigator.userAgent + window.screen.width;

  const resendOtp = async () => {
    if (!signupData?.email) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupData.email })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend OTP');
      }

      if (result.isResendFreeTier) {
        setDevOtp(result.devOtp);
        setOtpCode(result.devOtp);
        toast.success('Email restricted by provider. Verification auto-filled.', { icon: '🤖', duration: 5000 });
      } else {
        toast.success('A new verification code was sent!');
      }
      setResendTimer(60);
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Submit Details & Trigger OTP
  const onSignupSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // 0. Check if a pre-created worker document with this email already exists
      const qEmail = query(collection(db, 'users'), where('email', '==', data.email));
      const emailSnap = await getDocs(qEmail);
      const isPreCreated = !emailSnap.empty;

      if (!isPreCreated) {
        // If they are not pre-created workers, validate duplicate phone numbers using helper
        const isDuplicate = await checkPhoneDuplicate(db, data.phone, data.email);
        if (isDuplicate) {
          setShowDuplicatePopup(true);
          return;
        }
      }

      // 3. Send OTP
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send OTP');
      }

      setSignupData(data);
      if (result.isResendFreeTier) {
        setDevOtp(result.devOtp);
        setOtpCode(result.devOtp); // Auto-fill for convenience
        toast.success('Email restricted by provider. Verification auto-filled.', { icon: '🤖', duration: 5000 });
      } else {
        toast.success('Verification code sent to your email!');
        if (result.devOtp) setDevOtp(result.devOtp);
      }
      
      setSignupStep(2);

    } catch (error: any) {
      setErrorPopup(error.message || 'Network error occurred while signing up.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and create user
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupData.email, otp: otpCode })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Invalid OTP');

      toast.success('Email verified successfully!');
      
      // Email verified, create account.
      try {
        const cred = await createUserWithEmailAndPassword(auth, signupData.email, signupData.password);
        await handleAuthSuccess({ ...cred.user, displayName: signupData.name }, 'email', signupData.phone);
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          // The user exists in Auth but may be deleted in backend, or existing user trying to sign up again.
          try {
            const checkCred = await signInWithEmailAndPassword(auth, signupData.email, signupData.password);
            // Valid password!
            const docSnap = await getDoc(doc(db, 'users', checkCred.user.uid));
            if (!docSnap.exists()) {
               // Missing in backend (admin deleted), recreate their data!
               await handleAuthSuccess({ ...checkCred.user, displayName: signupData.name }, 'email', signupData.phone);
            } else {
               toast.error('Account already exists! We will log you in.');
               await handleAuthSuccess(checkCred.user, 'email');
            }
          } catch(signInErr) {
            throw new Error("An account with this email already exists but the password doesn't match. If you forgot your password, please reset it.");
          }
        } else {
          throw authError; // Re-throw other auth errors
        }
      }
      
    } catch (error: any) {
      setErrorPopup(mapFirebaseError(error) || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = async (user: any, method: 'email' | 'google', suppliedPhone?: string) => {
    let userRef = doc(db, 'users', user.uid);
    let snap = await getDoc(userRef);

    // Sync backend pre-created worker profiles
    if (!snap.exists() && user.email) {
      const q = query(collection(db, 'users'), where('email', '==', user.email));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const oldDoc = qSnap.docs[0];
        const oldData = oldDoc.data();
        
        const mergedData = {
          ...oldData,
          name: user.displayName || oldData.name || 'New Worker',
          email: user.email,
          phone: suppliedPhone ? `+91${suppliedPhone}` : (oldData.phone || ''),
          authMethod: method,
          emailVerified: true,
          joinedAt: oldData.joinedAt || serverTimestamp(),
          tempPhone: null,
          phoneVerified: true
        };

        await setDoc(userRef, mergedData);
        await deleteDoc(doc(db, 'users', oldDoc.id));
        
        if (mergedData.phone) {
          await associatePhoneWithUid(db, mergedData.phone, user.uid);
        }

        snap = await getDoc(userRef);
        toast.success('Your worker account has been successfully synced and activated!');
      }
    }

    if (!snap.exists()) {
      let finalPhone = suppliedPhone || await generateTempPhone();
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
        emailVerified: true, // we verified it via OTP
        tempPhone: method === 'email' ? null : finalPhone,
        phoneVerified: method === 'email', // if supplied
        kycDeferred: true,
        kycCompletedAt: null,
        tempWalletCap: 500,
        profileCompletion: 10,
        trustPoints: 0,
        amlFlag: false
      });
      
      if (finalPhone) {
        await associatePhoneWithUid(db, finalPhone, user.uid);
      }
      
      navigate('/onboarding');
    } else {
      const userData = snap.data();
      if (userData.phone) {
        await associatePhoneWithUid(db, userData.phone, user.uid);
      }

      const userRole = userData.role?.toLowerCase() || '';
      const userEmail = user.email?.toLowerCase().trim() || '';

      // 1. Dynamic Role Based Redirects (for EVERY user and worker)
      if (userRole === 'reseller' || userRole === 'partner' || userData.workerType === 'partner') {
        navigate('/reseller/dashboard');
      } else if (userRole === 'sub-admin') {
        navigate('/sub-admin');
      } else if (userRole === 'admin' || userRole === 'superadmin' || userRole === 'super-admin') {
        navigate('/admin');
      }
      // 2. Email Based Fallback for Super Admins (only if their database role is not a specific worker/reseller role)
      else if (userEmail === 'hvrsindustriespvtltd@gmail.com' || userEmail === 'marateyh@gmail.com') {
        navigate('/admin');
      }
      // 3. Fallback for workers and normal users
      else {
        if (!userData.venture || !userData.role) {
          navigate('/onboarding');
        } else {
          navigate('/home');
        }
      }
    }
  };

  const onLoginSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
      await handleAuthSuccess(cred.user, 'email');
    } catch (error: any) {
      setErrorPopup(mapFirebaseError(error) || "Invalid login credentials. Please try again.");
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
      if (error?.code === 'auth/cancelled-popup-request' || error?.code === 'auth/popup-closed-by-user') {
        toast.error("Google sign-in was closed or cancelled.");
        return;
      }
      setErrorPopup(mapFirebaseError(error) || "Google login failed.");
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="glass-card p-6 sm:p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
        
        {/* DUPLICATE ACCOUNT POPUP (Modal) */}
        {showDuplicatePopup && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#1A1A1D] border border-red-500/30 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Account Already Exists</h3>
              <p className="text-gray-400 text-sm mb-6">
                The mobile number <strong className="text-white">{signupData?.phone}</strong> is already registered with another WorkPlex account. To protect user security, multiple accounts using the same mobile number are not allowed.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDuplicatePopup(false)}
                  className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-white border border-gray-600 rounded-xl"
                >
                  Edit Number
                </button>
                <button 
                  onClick={() => {
                    setShowDuplicatePopup(false);
                    setIsLogin(true);
                  }}
                  className="flex-1 py-3 text-sm font-bold bg-[#E8B84B] text-black rounded-xl hover:bg-[#E8B84B]/90"
                >
                  Login Instead
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* GENERAL ERROR POPUP (Modal) */}
        {errorPopup && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#1A1A1D] border border-red-500/30 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Notice</h3>
              <p className="text-gray-400 text-sm mb-6 whitespace-pre-wrap">
                {errorPopup}
              </p>
              <div className="flex justify-center">
                <button 
                  onClick={() => setErrorPopup(null)}
                  className="px-8 py-3 text-sm font-bold bg-white/10 text-white rounded-xl hover:bg-white/20"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          {isLogin ? 'Login to continue earning' : 'Join WorkPlex and start earning today'}
        </p>

        {!isLogin && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${signupStep >= 1 ? 'text-[#E8B84B]' : 'text-gray-600'}`}>Details</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${signupStep >= 2 ? 'text-[#E8B84B]' : 'text-gray-600'}`}>Verify Email</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(signupStep / 2) * 100}%` }}
                className="h-full bg-[#E8B84B] rounded-full"
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* SIGNUP STEP 1: All Details (Name, Email, Phone, Password) */}
        {!isLogin && signupStep === 1 && (
          <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmitSignup(onSignupSubmit)} className="space-y-4 relative z-10">
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  {...registerSignup('name')}
                  type="text"
                  placeholder="Full Name"
                  className="w-full bg-[#1A1A1D] border border-white/10 text-white pl-12 pr-4 py-4 min-h-[48px] rounded-xl focus:border-[#E8B84B] outline-none transition-all"
                />
              </div>
              {signupErrors.name && <p className="text-red-500 text-xs mt-1 px-2">{signupErrors.name.message?.toString()}</p>}
            </div>

            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  {...registerSignup('email')}
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-[#1A1A1D] border border-white/10 text-white pl-12 pr-4 py-4 min-h-[48px] rounded-xl focus:border-[#E8B84B] outline-none transition-all"
                />
              </div>
              {signupErrors.email && <p className="text-red-500 text-xs mt-1 px-2">{signupErrors.email.message?.toString()}</p>}
            </div>

            <div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  {...registerSignup('phone')}
                  type="tel"
                  placeholder="Mobile Number"
                  className="w-full bg-[#1A1A1D] border border-white/10 text-white pl-12 pr-4 py-4 min-h-[48px] rounded-xl focus:border-[#E8B84B] outline-none transition-all"
                />
              </div>
              {signupErrors.phone && <p className="text-red-500 text-xs mt-1 px-2">{signupErrors.phone.message?.toString()}</p>}
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  {...registerSignup('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create Password"
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
              {signupErrors.password && <p className="text-red-500 text-xs mt-1 px-2">{signupErrors.password.message?.toString()}</p>}
            </div>

            <div className="flex items-center gap-2 mt-4 px-2 min-h-[44px]">
              <input 
                {...registerSignup('acceptTerms')}
                type="checkbox" 
                id="terms"
                className="rounded border-white/10 bg-transparent text-[#E8B84B] focus:ring-[#E8B84B] w-5 h-5 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-gray-400 cursor-pointer">
                I accept the Terms & Privacy Policy (DPDP Act 2023)
              </label>
            </div>
            {signupErrors.acceptTerms && <p className="text-red-500 text-xs mt-1 px-2">{signupErrors.acceptTerms.message?.toString()}</p>}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : ('Send Verification Code')} 
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </motion.form>
        )}

        {/* SIGNUP STEP 2: Verify Email OTP */}
        {!isLogin && signupStep === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2 block">Enter Email Verification Code</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-[#1A1A1D] border border-white/10 text-white pl-12 pr-4 py-4 min-h-[48px] rounded-xl focus:border-[#E8B84B] outline-none transition-all tracking-[0.5em] text-center font-mono text-xl"
                  maxLength={6}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">We sent a secure code to <strong className="text-white">{signupData?.email}</strong></p>
            </div>
            
            <button 
              onClick={handleVerifyOTP}
              disabled={isLoading}
              className="w-full min-h-[48px] bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP & Create Account'}
            </button>
            <div className="flex flex-col items-center gap-2 mt-4">
              <button 
                onClick={resendOtp} 
                disabled={resendTimer > 0 || isLoading}
                className={`text-sm tracking-wide ${resendTimer > 0 || isLoading ? 'text-gray-500 cursor-not-allowed' : 'text-[#E8B84B] hover:text-[#E8B84B]/80 font-semibold'}`}
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend Verification Code'}
              </button>
              <p className="text-center text-xs text-gray-500 hover:text-white cursor-pointer min-h-[44px] flex items-center justify-center transition-colors" onClick={() => setSignupStep(1)}>
                Go Back / Change Email
              </p>
            </div>
          </motion.div>
        )}

        {/* LOGIN FORM */}
        {isLogin && (
          <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-4 relative z-10">
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  {...registerLogin('email')}
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-[#1A1A1D] border border-white/10 text-white pl-12 pr-4 py-4 min-h-[48px] rounded-xl focus:border-[#E8B84B] outline-none transition-all"
                />
              </div>
              {loginErrors.email && <p className="text-red-500 text-xs mt-1 px-2">{loginErrors.email.message?.toString()}</p>}
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  {...registerLogin('password')}
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
              {loginErrors.password && <p className="text-red-500 text-xs mt-1 px-2">{loginErrors.password.message?.toString()}</p>}
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 min-h-[48px] rounded-xl hover:scale-[1.02] active:scale-95 transition-all mt-4 flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : ('Login')}
            </button>
          </motion.form>
        )}

        {/* SOCIAL LOGIN */}
        {isLogin && (
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
                setIsLogin(!isLogin);
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

