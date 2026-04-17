import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Upload, 
  Trash2, 
  Edit3, 
  Search, 
  Package, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  X,
  Database,
  Tag,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../lib/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function AdminCatalogManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const q = collection(db, 'catalogProducts');
      const snap = await getDocs(q);
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error('Failed to fetch catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setUploadPreview(data);
      setShowUploadModal(true);
    };
    reader.readAsBinaryString(file);
  };

  const commitBatchUpload = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      uploadPreview.forEach((item: any) => {
        const productRef = doc(collection(db, 'catalogProducts'));
        batch.set(productRef, {
          SKU: item.SKU || `HVRS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          name: item.Name || 'New Product',
          category: item.Category || 'General',
          hvrsBasePrice: parseFloat(item['Base Price']) || 0,
          suggestedRetailPrice: parseFloat(item['Suggested Price']) || 0,
          images: [item['Image URL'] || 'https://picsum.photos/seed/product/400/400'],
          isActive: true,
          createdAt: serverTimestamp()
        });
      });
      await batch.commit();
      toast.success(`Imported ${uploadPreview.length} products!`);
      setShowUploadModal(false);
      fetchProducts();
    } catch (error) {
      toast.error('Import failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure? This will remove it from all new partner searches.')) return;
    try {
      await deleteDoc(doc(db, 'catalogProducts', id));
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product removed');
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.SKU.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Master Catalog</h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Inventory Management System</p>
        </div>
        <div className="flex gap-2">
          <label className="bg-white/5 border border-white/10 p-4 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
            <Upload size={20} className="text-gray-400" />
            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileUpload} />
          </label>
          <button className="bg-teal-500 text-black px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
            <Plus size={16} /> New Product
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total items', value: products.length, icon: Package },
          { label: 'Categories', value: new Set(products.map(p => p.category)).size, icon: Tag },
          { label: 'Active', value: products.filter(p => p.isActive).length, icon: Database },
        ].map(stat => (
          <div key={stat.label} className="bg-[#111111] p-6 rounded-[32px] border border-white/5">
            <stat.icon className="text-teal-500 mb-3" size={20} />
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
            <h4 className="text-2xl font-black text-white">{stat.value}</h4>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
        <Search size={18} className="text-gray-600" />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by SKU or name..." 
          className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-700"
        />
      </div>

      {/* Product List */}
      <div className="bg-[#111111] rounded-[40px] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Image</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Product Details</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Base Price</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Suggested</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Category</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="p-6">
                    <img src={product.images[0]} className="w-12 h-12 rounded-xl object-cover" />
                  </td>
                  <td className="p-6">
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-tight">{product.name}</p>
                      <p className="text-[8px] text-gray-600 font-bold font-mono uppercase">{product.SKU}</p>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-xs font-black text-white">Rs.{product.hvrsBasePrice}</span>
                  </td>
                  <td className="p-6">
                    <span className="text-xs font-black text-teal-500">Rs.{product.suggestedRetailPrice}</span>
                  </td>
                  <td className="p-6">
                    <span className="px-2 py-1 bg-white/5 rounded-md text-[8px] font-black text-gray-500 uppercase tracking-widest">{product.category}</span>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-gray-400">
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="p-3 bg-red-500/10 rounded-xl hover:bg-red-500/20 text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Preview Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-4xl bg-[#111111] border border-white/10 rounded-[40px] overflow-hidden"
            >
              <div className="p-8 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-500">
                    <Package size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Import Preview</h3>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Found {uploadPreview.length} products to import</p>
                  </div>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X className="text-gray-500" />
                </button>
              </div>

              <div className="p-8 max-h-[50vh] overflow-y-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-white/5">
                      <th className="pb-4">Name</th>
                      <th className="pb-4">SKU</th>
                      <th className="pb-4">Base P.</th>
                      <th className="pb-4">Suggested P.</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-400 text-xs">
                    {uploadPreview.slice(0, 10).map((p: any, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-4 font-bold text-white uppercase">{p.Name || p.name}</td>
                        <td className="py-4">{p.SKU || p.sku}</td>
                        <td className="py-4">Rs.{p['Base Price'] || p.hvrsBasePrice}</td>
                        <td className="py-4 font-black text-teal-500">Rs.{p['Suggested Price'] || p.suggestedRetailPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-8 bg-black/40 border-t border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                  <AlertCircle size={14} /> Only valid products will be imported
                </div>
                <button 
                  onClick={commitBatchUpload}
                  disabled={loading}
                  className="bg-teal-500 text-black px-10 py-4 rounded-[28px] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-teal-500/20"
                >
                  {loading ? 'Processing...' : 'Confirm Import'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
