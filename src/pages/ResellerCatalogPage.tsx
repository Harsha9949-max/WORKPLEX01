import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Share2, 
  ExternalLink, 
  Zap, 
  Gift, 
  Package,
  ArrowUpRight,
  Plus,
  Heart,
  Tag,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import WhatsAppShareModal from '../components/viral/WhatsAppShareModal';
import toast from 'react-hot-toast';

const PRODUCTS = [
  {
    id: 'p1',
    name: 'WorkPlex Pro Setup',
    price: 4999,
    commission: 1500,
    category: 'Equipment',
    image: 'https://picsum.photos/seed/tech/400/400',
    description: 'Complete high-performance workspace setup for professional marketers.'
  },
  {
    id: 'p2',
    name: 'HVRS Smart Watch',
    price: 2499,
    commission: 800,
    category: 'Electronics',
    image: 'https://picsum.photos/seed/watch/400/400',
    description: 'Sync your tasks and track your earnings directly on your wrist.'
  },
  {
    id: 'p3',
    name: 'Venture Starter Kit',
    price: 999,
    commission: 300,
    category: 'Kits',
    image: 'https://picsum.photos/seed/box/400/400',
    description: 'Essential marketing materials and physical badges for offline growth.'
  },
  {
    id: 'p4',
    name: 'TrendyVerse Apparel',
    price: 1499,
    commission: 500,
    category: 'Fashion',
    image: 'https://picsum.photos/seed/hoodie/400/400',
    description: 'Premium HVRS branded workwear for the elite content creator.'
  }
];

export default function ResellerCatalogPage() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const categories = ['All', 'Electronics', 'Kits', 'Fashion', 'Equipment'];

  const filteredProducts = PRODUCTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleShareProduct = (product: any) => {
    setSelectedProduct(product);
    setIsShareModalOpen(true);
  };

  const shareText = selectedProduct 
    ? `Check out ${selectedProduct.name} on WorkPlex! Only Rs.${selectedProduct.price}. Use my referral code for a special bonus: ${userData?.uid}`
    : `Browse the WorkPlex Reseller Catalog and start earning today!`;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-32">
      <div className="absolute top-6 left-6 z-30">
        <button 
          onClick={() => navigate('/home')} 
          className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Premium Header */}
      <div className="relative h-64 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#E8B84B]/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 p-8 pt-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#E8B84B] rounded-2xl flex items-center justify-center shadow-lg shadow-[#E8B84B]/20">
              <ShoppingBag size={24} className="text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Reseller Store</h1>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">HVRS Official Catalog</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-1 flex items-center backdrop-blur-md">
            <div className="p-3 text-gray-500">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-white py-3 placeholder:text-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 -mt-8 relative z-20">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                selectedCategory === cat
                ? 'bg-[#E8B84B] border-[#E8B84B] text-black shadow-lg shadow-[#E8B84B]/20'
                : 'bg-[#111111] border-white/10 text-gray-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-6 mt-8 space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Trending Items</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#E8B84B]">{filteredProducts.length} Results</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#111111] border border-white/5 rounded-[32px] overflow-hidden group"
              >
                <div className="relative aspect-square">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[9px] font-black text-[#E8B84B] uppercase tracking-tighter">
                    {product.category}
                  </div>
                  <button className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white">
                    <Heart size={14} />
                  </button>
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Price</p>
                      <p className="text-lg font-black text-white leading-none">Rs.{product.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-green-500 font-black uppercase tracking-tighter">Commission</p>
                      <p className="text-sm font-black text-green-500">Rs.{product.commission}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <h4 className="text-xs font-black text-white leading-tight line-clamp-2">{product.name}</h4>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleShareProduct(product)}
                      className="flex-1 bg-white/5 border border-white/10 p-3 rounded-2xl text-white flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                    >
                      <Share2 size={14} />
                    </button>
                    <button 
                      onClick={() => setSelectedProduct(product)}
                      className="flex-[3] bg-white text-black text-[10px] font-black uppercase tracking-widest p-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                    >
                      Details
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <WhatsAppShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={selectedProduct ? "Share Product" : "Share Catalog"}
        shareText={shareText}
      />

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && !isShareModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-[#111111] rounded-t-[48px] z-[101] overflow-hidden flex flex-col pt-2"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-4">
                <div className="aspect-square rounded-[40px] overflow-hidden mb-8 border border-white/5 shadow-2xl">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="space-y-6 pb-12">
                  <div className="flex justify-between items-start text-left">
                    <div className="flex-1">
                      <span className="text-[10px] font-black text-[#E8B84B] uppercase tracking-widest bg-[#E8B84B]/10 px-3 py-1 rounded-full mb-3 inline-block">
                        {selectedProduct.category}
                      </span>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight mb-2">{selectedProduct.name}</h2>
                      <p className="text-gray-500 text-sm font-medium">{selectedProduct.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-white">Rs.{selectedProduct.price}</p>
                      <p className="text-[10px] text-green-500 font-black uppercase tracking-tighter">Earn Rs.{selectedProduct.commission}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center">
                      <Plus className="text-[#E8B84B] mb-2" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">In Stock</span>
                      <span className="text-white font-black">240 Units</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center">
                      <Tag className="text-[#E8B84B] mb-2" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform</span>
                      <span className="text-white font-black">BuyRix</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleShareProduct(selectedProduct)}
                      className="flex-1 bg-white/5 border border-white/10 py-5 rounded-[32px] text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                      <Share2 size={20} />
                      Share
                    </button>
                    <button 
                      onClick={() => {
                        toast.success('Product added to your shop!');
                        setSelectedProduct(null);
                      }}
                      className="flex-[2] bg-[#E8B84B] text-black py-5 rounded-[32px] font-black uppercase tracking-widest shadow-xl shadow-[#E8B84B]/20 active:scale-95 transition-all"
                    >
                      Add to Shop
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      <div className="fixed bottom-28 right-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-16 h-16 bg-[#E8B84B] rounded-3xl flex items-center justify-center text-black shadow-2xl shadow-[#E8B84B]/40 border-4 border-[#0A0A0A]"
        >
          <div className="relative">
            <ShoppingBag size={28} />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#E8B84B] flex items-center justify-center">
              <span className="text-[8px] font-black text-white">0</span>
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
