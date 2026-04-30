import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Search, Filter, Plus, Edit2, Trash2, X, Check
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, getDocs, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import toast from 'react-hot-toast';

const ProductImage = ({ images, name, size = 40, className = "" }: { images?: string[], name?: string, size?: number | 'full', className?: string }) => {
  const [imgError, setImgError] = useState(false);
  const src = images?.[0] || '';

  if (!src || imgError) {
    return (
      <div 
        className={className}
        style={{
          width: size === 'full' ? '100%' : size, 
          height: size === 'full' ? '100%' : size,
          background: '#2A2A2A',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size === 'full' ? 48 : 18
        }}
      >
        📦
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={className}
      style={{
        width: size === 'full' ? '100%' : size,
        height: size === 'full' ? '100%' : size,
        objectFit: 'cover',
        borderRadius: 6
      }}
      onError={() => setImgError(true)}
    />
  );
};

export default function ResellerProducts() {
  const { currentUser, userData } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  useEffect(() => {
    if (!currentUser) return;

    // Listen to Shop
    const unsubShop = onSnapshot(doc(db, 'partnerShops', currentUser.uid), (doc) => {
      if (doc.exists()) {
        setShop(doc.data());
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'partnerShops'));

    // Listen to My Products
    const qProducts = query(collection(db, `partnerProducts/${currentUser.uid}/products`));
    const unsubMyProducts = onSnapshot(qProducts, (snap) => {
      setMyProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'partnerProducts'));

    return () => {
      unsubShop();
      unsubMyProducts();
    };
  }, [currentUser]);

  // Load Catalog Products
  const loadCatalog = async () => {
    const currentVenture = shop?.venture || userData?.venture || 'BuyRix';
    if (!currentVenture) return;
    
    try {
      const q = query(
        collection(db, 'catalogProducts'),
        where('venture', '==', currentVenture),
        where('isActive', '==', true)
      );
      const snap = await getDocs(q);
      setCatalogProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'catalogProducts');
    }
  };

  useEffect(() => {
    if (showCatalogModal) {
      loadCatalog();
    }
  }, [showCatalogModal, shop?.venture, userData?.venture]);

  const handleAddProduct = async (catalogProd: any, sellingPrice: number) => {
    if (!currentUser) return;
    const currentVenture = shop?.venture || userData?.venture || 'BuyRix';
    try {
      const docRef = doc(db, `partnerProducts/${currentUser.uid}/products`, catalogProd.id);
      await setDoc(docRef, {
        productId: catalogProd.id,
        name: catalogProd.name,
        images: catalogProd.images || [],
        hvrsBasePrice: catalogProd.hvrsBasePrice,
        partnerSellingPrice: sellingPrice,
        partnerMargin: sellingPrice - catalogProd.hvrsBasePrice,
        category: catalogProd.category || 'General',
        description: catalogProd.description || '',
        isActive: true,
        venture: currentVenture,
        addedAt: serverTimestamp()
      });
      toast.success('Product added to your shop!');
      setShowCatalogModal(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'partnerProducts');
    }
  };

  const handleUpdatePrice = async (prodId: string, newPrice: number, basePrice: number) => {
    if (newPrice <= 0) {
      toast.error('Selling price must be greater than 0');
      return;
    }
    if (!currentUser) return;
    try {
      const docRef = doc(db, `partnerProducts/${currentUser.uid}/products`, prodId);
      await updateDoc(docRef, {
        partnerSellingPrice: newPrice,
        partnerMargin: newPrice - basePrice
      });
      toast.success('Price updated successfully');
      setEditingPriceId(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'partnerProducts');
    }
  };

  const handleToggleActive = async (prodId: string, currentActive: boolean) => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, `partnerProducts/${currentUser.uid}/products`, prodId);
      await updateDoc(docRef, { isActive: !currentActive });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'partnerProducts');
    }
  };

  const handleRemoveProduct = async (prodId: string) => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, `partnerProducts/${currentUser.uid}/products`, prodId);
      await deleteDoc(docRef);
      toast.success('Product removed');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'partnerProducts');
    }
  };

  const filteredCatalog = catalogProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">My Products</h1>
          <p className="text-sm text-gray-400">Pick from HVRS catalog and set your selling price.</p>
        </div>
        <button 
          onClick={() => setShowCatalogModal(true)}
          className="flex items-center gap-2 bg-[#E8B84B] text-black px-4 py-2 rounded-[6px] font-bold shadow-md hover:bg-[#E8B84B]/90 transition-colors"
        >
          <Plus size={18} /> Browse Catalog
        </button>
      </div>

      {myProducts.length === 0 ? (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-[8px] p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#2A2A2A] rounded-full flex items-center justify-center mb-4">
            <Package size={32} className="text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No products yet</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-sm">
            Browse the HVRS catalog and add products to start selling to your customers.
          </p>
          <button 
            onClick={() => setShowCatalogModal(true)}
            className="bg-[#E8B84B] text-black px-6 py-3 rounded-[6px] font-bold shadow-md hover:bg-[#E8B84B]/90 transition-colors"
          >
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-[8px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1A1A1A] text-gray-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Your Price</th>
                  <th className="px-6 py-4">Your Margin</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {myProducts.map(prod => (
                  <tr key={prod.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ProductImage images={prod.images} name={prod.name} size={40} />
                        <span className="font-medium text-white">{prod.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 capitalize">{prod.category}</td>
                    <td className="px-6 py-4">
                      {editingPriceId === prod.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Rs.</span>
                          <input 
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdatePrice(prod.id, Number(tempPrice), prod.hvrsBasePrice);
                              if (e.key === 'Escape') setEditingPriceId(null);
                            }}
                            autoFocus
                            className="w-20 bg-[#1A1A1A] border border-[#00C9A7] text-white px-2 py-1 rounded outline-none"
                          />
                          <button onClick={() => handleUpdatePrice(prod.id, Number(tempPrice), prod.hvrsBasePrice)} className="text-[#00C9A7] hover:text-[#00C9A7]/80">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingPriceId(null)} className="text-gray-500 hover:text-white">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/price cursor-pointer" onClick={() => { setEditingPriceId(prod.id); setTempPrice(prod.partnerSellingPrice.toString()); }}>
                          <span className="font-bold text-white">{formatCurrency(prod.partnerSellingPrice)}</span>
                          <Edit2 size={12} className="text-gray-500 group-hover/price:text-white opacity-0 group-hover/price:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#10B981]">
                      {formatCurrency(editingPriceId === prod.id ? (Number(tempPrice) - prod.hvrsBasePrice) : prod.partnerMargin)}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleActive(prod.id, prod.isActive)}
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                          prod.isActive ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'
                        }`}
                      >
                        {prod.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleRemoveProduct(prod.id)}
                        className="p-2 text-gray-500 hover:text-[#EF4444] transition-colors rounded hover:bg-[#EF4444]/10"
                        title="Remove product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Catalog Modal */}
      <AnimatePresence>
        {showCatalogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#111111] border border-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
                <div>
                  <h2 className="text-xl font-bold text-white">HVRS Catalog</h2>
                  <p className="text-sm text-gray-400">Available products for {shop?.venture || userData?.venture || 'BuyRix'}</p>
                </div>
                <button onClick={() => setShowCatalogModal(false)} className="p-2 text-gray-400 hover:text-white rounded bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 border-b border-[#2A2A2A] bg-[#1A1A1A] flex gap-4">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Search by name or category..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2A2A2A] text-white pl-10 pr-4 py-2 rounded-lg focus:border-[#E8B84B] focus:ring-1 focus:ring-[#E8B84B] outline-none"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#111111] border border-[#2A2A2A] text-gray-300 rounded-lg hover:bg-[#2A2A2A]">
                  <Filter size={18} /> Filters
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-[#0A0A0A]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCatalog.map(p => {
                    const isAdded = myProducts.some(mp => mp.productId === p.id);
                    return (
                      <div key={p.id} className="bg-[#111111] border border-[#2A2A2A] rounded-lg overflow-hidden flex flex-col group hover:border-[#E8B84B]/50 transition-colors">
                        <div className="aspect-square bg-[#1A1A1A] relative">
                          <ProductImage images={p.images} name={p.name} size="full" />
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-[10px] font-bold px-2 py-1 rounded text-white capitalize">
                            {p.category}
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="font-bold text-white mb-2 line-clamp-1">{p.name}</h3>
                          <div className="flex justify-between items-end mb-4">
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Sug. Retail</p>
                              <p className="text-lg font-black text-[#E8B84B]">{formatCurrency(p.suggestedRetailPrice)}</p>
                            </div>
                          </div>
                          <div className="mt-auto">
                            {isAdded ? (
                              <button disabled className="w-full py-2 bg-gray-500/10 text-gray-500 rounded text-sm font-bold cursor-not-allowed">
                                Already in Shop
                              </button>
                            ) : (
                              <CatalogAddButton product={p} onAdd={handleAddProduct} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredCatalog.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                      No products found matching your search.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CatalogAddButton({ product, onAdd }: { product: any, onAdd: (p: any, price: number) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [price, setPrice] = useState(product.suggestedRetailPrice || product.hvrsBasePrice * 1.5);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full py-2 bg-[#E8B84B] text-black rounded text-sm font-bold shadow hover:bg-[#E8B84B]/90 transition-colors"
      >
        Add to My Shop
      </button>
    );
  }

  const margin = price - product.hvrsBasePrice;

  return (
    <div className="bg-[#1A1A1A] p-3 rounded border border-[#00C9A7]">
      <p className="text-[10px] font-bold text-[#00C9A7] uppercase tracking-widest mb-2">Set Your Selling Price</p>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-400">Rs.</span>
        <input 
          type="number" 
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="flex-1 bg-[#111111] border border-[#2A2A2A] text-white px-2 py-1.5 rounded outline-none text-sm focus:border-[#E8B84B]"
          autoFocus
        />
      </div>
      <p className="text-xs text-gray-400 mb-3">
        You'll earn: <span className={`font-bold ${margin > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>Rs. {margin}</span>
      </p>
      <div className="flex gap-2">
        <button 
          onClick={() => setIsOpen(false)}
          className="flex-1 py-1.5 border border-[#2A2A2A] text-gray-400 rounded text-xs font-bold hover:bg-[#2A2A2A]"
        >
          Cancel
        </button>
        <button 
          onClick={() => {
            if (price <= 0) {
              toast.error('Price must be greater than 0');
              return;
            }
            onAdd(product, price);
          }}
          disabled={price <= 0}
          className="flex-1 py-1.5 bg-[#E8B84B] text-black rounded text-xs font-bold hover:bg-[#E8B84B]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm Add
        </button>
      </div>
    </div>
  );
}
