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
  CheckCircle2,
  Menu,
  ShoppingCart,
  User,
  HeartHandshake,
  TrendingUp,
  Award,
  Clock,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
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
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Filter products based on search queries and category selections
  const filteredProducts = products.filter(product => {
    const nameToMatch = (product.name || product.productData?.name || '').toLowerCase();
    const matchesSearch = nameToMatch.includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Items' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Listen to Firestore real-time snapshots
  useEffect(() => {
    if (!slug) return;

    setLoading(true);

    // 1. Get Shop by slug (Real-time to sync dynamic branding, layout, names)
    const shopsQ = query(collection(db, 'partnerShops'), where('shopSlug', '==', slug), limit(1));
    
    let unsubProducts: (() => void) | null = null;

    const unsubShop = onSnapshot(shopsQ, (shopsSnap) => {
      if (!shopsSnap.empty) {
        const shopDoc = shopsSnap.docs[0];
        const shopData = { id: shopDoc.id, ...shopDoc.data() } as any;
        setShop(shopData);

        // Dynamic SEO Injections
        if (shopData.seo) {
          document.title = shopData.seo.metaTitle || `${shopData.shopName} - Flipkart Store`;
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
          }
          metaDesc.setAttribute('content', shopData.seo.metaDescription || '');
        }

        // 2. Setup Real-time Listener for products (exclusively showing products added by this partner)
        if (unsubProducts) unsubProducts();

        const productsQ = query(
          collection(db, 'partnerProducts', shopDoc.id, 'products'), 
          where('isActive', '==', true)
        );

        unsubProducts = onSnapshot(productsQ, (productsSnap) => {
          const prods = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setProducts(prods);
          setLoading(false);
        }, (error) => {
          console.error('[Snap Error] partnerProducts list: ', error);
          setLoading(false);
        });

      } else {
        setShop(null);
        setLoading(false);
      }
    }, (error) => {
      console.error('[Snap Error] partnerShops query: ', error);
      setLoading(false);
    });

    return () => {
      unsubShop();
      if (unsubProducts) unsubProducts();
    };
  }, [slug]);

  // Slide carousel banners automatically
  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, [products]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Shop link copied to clipboard!');
  };

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('mobile') || cat.includes('phone')) return { emoji: '📱', bg: 'bg-[#E3F2FD]' };
    if (cat.includes('cloth') || cat.includes('fashion') || cat.includes('wear') || cat.includes('shoe')) return { emoji: '👕', bg: 'bg-[#FCE4EC]' };
    if (cat.includes('electronics') || cat.includes('gadget') || cat.includes('laptop') || cat.includes('tech')) return { emoji: '💻', bg: 'bg-[#EDE7F6]' };
    if (cat.includes('home') || cat.includes('kitchen') || cat.includes('furniture')) return { emoji: '🏠', bg: 'bg-[#E8F5E9]' };
    if (cat.includes('beauty') || cat.includes('cosmetic') || cat.includes('care')) return { emoji: '💄', bg: 'bg-[#FFF3E0]' };
    if (cat.includes('appliances') || cat.includes('tv') || cat.includes('fridge')) return { emoji: '🔌', bg: 'bg-[#E0F2F1]' };
    if (cat.includes('toy') || cat.includes('kids') || cat.includes('game')) return { emoji: '🧸', bg: 'bg-[#F3E5F5]' };
    return { emoji: '📦', bg: 'bg-[#ECEFF1]' }; // Default
  };

  if (loading) {
    const primaryColor = shop?.theme?.primaryColor || '#2874f0';
    return (
      <div className="min-h-screen bg-[#f1f3f6] flex flex-col items-center justify-center p-4">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-t-transparent rounded-full shadow-md mb-3" 
          style={{ borderLeftColor: primaryColor, borderRightColor: primaryColor, borderBottomColor: primaryColor }}
        />
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">Loading Store...</span>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#f1f3f6] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6">
          <Package size={36} className="text-gray-400" />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-2">Storefront Offline</h1>
        <p className="text-gray-500 mb-8 max-w-sm text-sm">The store coordinates are incorrect, or the seller has taken their storefront offline temporarily.</p>
        <Link to="/" className="bg-[#2874f0] text-white font-bold px-8 py-3 rounded shadow hover:bg-[#1259c7] transition-all">Go Home</Link>
      </div>
    );
  }

  // Dynamic branding colors & fonts if selected, otherwise fallback to Flipkart palette
  const primaryColor = shop.theme?.primaryColor || '#2874f0';
  const secondaryColor = shop.theme?.secondaryColor || '#ffe11b';
  const backgroundColor = shop.theme?.backgroundColor || '#f1f3f6';
  const fontStyle = shop.theme?.fontStyle || 'modern';
  const buttonStyle = shop.theme?.buttonStyle || 'rounded';
  const shopLayout = shop.theme?.layout || 'grid';

  const getButtonStyleClass = (style: string) => {
    switch (style) {
      case 'sharp': return 'rounded-none';
      case 'pill': return 'rounded-full';
      case 'rounded':
      default:
        return 'rounded-xl';
    }
  };

  const getFontStyleClass = (font: string) => {
    switch (font) {
      case 'classic': return 'font-serif';
      case 'minimal': return 'font-mono tracking-wide';
      case 'bold': return 'font-sans font-black tracking-tight';
      case 'modern':
      default:
        return 'font-sans';
    }
  };

  const fontClass = getFontStyleClass(fontStyle);
  const btnClass = getButtonStyleClass(buttonStyle);

  return (
    <div className={`min-h-screen pb-24 text-gray-800 ${fontClass} antialiased`} style={{ backgroundColor }}>
      
      {/* 1. Flipkart-esque Top Header Bar */}
      <header style={{ backgroundColor: primaryColor }} className="text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Logo Brand Title with "Plus" superscript symbol */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="#" className="flex flex-col select-none leading-none">
              <span className="text-lg md:text-xl font-black italic tracking-tight text-white flex items-center">
                {shop.shopName}
                <span style={{ color: secondaryColor }} className="ml-1 font-extrabold text-xs not-italic">Plus✦</span>
              </span>
              <span className="text-[9px] font-bold italic text-gray-200 hover:underline flex items-center gap-0.5 mt-0.5">
                Explore <span style={{ color: secondaryColor }} className="font-black uppercase tracking-wider">Choice</span>
              </span>
            </Link>
            {shop.logo && (
              <img 
                src={shop.logo} 
                className="w-8 h-8 rounded-full border border-white/20 object-cover bg-white" 
                alt="Shop Logo"
              />
            )}
          </div>

          {/* Flipkart Classic White Search Bar */}
          <div className="flex-1 max-w-2xl h-10 bg-white rounded-sm shadow-sm flex items-center overflow-hidden">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products, brands and more..." 
              className="w-full bg-transparent border-none outline-none text-sm text-gray-800 px-4 py-2 font-medium placeholder:text-gray-400 focus:ring-0"
            />
            <button style={{ color: primaryColor }} className="px-4 hover:opacity-80 transition-colors">
              <Search size={18} />
            </button>
          </div>

          {/* Header Action menu buttons */}
          <div className="flex items-center gap-4 text-sm font-bold shrink-0">
            <button 
              onClick={handleShare}
              className={`bg-white hidden md:flex items-center gap-1.5 px-6 py-1.5 shadow hover:bg-gray-50 transition-all font-black uppercase text-xs ${btnClass}`}
              style={{ color: primaryColor }}
            >
              <Share2 size={12} /> Share Store
            </button>

            {/* Icons */}
            <div className="flex items-center gap-3">
              {shop.branding?.instagramHandle && (
                <a 
                  href={`https://instagram.com/${shop.branding.instagramHandle.replace('@', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-1.5 rounded-full hover:bg-white/10 text-white transition-all"
                  title="Instagram"
                >
                  <User size={18} />
                </a>
              )}
              {shop.branding?.whatsappNumber && (
                <a 
                  href={`https://wa.me/${shop.branding.whatsappNumber}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-1.5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all shadow"
                  title="WhatsApp Chat"
                >
                  <ShoppingBag size={18} />
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Real-time Promo Marquee Alert Strip */}
      <div style={{ backgroundColor: secondaryColor }} className="text-gray-900 border-b border-black/10 py-1.5 px-4 text-center text-[10px] md:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
        <Zap size={12} className="text-red-600 fill-red-600 animate-pulse shrink-0" />
        <span>⚡ Super Value Budget Store | Free Home Delivery across India for all Cash on Delivery (COD) orders! ⚡</span>
      </div>

      {/* 3. Flipkart Categorical Circular Icon Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar justify-start md:justify-center items-center py-1">
            
            {/* "All Items" Circle */}
            <button 
              onClick={() => setSelectedCategory('All Items')}
              className="flex flex-col items-center gap-1 shrink-0 group min-w-[70px]"
            >
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  selectedCategory === 'All Items' 
                    ? 'text-white scale-105' 
                    : 'bg-gray-100 text-gray-600 group-hover:scale-105 group-hover:bg-gray-200'
                }`}
                style={selectedCategory === 'All Items' ? { backgroundColor: primaryColor, boxShadow: `0 0 0 4px ${primaryColor}33` } : {}}
              >
                <span className="text-xl">⭐</span>
              </div>
              <span 
                className="text-[11px] font-bold tracking-tight text-center truncate max-w-[80px]"
                style={selectedCategory === 'All Items' ? { color: primaryColor, fontWeight: 900 } : {}}
              >
                For You
              </span>
            </button>

            {/* Map actual reseller added categories dynamic */}
            {['All Items', ...(shop.categories || [])].filter(cat => cat !== 'All Items').map(cat => {
              const info = getCategoryIcon(cat);
              const isSelected = selectedCategory === cat;
              return (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)}
                  className="flex flex-col items-center gap-1 shrink-0 group min-w-[75px]"
                >
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isSelected 
                        ? 'text-white scale-105' 
                        : `${info.bg} text-gray-800 group-hover:scale-105 group-hover:opacity-90`
                    }`}
                    style={isSelected ? { backgroundColor: primaryColor, boxShadow: `0 0 0 4px ${primaryColor}33` } : {}}
                  >
                    <span className="text-xl">{info.emoji}</span>
                  </div>
                  <span 
                    className="text-[11px] font-bold tracking-tight text-center capitalize max-w-[80px] truncate"
                    style={isSelected ? { color: primaryColor, fontWeight: 900 } : {}}
                  >
                    {cat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Large Promo Carousel Banner Banner inspired by Big Saving Days */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div 
          className="relative rounded-md shadow-lg overflow-hidden h-40 md:h-64 flex items-center justify-between text-white border border-black/5"
          style={{ backgroundColor: primaryColor }}
        >
          {/* Decorative floating grids */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.05)_1px,_transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
          
          {shop.branding?.bannerImage && (
            <div className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay">
              <img src={shop.branding.bannerImage} className="w-full h-full object-cover" alt="Banner Background" />
            </div>
          )}

          <div className="relative z-10 px-6 md:px-12 py-8 max-w-lg space-y-2">
            <span 
              className="font-extrabold text-[9px] md:text-xxs px-2 py-0.5 rounded uppercase tracking-wider shadow"
              style={{ backgroundColor: secondaryColor, color: '#111' }}
            >
              F-Assured Store Deals
            </span>
            <h2 className="text-xl md:text-4xl font-black italic uppercase tracking-tighter leading-tight text-white drop-shadow-md">
              {shop.branding?.bannerText || "Big Billion Shopping Deals!"}
            </h2>
            <p className="text-gray-100 text-[10px] md:text-sm font-semibold tracking-wide flex items-center gap-1">
              <CheckCircle2 size={14} style={{ color: secondaryColor }} /> Direct reseller pricing with immediate delivery checks.
            </p>
          </div>

          <div className="hidden md:flex flex-col items-center gap-2 pr-12 relative z-10">
            <div 
              className="font-black p-4 rounded-full w-24 h-24 flex flex-col items-center justify-center border-4 border-white shadow-xl animate-bounce"
              style={{ backgroundColor: secondaryColor, color: '#111' }}
            >
              <p className="text-xxs leading-none uppercase">UP TO</p>
              <p className="text-2xl leading-none font-black italic">60%</p>
              <p className="text-[10px] leading-none uppercase font-bold">OFF</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Horizontal scroll: "Still Looking for These?" */}
      {products.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-white rounded-sm shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-orange-500" />
                <h3 className="text-sm md:text-base font-black text-gray-800 uppercase tracking-tight">
                  Still looking for these? <span className="text-gray-400 text-xs font-normal capitalize">Curated Selection</span>
                </h3>
              </div>
              <span style={{ color: primaryColor }} className="text-xs font-bold hover:underline cursor-pointer">View All</span>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {products.slice(0, 5).map((product) => {
                const finalPrice = product.partnerSellingPrice;
                const originalMrp = Math.ceil(finalPrice * 1.45);
                const discountPercent = Math.floor(((originalMrp - finalPrice) / originalMrp) * 100);

                return (
                  <div 
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`flex flex-col items-center p-3 border border-gray-100 hover:border-gray-200 bg-[#FCFDFE] hover:shadow-sm cursor-pointer rounded-sm w-[130px] md:w-[160px] shrink-0 transition-all text-center ${btnClass}`}
                  >
                    <div className="w-24 h-24 md:w-28 md:h-38 bg-white flex items-center justify-center p-1 overflow-hidden relative">
                      <img 
                        src={product.images?.[0] || product.productData?.image || 'https://via.placeholder.com/400'} 
                        className="max-h-full max-w-full object-contain hover:scale-105 transition-transform" 
                        alt="Product card"
                      />
                    </div>
                    <h4 className="text-[11px] font-bold text-gray-700 truncate w-full mt-2 text-center uppercase">
                      {product.name}
                    </h4>
                    <p className="text-[10px] text-green-600 font-extrabold mt-0.5">
                      Min {discountPercent}% Off
                    </p>
                    <p className="text-xs font-extrabold text-gray-800 mt-0.5">
                      ₹{finalPrice}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. Main Catalog grid - styled based on personalized Layout and Styling choices */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Header Department Title */}
          <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base md:text-lg font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                <Award size={18} style={{ color: primaryColor }} />
                {selectedCategory === 'All Items' ? 'Top Suggested Deals' : `${selectedCategory} Collection`}
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">100% Authentic Quality Assured</p>
            </div>
            <div style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }} className="flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-sm">
              <span>{filteredProducts.length} Premium items found</span>
            </div>
          </div>

          {/* Catalog content */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white space-y-4 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Package className="text-gray-400" size={28} />
              </div>
              <h4 className="text-sm font-bold uppercase text-gray-500 tracking-wider">No matching products found</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">Try selecting another department filter on the circular bar or adjusting your search input.</p>
            </div>
          ) : (
            <div className={
              shopLayout === 'list' 
                ? 'grid grid-cols-1 divide-y divide-gray-100 bg-white border-t border-gray-100'
                : shopLayout === 'masonry'
                  ? 'columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 p-4 bg-white border-t border-gray-100'
                  : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 divide-x divide-y divide-gray-100 bg-white border-t border-gray-100'
            }>
              {filteredProducts.map((product) => {
                
                // Beautiful Flipkart pricing variables
                const finalPrice = product.partnerSellingPrice;
                const originalMrp = Math.ceil(finalPrice * 1.45);
                const discountPercent = Math.floor(((originalMrp - finalPrice) / originalMrp) * 100);

                // Seed ratings and total reviews
                const ratingSeed = (product.id || '').charCodeAt(0) % 5;
                const ratingVal = 4.1 + (ratingSeed * 0.2); 
                const reviewsCount = 42 + (ratingSeed * 115);

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 bg-white hover:shadow-md transition-shadow relative flex group cursor-pointer ${
                      shopLayout === 'list' 
                        ? 'flex-col sm:flex-row items-center gap-6 border-b border-gray-100' 
                        : shopLayout === 'masonry'
                          ? 'flex-col justify-between border border-gray-100 mb-4 break-inside-avoid rounded-xl'
                          : 'flex-col justify-between'
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    
                    {/* Share & Wishlist button absolute overlay */}
                    <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:scale-105 shadow rounded-full transition-all">
                        <Heart size={12} className="fill-transparent" />
                      </button>
                    </div>

                    {/* Image Area */}
                    <div className={`bg-white flex items-center justify-center p-2 overflow-hidden relative shrink-0 ${
                      shopLayout === 'list' ? 'w-32 h-32 md:w-40 md:h-40' : 'aspect-square w-full'
                    }`}>
                      <img 
                        src={product.images?.[0] || product.productData?.image || 'https://via.placeholder.com/400'} 
                        className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300"
                        loading="lazy" 
                        alt={product.name}
                      />
                    </div>

                    {/* Text & Specs */}
                    <div className={`mt-4 flex-1 flex flex-col justify-between ${shopLayout === 'list' ? 'w-full sm:mt-0' : 'w-full'}`}>
                      <div className="space-y-1">
                        
                        {/* Title label */}
                        <h3 className="text-xs font-bold text-gray-800 line-clamp-2 leading-relaxed tracking-tight uppercase group-hover:opacity-85 transition-opacity">
                          {product.name}
                        </h3>

                        {/* Ratings & Assured tag */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="bg-green-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                            {ratingVal.toFixed(1)} <Star size={8} className="fill-white animate-pulse" />
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">({reviewsCount})</span>
                          <span className="text-[8px] bg-sky-100 text-sky-700 uppercase font-black tracking-widest px-1 rounded-sm ml-auto">
                            ✦ Assured
                          </span>
                        </div>
                      </div>

                      {/* Pricing Row */}
                      <div className="border-t border-gray-50 mt-3 pt-3 space-y-1.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-extrabold text-gray-900">₹{finalPrice}</span>
                          <span className="text-[10px] text-gray-400 line-through font-bold">₹{originalMrp}</span>
                          <span className="text-[10px] text-green-600 font-extrabold">{discountPercent}% off</span>
                        </div>

                        {/* Shipping and Delivery speeds */}
                        <p className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                          <span>✓</span> FREE Delivery by Tomorrow
                        </p>
                        
                        <div className="text-[8px] text-gray-400 uppercase tracking-wider font-extrabold pt-1">
                          Secure Cash On Delivery (COD) Enabled
                        </div>

                        {/* Checkout CTA */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                          }}
                          className={`w-full mt-2.5 py-2.5 text-gray-900 hover:opacity-90 font-extrabold text-[10px] tracking-wider uppercase flex items-center justify-center gap-1 text-center transition-all shadow-sm group-hover:shadow ${btnClass}`}
                          style={{ backgroundColor: secondaryColor, border: `1px solid ${secondaryColor}` }}
                        >
                          Buy Now <ArrowRight size={10} />
                        </button>
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 7. Flipkart-style footer */}
      <footer className="mt-16 bg-[#172337] text-white pt-12 pb-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-gray-700 pb-10">
          
          {/* Column 1 */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-black text-gray-400 tracking-wider">Secure Shopping</h4>
            <div className="text-xs text-gray-300 leading-relaxed space-y-1 font-medium">
              <p className="flex items-center gap-1.5"><ShieldCheck size={14} style={{ color: secondaryColor }} /> Instant Order Sync with Partners</p>
              <p className="flex items-center gap-1.5">✓ Zero advance payments for COD</p>
              <p className="flex items-center gap-1.5">✓ Encrypted checkout security and logging</p>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-black text-gray-400 tracking-wider">E-Commerce Partner Platform</h4>
            <div className="text-xs text-gray-300 leading-relaxed font-medium">
              <p>This storefront is authorized and securely hosted by WorkPlex as a verified white-label merchant partner. All customer queries and payouts are processed securely.</p>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-black text-gray-400 tracking-wider">Merchant Address & Profile</h4>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: secondaryColor }}>
              {shop.shopName} Inc.
            </p>
            {shop.branding?.tagline && (
              <p className="text-xs text-gray-400 font-medium italic">"{shop.branding.tagline}"</p>
            )}
            <div className="pt-2 flex items-center gap-3">
              <button 
                onClick={handleShare}
                className={`text-[10px] uppercase font-black tracking-widest border px-3 py-1 bg-white/5 hover:bg-white/15 ${btnClass}`}
                style={{ color: secondaryColor, borderColor: `${secondaryColor}33` }}
              >
                Copy Merchant Link
              </button>
            </div>
          </div>
        </div>

        {/* Footer legal credits */}
        <div className="max-w-7xl mx-auto px-4 pt-8 text-center flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          <p>© {new Date().getFullYear()} {shop.shopName} Plus Store. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Powered by</span> <Logo variant="mono" size="xs" />
          </div>
        </div>
      </footer>

      {/* 8. Checkout Modal Frame */}
      <CheckoutModal 
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        shopSlug={slug}
        resellerId={shop.ownerUID || shop.id}
        resellerName={shop.shopName}
        razorpayConnected={Boolean(shop?.razorpayConnected || shop?.paymentGateway?.razorpayConnected)}
      />

    </div>
  );
}

