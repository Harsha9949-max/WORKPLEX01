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
    <div className={`min-h-screen pb-32 text-white ${fontClass}`} style={themeVars}>
      {/* Dynamic Header */}
      <div className="relative h-72 overflow-hidden" style={{ backgroundColor: shop.theme?.secondaryColor || '#1A1A1A' }}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="absolute -top-24 -left-24 w-64 h-64 blur-[120px] rounded-full" style={{ backgroundColor: shop.theme?.primaryColor || '#14b8a6', opacity: 0.2 }} />
        
        <div className="relative z-10 p-8 flex flex-col items-center justify-center h-full text-center">
          <motion.img 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={shop.logo} 
            className="w-24 h-24 rounded-[32px] border-4 shadow-2xl mb-4 object-cover" 
            style={{ borderColor: shop.theme?.backgroundColor || '#0A0A0A' }}
          />
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">{shop.shopName}</h1>
          {shop.branding?.tagline && <p className="text-sm font-medium opacity-80 mb-3">{shop.branding.tagline}</p>}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
              <CheckCircle2 size={12} className="text-green-500" />
              <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Verified Store</span>
            </div>
            <button 
              onClick={handleShare}
              className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-white"
            >
              <Share2 size={16} />
            </button>
            {shop.branding?.instagramHandle && (
              <a href={`https://instagram.com/${shop.branding.instagramHandle.replace('@', '')}`} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-white">
                <span className="text-[10px] font-bold">IG</span>
              </a>
            )}
            {shop.branding?.whatsappNumber && (
              <a href={`https://wa.me/${shop.branding.whatsappNumber}`} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-white">
                <span className="text-[10px] font-bold">WA</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Featured Banner */}
      {shop.branding?.bannerText && (
        <div className="px-6 -mt-12 relative z-20">
          <div className="rounded-[40px] p-8 flex items-center justify-between shadow-2xl overflow-hidden relative" style={{ backgroundColor: shop.theme?.primaryColor || '#14b8a6' }}>
            {shop.branding?.bannerImage && (
               <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <img src={shop.branding.bannerImage} className="w-full h-full object-cover" />
               </div>
            )}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full pointer-events-none" />
            <div className="space-y-1 relative z-10 w-full pr-12">
              <h2 className="text-xl font-black text-black uppercase tracking-tighter mix-blend-color-burn">{shop.branding.bannerText}</h2>
              <p className="text-black/60 text-xs font-bold uppercase tracking-widest leading-none">Shop the official collection now</p>
            </div>
            <div className="w-12 h-12 bg-black rounded-2xl flex-shrink-0 flex items-center justify-center shadow-xl relative z-10" style={{ color: shop.theme?.primaryColor || '#14b8a6' }}>
              <Zap size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Search & Categories */}
      <div className="p-6 space-y-6">
        <div className="flex gap-4">
          <div className="flex-1 border rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: shop.theme?.secondaryColor || '#111111', borderColor: 'rgba(255,255,255,0.1)' }}>
            <Search size={18} className="text-gray-600" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-700"
            />
          </div>
          <button className="p-4 border rounded-2xl text-white" style={{ backgroundColor: shop.theme?.secondaryColor || '#111111', borderColor: 'rgba(255,255,255,0.1)' }}>
            <Package size={18} />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {['All Items', ...(shop.categories || [])].map(cat => (
            <button key={cat} className="flex-shrink-0 px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white" style={{ backgroundColor: shop.theme?.secondaryColor || '#111111', borderColor: 'rgba(255,255,255,0.05)' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className={`px-6 ${shop.theme?.layout === 'masonry' ? layoutClass : `grid ${layoutClass}`}`}>
        {products.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`border overflow-hidden group shadow-lg ${shop.theme?.layout === 'masonry' ? 'break-inside-avoid mb-4 inline-block w-full' : ''}`}
            style={{ backgroundColor: shop.theme?.secondaryColor || '#111111', borderColor: 'rgba(255,255,255,0.05)', borderRadius: shop.theme?.buttonStyle === 'sharp' ? '0px' : '40px' }}
          >
            <div className="relative aspect-square">
              <img 
                src={product.images?.[0] || product.productData?.image || 'https://via.placeholder.com/400'} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 font-bold" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <button className="absolute top-4 right-4 p-2.5 bg-black/60 backdrop-blur-md rounded-2xl text-white border border-white/10 z-10 hover:text-red-500">
                <Heart size={16} />
              </button>
              <div className="absolute bottom-4 left-4 z-10 text-white shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest leading-none drop-shadow-md">Price</p>
                <p className="text-xl font-black drop-shadow-md">Rs.{product.partnerSellingPrice}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <h3 className="text-xs font-black uppercase leading-snug line-clamp-2">{product.name || product.productData?.name}</h3>
              <button 
                onClick={() => setSelectedProduct(product)}
                className={`w-full py-4 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all ${buttonClass}`}
                style={{ backgroundColor: 'white', color: 'black' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = shop.theme?.primaryColor || '#14b8a6'; e.currentTarget.style.color = '#000'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = 'black'; }}
              >
                Buy Now <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <CheckoutModal 
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        shopSlug={slug}
        resellerId={shop.ownerUID || shop.id}
        resellerName={shop.shopName}
      />

      {/* Footer Branded */}
      <div className="mt-20 flex flex-col items-center gap-4 opacity-30">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-gray-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Powered by</span>
          <Logo variant="mono" size="xs" />
        </div>
        <div className="w-12 h-1 bg-gray-900 rounded-full" />
      </div>
    </div>
  );
}
