import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import toast from 'react-hot-toast';
import { ExternalLink, Copy, Share2, Download, Check, Save } from 'lucide-react';
import ResellerProducts from './ResellerProducts';

export default function ResellerShop() {
  const { currentUser } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Appearance');
  const [saving, setSaving] = useState(false);

  // Local state for edits
  const [theme, setTheme] = useState({
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    backgroundColor: '#ffffff',
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

  const shopName = shop?.shopName || 'My Shop';

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'partnerShops', currentUser.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setShop(data);
        if (data.theme) setTheme(data.theme);
        if (data.branding) setBranding(data.branding);
        if (data.seo) setSeo(data.seo);
      }
    }, (e) => handleFirestoreError(e, OperationType.GET, 'partnerShops/{id}'));
    return () => unsub();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'partnerShops', currentUser.uid), {
        theme,
        branding,
        seo
      });
      toast.success('Shop settings saved successfully!');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'partnerShops');
    }
    setSaving(false);
  };

  const copyShopLink = () => {
    if (!shop?.shopSlug) return;
    const url = `${window.location.origin}/shop/${shop.shopSlug}`;
    navigator.clipboard.writeText(url);
    toast.success('Shop link copied to clipboard!');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    
    const toastId = toast.loading(`Uploading ${type}...`);
    try {
      // In a real scenario, use smaller sizes, just a placeholder path
      const storageRef = ref(storage, `partners/${currentUser.uid}/${type}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setBranding(prev => ({ ...prev, [type]: url }));
      toast.success('Uploaded successfully', { id: toastId });
    } catch (error) {
      toast.error('Failed to upload image', { id: toastId });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">My Shop</h1>
          <p className="text-sm text-gray-400">Personalize your storefront and share it.</p>
        </div>
        {shop?.shopSlug && (
          <div className="flex items-center gap-2">
            <button onClick={copyShopLink} className="p-2 border border-[#2A2A2A] text-gray-400 rounded-lg hover:text-white hover:bg-[#2A2A2A]">
              <Copy size={18} />
            </button>
            <a
              href={`/shop/${shop.shopSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#E8B84B] text-black rounded-lg text-sm font-bold shadow hover:bg-[#E8B84B]/90 transition-colors"
            >
              <ExternalLink size={16} /> Live Preview
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
            <div className="bg-[#111111] p-6 rounded-xl border border-[#2A2A2A] space-y-4">
              <h2 className="font-bold text-white uppercase tracking-widest text-xs">Branding</h2>
              
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tagline</label>
                <input 
                  type="text" 
                  value={branding.tagline}
                  onChange={(e) => {
                    if (e.target.value.length <= 60) setBranding({...branding, tagline: e.target.value});
                  }}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-3 rounded-lg outline-none focus:border-[#E8B84B]"
                  placeholder="e.g. Premium quality at best prices"
                />
                <div className="text-right text-[10px] text-gray-500">{branding.tagline.length}/60</div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#2A2A2A] pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Logo</label>
                  <div className="relative h-24 border-2 border-dashed border-[#2A2A2A] rounded-lg flex items-center justify-center bg-[#1A1A1A] overflow-hidden group">
                    {branding.logo ? (
                      <img src={branding.logo} alt="Logo" className="h-full object-contain" />
                    ) : (
                      <span className="text-xs text-gray-500 font-bold group-hover:text-white transition-colors">Upload Logo</span>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Banner</label>
                  <div className="relative h-24 border-2 border-dashed border-[#2A2A2A] rounded-lg flex items-center justify-center bg-[#1A1A1A] overflow-hidden group">
                    {branding.bannerImage ? (
                      <img src={branding.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-500 font-bold group-hover:text-white transition-colors">Upload Banner</span>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#2A2A2A] pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">WhatsApp Number</label>
                  <input 
                    type="text" 
                    value={branding.whatsappNumber}
                    onChange={(e) => setBranding({...branding, whatsappNumber: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-lg outline-none text-sm focus:border-[#E8B84B]"
                    placeholder="+91..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Instagram Handle</label>
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

            <div className="bg-[#111111] p-6 rounded-xl border border-[#2A2A2A] space-y-4">
              <h2 className="font-bold text-white uppercase tracking-widest text-xs">Theme & Layout</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Primary Color</label>
                  <input 
                    type="color" 
                    value={theme.primaryColor}
                    onChange={(e) => setTheme({...theme, primaryColor: e.target.value})}
                    className="w-full h-10 border border-[#2A2A2A] rounded cursor-pointer bg-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Background</label>
                  <input 
                    type="color" 
                    value={theme.backgroundColor}
                    onChange={(e) => setTheme({...theme, backgroundColor: e.target.value})}
                    className="w-full h-10 border border-[#2A2A2A] rounded cursor-pointer bg-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Font Style</label>
                <div className="grid grid-cols-4 gap-2">
                  {['modern', 'classic', 'bold', 'minimal'].map(style => (
                    <button
                      key={style}
                      onClick={() => setTheme({...theme, fontStyle: style})}
                      className={`py-2 px-1 text-xs font-bold rounded border capitalize ${
                        theme.fontStyle === style ? 'bg-[#E8B84B]/20 border-[#E8B84B] text-[#E8B84B]' : 'bg-[#1A1A1A] border-[#2A2A2A] text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Button Style</label>
                  <select 
                    value={theme.buttonStyle}
                    onChange={(e) => setTheme({...theme, buttonStyle: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-lg text-sm outline-none"
                  >
                    <option value="rounded">Rounded Corners</option>
                    <option value="sharp">Sharp Edges</option>
                    <option value="pill">Pill Shaped</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Layout</label>
                  <select 
                    value={theme.layout}
                    onChange={(e) => setTheme({...theme, layout: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-lg text-sm outline-none"
                  >
                    <option value="grid">Grid</option>
                    <option value="list">List</option>
                    <option value="masonry">Masonry</option>
                  </select>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 bg-[#E8B84B] text-black font-black uppercase tracking-widest rounded-xl hover:bg-[#E8B84B]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} /> {saving ? 'Saving...' : 'Save Appearance'}
            </button>
          </div>

          {/* Live Preview Pane */}
          <div className="hidden lg:block bg-black border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl relative sticky top-6">
            <div className="h-10 bg-[#111111] border-b border-[#2A2A2A] flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              <div className="flex-1 text-center bg-black/50 text-[10px] text-gray-500 py-1 rounded mx-4 font-mono">
                {window.location.origin}/shop/{shop?.shopSlug}
              </div>
            </div>
            <div className="h-[700px] overflow-y-auto" style={{ backgroundColor: theme.backgroundColor }}>
              {/* Dummy Shop UI reflecting settings */}
              {branding.bannerImage && (
                <div className="w-full h-48 bg-cover bg-center" style={{ backgroundImage: `url(${branding.bannerImage})` }}>
                  <div className="w-full h-full bg-black/40 flex items-center justify-center">
                     {branding.logo && <img src={branding.logo} className="h-20 w-auto bg-white/10 p-2 rounded" alt="Logo" />}
                  </div>
                </div>
              )}
              {!branding.bannerImage && (
                <div className="w-full h-32 flex flex-col items-center justify-center" style={{ backgroundColor: theme.primaryColor }}>
                  {branding.logo ? <img src={branding.logo} className="h-16 w-auto" alt="Logo" /> : <h2 className="text-2xl font-black text-white">{shopName}</h2>}
                </div>
              )}
              <div className="p-6 pb-20">
                <p className="text-center font-medium opacity-80 mb-8" style={{ color: theme.secondaryColor }}>{branding.tagline || 'Your tagline here'}</p>
                <div className={`grid gap-4 ${theme.layout === 'list' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-white/5 border border-white/10 overflow-hidden" style={{ borderRadius: theme.buttonStyle === 'pill' ? '24px' : theme.buttonStyle === 'sharp' ? '0' : '8px' }}>
                      <div className="aspect-square bg-white/10"></div>
                      <div className="p-3">
                        <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-white/10 rounded w-1/2 mb-4"></div>
                        <div 
                          className="w-full py-1.5 text-[10px] font-bold text-center"
                          style={{ 
                            backgroundColor: theme.primaryColor, 
                            color: '#fff',
                            borderRadius: theme.buttonStyle === 'pill' ? '999px' : theme.buttonStyle === 'sharp' ? '0' : '4px' 
                          }}
                        >
                          BUY NOW
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
            {saving ? 'Saving...' : 'Save SEO Settings'}
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
