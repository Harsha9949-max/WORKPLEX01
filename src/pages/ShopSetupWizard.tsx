import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  CheckCircle2, 
  Tag, 
  Package, 
  ArrowRight,
  Sparkles,
  Search,
  Plus
} from 'lucide-react';
import { db, storage } from '../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CATEGORIES = ['Fashion', 'Electronics', 'Home & Kitchen', 'Beauty', 'Gadgets', 'Kits'];

export default function ShopSetupWizard() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [shopName, setShopName] = useState('');
  const [shopSlug, setShopSlug] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  // Personalization State (Step 4 now)
  const [themeParams, setThemeParams] = useState({
    primaryColor: '#14b8a6', // teal-500
    secondaryColor: '#111111',
    backgroundColor: '#0A0A0A',
    fontStyle: 'modern',
    buttonStyle: 'rounded',
    layout: 'grid'
  });
  
  const [brandingParams, setBrandingParams] = useState({
    tagline: '',
    whatsappNumber: '',
    instagramHandle: '',
    bannerImage: '',
    bannerText: ''
  });

  const [seoParams, setSeoParams] = useState({
    metaTitle: '',
    metaDescription: '',
    keywords: ''
  });

  useEffect(() => {
    const fetchCatalog = async () => {
      const venture = userData?.venture || 'BuyRix';
      const q = query(
         collection(db, 'catalogProducts'), 
         where('isActive', '==', true),
         where('venture', '==', venture)
      );
      const snap = await getDocs(q);
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCatalog(items);
      
      // Fallback for demo
      if (items.length === 0) {
        setCatalog([
          { id: 'c1', name: 'WorkPlex Pro Setup', hvrsBasePrice: 3500, suggestedRetailPrice: 4999, category: 'Electronics', images: ['https://picsum.photos/seed/tech/400/400'], venture }
        ]);
      }
    };
    if (userData?.venture) {
       fetchCatalog();
    }
  }, [userData]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => {
    if (step === 1) {
      if (window.confirm('Do you want to exit shop setup?')) {
        navigate('/home');
      }
    } else {
      setStep(s => s - 1);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const addProductToShop = (product: any) => {
    if (selectedProducts.find(p => p.id === product.id)) return;
    setSelectedProducts([...selectedProducts, { ...product, partnerSellingPrice: product.suggestedRetailPrice }]);
  };

  const updateProductPrice = (productId: string, price: number) => {
    setSelectedProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, partnerSellingPrice: price } : p
    ));
  };

  const handleFinish = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      let logoUrl = '';
      if (logo) {
        const logoRef = ref(storage, `shops/${currentUser.uid}/logo`);
        await uploadBytes(logoRef, logo);
        logoUrl = await getDownloadURL(logoRef);
      }

      // 1. Create Partner Shop
      await setDoc(doc(db, 'partnerShops', currentUser.uid), {
        shopName,
        shopSlug: shopSlug.toLowerCase().replace(/\s+/g, '-'),
        logo: logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${shopName}`,
        ownerUID: currentUser.uid,
        venture: userData?.venture || 'BuyRix',
        isActive: true,
        totalSales: 0,
        categories: selectedCategories,
        theme: themeParams,
        branding: brandingParams,
        seo: seoParams,
        createdAt: serverTimestamp()
      });

      // 2. Add Products
      for (const p of selectedProducts) {
        await setDoc(doc(db, 'partnerProducts', currentUser.uid, 'products', p.id), {
          productId: p.id,
          name: p.name,
          images: p.images || [],
          category: p.category || 'General',
          description: p.description || '',
          hvrsBasePrice: p.hvrsBasePrice,
          partnerSellingPrice: p.partnerSellingPrice,
          partnerMargin: p.partnerSellingPrice - p.hvrsBasePrice,
          isActive: true,
          addedAt: serverTimestamp()
        });
      }

      // 3. Update User Role to Partner
      await setDoc(doc(db, 'users', currentUser.uid), {
        role: 'Partner',
        hasShop: true
      }, { merge: true });

      toast.success('Shop Published Successfully! 🎉');
      navigate('/home');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'partnerShops');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-b from-teal-500/10 to-transparent pointer-events-none" />
      
      <div className="max-w-xl mx-auto px-6 py-20 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleBack} 
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group"
          >
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-all">
              <ChevronLeft size={18} />
            </div>
            <span className="text-sm font-medium uppercase tracking-widest">
              {step === 1 ? 'Exit' : 'Back'}
            </span>
          </button>
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
            Step {step} of 5
          </span>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div 
              key={i} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-teal-500' : 'bg-white/10'}`} 
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="w-16 h-16 bg-teal-500/10 rounded-3xl flex items-center justify-center border border-teal-500/20">
                  <ShoppingBag className="text-teal-500" size={32} />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">Your Shop Identity</h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Let's name your white-label store.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Shop Name</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Rahul's Fashion Hub"
                    className="w-full bg-[#111111] border border-white/10 rounded-2xl p-5 outline-none focus:border-teal-500 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Shop URL Slug</label>
                  <div className="flex items-center gap-2 bg-[#111111] border border-white/10 rounded-2xl p-5">
                    <span className="text-gray-600 text-sm font-bold">workplex.hvrs.in/shop/</span>
                    <input
                      type="text"
                      value={shopSlug}
                      onChange={(e) => setShopSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="rahul-hub"
                      className="flex-1 bg-transparent border-none outline-none text-teal-500 font-bold"
                    />
                  </div>
                </div>
              </div>

              <button
                disabled={!shopName || !shopSlug}
                onClick={handleNext}
                className="w-full bg-teal-500 text-black py-5 rounded-[32px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-teal-500/20"
              >
                Continue Setup <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-3xl font-black uppercase tracking-tighter">Brand Visuals</h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Upload your shop logo (Optional).</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-40 h-40 bg-[#111111] border-2 border-dashed border-white/10 rounded-[48px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-teal-500/50 transition-all group overflow-hidden relative">
                  {logo ? (
                    <img src={URL.createObjectURL(logo)} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="text-teal-500 group-hover:scale-110 transition-transform" size={40} />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Image</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    onChange={(e) => setLogo(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={handleBack} className="flex-1 py-5 rounded-[32px] border border-white/10 font-black uppercase text-xs tracking-widest">Back</button>
                <button onClick={handleNext} className="flex-1 bg-teal-500 text-black py-5 rounded-[32px] font-black uppercase text-xs tracking-widest">Next Step</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-3xl font-black uppercase tracking-tighter">Niche Selection</h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">What kind of products will you sell?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`p-6 rounded-3xl border text-sm font-black uppercase tracking-widest transition-all ${
                      selectedCategories.includes(cat)
                      ? 'bg-teal-500/10 border-teal-500 text-teal-500 shadow-lg shadow-teal-500/10'
                      : 'bg-[#111111] border-white/5 text-gray-500 hover:border-white/20'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex gap-4 pt-8">
                <button onClick={handleBack} className="flex-1 py-5 rounded-[32px] border border-white/10 font-black uppercase text-xs tracking-widest">Back</button>
                <button 
                  disabled={selectedCategories.length === 0}
                  onClick={handleNext} 
                  className="flex-1 bg-teal-500 text-black py-5 rounded-[32px] font-black uppercase text-xs tracking-widest disabled:opacity-50"
                >
                  Confirm Niches
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-3xl font-black uppercase tracking-tighter">Personalise Shop</h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Setup branding, colors, and styling.</p>
              </div>

              <div className="space-y-8 max-h-[50vh] overflow-y-auto no-scrollbar pr-2 pb-10">
                {/* Branding */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase">Branding & Links</h3>
                  <div className="space-y-4">
                    <input type="text" placeholder="Shop Tagline (e.g. Best deals on electronics)" value={brandingParams.tagline} onChange={e => setBrandingParams({...brandingParams, tagline: e.target.value})} className="w-full bg-[#111111] border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-teal-500" />
                    <input type="text" placeholder="WhatsApp Number" value={brandingParams.whatsappNumber} onChange={e => setBrandingParams({...brandingParams, whatsappNumber: e.target.value})} className="w-full bg-[#111111] border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-teal-500" />
                    <input type="text" placeholder="Instagram Handle (@username)" value={brandingParams.instagramHandle} onChange={e => setBrandingParams({...brandingParams, instagramHandle: e.target.value})} className="w-full bg-[#111111] border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-teal-500" />
                    <input type="text" placeholder="Promotion Banner Text" value={brandingParams.bannerText} onChange={e => setBrandingParams({...brandingParams, bannerText: e.target.value})} className="w-full bg-[#111111] border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-teal-500" />
                    <input type="text" placeholder="Banner Image URL" value={brandingParams.bannerImage} onChange={e => setBrandingParams({...brandingParams, bannerImage: e.target.value})} className="w-full bg-[#111111] border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-teal-500" />
                  </div>
                </div>

                {/* Theme */}
                <div className="space-y-4">
                   <h3 className="text-sm font-black uppercase">Theme & Colors</h3>
                   <div className="grid grid-cols-3 gap-4">
                     <div>
                       <label className="text-[10px] text-gray-500 font-bold block mb-2">Primary Color</label>
                       <input type="color" value={themeParams.primaryColor} onChange={e => setThemeParams({...themeParams, primaryColor: e.target.value})} className="w-full h-12 rounded-xl cursor-pointer" />
                     </div>
                     <div>
                       <label className="text-[10px] text-gray-500 font-bold block mb-2">Secondary Color</label>
                       <input type="color" value={themeParams.secondaryColor} onChange={e => setThemeParams({...themeParams, secondaryColor: e.target.value})} className="w-full h-12 rounded-xl cursor-pointer" />
                     </div>
                     <div>
                       <label className="text-[10px] text-gray-500 font-bold block mb-2">Background</label>
                       <input type="color" value={themeParams.backgroundColor} onChange={e => setThemeParams({...themeParams, backgroundColor: e.target.value})} className="w-full h-12 rounded-xl cursor-pointer" />
                     </div>
                   </div>
                </div>

                {/* Typography & Layout */}
                <div className="space-y-4">
                   <h3 className="text-sm font-black uppercase">Styling & Layout</h3>
                   
                   <div>
                     <label className="text-[10px] text-gray-500 font-bold block mb-2">Font Style</label>
                     <select value={themeParams.fontStyle} onChange={e => setThemeParams({...themeParams, fontStyle: e.target.value})} className="w-full bg-[#111111] border border-white/10 rounded-xl p-4 text-sm outline-none">
                       <option value="modern">Modern (Inter)</option>
                       <option value="classic">Classic (Serif)</option>
                       <option value="bold">Bold (Impact)</option>
                       <option value="minimal">Minimal (Mono)</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] text-gray-500 font-bold block mb-2">Button Style</label>
                     <select value={themeParams.buttonStyle} onChange={e => setThemeParams({...themeParams, buttonStyle: e.target.value})} className="w-full bg-[#111111] border border-white/10 rounded-xl p-4 text-sm outline-none">
                       <option value="rounded">Rounded</option>
                       <option value="sharp">Sharp (Square)</option>
                       <option value="pill">Pill (Fully rounded)</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] text-gray-500 font-bold block mb-2">Product Grid Layout</label>
                     <select value={themeParams.layout} onChange={e => setThemeParams({...themeParams, layout: e.target.value})} className="w-full bg-[#111111] border border-white/10 rounded-xl p-4 text-sm outline-none">
                       <option value="grid">Standard Grid</option>
                       <option value="list">List View</option>
                       <option value="masonry">Masonry</option>
                     </select>
                   </div>
                </div>

                {/* SEO */}
                <div className="space-y-4">
                   <h3 className="text-sm font-black uppercase">SEO Metadata</h3>
                   <div className="space-y-4">
                     <input type="text" placeholder="Meta Title" value={seoParams.metaTitle} onChange={e => setSeoParams({...seoParams, metaTitle: e.target.value})} className="w-full bg-[#111111] border border-white/10 rounded-xl p-4 text-sm outline-none" />
                     <textarea rows={3} placeholder="Meta Description" value={seoParams.metaDescription} onChange={e => setSeoParams({...seoParams, metaDescription: e.target.value})} className="w-full bg-[#111111] border border-white/10 rounded-xl p-4 text-sm outline-none resize-none" />
                     <input type="text" placeholder="Keywords (comma separated)" value={seoParams.keywords} onChange={e => setSeoParams({...seoParams, keywords: e.target.value})} className="w-full bg-[#111111] border border-white/10 rounded-xl p-4 text-sm outline-none" />
                   </div>
                </div>

              </div>

              <div className="flex gap-4">
                <button onClick={handleBack} className="flex-1 py-5 rounded-[32px] border border-white/10 font-black uppercase text-xs tracking-widest">Back</button>
                <button 
                  onClick={handleNext} 
                  className="flex-1 bg-teal-500 text-black py-5 rounded-[32px] font-black uppercase text-xs tracking-widest"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-3xl font-black uppercase tracking-tighter">Stock Your Store</h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Choose products and set your profit margins.</p>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                {catalog.map(product => {
                  const isSelected = selectedProducts.find(p => p.id === product.id);
                  return (
                    <div key={product.id} className="bg-[#111111] border border-white/5 rounded-3xl p-4 flex gap-4 items-center">
                      <img src={product.images[0]} className="w-16 h-16 rounded-2xl object-cover" />
                      <div className="flex-1 space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-tight">{product.name}</h4>
                        <p className="text-[10px] text-gray-500 font-bold">Base: Rs.{product.hvrsBasePrice}</p>
                      </div>
                      {!isSelected ? (
                        <button 
                          onClick={() => addProductToShop(product)}
                          className="bg-white/5 p-3 rounded-xl hover:bg-white/10 text-teal-500"
                        >
                          <Plus size={20} />
                        </button>
                      ) : (
                        <div className="w-24">
                          <input
                            type="number"
                            value={isSelected.partnerSellingPrice}
                            onChange={(e) => updateProductPrice(product.id, parseFloat(e.target.value) || 0)}
                            className="w-full bg-black/40 border border-teal-500/30 rounded-lg p-2 text-xs font-black text-teal-400 outline-none"
                          />
                          <p className="text-[8px] text-center mt-1 text-green-500 font-black">Profit: Rs.{(isSelected.partnerSellingPrice || 0) - product.hvrsBasePrice}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4">
                <button onClick={handleBack} className="flex-1 py-5 rounded-[32px] border border-white/10 font-black uppercase text-xs tracking-widest">Back</button>
                <button 
                  disabled={selectedProducts.length === 0}
                  onClick={handleNext} 
                  className="flex-1 bg-teal-500 text-black py-5 rounded-[32px] font-black uppercase text-xs tracking-widest disabled:opacity-50"
                >
                  Review Selection
                </button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-12"
            >
              <div className="space-y-6">
                <div className="inline-flex w-24 h-24 bg-teal-500/20 border border-teal-500/30 rounded-[40px] items-center justify-center text-teal-500 mb-4 animate-bounce">
                  <Sparkles size={48} />
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tighter">Ready to Launch!</h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs max-w-sm mx-auto leading-relaxed">
                  Your store "{shopName}" is configured with {selectedProducts.length} items. Publishing will make it public.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  disabled={loading}
                  onClick={handleFinish}
                  className="w-full bg-teal-500 text-black py-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-teal-500/20"
                >
                  {loading ? 'Launching Shop...' : 'Publish Store'} <ArrowRight size={20} />
                </button>
                <button onClick={handleBack} className="text-gray-600 font-black uppercase text-[10px] tracking-widest">Wait, let me change something</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
