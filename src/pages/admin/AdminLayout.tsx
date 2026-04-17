import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Outlet, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CheckSquare, Ticket, 
  CreditCard, UserPlus, AlertTriangle, Megaphone, LogOut 
} from 'lucide-react';

export default function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (currentUser?.email !== 'marateyh@gmail.com') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white p-8 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
        <button onClick={() => navigate('/home')} className="bg-[#E8B84B] text-black px-4 py-2 rounded">Go Home</button>
      </div>
    );
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/workers', label: 'Workers', icon: Users },
    { path: '/admin/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/admin/coupons', label: 'Coupons', icon: Ticket },
    { path: '/admin/withdrawals', label: 'Withdrawals', icon: CreditCard },
    { path: '/admin/sub-admins', label: 'Sub-Admins', icon: UserPlus },
    { path: '/admin/fraud-alerts', label: 'Fraud Alerts', icon: AlertTriangle },
    { path: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111111] border-r border-[#2A2A2A] flex flex-col">
        <div className="p-6 border-b border-[#2A2A2A] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8B84B] to-[#d4a63f] flex items-center justify-center shadow-[0_0_20px_rgba(232,184,75,0.3)] overflow-hidden p-1">
            <img src="https://gcdnb.pbrd.co/images/-QD5NsLGLsZD.png" alt="WorkPlex Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <span className="font-bold text-xl tracking-tight">WorkPlex Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-[#E8B84B]/10 text-[#E8B84B]' 
                    : 'text-gray-400 hover:bg-[#1A1A1A] hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#2A2A2A]">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin</p>
              <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
            </div>
          </div>
          <button 
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="w-full mt-2 flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-[#111111] border-b border-[#2A2A2A] flex items-center justify-between px-8 shrink-0">
          <h1 className="text-2xl font-bold text-white">
            {navItems.find(item => item.path === location.pathname)?.label || 'Admin Panel'}
          </h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <AlertTriangle className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#111111]"></span>
            </button>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
