import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Briefcase, 
  ShieldCheck, 
  Clipboard, 
  Users, 
  TrendingUp, 
  Award, 
  Copy, 
  Share2, 
  QrCode,
  Flame,
  CheckCircle2,
  ExternalLink,
  Settings,
  LogOut,
  Camera,
  CheckCircle,
  Award as AwardIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTeamData } from '../hooks/useTeamData';
import { useNavigate, Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';
import BadgeShowcase from '../components/gamification/BadgeShowcase';
import LevelProgress from '../components/gamification/LevelProgress';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import QRCode from 'react-qr-code';

export default function ProfileScreen() {
  const { userData, currentUser, logout } = useAuth();
  const { teamMembers } = useTeamData();
  const [showQR, setShowQR] = useState(false);
  const navigate = useNavigate();

  if (!userData) return null;

  const referralCode = userData.referralCode || currentUser?.uid?.substring(0,6).toUpperCase();
  const referralLink = `${window.location.origin}/join?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  const handleWhatsAppShare = () => {
    const text = `Hey! Join me on WorkPlex and start earning. Use my invite code: *${referralCode}* or click here: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Lead Marketer': return <Crown className="text-[#E8B84B]" size={28} />;
      case 'Manager': return <Briefcase className="text-blue-500" size={28} />;
      case 'Sub-Admin': return <ShieldCheck className="text-purple-500" size={28} />;
      case 'Content Creator': return <Camera className="text-pink-500" size={28} />;
      default: return <Clipboard className="text-[#00C9A7]" size={28} />;
    }
  };

  const chartData = [
    { name: 'Direct Tasks', value: userData.totalEarned || 0, color: '#10B981' },
    { name: 'Team Comm.', value: userData.teamEarnings || 0, color: '#3B82F6' },
    { name: 'Bonuses', value: userData.wallets?.bonus || 0, color: '#8B5CF6' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 pb-28 font-sans text-white max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pt-2">
         <div>
            <h1 className="text-[22px] font-bold text-white leading-tight">My Profile</h1>
            <p className="text-[13px] text-gray-400 mt-1">{userData.email || currentUser?.email}</p>
         </div>
         <div className="flex gap-2">
            <button className="w-10 h-10 border border-[#2A2A2A] bg-[#111111] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition">
               <Settings size={18} />
            </button>
            <button onClick={handleLogout} className="w-10 h-10 border border-red-500/20 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500/20 transition">
               <LogOut size={18} />
            </button>
         </div>
      </div>

      {/* Role Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1A1A1A] to-[#111111] border border-[#2A2A2A] rounded-[24px] p-6 mb-6 relative overflow-hidden shadow-xl"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#E8B84B] blur-[80px] opacity-10 rounded-full" />
        
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className="w-16 h-16 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner cursor-pointer" onClick={() => navigate('/settings')}>
             {userData.photoURL ? (
                <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
             ) : (
                <>
                   <div className="absolute inset-0 bg-white/5"></div>
                   {getRoleIcon(userData.role)}
                </>
             )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-white">{userData.name || 'Promoter'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black px-2 py-0.5 bg-[#E8B84B] text-black rounded-sm uppercase tracking-widest">
                {userData.role}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#2A2A2A] text-gray-300 rounded-sm uppercase tracking-widest">
                Level {userData.level || 1}
              </span>
            </div>
          </div>
          <Link 
            to={`/u/${userData.username || currentUser?.uid}`}
            className="w-10 h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-full hover:bg-white/5 text-[#E8B84B] flex items-center justify-center shadow-lg transition"
          >
            <ExternalLink size={16} />
          </Link>
        </div>

        {userData.role === 'Marketer' && (
          <div className="space-y-3 bg-[#0A0A0A] p-4 rounded-xl border border-[#2A2A2A]">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
              <span className="text-gray-500">Progress to Lead</span>
              <span className="text-[#E8B84B]">{formatCurrency(userData.monthlyEarned || 0)} / 50K</span>
            </div>
            <div className="h-1.5 bg-[#111111] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((userData.monthlyEarned || 0) / 50000) * 100, 100)}%` }}
                className="h-full bg-[#E8B84B]"
              />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase">
              <CheckCircle2 size={12} className={userData.activeMonths >= 3 ? 'text-[#10B981]' : 'text-gray-600'} />
              <span>{userData.activeMonths || 0}/3 Active Months Required</span>
            </div>
          </div>
        )}
      </motion.div>

      {userData.role === 'Content Creator' ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
           <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex flex-col justify-center text-center">
              <div className="text-pink-500 mb-1 flex justify-center"><Camera size={20} /></div>
              <span className="text-2xl font-black text-white">{userData.contentStats?.totalSubmitted || 0}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Submitted</span>
           </div>
           <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex flex-col justify-center text-center">
              <div className="text-[#10B981] mb-1 flex justify-center"><CheckCircle size={20} /></div>
              <span className="text-2xl font-black text-white">{userData.contentStats?.approvalRate || 100}%</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Approval Rate</span>
           </div>
           <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex flex-col justify-center text-center">
              <div className="text-[#3B82F6] mb-1 flex justify-center"><AwardIcon size={20} /></div>
              <span className="text-2xl font-black text-white">{userData.badges?.length || 0}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Achievements</span>
           </div>
           <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex flex-col justify-center text-center">
              <div className="text-yellow-500 mb-1 flex justify-center"><TrendingUp size={20} /></div>
              <span className="text-2xl font-black text-white">{userData.contentStats?.totalApproved || 0}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Approved</span>
           </div>
        </div>
      ) : (
        <>
          <LevelProgress totalEarned={userData.totalEarned || 0} />
          <BadgeShowcase unlockedBadges={userData.badges || []} />
        </>
      )}

      {/* Referral Section */}
      <div className="bg-[#111111] border border-[#E8B84B]/30 rounded-2xl p-5 mb-6 relative overflow-hidden shadow-[0_0_30px_rgba(232,184,75,0.05)]">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#E8B84B] blur-[80px] opacity-20 pointer-events-none" />
        <h3 className="text-xs font-black text-[#E8B84B] uppercase tracking-widest mb-1 flex items-center gap-2">
            Invite & Earn
        </h3>
        <p className="text-sm font-medium text-gray-400 mb-4">Build your team and earn commissions on their tasks!</p>
        
        <div className="flex items-center justify-between mb-4 bg-[#0A0A0A] border border-[#2A2A2A] p-4 rounded-xl">
           <div>
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Your Code</p>
               <p className="text-2xl font-black text-white tracking-widest">{referralCode}</p>
           </div>
           <button onClick={() => {
              navigator.clipboard.writeText(referralCode);
              toast.success('Code copied!');
           }} className="w-10 h-10 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg flex items-center justify-center hover:bg-[#2A2A2A] transition text-gray-300">
               <Copy size={16} />
           </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleWhatsAppShare} className="flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#10B981]/90 text-black py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-500/20 transition">
            <Share2 size={16} /> WhatsApp
          </button>
          <button onClick={() => setShowQR(true)} className="flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-[#2A2A2A] text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition">
            <QrCode size={16} /> Show QR
          </button>
        </div>
      </div>

      {/* Team Stats (if applicable) */}
      {(userData.role === 'Lead Marketer' || userData.role === 'Manager') && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex flex-col justify-center items-center text-center">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex justify-center items-center mb-2">
               <Users size={14} className="text-blue-500" />
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Team Size</p>
            <p className="text-2xl font-black text-white">{userData.teamSize || 0}</p>
          </div>
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex flex-col justify-center items-center text-center">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex justify-center items-center mb-2">
               <TrendingUp size={14} className="text-green-500" />
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Team Earnings</p>
            <p className="text-xl font-black text-green-500">{formatCurrency(userData.teamEarnings || 0)}</p>
          </div>
        </div>
      )}

      {/* Earnings Breakdown */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 mb-6">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Earnings Breakdown</h3>
        <div className="h-48 border border-[#2A2A2A] rounded-xl bg-[#0A0A0A] p-2 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                formatter={(value: number) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-4 flex-wrap">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 border border-[#2A2A2A] px-2 py-1 rounded-md bg-[#1A1A1A]">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Path to Manager Section */}
      {userData.role === 'Lead Marketer' && (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
             <Briefcase className="text-blue-500" size={18} />
             <h3 className="text-[14px] font-black text-white uppercase tracking-widest">Path to Manager</h3>
          </div>
          <p className="text-sm text-gray-400 font-medium mb-4">
             Become a Manager to unlock <span className="text-white font-bold">10% Team Commission</span>, higher priorities, and custom campaigns!
          </p>
          <div className="space-y-4">
             <div>
                <div className="flex justify-between items-center mb-1">
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Team Size (Target: 30)</span>
                   <span className={`text-[10px] font-bold ${userData.teamSize >= 30 ? 'text-green-500' : 'text-[#E8B84B]'}`}>
                      {userData.teamSize || 0} / 30
                   </span>
                </div>
                <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden">
                   <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${Math.min(((userData.teamSize || 0) / 30) * 100, 100)}%`}}></div>
                </div>
             </div>
             <div>
                <div className="flex justify-between items-center mb-1">
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Monthly Team Earnings (Target: Rs.15,000)</span>
                   <span className={`text-[10px] font-bold ${(userData.teamEarningsThisMonth || 0) >= 15000 ? 'text-green-500' : 'text-[#E8B84B]'}`}>
                      {formatCurrency(userData.teamEarningsThisMonth || 0)} / 15K
                   </span>
                </div>
                <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden">
                   <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${Math.min(((userData.teamEarningsThisMonth || 0) / 15000) * 100, 100)}%`}}></div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Achievements & Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex flex-col justify-center items-center text-center">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center mb-2">
            <Flame className="text-orange-500" size={20} />
          </div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Streak</p>
          <p className="text-lg font-black">{userData.streak || 0}  Days</p>
        </div>
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex flex-col justify-center items-center text-center">
          <div className="w-10 h-10 bg-[#00C9A7]/10 rounded-xl flex items-center justify-center mb-2">
            <Award className="text-[#00C9A7]" size={20} />
          </div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Tasks Done</p>
          <p className="text-lg font-black">{userData.tasksCompleted || 0}</p>
        </div>
      </div>

      {showQR && (
         <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-8 max-w-sm w-full flex flex-col items-center">
               <h3 className="text-xl font-black mb-4">Scan to Join</h3>
               <div className="bg-white p-4 rounded-xl mb-4">
                  <QRCode value={referralLink} size={200} />
               </div>
               <p className="text-center text-gray-400 text-sm mb-6 font-medium">Have your friend scan this code to join your team automatically.</p>
               <button onClick={() => setShowQR(false)} className="w-full bg-[#E8B84B] text-black font-black uppercase py-4 rounded-xl transition hover:scale-105 min-h-[48px]">Close</button>
            </motion.div>
         </div>
      )}
    </div>
  );
}
