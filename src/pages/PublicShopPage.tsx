import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Share2, 
  ArrowRight, 
  ChevronRight, 
  Zap, 
  Star, 
  ShieldCheck,
  Package,
  Heart,
  Search,
  CheckCircle2
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import CheckoutModal from '../components/shop/CheckoutModal';
import toast from 'react-hot-toast';
import { Logo } from '../components/ui/Logo';

export default function PublicShopPage() {
  const { slug } = useParams();
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Items');

  const filteredProducts = products.filter(product => {
    const nameToMatch = (product.name || product.productData?.name || '').toLowerCase();
    const matchesSearch = nameToMatch.includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Items' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      
      // 1. Get Shop
      const shopsQ = query(collection(db, 'partnerShops'), where('shopSlug', '==', slug), limit(1));
      const shopsSnap = await getDocs(shopsQ);
      
      if (!shopsSnap.empty) {
        const shopDoc = shopsSnap.docs[0];
        const shopData = { id: shopDoc.id, ...shopDoc.data() } as any;
        setShop(shopData);

        // SEO Injection
        if (shopData.seo) {
           document.title = shopData.seo.metaTitle || shopData.shopName;
           let metaDesc = document.querySelector('meta[name="description"]');
           if (!metaDesc) {
              metaDesc = document.createElement('meta');
              metaDesc.setAttribute('name', 'description');
              document.head.appendChild(metaDesc);
           }
           metaDesc.setAttribute('content', shopData.seo.metaDescription || '');
        }

        // 2. Get Partner Products
        const productsQ = query(collection(db, 'partnerProducts', shopDoc.id, 'products'), where('isActive', '==', true));
        const productsSnap = await getDocs(productsQ);
        setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      setLoading(false);
    };

    fetchData();
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Shop link copied!');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full" 
      />
    </div>
  );

  if (!shop) return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-black text-white mb-4">Shop Not Found</h1>
      <p className="text-gray-500 mb-8 max-w-xs">The store you're looking for doesn't exist or has been taken down.</p>
      <Link to="/" className="bg-teal-500 text-black font-black px-10 py-4 rounded-3xl">Go Home</Link>
    </div>
  );

  const themeVars = {
    '--color-primary': shop.theme?.primaryColor || '#14b8a6',
    '--color-secondary': shop.theme?.secondaryColor || '#111111',
    '--color-bg': shop.theme?.backgroundColor || '#0A0A0A',
    backgroundColor: shop.theme?.backgroundColor || '#0A0A0A'
  } as React.CSSProperties;

  const fontClass = shop.theme?.fontStyle === 'classic' ? 'font-serif' 
                  : shop.theme?.fontStyle === 'bold' ? 'font-black' 
                  : shop.theme?.fontStyle === 'minimal' ? 'font-mono' 
                  : 'font-sans';

  const buttonClass = shop.theme?.buttonStyle === 'sharp' ? 'rounded-none' 
                    : shop.theme?.buttonStyle === 'pill' ? 'rounded-full' 
                    : 'rounded-2xl';

  const layoutClass = shop.theme?.layout === 'list' ? 'grid-cols-1' 
                    : shop.theme?.layout === 'masonry' ? 'columns-2 gap-4 space-y-4' 
                    : 'grid-cols-2 gap-4';

  return (
    <div className={`min-h-screen pb-32 ${fontClass}`} style={{ ...themeVars, color: '#FFFFFF', backgroundColor: '#0B0F13' }}>
      {/* Real-time Top Notification Bar */}
      <div className="bg-[#131920] border-b border-white/5 py-1.5 px-4 text-center text-[10px] md:text-xs font-black uppercase tracking-wider text-[#FF9900] flex items-center justify-center gap-2">
        <Zap size={12} className="animate-pulse" />
        <span>✓ 100% Verified Store | FREE Delivery with Fast Cash on Delivery (COD)</span>
      </div>

      {/* Amazon-Style Dedicated Header Navbar */}
      <div className="bg-[#1A222D] shadow-xl sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand/Store Info */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <motion.img 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              src={shop.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${shop.shopName}`} 
              className="w-10 h-10 rounded-xl object-cover bg-white/5 border border-white/10 shadow-md shrink-0" 
            />
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black uppercase tracking-tight text-white">{shop.shopName}</h1>
                <span className="bg-[#FF9900] text-black text-[8px] font-black uppercase px-1 rounded">Choice</span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold max-w-[200px] truncate">{shop.branding?.tagline || 'Authorized Reseller'}</p>
            </div>
          </div>

          {/* Core Interactive Search Bar */}
          <div className="flex-1 w-full max-w-xl group">
            <div className="relative flex items-center bg-white rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#FF9900] shadow-md transition-all">
              <Search size={16} className="text-gray-400 ml-4 shrink-0" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search premium products..." 
                className="bg-transparent border-none outline-none text-xs text-black w-full px-3 py-3.5 placeholder:text-gray-400 font-bold"
              />
              <button className="bg-[#FF9900] text-black h-full px-5 hover:bg-[#F3A847] transition-colors flex items-center justify-center font-black text-xs space-gap-1">
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Social Links & Sharing */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button 
              onClick={handleShare}
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-[#FF9900] transition-all text-white flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
              title="Share Storefront"
            >
              <Share2 size={14} /> Share
            </button>
            {shop.branding?.instagramHandle && (
              <a 
                href={`https://instagram.com/${shop.branding.instagramHandle.replace('@', '')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white text-[10px] font-bold"
              >
                Instagram
              </a>
            )}
            {shop.branding?.whatsappNumber && (
              <a 
                href={`https://wa.me/${shop.branding.whatsappNumber}`} 
                target="_blank" 
                rel="noreferrer" 
                className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-colors text-green-400 text-[10px] font-bold"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Featured Banner & Promo Carousel */}
      {shop.branding?.bannerText && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-2xl overflow-hidden relative border border-white/10 bg-[#1D252F]">
            {shop.branding?.bannerImage && (
               <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <img src={shop.branding.bannerImage} className="w-full h-full object-cover" />
               </div>
            )}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF9900]/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="space-y-2 relative z-10 w-full pr-12">
              <div className="inline-flex items-center gap-1.5 bg-[#FF9900]/10 border border-[#FF9900]/20 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 size={10} className="text-[#FF9900]" />
                <span className="text-[8px] font-black text-[#FF9900] uppercase tracking-wider">Mega Promotion Live</span>
              </div>
              <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter">{shop.branding.bannerText}</h2>
              <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-none">Complete premium white-label catalog on sale</p>
            </div>
            <div className="w-12 h-12 bg-black rounded-2xl flex-shrink-0 flex items-center justify-center shadow-xl relative z-10 text-[#FF9900]">
              <Zap size={24} className="animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Category Section with Interactive Click Triggers */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">Browse Departments</h3>
          <span className="text-[9px] text-[#FF9900] font-bold uppercase">{filteredProducts.length} Premium Products</span>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {['All Items', ...(shop.categories || [])].map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  isSelected 
                    ? 'bg-[#FF9900] text-black border-[#FF9900] shadow-lg shadow-[#FF9900]/10 scale-102 font-black' 
                    : 'bg-[#181F29] border-white/5 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Catalog - Amazon-Designed Grid */}
      <div className="max-w-7xl mx-auto px-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-[#141B24] rounded-3xl border border-white/5 my-6 space-y-3">
            <Package className="mx-auto text-gray-500" size={32} />
            <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">No matching products found</h4>
            <p className="text-[10px] text-gray-600 max-w-xs mx-auto">Try checking other department filters or adjusting your search keyword.</p>
          </div>
        ) : (
          <div className={`grid ${layoutClass}`}>
            {filteredProducts.map((product) => {
              // Calculate beautiful fake Amazon pricing variables
              const finalPrice = product.partnerSellingPrice;
              const originalMrp = Math.ceil(finalPrice * 1.48);
              const discountPercent = Math.floor(((originalMrp - finalPrice) / originalMrp) * 100);
              
              // Seed-based rating values
              const ratingScore = 4.5 + (product.id.charCodeAt(0) % 6) * 0.1;
              const ratingCount = 80 + (product.id.charCodeAt(0) % 250);

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className={`bg-[#141B24] border border-white/5 overflow-hidden group shadow-lg flex flex-col hover:border-white/10 transition-all ${
                    shop.theme?.layout === 'masonry' ? 'break-inside-avoid mb-4 inline-block w-full' : ''
                  }`}
                  style={{ borderRadius: shop.theme?.buttonStyle === 'sharp' ? '0px' : '24px' }}
                >
                  {/* Aspect Ratio & Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-[#0F141C]">
                    <img 
                      src={product.images?.[0] || product.productData?.image || 'https://via.placeholder.com/400'} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      loading="lazy"
                    />
                    
                    {/* Orange discount tag label */}
                    <div className="absolute top-3 left-3 bg-[#CC0C39] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow z-10">
                      -{discountPercent}% DEAL
                    </div>

                    <button className="absolute top-3 right-3 p-2 bg-[#1A222D]/80 backdrop-blur rounded-full text-white border border-white/10 z-10 hover:text-red-500 shadow transition-colors">
                      <Heart size={14} />
                    </button>
                    
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="bg-[#1A222D]/90 backdrop-blur text-white border border-white/10 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow">
                        ✓ Prime Delivery
                      </span>
                    </div>
                  </div>

                  {/* Card Info details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      {/* Department Text */}
                      <p className="text-[9px] text-[#FF9900] font-black uppercase tracking-widest">{product.category || 'Deals'}</p>
                      
                      {/* Full Name */}
                      <h3 className="text-xs font-black uppercase tracking-tight text-white line-clamp-2 leading-relaxed min-h-[36px]">
                        {product.name || product.productData?.name}
                      </h3>

                      {/* Amazon Star Row with counts */}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={10} 
                              fill={star <= Math.floor(ratingScore) ? '#FF9900' : 'none'} 
                              stroke="#FF9900" 
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold">{ratingScore.toFixed(1)}</span>
                        <span className="text-[10px] text-gray-500 font-bold">({ratingCount})</span>
                      </div>
                    </div>

                    {/* Highly Professional Amazon-like Pricing layout */}
                    <div className="border-t border-white/5 pt-3 space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-gray-400 font-bold">Rs.</span>
                        <span className="text-2xl font-black text-white leading-none">{finalPrice}</span>
                        <span className="text-[10px] text-gray-500 font-bold line-through">M.R.P. {originalMrp}</span>
                      </div>
                      
                      {/* Prime status and shipment speed details */}
                      <div className="space-y-0.5 text-[10px] text-gray-400 font-medium">
                        <p className="text-green-500 font-bold flex items-center gap-1">
                          <span>✓</span> FREE delivery Tomorrow
                        </p>
                        <p className="text-gray-500 text-[8px] uppercase tracking-wider font-black">Secure COD payment mode available</p>
                      </div>

                      {/* Prime and buy visual checkout CTA with customized classes */}
                      <button 
                        onClick={() => setSelectedProduct(product)}
                        className={`w-full py-3 font-semibold uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 transition-all bg-gradient-to-r from-[#ffe494] to-[#f4b82d] text-black border border-[#a2a6ac] hover:from-[#f5d06b] hover:to-[#e4aa20] active:scale-[0.98] ${buttonClass}`}
                      >
                        Buy Now <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout Modal Frame */}
      <CheckoutModal 
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        shopSlug={slug}
        resellerId={shop.ownerUID || shop.id}
        resellerName={shop.shopName}
      />

      {/* Amazon Footer and Credit Badges */}
      <div className="mt-24 border-t border-white/5 py-12 flex flex-col items-center gap-4 text-center px-4">
        <div className="flex items-center gap-2 text-gray-500">
          <ShieldCheck size={16} className="text-gray-500 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">Powered by Secure Infrastructure</span>
          <Logo variant="mono" size="xs" />
        </div>
        <p className="text-[8px] text-gray-600 uppercase tracking-widest">
          © {new Date().getFullYear()} {shop.shopName}. All rights and trademarks are property of their respective owners.
        </p>
        <div className="w-12 h-1 bg-[#1A222D] rounded-full" />
      </div>
    </div>
  );
}
