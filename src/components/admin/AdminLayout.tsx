import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Ticket, 
  CreditCard, 
  ShieldAlert, 
  UserPlus, 
  Megaphone,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Main Layout for Admin Panel.
 * Includes sticky sidebar and dynamic topbar.
 */
export default function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Partner Orders', path: '/admin/partner-orders', icon: Briefcase },
    { name: 'Workers', path: '/admin/workers', icon: Users },
    { name: 'Tasks', path: '/admin/tasks', icon: CheckSquare },
    { name: 'Coupons', path: '/admin/coupons', icon: Ticket },
    { name: 'Withdrawals', path: '/admin/withdrawals', icon: CreditCard },
    { name: 'Catalog', path: '/admin/catalog', icon: Briefcase },
    { name: 'Sub-Admins', path: '/admin/sub-admins', icon: UserPlus },
    { name: 'Fraud Alerts', path: '/admin/fraud', icon: ShieldAlert },
    { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-white">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] border-r border-[#2A2A2A] transition-transform duration-300 lg:translate-x-0 lg:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6">
            <h1 className="text-xl font-black text-[#E8B84B] tracking-tighter">WORKPLEX ADMIN</h1>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm
                  ${isActive ? 'bg-[#E8B84B]/10 text-[#E8B84B]' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                `}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon size={20} />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-[#2A2A2A] bg-[#0A0A0A]/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#E8B84B]/20 flex items-center justify-center text-[#E8B84B] font-bold">
                {currentUser?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate">{currentUser?.email?.split('@')[0]}</p>
                <p className="text-[10px] text-gray-500 truncate">{currentUser?.email === 'marateyh@gmail.com' ? 'Super Admin' : 'Sub-Admin'}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-bold text-[#EF4444] hover:text-[#FF5F5F] transition-colors"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-[#111111] border-b border-[#2A2A2A] px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-black uppercase tracking-widest text-[#E8B84B]">Control Center</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 bg-[#0A0A0A] border border-[#2A2A2A] px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Healthy</span>
            </div>
            <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Bell size={20} className="text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-10 scrollbar-hide">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
