import React, { useState, useMemo } from 'react';
import { CatalogProduct } from '../../../hooks/admin/useCatalogProducts';
import { Search, ChevronLeft, ChevronRight, Edit2, Trash2, Power } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';

interface Props {
  products: CatalogProduct[];
  loading: boolean;
  toggleActive: (id: string, current: boolean) => void;
  deleteProduct: (id: string) => void;
}

export default function CatalogTable({ products, loading, toggleActive, deleteProduct }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, categoryFilter]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      deleteProduct(id);
    }
  };

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-[32px] overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-6 border-b border-[#2A2A2A] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-lg font-black text-white uppercase tracking-wider">Catalog Inventory</h3>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search SKU or Name..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="bg-black border border-white/10 text-white pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:border-[#E8B84B]"
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="bg-black border border-white/10 text-white px-4 py-2 rounded-xl text-sm outline-none focus:border-[#E8B84B]"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Product</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Category</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Base Price</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Suggested</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A2A]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-6 py-8 h-16 bg-white/[0.01]"></td>
                </tr>
              ))
            ) : paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-bold">No products found.</td>
              </tr>
            ) : paginatedProducts.map((p) => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#2A2A2A] shrink-0 border border-white/10">
                      {p.images && p.images[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#E8B84B] font-bold text-xs">No Img</div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white max-w-[200px] truncate">{p.name}</p>
                      <p className="text-[10px] font-mono text-gray-400 mt-1">{p.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-300 text-xs font-bold uppercase tracking-wider">{p.category}</td>
                <td className="px-6 py-4 text-right font-mono text-[#00C9A7] font-bold">{formatCurrency(p.hvrsBasePrice)}</td>
                <td className="px-6 py-4 text-right font-mono text-[#E8B84B] font-bold">{formatCurrency(p.suggestedRetailPrice)}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${p.isActive ? 'bg-[#00C9A7]/10 text-[#00C9A7]' : 'bg-red-500/10 text-red-500'}`}>
                    {p.isActive ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => toggleActive(p.id, p.isActive)}
                      className={`p-2 rounded-lg transition-colors ${p.isActive ? 'text-red-400 hover:bg-red-500/10' : 'text-[#00C9A7] hover:bg-[#00C9A7]/10'}`}
                      title={p.isActive ? 'Disable' : 'Enable'}
                    >
                      <Power size={16} />
                    </button>
                    {/* Edit feature can be expanded later, for now we have batch excel replace */}
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Product"
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

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="p-4 border-t border-[#2A2A2A] flex justify-between items-center bg-[#1A1A1A]">
          <span className="text-xs text-gray-500 font-bold">Showing page {currentPage} of {totalPages}</span>
          <div className="flex gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-2 bg-black border border-white/10 rounded-lg text-white disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-2 bg-black border border-white/10 rounded-lg text-white disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
