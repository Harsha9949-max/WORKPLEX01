import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import toast from 'react-hot-toast';
import { ExternalLink, Copy, Share2, Download, Check, Save, Sparkles, CheckCircle2 } from 'lucide-react';
import ResellerProducts from './ResellerProducts';

export default function ResellerShop() {
  const { currentUser } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Appearance');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Local state for edits
  const [theme, setTheme] = useState({
    primaryColor: '#2874f0',
    secondaryColor: '#ffe11b',
    backgroundColor: '#f1f3f6',
    fontStyle: 'modern',
    buttonStyle: 'rounded',
    layout: 'grid'
  });
  const [branding, setBranding] = useState({
    tagline: '',
    whatsappNumber: '',
    instagramHandle: '',
    bannerText: '',
    logo: '',
    bannerImage: ''
  });
  const [seo, setSeo] = useState({
    metaTitle: '',
    metaDescription: '',
    keywords: ''
  });

  const [localShopName, setLocalShopName] = useState('');
  const [localShopSlug, setLocalShopSlug] = useState('');

  const shopName = localShopName || shop?.shopName || 'My Shop';

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-') // replace spaces & special chars with -
      .replace(/-+/g, '-')         // collapse duplicate dashes
      .replace(/^-+|-+$/g, '');     // trim leading/trailing dashes
  };

  const handleShopNameChange = (val: string) => {
    setLocalShopName(val);
    setLocalShopSlug(slugify(val));
  };

  // Real-time listener for current shop configurations
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'partnerShops', currentUser.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setShop(data);
        if (!initialLoaded) {
          if (data.theme) setTheme(data.theme);
          if (data.branding) setBranding(data.branding);
          if (data.seo) setSeo(data.seo);
          if (data.shopName) setLocalShopName(data.shopName);
          if (data.shopSlug) setLocalShopSlug(data.shopSlug);
          setInitialLoaded(true);
        }
      }
    }, (e) => handleFirestoreError(e, OperationType.GET, 'partnerShops/{id}'));
    return () => unsub();
  }, [currentUser, initialLoaded]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!currentUser || !initialLoaded) return;

    // Prevent auto-save if everything matches loaded data
    const isUnchanged = (
      localShopName === (shop?.shopName || '') &&
      localShopSlug === (shop?.shopSlug || '') &&
      JSON.stringify(theme) === JSON.stringify(shop?.theme || {}) &&
      JSON.stringify(branding) === JSON.stringify(shop?.branding || {}) &&
      JSON.stringify(seo) === JSON.stringify(shop?.seo || {})
    );
    if (isUnchanged) return;

    setSaveStatus('saving');

    const delayDebounce = setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'partnerShops', currentUser.uid), {
          theme,
          branding,
          seo,
          shopName: localShopName.trim(),
          shopSlug: localShopSlug.trim().toLowerCase().replace(/\s+/g, '-')
        });
        setSaveStatus('saved');
        // Clear status to prevent stale state indicators
        setTimeout(() => setSaveStatus(p => p === 'saved' ? 'idle' : p), 3000);
      } catch (err) {
        console.error('Background auto-save interrupted:', err);
        setSaveStatus('error');
      }
    }, 800); // Optimized for 800ms super responsive debounce

    return () => clearTimeout(delayDebounce);
  }, [theme, branding, seo, localShopName, localShopSlug, currentUser, initialLoaded]);

  // Manual save backup handler (fixing unhandled exceptions and infinite saving)
  const handleSave = async () => {
    if (!currentUser) return;
    if (!localShopName.trim()) {
      toast.error('Store name cannot be empty');
      return;
    }
    if (!localShopSlug.trim()) {
      toast.error('Store link slug cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'partnerShops', currentUser.uid), {
        theme,
        branding,
        seo,
        shopName: localShopName.trim(),
        shopSlug: localShopSlug.trim().toLowerCase().replace(/\s+/g, '-')
      });
      toast.success('Shop settings saved successfully! Your store link is active immediately.');
      setSaveStatus('saved');
    } catch (e) {
      console.error(e);
      toast.error('Could not save shop configuration.');
    } finally {
      setSaving(false);
    }
  };

  const copyShopLink = () => {
    const slugToUse = localShopSlug || shop?.shopSlug;
    if (!slugToUse) return;
    const url = `${window.location.origin}/shop/${slugToUse}`;
    navigator.clipboard.writeText(url);
    toast.success('Shop link copied to clipboard!');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.size > 1500000) {
      toast.error('Image is too large. Please select an image under 1.5MB.');
      return;
    }
    
    const toastId = toast.loading(`Uploading ${type}...`);
    const fieldName = type === 'banner' ? 'bannerImage' : 'logo';

    try {
      // Try publishing to Storage first
      const storageRef = ref(storage, `partners/${currentUser.uid}/${type}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setBranding(prev => ({ ...prev, [fieldName]: url }));
      toast.success('Uploaded successfully!', { id: toastId });
    } catch (error) {
      console.warn('Storage failed or blocked, loading image as optimized Local base64:', error);
      // Fallback to base64 synchronously
      try {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setBranding(prev => ({ ...prev, [fieldName]: base64 }));
          toast.success('Uploaded successfully to your profile!', { id: toastId });
        };
        reader.onerror = () => {
          toast.error('Failed to read image file', { id: toastId });
        };
        reader.readAsDataURL(file);
      } catch (fallbackError) {
        toast.error('Failed to upload image', { id: toastId });
      }
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-32">
      
      {/* Title & Live Status Indicators */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-white">My Shop</h1>
            
            {/* Real-time State Badges */}
            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-[#E8B84B]/10 text-[#E8B84B] border border-[#E8B84B]/20 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8B84B] animate-ping" />
                Auto-saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-green-500/10 text-green-400 border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                ✓ All Saved To Cloud
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Connection Lost (Reconnecting)
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">Personalize your storefront. Changes are synced instantly to your live store!</p>
        </div>
        
        {shop?.shopSlug && (
          <div className="flex items-center gap-2">
            <button onClick={copyShopLink} className="p-2.5 border border-[#2A2A2A] text-gray-400 rounded-lg hover:text-white hover:bg-[#2A2A2A]" title="Copy link">
              <Copy size={18} />
            </button>
            <a
              href={`/shop/${shop.shopSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#E8B84B] text-black rounded-lg text-sm font-black shadow hover:bg-[#E8B84B]/90 transition-colors"
            >
              <ExternalLink size={16} /> Live Shop Link
            </a>
          </div>
        )}
      </div>

      <div className="flex gap-6 border-b border-[#2A2A2A] overflow-x-auto scrollbar-hide">
        {['Appearance', 'Products', 'SEO', 'Share'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-sm font-bold transition-colors whitespace-nowrap ${
              activeTab === tab 
                ? 'text-[#E8B84B] border-b-2 border-[#E8B84B]' 
                : 'text-gray-500 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Products' && (
        <div className="-mx-4 md:mx-0">
          <ResellerProducts />
        </div>
      )}

      {activeTab === 'Appearance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            
            {/* Shop Identity Card */}
            <div className="bg-[#111111] p-6 rounded-xl border border-[#2A2A2A] space-y-4">
              <h2 className="font-bold text-[#E8B84B] uppercase tracking-widest text-xs">Shop Identity Settings</h2>
              
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Store / Shop Name</label>
                <input 
                  type="text" 
                  value={localShopName}
                  onChange={(e) => handleShopNameChange(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B] font-bold"
                  placeholder="Rahul's Premium Store"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Shop URL Link Slug</label>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] px-4 py-3 rounded-lg">
                    <span className="text-gray-600 text-xs font-mono">{window.location.host}/shop/</span>
                    <input 
                      type="text" 
                      value={localShopSlug}
                      onChange={(e) => setLocalShopSlug(slugify(e.target.value))}
                      className="flex-1 bg-transparent text-[#E8B84B] outline-none text-xs font-mono font-bold"
                      placeholder="slug-name"
                    />
                  </div>
                  <p className="text-[9px] text-gray-500 leading-snug">
                    Your store link updates instantly on saved changes.
                  </p>
                </div>
              </div>
            </div>

            {/* Branding Settings Option card */}
            <div className="bg-[#111111] p-6 rounded-xl border border-[#2A2A2A] space-y-4">
              <h2 className="font-bold text-white uppercase tracking-widest text-xs">Store Brand Asserts</h2>
              
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Banner Sales Title Text</label>
                <input 
                  type="text" 
                  value={branding.bannerText}
                  onChange={(e) => setBranding({...branding, bannerText: e.target.value})}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]"
                  placeholder="Big Billion Savings: Up to 50% Off!"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tagline / Slogan</label>
                <input 
                  type="text" 
                  value={branding.tagline}
                  onChange={(e) => {
                    if (e.target.value.length <= 60) setBranding({...branding, tagline: e.target.value});
                  }}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]"
                  placeholder="Premium quality goods delivered direct."
                />
                <div className="text-right text-[10px] text-gray-500">{branding.tagline.length}/60</div>
              </div>

              {/* Upload controls */}
              <div className="grid grid-cols-2 gap-4 border-t border-[#2A2A2A] pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Logo Assert</label>
                  <div className="relative h-24 border-2 border-dashed border-[#2A2A2A] rounded-lg flex items-center justify-center bg-[#1A1A1A] overflow-hidden group hover:border-[#E8B84B] transition-colors">
                    {branding.logo ? (
                      <div className="relative w-full h-full">
                        <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-[#E8B84B] font-bold">Replace logo</div>
                      </div>
                    ) : (
                      <div className="text-center p-2">
                        <span className="text-[10px] text-[#E8B84B] font-black uppercase block tracking-wider mb-0.5">Upload</span>
                        <span className="text-[9px] text-gray-500 block leading-tight">PNG/JPG under 1.5M</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Banner Backdrop</label>
                  <div className="relative h-24 border-2 border-dashed border-[#2A2A2A] rounded-lg flex items-center justify-center bg-[#1A1A1A] overflow-hidden group hover:border-[#E8B84B] transition-colors">
                    {branding.bannerImage ? (
                      <div className="relative w-full h-full">
                        <img src={branding.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-[#E8B84B] font-bold">Replace banner</div>
                      </div>
                    ) : (
                      <div className="text-center p-2">
                        <span className="text-[10px] text-[#E8B84B] font-black uppercase block tracking-wider mb-0.5">Upload</span>
                        <span className="text-[9px] text-gray-500 block leading-tight">Landscape banner</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#2A2A2A] pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">WhatsApp Contact Number</label>
                  <input 
                    type="text" 
                    value={branding.whatsappNumber}
                    onChange={(e) => setBranding({...branding, whatsappNumber: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-lg outline-none text-sm focus:border-[#E8B84B]"
                    placeholder="+91..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Instagram Handler</label>
                  <input 
                    type="text" 
                    value={branding.instagramHandle}
                    onChange={(e) => setBranding({...branding, instagramHandle: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-lg outline-none text-sm focus:border-[#E8B84B]"
                    placeholder="@username"
                  />
                </div>
              </div>
            </div>

            {/* Manual preservation options just in case */}
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 bg-[#E8B84B] text-black font-black uppercase tracking-widest rounded-xl hover:bg-[#E8B84B]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} /> {saving ? 'Force Saving...' : 'Force Save Storefront Settings'}
            </button>
          </div>

          {/* Flipkart-Style Real-time Live Preview Pane */}
          <div className="hidden lg:block bg-black border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl relative sticky top-6">
            
            {/* Window bar layout */}
            <div className="h-10 bg-[#111111] border-b border-[#2A2A2A] flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              <div className="flex-1 text-center bg-black/50 text-[10px] text-[#E8B84B] py-1 rounded mx-4 font-mono select-none truncate">
                Preview: {window.location.host}/shop/{localShopSlug || 'store-url'}
              </div>
              <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/20 py-0.5 px-2 rounded-full uppercase font-black tracking-widest">Live</span>
            </div>

            {/* Inner frame mock representing Flipkart theme */}
            <div className="h-[720px] overflow-y-auto bg-[#f1f3f6] text-gray-800 font-sans">
              
              {/* Flipkart Blue header */}
              <div className="bg-[#2874f0] text-white p-3.5 flex items-center justify-between shadow">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black italic tracking-tighter">
                    {shopName} <span className="text-[#ffe11b]">Plus✦</span>
                  </span>
                  {branding.logo && (
                    <img src={branding.logo} className="w-5 h-5 rounded-full border border-white/20 object-cover bg-white" alt="logo" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[8px] font-black text-white">✓</div>
                  <span className="text-[8px] bg-white text-[#2874f0] font-black uppercase tracking-wider px-1 py-0.5 rounded-sm">Choice</span>
                </div>
              </div>

              {/* White Search bar wrapper */}
              <div className="bg-[#2874f0] px-4 pb-3 shadow-md">
                <div className="bg-white rounded-sm h-8 text-[11px] flex items-center px-3 text-gray-400 font-medium select-none shadow-sm cursor-text gap-2">
                  <span>🔍</span> Search for products, brands and more...
                </div>
              </div>

              {/* Promotional Ribbon ticker */}
              <div className="bg-[#ffe11b] text-gray-800 py-1 px-4 text-center text-[9px] font-bold uppercase tracking-wider">
                ⚡ 100% Free Shipping on Cash on Delivery orders!
              </div>

              {/* Segment Circle Rows */}
              <div className="bg-white py-3 border-b border-gray-200 shadow-sm flex gap-3 overflow-x-auto px-4 justify-start no-scrollbar">
                {[
                  { emoji: '⭐', label: 'For You' },
                  { emoji: '📱', label: 'Mobiles' },
                  { emoji: '👕', label: 'Fashion' },
                  { emoji: '💻', label: 'Gadget' },
                  { emoji: '🔌', label: 'Electronics' }
                ].map((item, index) => (
                  <div key={index} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-md border border-gray-100 hover:border-[#2874f0] transition-colors">{item.emoji}</div>
                    <span className="text-[10px] font-bold text-gray-500">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Banner visual */}
              <div className="mx-3 mt-3.5 rounded bg-gradient-to-r from-blue-700 via-blue-600 to-[#1259c7] p-4 text-white relative overflow-hidden h-28 flex flex-col justify-center">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.05)_1px,_transparent_1px)] bg-[size:12px_12px] opacity-40 pointer-events-none" />
                {branding.bannerImage && (
                  <img src={branding.bannerImage} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" alt="banner" />
                )}
                <div className="relative z-10 space-y-1">
                  <span className="bg-[#ffe11b] text-gray-900 font-extrabold text-[8px] px-1 rounded uppercase tracking-wider leading-none">BS Days Deal</span>
                  <p className="text-xs font-black uppercase text-white truncate max-w-[200px]">{branding.bannerText || 'Big Billions Savings!'}</p>
                  <p className="text-[9px] text-gray-100">{branding.tagline || 'Premium Quality Assured Selection'}</p>
                </div>
              </div>

              {/* Flipkart style shelf rows previews */}
              <div className="m-3 bg-white border border-gray-200 rounded-sm p-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-3 select-none">
                  <span className="text-xs font-extrabold text-gray-800 uppercase flex items-center gap-1">📈 Still looking for these?</span>
                  <span className="text-[10px] text-[#2874f0] font-black uppercase">View all</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="border border-gray-100 p-2.5 rounded-sm flex flex-col bg-white text-center">
                      <div className="w-full aspect-square bg-gray-50 border border-gray-100 rounded-sm flex items-center justify-center p-1 relative text-xs text-gray-400 font-extrabold select-none">
                        <span>Image #{i}</span>
                        <span className="absolute bottom-1 right-1 bg-sky-100 text-sky-700 font-black text-[7px] px-1 rounded">Assured</span>
                      </div>
                      <p className="text-[10px] text-gray-700 font-bold truncate mt-2">Example Merchant Item #{i}</p>
                      <p className="text-[9px] text-green-600 font-black leading-none mt-0.5">Min 45% Off</p>
                      <p className="text-xs font-black text-gray-800 mt-1">₹899</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom footer credit bar */}
              <div className="bg-[#172337] p-6 text-center text-white space-y-2 select-none border-t border-gray-200 mt-12">
                <p className="text-[10px] font-black tracking-tight uppercase">{shopName} Plus store</p>
                <p className="text-[8px] text-gray-400 capitalize">Authorized e-commerce workplex verified vendor</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {activeTab === 'SEO' && (
        <div className="bg-[#111111] p-6 rounded-xl border border-[#2A2A2A] max-w-2xl space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Meta Title (max 60 chars)</label>
            <input 
              type="text" 
              value={seo.metaTitle}
              onChange={(e) => {
                if(e.target.value.length <= 60) setSeo({...seo, metaTitle: e.target.value});
              }}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]"
              placeholder={`${shopName} - Best Products Online`}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Meta Description (max 160 chars)</label>
            <textarea 
              value={seo.metaDescription}
              onChange={(e) => {
                if(e.target.value.length <= 160) setSeo({...seo, metaDescription: e.target.value});
              }}
              rows={3}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B] resize-none"
              placeholder={`Shop from ${shopName}. Great quality and fast delivery.`}
            />
          </div>

          <div className="space-y-2">
             <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Keywords (comma separated)</label>
             <input 
               type="text" 
               value={seo.keywords}
               onChange={(e) => setSeo({...seo, keywords: e.target.value})}
               className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]"
               placeholder="shopping, online store, best deals"
             />
          </div>

          <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
            <p className="text-sm font-normal text-[#1a0dab] truncate hover:underline cursor-pointer">{seo.metaTitle || `${shopName} - Best Products Online`}</p>
            <p className="text-[13px] text-[#006621] truncate">{window.location.host}/shop/{shop?.shopSlug}</p>
            <p className="text-sm text-[#545454] line-clamp-2 mt-1">{seo.metaDescription || `Shop from ${shopName}. Great quality and fast delivery. Browse our collection today and get amazing deals on all products.`}</p>
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="py-3 px-6 bg-[#E8B84B] text-black font-bold rounded-lg hover:bg-[#E8B84B]/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Force Save SEO Settings'}
          </button>
        </div>
      )}

      {activeTab === 'Share' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#111111] p-6 rounded-xl border border-[#2A2A2A] space-y-6">
            <h2 className="font-bold text-white uppercase tracking-widest text-xs">Shop Link & QR</h2>
            <div className="flex gap-2">
              <input 
                readOnly
                value={`${window.location.origin}/shop/${shop?.shopSlug}`}
                className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] text-gray-300 px-4 py-3 rounded-lg outline-none font-mono text-sm"
              />
              <button onClick={copyShopLink} className="px-4 py-3 bg-[#2A2A2A] text-white rounded-lg hover:bg-[#333] transition-colors font-bold flex items-center justify-center">
                <Copy size={18} />
              </button>
            </div>
            
            <div className="border border-[#E8B84B] p-6 bg-[#1A1A1A] rounded-xl flex flex-col items-center text-center gap-4">
               {/* Stand-in for real QR code */}
               <div className="w-48 h-48 bg-white border-4 border-[#E8B84B] flex items-center justify-center p-2 rounded-lg relative">
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/shop/' + shop?.shopSlug)}`} alt="QR Code" className="w-full h-full mix-blend-multiply" />
                 <div className="absolute bg-[#0A0A0A] border-2 border-[#E8B84B] rounded-full p-1 w-10 h-10 flex items-center justify-center text-[#E8B84B] font-black text-xs">
                   WP
                 </div>
               </div>
               <button className="flex items-center gap-2 px-6 py-2 border border-[#E8B84B] text-[#E8B84B] rounded-full text-sm font-bold hover:bg-[#E8B84B]/10 transition-colors">
                 <Download size={16} /> Download PNG
               </button>
            </div>
          </div>

          <div className="bg-[#111111] p-6 rounded-xl border border-[#2A2A2A] space-y-6">
            <h2 className="font-bold text-white uppercase tracking-widest text-xs">WhatsApp Templates</h2>
            {[
              {
                title: 'General Welcome',
                text: `🛍️ Shop at ${shopName}!\nBrowse amazing products at great prices.\nShop now: ${window.location.origin}/shop/${shop?.shopSlug}`
              },
              {
                title: 'Offer Alert',
                text: `🎉 Great deals at ${shopName}!\nCash on Delivery available on all products.\nShop now: ${window.location.origin}/shop/${shop?.shopSlug}`
              }
            ].map((tmpl, i) => (
              <div key={i} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">{tmpl.title}</p>
                <div className="text-sm text-gray-300 font-mono whitespace-pre-wrap mb-4 bg-black/40 p-3 rounded">
                  {tmpl.text}
                </div>
                <button 
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(tmpl.text)}`, '_blank')}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-[#10B981]/10 text-[#10B981] font-bold rounded hover:bg-[#10B981]/20 transition-colors"
                >
                  <Share2 size={16} /> Share on WhatsApp
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
