import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Briefcase, 
  Sliders, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Sparkles, 
  Users, 
  ShieldAlert, 
  Check, 
  X,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  ShoppingBag,
  Video,
  Target,
  Flame,
  Zap,
  Layers,
  Palette
} from 'lucide-react';
import toast from 'react-hot-toast';

// Dynamic default ventures list for seeding
const defaultVenturesSeed = [
  { 
    id: 'BuyRix', 
    name: 'BuyRix', 
    tag: 'Digital Commerce', 
    desc: 'Digital products only. Sell premium software, licenses, templates, and courses.',
    potential: 'Up to ₹2,500/day',
    comingSoon: false,
    active: true,
    iconName: 'Layers',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    roles: ['Reseller', 'Marketer', 'Content Creator']
  },
  { 
    id: 'Vyuma', 
    name: 'Vyuma', 
    tag: 'E-commerce', 
    desc: 'Physical product marketplace. Sell gadgets, accessories, apparel, and direct courier items.',
    potential: 'Up to ₹4,000/day',
    comingSoon: false,
    active: true,
    iconName: 'ShoppingBag',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    roles: ['Reseller', 'Marketer', 'Content Creator']
  },
  { 
    id: 'Growplex', 
    name: 'Growplex', 
    tag: 'SMM Panel', 
    desc: 'B2C Social Media Panel. Sell followers, likes, engagement, and promotional funnels.',
    potential: 'Up to ₹5,000/day',
    comingSoon: false,
    active: true,
    iconName: 'TrendingUp',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    roles: ['Reseller', 'Marketer', 'Content Creator']
  },
  { 
    id: 'Zaestify', 
    name: 'Zaestify', 
    tag: 'Startup Hub', 
    desc: 'Startup entrepreneurship incubator. Encouraging next-generation startups is our main motto.',
    potential: 'Coming Soon',
    comingSoon: true,
    active: true,
    iconName: 'Target',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    roles: ['Reseller', 'Marketer', 'Content Creator']
  }
];

export default function VentureControl() {
  // State variables
  const [ventures, setVentures] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [regConfig, setRegConfig] = useState<any>({
    globalRegistrationEnabled: true,
    blockedVentureIds: [],
    blockedRoles: [],
    quotas: {},
    blockedCombinations: {}
  });
  const [loading, setLoading] = useState(true);

  // New Venture Form
  const [showAddVenture, setShowAddVenture] = useState(false);
  const [newVenture, setNewVenture] = useState({
    id: '',
    name: '',
    tag: '',
    desc: '',
    potential: 'Up to ₹3,000/day',
    comingSoon: false,
    active: true,
    iconName: 'Briefcase',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-400/10',
    rolesInput: 'Marketer, Content Creator, Reseller'
  });

  // Load and Subscribe data
  useEffect(() => {
    // 1. Subscribe to Ventures
    const unsubVentures = onSnapshot(collection(db, 'ventures'), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVentures(list);
      
      // Auto-seeds ventures if empty to guarantee instant content
      if (list.length === 0) {
        toast.loading('Initializing official system ventures...', { id: 'seed_loader' });
        Promise.all(
          defaultVenturesSeed.map(async (v) => {
            const docRef = doc(db, 'ventures', v.id);
            await setDoc(docRef, v);
          })
        ).then(() => {
          toast.success('Successfully initialized standard WorkPlex ventures!', { id: 'seed_loader' });
        }).catch(err => {
          console.error("Failed to seed default ventures", err);
          toast.error("Initialization failed", { id: 'seed_loader' });
        });
      }
    });

    // 2. Subscribe to Users for Worker Allocation Analytics
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter out admin & main company accounts
      const activeWorkers = list.filter((w: any) => 
        w.email !== 'hvrsindustriespvtltd@gmail.com' && 
        w.role?.toLowerCase() !== 'admin' &&
        w.venture // Must have a designated venture
      );
      setWorkers(activeWorkers);
    });

    // 3. Subscribe to System Registration Configurations
    const unsubConfig = onSnapshot(doc(db, 'systemConfig', 'registrationControls'), (docSnap) => {
      if (docSnap.exists()) {
        setRegConfig(docSnap.data());
      } else {
        // Create initial config if missing
        const initial = {
          globalRegistrationEnabled: true,
          blockedVentureIds: [],
          blockedRoles: [],
          quotas: {},
          blockedCombinations: {}
        };
        setDoc(doc(db, 'systemConfig', 'registrationControls'), initial);
        setRegConfig(initial);
      }
      setLoading(false);
    });

    return () => {
      unsubVentures();
      unsubUsers();
      unsubConfig();
    };
  }, []);

  // Handler to block/unblock a complete venture across registration
  const toggleBlockVenture = async (ventureId: string) => {
    let list = regConfig.blockedVentureIds ? [...regConfig.blockedVentureIds] : [];
    if (list.includes(ventureId)) {
      list = list.filter((id) => id !== ventureId);
      toast.success(`Registration enabled for entire ${ventureId} venture!`);
    } else {
      list.push(ventureId);
      toast.success(`Registration suspended for ${ventureId} venture.`);
    }
    await updateDoc(doc(db, 'systemConfig', 'registrationControls'), { blockedVentureIds: list });
  };

  // Handler to block/unblock an entire role across registration
  const toggleBlockRole = async (roleName: string) => {
    let list = regConfig.blockedRoles ? [...regConfig.blockedRoles] : [];
    if (list.includes(roleName)) {
      list = list.filter((r) => r !== roleName);
      toast.success(`Registration enabled for role: ${roleName}`);
    } else {
      list.push(roleName);
      toast.success(`Registration suspended for role: ${roleName}`);
    }
    await updateDoc(doc(db, 'systemConfig', 'registrationControls'), { blockedRoles: list });
  };

  // Handler to block specifically a single combination
  const toggleBlockCombination = async (ventureId: string, roleName: string) => {
    const key = `${ventureId}_${roleName}`;
    const blockedCombinations = { ...(regConfig.blockedCombinations || {}) };
    const currentState = !!blockedCombinations[key];
    blockedCombinations[key] = !currentState;
    
    await updateDoc(doc(db, 'systemConfig', 'registrationControls'), { blockedCombinations });
    toast.success(`${ventureId} (${roleName}) registration ${!currentState ? 'Blocked 🔒' : 'Restored 🔓'}`);
  };

  // Handler to change combination quota
  const updateCombinationQuota = async (ventureId: string, roleName: string, val: string) => {
    const key = `${ventureId}_${roleName}`;
    const quotas = { ...(regConfig.quotas || {}) };
    const num = val.trim() === '' ? 0 : Number(val);
    
    if (num < 0) return;
    quotas[key] = num;
    await updateDoc(doc(db, 'systemConfig', 'registrationControls'), { quotas });
  };

  // Master switch
  const toggleGlobalRegistration = async () => {
    const nextVal = !regConfig.globalRegistrationEnabled;
    await updateDoc(doc(db, 'systemConfig', 'registrationControls'), { globalRegistrationEnabled: nextVal });
    toast.success(`System-wide Registration is now ${nextVal ? 'OPEN 🟢' : 'CLOSED 🔴'}`);
  };

  // Delete dynamic venture
  const handleDeleteVenture = async (id: string) => {
    const isDefault = ['BuyRix', 'Vyuma', 'Growplex', 'Zaestify'].includes(id);
    const msg = isDefault 
      ? `Are you sure you want to delete the standard venture "${id}"? This will erase it from configuration.`
      : `Are you sure you want to delete the custom venture "${id}"? It will immediately disappear from landing pages.`;
    
    if (!window.confirm(msg)) return;
    try {
      await deleteDoc(doc(db, 'ventures', id));
      toast.success(`Venture ${id} removed successfully.`);
    } catch (err) {
      toast.error("Failed to delete venture");
    }
  };

  // Add new dynamic Venture
  const handleCreateVenture = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedId = newVenture.id.trim().replace(/\s+/g, '');
    if (!formattedId) {
      toast.error("Invalid Venture ID");
      return;
    }

    try {
      const parsedRoles = newVenture.rolesInput
        .split(',')
        .map(r => r.trim())
        .filter(r => r.length > 0);

      if (parsedRoles.length === 0) {
        toast.error("Please provide at least 1 role for this venture.");
        return;
      }

      await setDoc(doc(db, 'ventures', formattedId), {
        id: formattedId,
        name: newVenture.name.trim(),
        tag: newVenture.tag.trim(),
        desc: newVenture.desc.trim(),
        potential: newVenture.potential.trim(),
        comingSoon: newVenture.comingSoon,
        active: newVenture.active,
        iconName: newVenture.iconName,
        color: newVenture.colorClass,
        bg: newVenture.bgClass,
        roles: parsedRoles
      });

      toast.success(`Venture "${newVenture.name}" successfully deployed and registered! 🚀`);
      setShowAddVenture(false);
      setNewVenture({
        id: '',
        name: '',
        tag: '',
        desc: '',
        potential: 'Up to ₹3,000/day',
        comingSoon: false,
        active: true,
        iconName: 'Briefcase',
        colorClass: 'text-amber-400',
        bgClass: 'bg-amber-400/10',
        rolesInput: 'Marketer, Content Creator, Reseller'
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save new venture.");
    }
  };

  // Icon collection options mapping
  const iconOptions = [
    { name: 'Briefcase', icon: Briefcase },
    { name: 'ShoppingBag', icon: ShoppingBag },
    { name: 'Video', icon: Video },
    { name: 'TrendingUp', icon: TrendingUp },
    { name: 'Users', icon: Users },
    { name: 'Target', icon: Target },
    { name: 'Flame', icon: Flame },
    { name: 'Zap', icon: Zap },
    { name: 'Layers', icon: Layers }
  ];

  const colorPresets = [
    { text: 'text-blue-400', bg: 'bg-blue-400/10', name: 'Cosmic Blue' },
    { text: 'text-purple-400', bg: 'bg-purple-400/10', name: 'Regal Violet' },
    { text: 'text-emerald-400', bg: 'bg-emerald-400/10', name: 'Neon Emerald' },
    { text: 'text-pink-400', bg: 'bg-pink-400/10', name: 'Cyber Pink' },
    { text: 'text-amber-400', bg: 'bg-amber-400/10', name: 'Liquid Amber' },
    { text: 'text-cyan-400', bg: 'bg-cyan-400/10', name: 'Electric Cyan' },
    { text: 'text-rose-400', bg: 'bg-rose-400/10', name: 'Fiery Rose' }
  ];

  // Helper selectors
  const getWorkerCount = (vId: string, rName: string) => {
    return workers.filter((w) => 
      w.venture?.toLowerCase() === vId.toLowerCase() && 
      w.role?.toLowerCase() === rName.toLowerCase()
    ).length;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-400 font-sans">
        <Sparkles className="w-10 h-10 text-[#E8B84B] animate-spin mb-4" />
        <p className="text-xs uppercase font-black tracking-widest text-[#E8B84B]">Loading Allocation Systems...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-24 p-2 sm:p-6 text-white font-sans max-w-7xl mx-auto">
      {/* 1. HEADER HERO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#2A2A2A]/40">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-glow-gold flex items-center gap-3">
             REGISTRY & ACCESS CONTROL
          </h1>
          <p className="text-gray-500 text-xs font-black uppercase tracking-widest mt-1">
             SYSTEMATIC WORKER DENSITY MONITORING & DYNAMIC VENTURE EXPANSION
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Master Kill switch on registrations */}
          <div className="flex items-center gap-3 bg-[#111111] border border-[#2A2A2A] px-4 py-3 rounded-2xl">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              REGISTRATION MASTER
            </span>
            <button
              onClick={toggleGlobalRegistration}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                regConfig.globalRegistrationEnabled 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {regConfig.globalRegistrationEnabled ? (
                <>
                  <Unlock size={11} strokeWidth={3} /> SYSTEM OPEN
                </>
              ) : (
                <>
                  <Lock size={11} strokeWidth={3} /> SYSTEM CLOSED
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => setShowAddVenture(true)}
            className="px-6 py-4.5 bg-[#E8B84B] text-black hover:bg-[#d6a537] rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl shadow-[#E8B84B]/10 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={16} strokeWidth={3} /> NEW VENTURE
          </button>
        </div>
      </div>

      {/* 2. LIVE SYSTEM CAPACITY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-[#E8B84B] font-black uppercase tracking-widest block">TOTAL REGISTERED WORKERS</span>
            <h3 className="text-3xl font-black mt-2 text-white">{workers.length}</h3>
          </div>
          <p className="text-[10px] text-gray-500 mt-4 uppercase">Across all designated fields</p>
        </div>

        <div className="bg-[#111111] border border-[#2A2A2A] rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest block">DIVERSIFIED VENTURES</span>
            <h3 className="text-3xl font-black mt-2 text-white">{ventures.length}</h3>
          </div>
          <p className="text-[10px] text-gray-500 mt-4 uppercase">Dynamic commercial segments</p>
        </div>

        <div className="bg-[#111111] border border-[#2A2A2A] rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest block">ACTIVE SIGNUP CHANNELS</span>
            <h3 className="text-3xl font-black mt-2 text-white">
              {regConfig.globalRegistrationEnabled ? 'ALL ACTIVE' : 'SUSPENDED'}
            </h3>
          </div>
          <p className="text-[10px] text-gray-500 mt-4 uppercase font-bold text-gray-400">
            {regConfig.globalRegistrationEnabled ? 'System onboarding open' : 'Registration frozen'}
          </p>
        </div>

        <div className="bg-[#111111] border border-[#2A2A2A] rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-pink-400 font-black uppercase tracking-widest block">QUOTA OVERRIDES INSTALLED</span>
            <h3 className="text-3xl font-black mt-2 text-white">
              {Object.keys(regConfig.quotas || {}).filter(k => regConfig.quotas[k] > 0).length}
            </h3>
          </div>
          <p className="text-[10px] text-gray-500 mt-4 uppercase">Active limitations applied</p>
        </div>
      </div>

      {/* 3. CORE SUB-SECTIONS VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFTSIDE: SYSTEMATIC ALLOCATION GRID & REGISTRATION RULES */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-[32px] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Sliders size={20} className="text-[#E8B84B]" /> SYSTEMATIC ALLOCATION MATRIX
                </h3>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mt-1">
                  MANAGE REGISTRATION BLOCKS, ACCESS LAWS, AND MAX WORKER QUOTAS FOR EACH COMBINATION
                </p>
              </div>
            </div>

            <div className="space-y-8 mt-8">
              {ventures.map((v) => {
                const isVentureBlocked = regConfig.blockedVentureIds?.includes(v.id);
                const ventureRoles = v.roles || ['Marketer', 'Content Creator', 'Reseller'];

                return (
                  <div key={v.id} className="border border-[#2D2D2D]/60 rounded-3xl bg-[#161616]/40 p-5 space-y-4">
                    {/* Venture Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2A2A]/40">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${v.bg || 'bg-amber-400/10'} flex items-center justify-center`}>
                          <Briefcase className={`w-4 h-4 ${v.color || 'text-amber-400'}`} />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-white uppercase tracking-wider">
                            {v.name}
                          </h4>
                          <span className="text-[9px] text-gray-500 uppercase font-black">Segment: {v.tag || 'Work Plex Field'}</span>
                        </div>
                      </div>

                      {/* Block whole venture signup toggle */}
                      <button
                        onClick={() => toggleBlockVenture(v.id)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                          isVentureBlocked 
                            ? 'bg-red-500/10 border-red-500/40 text-red-400' 
                            : 'bg-black border-[#2A2A2A] text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        {isVentureBlocked ? '🔒 Venture Closed' : '🔓 Venture Open'}
                      </button>
                    </div>

                    {/* Combinations Mapping */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {ventureRoles.map((role: string) => {
                        const comboKey = `${v.id}_${role}`;
                        const isComboBlocked = !!regConfig.blockedCombinations?.[comboKey];
                        const quotaLimit = regConfig.quotas?.[comboKey] || 0;
                        const currentCount = getWorkerCount(v.id, role);
                        const isQuotaFull = quotaLimit > 0 && currentCount >= quotaLimit;
                        
                        return (
                          <div 
                            key={role} 
                            className={`p-4 rounded-2xl border transition-all ${
                              isComboBlocked || isVentureBlocked
                                ? 'bg-black/40 border-[#EF4444]/20 opacity-75'
                                : isQuotaFull 
                                  ? 'bg-[#E8B84B]/5 border-[#E8B84B]/30'
                                  : 'bg-black/60 border-[#2A2A2A] hover:border-[#E8B84B]/20'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-xs font-black text-gray-300 uppercase tracking-wider">{role}</h5>
                                
                                {/* Density Count */}
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <Users size={12} className="text-gray-500" />
                                  <span className="text-xs font-black font-mono">
                                    {currentCount} {currentCount === 1 ? 'worker' : 'workers'}
                                  </span>
                                  {quotaLimit > 0 && (
                                    <span className="text-[10px] text-gray-500 font-bold font-mono">
                                      / {quotaLimit} limit
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => toggleBlockCombination(v.id, role)}
                                className={`p-2 rounded-lg transition-all ${
                                  isComboBlocked 
                                    ? 'bg-rose-950/20 hover:bg-rose-900/40 text-red-400' 
                                    : 'bg-[#1D1D1D] text-gray-400 hover:text-white'
                                }`}
                                title={isComboBlocked ? "Unlock Registration for this combo" : "Lock Registration for this combo"}
                              >
                                {isComboBlocked ? <Lock size={13} /> : <Unlock size={13} />}
                              </button>
                            </div>

                            {/* Allocation Bar visual representing quota */}
                            {quotaLimit > 0 && (
                              <div className="mt-3 space-y-1">
                                <div className="h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${isQuotaFull ? 'bg-rose-500' : 'bg-[#E8B84B]'}`}
                                    style={{ width: `${Math.min(100, (currentCount / quotaLimit) * 100)}%` }}
                                  />
                                </div>
                                <div className="flex justify-between items-center text-[9px]">
                                  <span className={isQuotaFull ? 'text-rose-400 font-bold' : 'text-gray-500'}>
                                    {isQuotaFull ? '🔒 REGISTRATION LOCK (FULL)' : `${quotaLimit - currentCount} spots left`}
                                  </span>
                                  <span className="text-gray-500 font-mono">
                                    {Math.round((currentCount / quotaLimit) * 100)}% Density
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Quota adjusting panel */}
                            <div className="mt-4 pt-3 border-t border-[#2A2A2A]/40 flex items-center justify-between gap-4">
                              <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Adjust Limit:</span>
                              <div className="flex items-center gap-1.5 bg-black rounded-lg border border-[#2D2D2D] px-2 py-0.5 w-24">
                                <input 
                                  type="number"
                                  value={quotaLimit || ''}
                                  onChange={(e) => updateCombinationQuota(v.id, role, e.target.value)}
                                  placeholder="∞"
                                  className="w-full bg-transparent text-right text-xs font-mono font-bold border-none outline-none text-white placeholder-gray-600"
                                />
                                <span className="text-[9px] text-gray-600 font-bold">Qty</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHTSIDE: VENTURE REGISTRY & DEPLOYER */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-[32px] p-6">
            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2 flex items-center gap-2">
               <Briefcase size={18} className="text-[#E8B84B]" /> VENTURE REGISTRY
            </h3>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-6">
               MANAGE CURRENTLY DISPATCHED SYSTEM VENTURES
            </p>

            <div className="space-y-4">
              {ventures.map((v) => {
                const isDefault = ['BuyRix', 'Vyuma', 'Growplex', 'Zaestify'].includes(v.id);
                return (
                  <div key={v.id} className="bg-black/50 border border-[#2A2A2A] rounded-2xl p-4 flex flex-col justify-between gap-3 relative overflow-hidden group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl ${v.bg || 'bg-amber-400/10'} flex items-center justify-center`}>
                          <Sliders className={`w-5 h-5 ${v.color || 'text-amber-400'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-white text-sm uppercase">{v.name}</h4>
                            {isDefault && (
                              <span className="text-[7px] bg-[#E8B84B]/10 text-[#E8B84B] px-1 py-0.5 rounded font-black uppercase">
                                SYSTEM
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500">{v.tag}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteVenture(v.id)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete this venture"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <p className="text-[11px] text-gray-400 leading-relaxed pr-2">{v.desc}</p>
                    
                    <div className="pt-3 border-t border-[#2A2A2A]/40 flex items-center justify-between text-[10px] font-bold">
                      <span className="text-[#00C9A7]">{v.potential}</span>
                      <span className="text-gray-500 font-mono uppercase">{v.roles?.length || 3} Roles Ready</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODAL: CREATE NEW VENTURE SYSTEM FLUID INCLUSION */}
      {showAddVenture && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
             initial={{ scale: 0.95, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-[#111111] border border-[#2A2A2A] rounded-[32px] p-8 w-full max-w-lg shadow-2xl shadow-black relative overflow-y-auto max-h-[90vh]"
          >
             <div className="flex items-center justify-between mb-6">
                <div>
                   <h3 className="text-lg font-black text-white uppercase tracking-widest">DEPLOY NEW SYSTEM VENTURE</h3>
                   <p className="text-gray-500 text-[10px] font-bold uppercase mt-1">This registers a new venture visible on Landing Page & onboarding</p>
                </div>
                <button 
                  onClick={() => setShowAddVenture(false)}
                  className="text-gray-500 hover:text-white p-1 hover:bg-white/5 rounded-lg"
                >
                   <X size={20} />
                </button>
             </div>

             <form onSubmit={handleCreateVenture} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">SYSTEM KEY (No Spaces)</label>
                     <input 
                        type="text" 
                        value={newVenture.id}
                        onChange={e => setNewVenture({...newVenture, id: e.target.value})}
                        placeholder="E.g. Finix"
                        className="w-full bg-black border border-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:border-[#E8B84B] outline-none text-xs font-semibold"
                        required
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">HUMAN NAME</label>
                     <input 
                        type="text" 
                        value={newVenture.name}
                        onChange={e => setNewVenture({...newVenture, name: e.target.value})}
                        placeholder="E.g. Finix Hub"
                        className="w-full bg-black border border-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:border-[#E8B84B] outline-none text-xs font-semibold"
                        required
                     />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">VENTURE TAGLINE</label>
                     <input 
                        type="text" 
                        value={newVenture.tag}
                        onChange={e => setNewVenture({...newVenture, tag: e.target.value})}
                        placeholder="E.g. Fintech & Micro-loans"
                        className="w-full bg-black border border-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:border-[#E8B84B] outline-none text-xs font-semibold"
                        required
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">EARNING POTENTIAL TEXT</label>
                     <input 
                        type="text" 
                        value={newVenture.potential}
                        onChange={e => setNewVenture({...newVenture, potential: e.target.value})}
                        placeholder="E.g. Up to ₹4,000/day"
                        className="w-full bg-black border border-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:border-[#E8B84B] outline-none text-xs font-semibold"
                        required
                     />
                  </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">VENTURE DESCRIPTION</label>
                   <textarea 
                      rows={3}
                      value={newVenture.desc}
                      onChange={e => setNewVenture({...newVenture, desc: e.target.value})}
                      placeholder="Enter details displayed on registration cards for this venture..."
                      className="w-full bg-black border border-[#2A2A2A] text-white p-4 rounded-xl focus:border-[#E8B84B] outline-none text-xs font-semibold resize-none"
                      required
                   />
                </div>

                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">ASSIGNED ROLES (Comma Separated)</label>
                   <input 
                      type="text" 
                      value={newVenture.rolesInput}
                      onChange={e => setNewVenture({...newVenture, rolesInput: e.target.value})}
                      placeholder="E.g. Marketer, Content Creator, Reseller"
                      className="w-full bg-black border border-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:border-[#E8B84B] outline-none text-xs font-semibold"
                      required
                   />
                </div>

                {/* Theme palette presets */}
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block ml-1">THEME COLOURS PAIRINGS</label>
                   <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1 border border-[#2A2A2A] rounded-xl bg-black">
                     {colorPresets.map((c) => (
                        <button
                           key={c.name}
                           type="button"
                           onClick={() => setNewVenture({ ...newVenture, colorClass: c.text, bgClass: c.bg })}
                           className={`p-2.5 rounded-lg flex items-center justify-between text-left text-[10px] uppercase font-black transition-all border ${
                              newVenture.colorClass === c.text 
                                 ? 'bg-white/10 border-[#E8B84B]' 
                                 : 'border-transparent hover:bg-white/5'
                           }`}
                        >
                           <span className={c.text}>{c.name}</span>
                           <div className={`w-3.5 h-3.5 rounded-full ${c.bg} border border-current flex items-center justify-center`} />
                        </button>
                     ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block ml-1">CHOOSE ICON PRESET</label>
                     <div className="grid grid-cols-5 gap-1.5 bg-black p-2 rounded-xl border border-[#2A2A2A]">
                        {iconOptions.map((opt) => (
                           <button
                              key={opt.name}
                              type="button"
                              onClick={() => setNewVenture({...newVenture, iconName: opt.name})}
                              className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
                                 newVenture.iconName === opt.name 
                                    ? 'bg-[#E8B84B] text-black font-bold' 
                                    : 'text-gray-400 hover:text-white'
                              }`}
                              title={opt.name}
                           >
                              <opt.icon size={16} />
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="flex flex-col justify-center gap-3">
                     <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                           type="checkbox"
                           checked={newVenture.comingSoon}
                           onChange={e => setNewVenture({...newVenture, comingSoon: e.target.checked})}
                           className="w-4 h-4 rounded border-[#2D2D2D] text-[#E8B84B] focus:ring-transparent accent-[#E8B84B]"
                        />
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Mark as Coming Soon</span>
                     </label>

                     <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                           type="checkbox"
                           checked={newVenture.active}
                           onChange={e => setNewVenture({...newVenture, active: e.target.checked})}
                           className="w-4 h-4 rounded border-[#2D2D2D] text-[#E8B84B] focus:ring-transparent accent-[#E8B84B]"
                        />
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Instantly Activatable</span>
                     </label>
                  </div>
                </div>

                <button 
                   type="submit"
                   className="w-full bg-[#E8B84B] hover:bg-[#d6a537] text-black font-black uppercase text-[10px] tracking-widest py-4.5 rounded-2xl transition shadow-xl shadow-[#E8B84B]/10 cursor-pointer text-center"
                >
                   DEPLOY NEW SYSTEM VENTURE
                </button>
             </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
