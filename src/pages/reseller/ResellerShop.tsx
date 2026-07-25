import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, firebaseConfig } from '../../lib/firebase';
import { compressImageToBlob } from '../../utils/imageCompressor';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import toast from 'react-hot-toast';
import { ExternalLink, Copy, Share2, Download, Check, Save, Sparkles, CheckCircle2, Zap, PhoneCall, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import ResellerProducts from './ResellerProducts';
import SubscriptionLimitsNotice from '../../components/reseller/SubscriptionLimitsNotice';
import RazorpayOnboardingModal from '../../components/reseller/RazorpayOnboardingModal';

const getOAuthAuthInstance = () => {
  const name = 'GoogleOAuthApp';
  const apps = getApps();
  const existingApp = apps.find(app => app.name === name);
  const app = existingApp || initializeApp(firebaseConfig, name);
  return getAuth(app);
};

// Helper function to convert base64 back to Blob cleanly on client-side
const base64ToBlob = (base64: string): Blob => {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
};

// Helper function to compress large image files into lightweight base64 values
const compressImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize proportional to boundaries
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string); // Fallback to raw base64
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress as jpeg with high-performance 0.75 quality format
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export default function ResellerShop() {
  const { currentUser } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Appearance');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Google Drive asset path states
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [driveLinkedEmail, setDriveLinkedEmail] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const connectGoogleDrive = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      
      const toastId = toast.loading('Connecting and authenticating with Google Drive...');
      const oauthAuth = getOAuthAuthInstance();
      const result = await signInWithPopup(oauthAuth, provider);
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Access token was not returned from Google Login');
      }
      
      const token = credential.accessToken;
      setDriveToken(token);
      
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let driveEmail = result.user.email;
      if (profileRes.ok) {
        const profile = await profileRes.json();
        driveEmail = profile.email || result.user.email;
      }
      
      setDriveLinkedEmail(driveEmail);
      
      await setDoc(doc(db, 'partnerShops', currentUser!.uid), {
        isGoogleDriveLinked: true,
        googleDriveEmail: driveEmail
      }, { merge: true });
      
      toast.success(`Successfully connected: ${driveEmail}`, { id: toastId });
    } catch (e: any) {
      console.error(e);
      if (e?.code === 'auth/cancelled-popup-request' || e?.code === 'auth/popup-closed-by-user') {
        toast.dismiss();
        toast.error('Google Drive link was closed or cancelled by user.');
      } else {
        toast.error(`OAuth link failed: ${e.message || String(e)}`);
      }
    }
  };

  const disconnectGoogleDrive = async () => {
    try {
      setDriveToken(null);
      setDriveLinkedEmail(null);
      await setDoc(doc(db, 'partnerShops', currentUser!.uid), {
        isGoogleDriveLinked: false,
        googleDriveEmail: null
      }, { merge: true });
      toast.success('Disconnected Google Drive storage successfully.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to unlink Google Drive');
    }
  };

  const migrateAssetsToGoogleDrive = async () => {
    if (!driveToken) {
      toast.error('Please connect Google Drive first to copy files.');
      return;
    }
    
    setIsMigrating(true);
    const toastId = toast.loading('Migrating local assets to your Google Drive database...');
    
    try {
      let updatedBranding = { ...branding };
      let migratedCount = 0;
      
      // Check logo
      if (branding.logo && branding.logo.startsWith('data:image/')) {
        const logoBlob = base64ToBlob(branding.logo);
        const metadata = {
          name: `workplex_logo_${Date.now()}.jpg`,
          mimeType: logoBlob.type || 'image/jpeg'
        };
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', logoBlob);
        
        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
          method: 'POST',
          headers: { Authorization: `Bearer ${driveToken}` },
          body: formData
        });
        
        if (res.ok) {
          const fileData = await res.json();
          await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${driveToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: 'reader', type: 'anyone' })
          });
          updatedBranding.logo = `https://drive.google.com/thumbnail?sz=w400&id=${fileData.id}`;
          migratedCount++;
        }
      }
      
      // Check banner image
      if (branding.bannerImage && branding.bannerImage.startsWith('data:image/')) {
        const bannerBlob = base64ToBlob(branding.bannerImage);
        const metadata = {
          name: `workplex_banner_${Date.now()}.jpg`,
          mimeType: bannerBlob.type || 'image/jpeg'
        };
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', bannerBlob);
        
        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
          method: 'POST',
          headers: { Authorization: `Bearer ${driveToken}` },
          body: formData
        });
        
        if (res.ok) {
          const fileData = await res.json();
          await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${driveToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: 'reader', type: 'anyone' })
          });
          updatedBranding.bannerImage = `https://drive.google.com/thumbnail?sz=w1200&id=${fileData.id}`;
          migratedCount++;
        }
      }
      
      if (migratedCount > 0) {
        setBranding(updatedBranding);
        await setDoc(doc(db, 'partnerShops', currentUser!.uid), {
          branding: updatedBranding,
          logo: updatedBranding.logo || ''
        }, { merge: true });
        toast.success(`Success! Migrated ${migratedCount} local asset(s) and saved 100% of Firestore storage limits!`, { id: toastId });
      } else {
        toast.error('You do not have any local Base64 assets that require migration.', { id: toastId });
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Migration error: ${e.message || String(e)}`, { id: toastId });
    } finally {
      setIsMigrating(false);
    }
  };

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

  const [razorpayConnected, setRazorpayConnected] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayAccountId, setRazorpayAccountId] = useState('');
  const [razorpayStatus, setRazorpayStatus] = useState<string>('none');
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);

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
        if (data.googleDriveEmail) {
          setDriveLinkedEmail(data.googleDriveEmail);
        }
        if (data.razorpayConnected !== undefined) setRazorpayConnected(Boolean(data.razorpayConnected || data.paymentGateway?.razorpayConnected));
        if (data.razorpayStatus) setRazorpayStatus(data.razorpayStatus);
        else if (data.razorpayConnected) setRazorpayStatus('active');
        if (data.razorpayKeyId || data.paymentGateway?.razorpayKeyId) setRazorpayKeyId(data.razorpayKeyId || data.paymentGateway?.razorpayKeyId || '');
        if (data.razorpayAccountId || data.paymentGateway?.razorpayAccountId) setRazorpayAccountId(data.razorpayAccountId || data.paymentGateway?.razorpayAccountId || '');

        if (!initialLoaded) {
          if (data.theme) setTheme(data.theme);
          if (data.branding) setBranding(data.branding);
          if (data.seo) setSeo(data.seo);
          if (data.shopName) setLocalShopName(data.shopName);
          if (data.shopSlug) setLocalShopSlug(data.shopSlug);
          setInitialLoaded(true);
        }
      } else {
        setShop({});
        setInitialLoaded(true);
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
      razorpayConnected === Boolean(shop?.razorpayConnected) &&
      razorpayKeyId === (shop?.razorpayKeyId || '') &&
      razorpayAccountId === (shop?.razorpayAccountId || '') &&
      JSON.stringify(theme) === JSON.stringify(shop?.theme || {}) &&
      JSON.stringify(branding) === JSON.stringify(shop?.branding || {}) &&
      JSON.stringify(seo) === JSON.stringify(shop?.seo || {})
    );
    if (isUnchanged) return;

    setSaveStatus('saving');

    const delayDebounce = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'partnerShops', currentUser.uid), {
          theme,
          branding,
          seo,
          shopName: localShopName.trim(),
          shopSlug: localShopSlug.trim().toLowerCase().replace(/\s+/g, '-'),
          logo: branding.logo || '', // Keep root-level logo perfectly synced
          razorpayConnected,
          razorpayKeyId,
          razorpayAccountId,
          paymentGateway: {
            razorpayConnected,
            razorpayKeyId,
            razorpayAccountId
          }
        }, { merge: true });
        setSaveStatus('saved');
        // Clear status to prevent stale state indicators
        setTimeout(() => setSaveStatus(p => p === 'saved' ? 'idle' : p), 3000);
      } catch (err) {
        console.error('Background auto-save interrupted:', err);
        setSaveStatus('error');
      }
    }, 800); // Optimized for 800ms super responsive debounce

    return () => clearTimeout(delayDebounce);
  }, [theme, branding, seo, localShopName, localShopSlug, razorpayConnected, razorpayKeyId, razorpayAccountId, currentUser, initialLoaded]);

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
      await setDoc(doc(db, 'partnerShops', currentUser.uid), {
        theme,
        branding,
        seo,
        shopName: localShopName.trim(),
        shopSlug: localShopSlug.trim().toLowerCase().replace(/\s+/g, '-'),
        logo: branding.logo || '', // Keep root-level logo synced
        razorpayConnected,
        razorpayKeyId,
        razorpayAccountId,
        paymentGateway: {
          razorpayConnected,
          razorpayKeyId,
          razorpayAccountId
        }
      }, { merge: true });
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

    if (file.size > 5000000) { // Support larger source files up to 5MB since we compress client-side
      toast.error('Image is too large. Please select an image under 5MB.');
      return;
    }
    
    const toastId = toast.loading(`Uploading, compressing and syncing ${type}...`);
    const fieldName = type === 'banner' ? 'bannerImage' : 'logo';

    // If Google Drive token exists, upload straight to Google Drive!
    if (driveToken) {
      try {
        const maxWidth = type === 'logo' ? 400 : 1200;
        const maxHeight = type === 'logo' ? 400 : 600;
        const base64Data = await compressImage(file, maxWidth, maxHeight);
        
        // Convert to Blob
        const base64Blob = base64ToBlob(base64Data);
        
        const metadata = {
          name: `workplex_${type}_${Date.now()}.jpg`,
          mimeType: 'image/jpeg'
        };
        
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', base64Blob);
        
        const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
          method: 'POST',
          headers: { Authorization: `Bearer ${driveToken}` },
          body: formData
        });
        
        if (!uploadRes.ok) {
          throw new Error('Google Drive upload response status was non-200');
        }
        
        const fileData = await uploadRes.json();
        const fileId = fileData.id;
        
        // Make public so visitors can see logo/banner on PublicShopPage
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${driveToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: 'reader', type: 'anyone' })
        });
        
        const finalUrl = `https://drive.google.com/thumbnail?sz=w${type === 'logo' ? '400' : '1200'}&id=${fileId}`;
        
        setBranding(prev => ({ ...prev, [fieldName]: finalUrl }));
        toast.success(`Uploaded & scaled to Google Drive successfully!`, { id: toastId });
        return;
      } catch (driveErr) {
        console.warn('Google Drive secure upload failed, falling back to standard pathways...', driveErr);
      }
    }

    try {
      const maxWidth = type === 'logo' ? 400 : 1200;
      const maxHeight = type === 'logo' ? 400 : 600;
      
      // Instantly compress image in browser before starting upload
      const compressedBlob = await compressImageToBlob(file, maxWidth, maxHeight, 0.75);

      // Try publishing to Storage first
      const storageRef = ref(storage, `partners/${currentUser.uid}/${type}_${Date.now()}.jpg`);
      await uploadBytes(storageRef, compressedBlob);
      const url = await getDownloadURL(storageRef);
      setBranding(prev => ({ ...prev, [fieldName]: url }));
      toast.success('Uploaded successfully!', { id: toastId });
    } catch (error) {
      console.warn('Storage failed or blocked, loading image as optimized Local base64:', error);
      // Fallback to compressed base64 synchronously
      try {
        const maxWidth = type === 'logo' ? 250 : 800;
        const maxHeight = type === 'logo' ? 250 : 400;
        const base64 = await compressImage(file, maxWidth, maxHeight);
        
        setBranding(prev => ({ ...prev, [fieldName]: base64 }));
        toast.success('Optimized locally successfully!', { id: toastId });
      } catch (fallbackError) {
        console.error('Image optimization failed:', fallbackError);
        toast.error('Failed to read and optimize image file', { id: toastId });
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

      {/* Subscription Tier Limits Warning & Upgrade prompts */}
      <SubscriptionLimitsNotice context="shop" />

      <div className="flex gap-6 border-b border-[#2A2A2A] overflow-x-auto scrollbar-hide">
        {['Appearance', 'Products', 'SEO', 'Payments', 'Share'].map(tab => (
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

      {activeTab === 'Payments' && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-[#111111] p-6 rounded-xl border border-[#2A2A2A] space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
              <div>
                <h2 className="font-extrabold text-white uppercase tracking-widest text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E8B84B]" /> Razorpay Online Payment Gateway
                </h2>
                <p className="text-xs text-gray-400 mt-1">Connect your Razorpay account via WorkPlex to enable instant online checkout.</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                razorpayConnected 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                  : razorpayStatus === 'pending_verification'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : razorpayStatus === 'assistance_requested'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
              }`}>
                {razorpayConnected ? 'Connected & Verified' : razorpayStatus === 'pending_verification' ? 'Verification Under Process' : razorpayStatus === 'assistance_requested' ? '24h Call Requested' : 'Only COD Active'}
              </span>
            </div>

            {/* Banner status */}
            {razorpayConnected ? (
              <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-green-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> Razorpay Account Linked & Verified
                  </p>
                  <span className="text-[10px] font-mono bg-black/40 text-gray-300 px-2.5 py-1 rounded-md border border-white/10">
                    ID: {razorpayAccountId || 'acc_rzp_workplex_' + currentUser?.uid?.slice(0, 8)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  Your store is fully setup to receive online payments (Google Pay, PhonePe, Cards, NetBanking). Product cost will automatically route to HVRS while profit margin flows directly into your account!
                </p>
                
                <div className="pt-2 flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsRazorpayModalOpen(true)}
                    className="text-[11px] font-bold text-[#E8B84B] hover:underline"
                  >
                    Update Razorpay Credentials
                  </button>
                  <span className="text-gray-600">•</span>
                  <button 
                    type="button"
                    onClick={() => {
                      setRazorpayConnected(false);
                      setRazorpayStatus('none');
                      toast.success('Razorpay account disconnected. Your store is now on Cash On Delivery (COD) mode.');
                    }}
                    className="text-[11px] font-bold text-red-400 hover:text-red-300 underline"
                  >
                    Disconnect Razorpay
                  </button>
                </div>
              </div>
            ) : razorpayStatus === 'pending_verification' ? (
              <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-blue-400 font-bold flex items-center gap-1.5">
                    <Clock size={16} className="animate-spin" /> Verification Under Process
                  </p>
                  <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-md">
                    Queue Status: In Review
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  Your Razorpay details have been submitted to the WorkPlex technical onboarding team! Verification is in progress and team will activate your account soon. In the meantime, your store remains 100% active on <strong>Cash On Delivery (COD)</strong> mode.
                </p>
                
                <div className="pt-2 flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsRazorpayModalOpen(true)}
                    className="text-[11px] font-bold text-[#E8B84B] hover:underline flex items-center gap-1"
                  >
                    Update Submitted Details
                  </button>
                </div>
              </div>
            ) : razorpayStatus === 'assistance_requested' ? (
              <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                    <PhoneCall size={16} className="animate-pulse" /> 24-Hour Setup Call Requested
                  </p>
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-md">
                    Callback Scheduled
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  You requested 1-on-1 onboarding assistance! Our WorkPlex technical onboarding specialist will contact you on your registered phone within 24 hours to guide you step-by-step.
                </p>
                
                <div className="pt-2 flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsRazorpayModalOpen(true)}
                    className="text-[11px] font-bold text-[#E8B84B] hover:underline"
                  >
                    Submit Razorpay Details Directly
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-6 rounded-2xl text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[#E8B84B] flex items-center justify-center mx-auto">
                  <Zap size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Connect Razorpay Payment Gateway</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                    Connect your Razorpay account directly through WorkPlex or request 1-on-1 assistance within 24 hours from our technical team.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsRazorpayModalOpen(true)}
                    className="w-full sm:w-auto px-6 py-3.5 bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap size={16} /> Connect Razorpay Account Now
                  </button>
                </div>
              </div>
            )}

            {/* Toggle Online Payments */}
            {razorpayConnected && (
              <div className="flex items-center justify-between p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">Online Payment Option on Checkout</span>
                  <span className="text-[11px] text-gray-400">Turn OFF if you temporarily want buyers to pay via COD only.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={razorpayConnected}
                    onChange={(e) => setRazorpayConnected(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E8B84B]"></div>
                </label>
              </div>
            )}

            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 bg-[#E8B84B] text-black font-black uppercase text-xs tracking-wider rounded-xl hover:bg-[#E8B84B]/90 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Save size={16} /> {saving ? 'Saving Changes...' : 'Save Razorpay Payment Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Razorpay Onboarding Modal */}
      <RazorpayOnboardingModal
        isOpen={isRazorpayModalOpen}
        onClose={() => setIsRazorpayModalOpen(false)}
        partnerShopName={shopName}
        partnerShopSlug={localShopSlug}
        onSuccess={() => {
          setIsRazorpayModalOpen(false);
        }}
      />

      {activeTab === 'Appearance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            
            {/* Google Drive Offloader Config Card */}
            <div className="bg-[#111111] p-6 rounded-xl border border-[#E8B84B]/20 relative overflow-hidden space-y-4 shadow-xl">
              <div className="absolute top-0 right-0 p-3 select-none">
                <Sparkles size={16} className="text-[#E8B84B] animate-pulse" />
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-[#E8B84B] rounded-full"></div>
                <h2 className="font-bold text-white uppercase tracking-widest text-xs">Google Drive Asset Offloader</h2>
              </div>
              
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Connect your Google Drive account! WorkPlex will automatically compress, scale, and save all new brand logos and banner backdrops into your personal Google Drive, offloading 100% of Firebase limits.
              </p>

              <div className="bg-[#1A1A1A] p-4 rounded-lg border border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Storage Link Status</div>
                  {driveLinkedEmail ? (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs text-white font-bold">{driveLinkedEmail}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-600" />
                      <span className="text-xs text-gray-500">Not Synced (Active Firebase Standard Mode)</span>
                    </div>
                  )}
                </div>

                {driveLinkedEmail ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    {!driveToken ? (
                      <button 
                        onClick={connectGoogleDrive}
                        className="px-4 py-2 bg-[#E8B84B] text-black font-black text-xs uppercase rounded-lg hover:bg-[#E8B84B]/90 transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={13} /> Activate Drive Session
                      </button>
                    ) : (
                      <span className="px-3 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-[10px] font-black uppercase text-center flex items-center justify-center gap-1">
                        🟢 Synced & Connected
                      </span>
                    )}
                    <button 
                      onClick={disconnectGoogleDrive}
                      className="px-3 py-2 border border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-300 rounded-lg text-xs font-bold transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={connectGoogleDrive}
                    className="px-5 py-2.5 bg-[#E8B84B] text-black font-black text-xs uppercase tracking-wider rounded-lg hover:bg-[#E8B84B]/90 transition-colors flex items-center justify-center gap-2"
                  >
                    Sync Google Drive
                  </button>
                )}
              </div>

              {/* Show migration button if local base64 images are detected */}
              {((branding.logo && branding.logo.startsWith('data:image/')) || (branding.bannerImage && branding.bannerImage.startsWith('data:image/'))) && (
                <div className="bg-[#E8B84B]/5 border border-[#E8B84B]/20 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-[#E8B84B] font-bold">Local base64 assets found!</p>
                    <p className="text-[10px] text-gray-400 leading-tight">We detected unoptimized base64 images inside your settings. Copy them to Google Drive to offload limits immediately.</p>
                  </div>
                  <button
                    disabled={isMigrating || !driveToken}
                    onClick={migrateAssetsToGoogleDrive}
                    className="shrink-0 px-4 py-2 bg-[#E8B84B]/10 hover:bg-[#E8B84B]/20 text-[#E8B84B] border border-[#E8B84B]/30 disabled:opacity-30 rounded-lg text-[11px] font-black uppercase tracking-wider transition-colors"
                  >
                    {isMigrating ? 'Migrating...' : 'Migrate to Drive'}
                  </button>
                </div>
              )}
            </div>

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
