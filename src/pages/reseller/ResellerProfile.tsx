import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Store, User, Settings, ExternalLink, LogOut, Package, TrendingUp } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function ResellerProfile() {
  const { userData, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  if (!userData) return null;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
         <div>
            <h1 className="text-2xl font-black text-white">My Profile</h1>
            <p className="text-xs text-gray-400 mt-1">{userData.email || currentUser?.email}</p>
         </div>
         <div className="flex gap-2">
            <button onClick={() => navigate('/reseller/settings')} className="w-10 h-10 border border-[#2A2A2A] bg-[#111111] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition">
               <Settings size={18} />
            </button>
            <button onClick={() => logout().then(() => navigate('/'))} className="w-10 h-10 border border-red-500/20 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500/20 transition">
               <LogOut size={18} />
            </button>
         </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1A1A1A] to-[#111111] border border-[#2A2A2A] rounded-[24px] p-6 mb-6 relative overflow-hidden shadow-xl"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#E8B84B] blur-[80px] opacity-10 rounded-full" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl flex items-center justify-center relative shadow-inner cursor-pointer" onClick={() => navigate('/reseller/settings')}>
             {userData.photoURL ? (
                <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
             ) : (
                <User className="text-[#E8B84B]" size={28} />
             )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-white">{userData.name || 'Reseller'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black px-2 py-0.5 bg-[#E8B84B] text-black rounded-sm uppercase tracking-widest">
                Partner
              </span>
            </div>
          </div>
          {userData.shopSlug && (
             <Link 
               to={`/shop/${userData.shopSlug}`}
               className="w-10 h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-full hover:bg-[#E8B84B]/10 text-[#E8B84B] flex items-center justify-center shadow-lg transition"
             >
               <ExternalLink size={16} />
             </Link>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
         <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 flex flex-col justify-center items-center text-center">
            <div className="text-teal-500 mb-2"><Store size={24} /></div>
            <span className="text-2xl font-black text-white">{userData.totalSales || 0}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Products Sold</span>
         </div>
         <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 flex flex-col justify-center items-center text-center">
            <div className="text-[#E8B84B] mb-2"><TrendingUp size={24} /></div>
            <span className="text-2xl font-black text-white">Rs. {userData.wallets?.earned || 0}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Total Profit</span>
         </div>
      </div>
      
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5 space-y-4">
         <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-[#2A2A2A] pb-3">Quick Actions</h3>
         <button onClick={() => navigate('/reseller/settings')} className="w-full flex justify-between items-center bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A] hover:border-[#E8B84B]/50 transition">
            <div className="flex items-center gap-3">
               <Settings size={18} className="text-[#E8B84B]" />
               <span className="text-sm font-bold text-white">Edit Store Details</span>
            </div>
            <ExternalLink size={16} className="text-gray-500" />
         </button>
         <button onClick={() => navigate('/reseller/products')} className="w-full flex justify-between items-center bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A] hover:border-[#E8B84B]/50 transition">
            <div className="flex items-center gap-3">
               <Package size={18} className="text-teal-500" />
               <span className="text-sm font-bold text-white">Manage Products</span>
            </div>
            <ExternalLink size={16} className="text-gray-500" />
         </button>
      </div>

    </div>
  );
}
