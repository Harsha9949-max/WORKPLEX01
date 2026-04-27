import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Package, ShoppingCart, Store, 
  BarChart, Wallet, Settings, LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { Logo } from '../ui/Logo';

export default function ResellerLayout() {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/reseller/dashboard' },
    { icon: Package, label: 'My Products', path: '/reseller/products' },
    { icon: ShoppingCart, label: 'Orders', path: '/reseller/orders' },
    { icon: Store, label: 'My Shop', path: '/reseller/my-shop' },
    { icon: BarChart, label: 'Performance', path: '/reseller/performance' },
    { icon: Wallet, label: 'Earnings', path: '/reseller/earnings' },
    { icon: Settings, label: 'Settings', path: '/reseller/settings' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col md:flex-row text-white font-sans">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 flex-col bg-[#111111] border-r border-[#2A2A2A] h-screen sticky top-0 shrink-0">
        <div className="p-6 border-b border-[#2A2A2A] flex flex-col justify-center">
          <Logo variant="primary" size="sm" />
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">Partner Panel</p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-[#E8B84B]/10 text-[#E8B84B]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#2A2A2A]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 bg-[#E8B84B]/20 rounded-full flex items-center justify-center text-[#E8B84B] font-bold shrink-0">
              {userData?.name?.charAt(0) || 'R'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{userData?.name || 'Reseller'}</p>
              <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-bold"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full md:w-[calc(100%-16rem)] min-h-screen">
        <div className="pb-24 md:pb-0 min-h-screen">
          <Outlet />
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#2A2A2A] z-50 px-2 py-2 pb-safe flex justify-between items-center text-gray-400">
        {[navItems[0], navItems[1], navItems[2], navItems[3], navItems[5]].map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
                isActive ? 'text-[#E8B84B]' : 'hover:text-white'
              }`}
            >
              <item.icon size={20} className="mb-1" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
