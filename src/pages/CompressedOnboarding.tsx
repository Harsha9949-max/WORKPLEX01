import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, query, collection, where, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ChevronLeft, Zap, Target, Globe, Users, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Logo } from '../components/ui/Logo';
import { associatePhoneWithUid, checkPhoneDuplicate } from '../utils/phoneDirectory';

export default function CompressedOnboarding() {
  const [step, setStep] = useState(1);
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [venture, setVenture] = useState('');
  const [role, setRole] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [realPhoneInput, setRealPhoneInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const { currentUser, userData, loading } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const isTempPhone = userData ? (userData.phone?.includes('-TEMP-') || userData.tempPhone || !userData.phone) : false;

  useEffect(() => {
    // Keep user here if they haven't picked venture/role
    if (!loading && userData?.venture && userData?.role && !showWelcome) {
      if (userData?.role === 'Reseller') {
        navigate('/reseller/dashboard');
      } else {
        navigate('/home');
      }
    }
  }, [userData, loading, navigate, showWelcome]);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindī (हिन्दी)', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil (தமிழ்)', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu (తెలుగు)', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali (বাংলা)', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi (मराठी)', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam (മലയാളം)', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati (ગુજરાતી)', flag: '🇮🇳' },
    { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)', flag: '🇮🇳' }
  ];

  const [dbVentures, setDbVentures] = useState<any[]>([]);
  const [regConfig, setRegConfig] = useState<any>({
    globalRegistrationEnabled: true,
    blockedVentureIds: [],
    blockedRoles: [],
    quotas: {},
    blockedCombinations: {}
  });
  const [dynamicCounts, setDynamicCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Subscriber to live channels
    const unsubVentures = onSnapshot(collection(db, 'ventures'), (snap) => {
      if (!snap.empty) {
        setDbVentures(snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })));
      }
    });

    const unsubConfig = onSnapshot(doc(db, 'systemConfig', 'registrationControls'), (snap) => {
      if (snap.exists()) {
        setRegConfig(snap.data());
      }
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const counts: Record<string, number> = {};
      snap.docs.forEach(docSnap => {
        const u = docSnap.data();
        if (u.email !== 'hvrsindustriespvtltd@gmail.com' && u.role?.toLowerCase() !== 'admin' && u.venture && u.role) {
          // Normalize matching key with capitalisation
          const key = `${u.venture}_${u.role}`;
          counts[key] = (counts[key] || 0) + 1;
        }
      });
      setDynamicCounts(counts);
    });

    return () => {
      unsubVentures();
      unsubConfig();
      unsubUsers();
    };
  }, []);

  const defaultVentures = [
    { id: 'BuyRix', name: 'BuyRix', tag: 'Digital Commerce', desc: 'Digital products only. Sell premium software, licenses, templates, and courses.', active: true, roles: ['Reseller', 'Marketer', 'Content Creator'] },
    { id: 'Vyuma', name: 'Vyuma', tag: 'E-commerce', desc: 'Physical product marketplace. Sell gadgets, accessories, apparel, and direct courier items.', active: true, roles: ['Reseller', 'Marketer', 'Content Creator'] },
    { id: 'Growplex', name: 'Growplex', tag: 'SMM Panel', desc: 'B2C Social Media Panel. Sell followers, likes, engagement, and promotional funnels.', active: true, roles: ['Reseller', 'Marketer', 'Content Creator'] },
    { id: 'Zaestify', name: 'Zaestify', tag: 'Startup Hub', desc: 'Encouraging startups is our main motto. Incubation and startup workspace (Coming Soon).', active: false, roles: ['Reseller', 'Marketer', 'Content Creator'] }
  ];

  // Dynamic Ventures mapping matching admin custom settings
  const ventures = (dbVentures.length > 0 ? dbVentures : defaultVentures).map(v => {
    // Check if the whole venture is closed by admin controls
    const isVentureBlocked = regConfig.blockedVentureIds?.includes(v.id);
    return {
      ...v,
      // Active state is driven by direct active status and block lists
      active: v.active !== false && !isVentureBlocked && !v.comingSoon
    };
  });

  const getRoleDesc = (r: string) => {
     switch(r) {
        case 'Reseller': return 'Launch custom white-label stores with chosen venture products';
        case 'Marketer': return 'Market ventures & get paid on verified sales. Instagram video assets provided';
        case 'Content Creator': return 'Create custom video reviews and creative media assets (Coming Soon)';
        default: return `Participate as an active ${r}`;
     }
  };

  const getRolesByVenture = (vId: string) => {
    const matchedVenture = (dbVentures.length > 0 ? dbVentures : defaultVentures).find(v => v.id.toLowerCase() === vId.toLowerCase());
    if (!matchedVenture) return [];

    const matchedRoles = matchedVenture.roles || ['Marketer', 'Content Creator', 'Reseller'];

    return matchedRoles.map((rName: string) => {
      const comboKey = `${matchedVenture.id}_${rName}`;
      
      const isRoleBlockedGlobally = regConfig.blockedRoles?.includes(rName);
      const isComboBlocked = !!regConfig.blockedCombinations?.[comboKey];
      const maxQuota = regConfig.quotas?.[comboKey] || 0;
      const currentCount = dynamicCounts[comboKey] || 0;
      const isQuotaFull = maxQuota > 0 && currentCount >= maxQuota;

      // Master lock: disabled if blocked globally, combination blocked, or capacity reached
      let isDisabled = isRoleBlockedGlobally || isComboBlocked || isQuotaFull;

      // Enforce the default state locks for standardized values
      if (matchedVenture.id === 'BuyRix' || matchedVenture.id === 'Vyuma') {
         if (rName !== 'Reseller' && !isComboBlocked && !isQuotaFull && !isRoleBlockedGlobally && dbVentures.length === 0) {
            // Standard state has non-reseller roles as coming soon by default
            isDisabled = true;
         }
      } else if (matchedVenture.id === 'Growplex' || matchedVenture.id === 'Zaestify') {
         if (dbVentures.length === 0) {
            isDisabled = true; // Growplex/Zaestify roles default to coming soon in static mode
         }
      }

      // Add descriptive status tags
      let statusTag = '';
      if (isQuotaFull) statusTag = '(QUOTA FULL)';
      else if (isComboBlocked || isRoleBlockedGlobally) statusTag = '(LOCKED)';

      return {
        id: rName,
        name: rName,
        icon: rName.toLowerCase().includes('resell') ? '🛍️' : rName.toLowerCase().includes('creat') || rName.toLowerCase().includes('video') ? '🎥' : rName.toLowerCase().includes('promot') ? '📢' : '📈',
        desc: `${getRoleDesc(rName)} ${statusTag}`,
        disabled: isDisabled,
        isQuotaFull,
        maxQuota,
        currentCount
      };
    });
  };

  const currentRoles = getRolesByVenture(venture);

  const handleLanguageSelect = (langCode: string) => {
    setPreferredLanguage(langCode);
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
  };

  const handleComplete = async () => {
    if (!venture || !role) {
      toast.error('Please select both a venture and a role to proceed.');
      return;
    }
    if (!currentUser) {
      toast.error('Auth error. Please login again.');
      navigate('/login');
      return;
    }

    // Secure systemwide, venture, and combination quota locks
    if (regConfig.globalRegistrationEnabled === false) {
      toast.error('Registration is temporarily closed system-wide by the administrator.');
      return;
    }

    if (regConfig.blockedVentureIds?.includes(venture)) {
      toast.error(`Signups for the ${venture} venture are currently suspended.`);
      return;
    }

    if (regConfig.blockedRoles?.includes(role)) {
      toast.error(`The "${role}" role is currently suspended system-wide.`);
      return;
    }

    const comboKey = `${venture}_${role}`;
    if (regConfig.blockedCombinations?.[comboKey]) {
      toast.error(`Signups for "${role}" within ${venture} are currently locked.`);
      return;
    }

    const maxQuota = regConfig.quotas?.[comboKey] || 0;
    const currentCount = dynamicCounts[comboKey] || 0;
    if (maxQuota > 0 && currentCount >= maxQuota) {
      toast.error(`Registration slot is full! This field has reached its limit of ${maxQuota} workers.`);
      return;
    }

    if (isTempPhone) {
      if (!realPhoneInput || realPhoneInput.length !== 10) {
        toast.error("Please enter a valid 10-digit actual mobile number");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isTempPhone) {
        // Check duplication
        const isDuplicate = await checkPhoneDuplicate(db, `+91${realPhoneInput}`, currentUser.email || '');
        if (isDuplicate) {
          toast.error("This phone number is already registered with another account");
          setIsSubmitting(false);
          return;
        }
      }

      let referredById = null;
      if (referralCodeInput) {
          const q = query(collection(db, 'users'), where('referralCode', '==', referralCodeInput.toUpperCase().trim()), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
              referredById = snap.docs[0].id;
          } else {
              toast.error("Invalid Referral Code. Proceeding without it.");
          }
      }

      const generatedCode = userData?.referralCode || Math.random().toString(36).substring(2, 8).toUpperCase();

      const userRef = doc(db, 'users', currentUser.uid);
      const phoneVal = isTempPhone ? `+91${realPhoneInput}` : (userData?.phone || '');

      await setDoc(userRef, {
        preferredLanguage,
        venture,
        role,
        kycDeferred: true,
        profileCompletion: 20,
        referralCode: generatedCode,
        ...(isTempPhone ? { phone: phoneVal, tempPhone: null } : {}),
        ...(referredById ? { referredBy: referredById } : {})
      }, { merge: true });
      
      if (isTempPhone) {
        // Associate phone with UID in phoneDirectory
        await associatePhoneWithUid(db, phoneVal, currentUser.uid);
        
        // Sync profile update with backend api
        try {
          await fetch(`/api/admin/update-user/${currentUser.uid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneVal })
          });
        } catch (apiErr) {
          console.warn("Syncing phone change to backend failed:", apiErr);
        }
      }

      setShowWelcome(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 1) navigate('/');
    else setStep(step - 1);
  };

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-black/95 flex items-center justify-center p-6 z-50 fixed inset-0 overflow-y-auto">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="bg-[#111111] border border-[#E8B84B]/30 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 text-center flex flex-col items-center my-8 shadow-[0_0_50px_rgba(232,184,75,0.15)]"
        >
          <Logo variant="vertical" size="lg" />
          
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-wider">🎉 CONGRATULATIONS!</h3>
            <p className="text-gray-400 text-xs">
              You are officially activated. You have unlocked the first chunk of your gamified <span className="text-[#E8B84B] font-bold">₹2,500 Welcome Incentive</span>!
            </p>
          </div>

          {/* Gamified Chunk Milestones Timeline */}
          <div className="w-full bg-[#0A0A0B] border border-white/5 rounded-2xl p-4 text-left space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Incentive Unlock Roadmap (₹2,500 Total)</p>
            
            <div className="space-y-3 relative">
              {/* Vertical connector line */}
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-white/10 z-0" />
              
              {/* Milestone 1: Done */}
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-6 h-6 rounded-full bg-[#10B981] border border-[#10B981]/50 flex items-center justify-center text-[10px] font-black text-black shrink-0">
                  ✓
                </div>
                <div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs font-bold text-white">Profile Activation</span>
                    <span className="text-[10px] font-mono font-black text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded">₹200 UNLOCKED</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Credited to your pending wallet bonus balance.</p>
                </div>
              </div>

              {/* Milestone 2 */}
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-6 h-6 rounded-full bg-[#222] border border-white/10 flex items-center justify-center text-[10px] font-black text-gray-500 shrink-0">
                  2
                </div>
                <div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs font-medium text-gray-300">Store / First Catalog Setup</span>
                    <span className="text-[10px] font-mono font-bold text-gray-500">₹500 LOCKED</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Unlocks automatically when you activate your custom storefront.</p>
                </div>
              </div>

              {/* Milestone 3 */}
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-6 h-6 rounded-full bg-[#222] border border-white/10 flex items-center justify-center text-[10px] font-black text-gray-500 shrink-0">
                  3
                </div>
                <div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs font-medium text-gray-300">First Verified Customer Sale</span>
                    <span className="text-[10px] font-mono font-bold text-gray-500">₹800 LOCKED</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Unlocks upon courier delivery and reconciliation of your first order.</p>
                </div>
              </div>

              {/* Milestone 4 */}
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-6 h-6 rounded-full bg-[#222] border border-white/10 flex items-center justify-center text-[10px] font-black text-gray-500 shrink-0">
                  4
                </div>
                <div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs font-medium text-gray-300">Streak / Volume Master</span>
                    <span className="text-[10px] font-mono font-bold text-gray-500">₹1,000 LOCKED</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Unlocks upon completing 5 verified orders or keeping a 7-day streak.</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#E8B84B] font-bold mt-2">Activate your workspace now to complete the remaining milestones!</p>
          
          <button 
            onClick={() => navigate(role === 'Reseller' ? '/reseller/dashboard' : '/home')} 
            className="w-full bg-[#E8B84B] text-black font-black uppercase py-4 rounded-xl mt-4 hover:scale-102 transition-transform min-h-[48px] shadow-[0_0_20px_rgba(232,184,75,0.2)]"
          >
            Launch My Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center p-4 pt-10 sm:p-6">
      <div className="mb-8 scale-90">
        <Logo variant="primary" size="md" />
      </div>
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleBack} 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors min-h-[44px]"
          >
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
              <ChevronLeft size={18} />
            </div>
            <span className="text-sm font-medium uppercase tracking-widest">{step === 1 ? 'Back' : 'Previous'}</span>
          </button>
          <div className="flex-1 max-w-[200px] ml-4">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 1 ? 'text-[#E8B84B]' : 'text-gray-600'}`}>Language</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 2 ? 'text-[#E8B84B]' : 'text-gray-600'}`}>Venture</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 3 ? 'text-[#E8B84B]' : 'text-gray-600'}`}>Role</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(step / 3) * 100}%` }}
                className="h-full bg-[#E8B84B] rounded-full"
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 sm:p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8">
                <div className="w-12 h-12 bg-[#2A2A2A] rounded-2xl flex items-center justify-center mb-4">
                  <Globe className="text-[#E8B84B]" size={24} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Select Language</h2>
                <p className="text-gray-400 text-sm">Choose your preferred language for the app.</p>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-6">
                <h2 className="text-red-500 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  ⚠️ IMPORTANT: HOW EARNINGS WORK
                </h2>
                <div className="space-y-4 text-xs font-medium text-gray-300">
                  <div>
                    <p className="text-green-400 font-bold mb-1">✅ You earn ONLY when:</p>
                    <ul className="list-disc pl-4 space-y-1 text-gray-400">
                      <li>Your marketing leads to ACTUAL SALES</li>
                      <li>Customers use YOUR coupon code</li>
                      <li>Your content drives VERIFIED metrics</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-red-400 font-bold mb-1">❌ You DO NOT earn for:</p>
                    <ul className="list-disc pl-4 space-y-1 text-gray-400">
                      <li>Just making an account</li>
                      <li>Clicking links without results</li>
                      <li>Submitting fake proof</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`p-4 rounded-xl border min-h-[48px] text-left flex items-center gap-3 transition-all ${
                      preferredLanguage === lang.code 
                        ? 'bg-[#E8B84B]/10 border-[#E8B84B] text-white' 
                        : 'bg-[#111] border-white/5 hover:border-white/20 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-bold text-sm tracking-tight">{lang.name}</span>
                  </button>
                ))}
              </div>

              <button 
                disabled={!preferredLanguage}
                onClick={() => setStep(2)}
                className="w-full mt-8 min-h-[48px] bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next Step
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8 font-sans">
                <div className="w-12 h-12 bg-[#2A2A2A] rounded-2xl flex items-center justify-center mb-4">
                  <Target className="text-[#E8B84B]" size={24} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Select Venture</h2>
                <p className="text-gray-400 text-sm">Choose your primary focus area to match missions exactly to your interests.</p>
              </div>

              {regConfig.globalRegistrationEnabled === false && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 text-xs text-red-400 font-bold tracking-tight">
                  ⚠️ ONBOARDING SUSPENDED: System administration has temporarily paused new account registrations worldwide.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ventures.map(v => {
                  const isVentureBlocked = regConfig.blockedVentureIds?.includes(v.id);
                  const isClosed = !v.active || isVentureBlocked;
                  const displayBadge = isVentureBlocked ? 'CLOSED' : (!v.active ? 'COMING SOON' : 'ACTIVE_SPOTS');

                  return (
                    <button
                      key={v.id}
                      disabled={isClosed || regConfig.globalRegistrationEnabled === false}
                      onClick={() => {
                        if (isClosed) {
                          toast(`${v.name} onboarding is currently closed or launching soon.`, { icon: '🚀' });
                          return;
                        }
                        setVenture(v.id);
                        setRole(''); // Reset role when venture changes
                      }}
                      className={`p-4 rounded-2xl border min-h-[100px] text-left flex flex-col transition-all relative overflow-hidden ${
                        isClosed || regConfig.globalRegistrationEnabled === false 
                          ? 'opacity-60 bg-[#111] border-white/5 cursor-not-allowed grayscale' 
                          : venture === v.id 
                            ? 'bg-[#E8B84B]/10 border-[#E8B84B]' 
                            : 'bg-[#111] border-white/5 hover:border-white/20'
                      }`}
                    >
                      {displayBadge === 'CLOSED' && (
                        <div className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-full z-10 font-mono">
                          CLOSED
                        </div>
                      )}
                      {displayBadge === 'COMING SOON' && (
                        <div className="absolute top-2 right-2 bg-[#E8B84B] text-black text-[9px] font-black uppercase px-2 py-1 rounded-full z-10 font-mono">
                          COMING SOON
                        </div>
                      )}
                      {v.active && !isVentureBlocked && (
                        <div className="absolute top-2 right-2 bg-green-900/40 text-green-400 border border-green-500/20 text-[9px] font-black uppercase px-2 py-1 rounded-full z-10 font-mono">
                          OPEN
                        </div>
                      )}
                      <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${!isClosed ? 'text-[#E8B84B]' : 'text-gray-500'}`}>{v.tag || 'Venture'}</span>
                      <span className="text-white font-black text-lg mb-1">{v.name}</span>
                      <span className="text-gray-500 text-xs">{v.desc}</span>
                    </button>
                  );
                })}
              </div>

              <button 
                disabled={!venture || regConfig.globalRegistrationEnabled === false}
                onClick={() => setStep(3)}
                className="w-full mt-8 min-h-[48px] bg-[#E8B84B] text-black font-black uppercase tracking-widest py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next Step
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8 font-sans">
                <div className="w-12 h-12 bg-[#2A2A2A] rounded-2xl flex items-center justify-center mb-4">
                  <Zap className="text-[#E8B84B]" size={24} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Select Your Role</h2>
                <p className="text-gray-400 text-sm">Choose your operational role in {venture}. Live seats and limits apply.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentRoles.map(r => {
                  const comboKey = `${venture}_${r.id}`;
                  const currentCount = r.currentCount || 0;
                  const maxQuota = r.maxQuota || 0;
                  const displaySeats = maxQuota > 0 ? `${currentCount}/${maxQuota} Seats filled` : 'Unlimited Seats';

                  return (
                    <button
                      key={r.id}
                      disabled={r.disabled}
                      onClick={() => {
                        if (r.disabled) {
                          toast(r.isQuotaFull ? 'This slot registration limit has been fully saturated.' : 'Role launching soon! Stay tuned.', { icon: '🚀' });
                          return;
                        }
                        setRole(r.id);
                      }}
                      className={`p-4 rounded-2xl border min-h-[100px] relative text-left flex flex-col transition-all ${
                        r.disabled 
                          ? 'opacity-60 bg-[#111] border-white/5 cursor-not-allowed grayscale' 
                          : role === r.id 
                            ? 'bg-[#E8B84B]/10 border-[#E8B84B]' 
                            : 'bg-[#111] border-white/5 hover:border-white/20'
                      }`}
                    >
                      {r.disabled && (
                        <div className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-full z-10 w-fit whitespace-nowrap font-mono">
                          {r.isQuotaFull ? 'FULL' : 'LOCKED'}
                        </div>
                      )}
                      {!r.disabled && (
                        <div className="absolute top-2 right-2 bg-green-900/40 text-green-400 border border-green-500/20 text-[9px] font-black uppercase px-2 py-1 rounded-full z-10 font-mono">
                          ACTIVE
                        </div>
                      )}
                      <span className="text-2xl mb-2">{r.icon}</span>
                      <span className="text-white font-black text-lg mb-1">{r.name}</span>
                      <span className="text-gray-500 text-xs mb-2 leading-tight">{r.desc}</span>
                      <span className="text-[10px] font-mono text-[#E8B84B] font-semibold mt-auto">{displaySeats}</span>
                    </button>
                  );
                })}
              </div>

              {isTempPhone && (
                <div className="mt-8 border-t border-[#2A2A2A] pt-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#E8B84B] ml-2 block mb-2 flex items-center gap-2">
                    <Phone size={14} /> Enter Actual Mobile Number (Required)
                  </label>
                  <div className="relative flex">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] border-r-0 rounded-l-xl px-4 py-4 flex items-center text-gray-400 font-mono text-sm leading-none">
                       +91
                    </div>
                    <input
                      type="tel"
                      value={realPhoneInput}
                      onChange={(e) => setRealPhoneInput(e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                      placeholder="10-digit number"
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-r-xl text-white px-4 py-4 focus:ring-2 focus:ring-[#E8B84B] font-mono outline-none"
                    />
                  </div>
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-2 ml-2">
                    We require a real mobile number for payouts and KYC compliance.
                  </p>
                </div>
              )}

              <div className="mt-8 border-t border-[#2A2A2A] pt-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#E8B84B] ml-2 block mb-2 flex items-center gap-2">
                  <Users size={14} /> Referral Code (Optional)
                </label>
                <input
                  type="text"
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code"
                  className="w-full bg-[#1A1A1A] border-none rounded-xl text-white px-4 py-4 focus:ring-2 focus:ring-[#E8B84B] uppercase tracking-widest font-black"
                />
              </div>

              <div className="mt-8 space-y-4">
                <button 
                  disabled={!role || isSubmitting || (isTempPhone && realPhoneInput.length !== 10)}
                  onClick={handleComplete}
                  className="w-full bg-[#E8B84B] min-h-[48px] text-black font-black uppercase tracking-widest py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : 'Complete Signup'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

