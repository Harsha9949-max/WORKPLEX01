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
        const shopData = { id: shopDoc.id, ...shopDoc.data() };
        setShop(shopData);

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

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-32">
      {/* Dynamic Header */}
      <div className="relative h-72 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-teal-500/10 blur-[120px] rounded-full" />
        
        <div className="relative z-10 p-8 flex flex-col items-center justify-center h-full text-center">
          <motion.img 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={shop.logo} 
            className="w-24 h-24 rounded-[32px] border-4 border-[#0A0A0A] shadow-2xl mb-4 object-cover" 
          />
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">{shop.shopName}</h1>
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
          </div>
        </div>
      </div>

      {/* Featured Banner */}
      <div className="px-6 -mt-12 relative z-20">
        <div className="bg-teal-500 rounded-[40px] p-8 flex items-center justify-between shadow-2xl shadow-teal-500/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
          <div className="space-y-1 relative z-10">
            <h2 className="text-2xl font-black text-black uppercase tracking-tighter">Grand Opening</h2>
            <p className="text-black/60 text-xs font-bold uppercase tracking-widest leading-none">Shop the official collection now</p>
          </div>
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-teal-500 shadow-xl relative z-10">
            <Zap size={24} />
          </div>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="p-6 space-y-6">
        <div className="flex gap-4">
          <div className="flex-1 bg-[#111111] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <Search size={18} className="text-gray-600" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-700"
            />
          </div>
          <button className="p-4 bg-[#111111] border border-white/10 rounded-2xl text-white">
            <Package size={18} />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {['All Items', ...shop.categories].map(cat => (
            <button key={cat} className="flex-shrink-0 px-6 py-2 rounded-full border border-white/5 bg-[#111111] text-[10px] font-black uppercase tracking-widest text-gray-500">
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-6 grid grid-cols-2 gap-4">
        {products.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] border border-white/5 rounded-[40px] overflow-hidden group shadow-lg"
          >
            <div className="relative aspect-square">
              <img 
                src={product.productData.image} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 font-bold" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <button className="absolute top-4 right-4 p-2.5 bg-black/60 backdrop-blur-md rounded-2xl text-white border border-white/10">
                <Heart size={16} />
              </button>
              <div className="absolute bottom-4 left-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Price</p>
                <p className="text-xl font-black text-white">Rs.{product.partnerSellingPrice}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <h3 className="text-xs font-black text-white uppercase leading-snug line-clamp-2">{product.productData.name}</h3>
              <button 
                onClick={() => setSelectedProduct(product)}
                className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 group-hover:bg-teal-500 transition-all"
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
      />

      {/* Footer Branded */}
      <div className="mt-20 flex flex-col items-center gap-4 opacity-30">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-gray-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Powered by WorkPlex</span>
        </div>
        <div className="w-12 h-1 bg-gray-900 rounded-full" />
      </div>
    </div>
  );
}
