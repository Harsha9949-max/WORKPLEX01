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
  ChevronRight,
  Flame,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTeamData } from '../hooks/useTeamData';
import { useNavigate, Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';
import BadgeShowcase from '../components/gamification/BadgeShowcase';
import LevelProgress from '../components/gamification/LevelProgress';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function ProfileScreen() {
  const { userData, currentUser } = useAuth();
  const { teamMembers, commissionLogs } = useTeamData();
  const [showQR, setShowQR] = useState(false);
  const navigate = useNavigate();

  if (!userData) return null;

  const referralLink = `workplex.hvrs.in/join?ref=${currentUser?.uid}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Lead Marketer': return <Crown className="text-[#E8B84B]" />;
      case 'Manager': return <Briefcase className="text-blue-500" />;
      case 'Sub-Admin': return <ShieldCheck className="text-purple-500" />;
      default: return <Clipboard className="text-teal-500" />;
    }
  };

  const chartData = [
    { name: 'Direct Tasks', value: userData.totalEarned || 0, color: '#10B981' },
    { name: 'Team Comm.', value: userData.teamEarnings || 0, color: '#3B82F6' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 pb-24 text-white">
      {/* Role Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1A1A1A] to-[#111111] border border-white/10 rounded-3xl p-6 mb-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8B84B]/10 blur-3xl rounded-full" />
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl">
            {getRoleIcon(userData.role)}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black">{userData.role}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 bg-[#E8B84B]/20 text-[#E8B84B] rounded-full uppercase tracking-tighter">
                {userData.level || 'Bronze'}
              </span>
            </div>
          </div>
          <Link 
            to={`/u/${userData.username || currentUser?.uid}`}
            className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 text-[#E8B84B] flex items-center gap-2"
          >
            <ExternalLink size={18} />
          </Link>
        </div>

        {userData.role === 'Marketer' && (
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-400 uppercase">Progress to Lead Marketer</span>
              <span className="text-[#E8B84B]">{formatCurrency(userData.monthlyEarned || 0)} / Rs. 50,000</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((userData.monthlyEarned || 0) / 50000) * 100, 100)}%` }}
                className="h-full bg-[#E8B84B]"
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <CheckCircle2 size={12} className={userData.activeMonths >= 3 ? 'text-green-500' : ''} />
              <span>{userData.activeMonths || 0}/3 Active Months Required</span>
            </div>
          </div>
        )}
      </motion.div>

      <LevelProgress totalEarned={userData.totalEarned || 0} />

      <BadgeShowcase unlockedBadges={userData.badges || []} />

      {/* Referral Section */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Your Referral Link</h3>
        <div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/5 mb-4">
          <span className="text-xs text-gray-300 truncate flex-grow font-mono">{referralLink}</span>
          <button onClick={handleCopy} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <Copy size={16} className="text-[#E8B84B]" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl font-bold text-sm">
            <Share2 size={18} /> WhatsApp
          </button>
          <button onClick={() => setShowQR(true)} className="flex items-center justify-center gap-2 bg-white/5 text-white py-3 rounded-xl font-bold text-sm">
            <QrCode size={18} /> QR Code
          </button>
        </div>
      </div>

      {/* Team Stats (if applicable) */}
      {(userData.role === 'Lead Marketer' || userData.role === 'Manager') && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Users size={14} />
              <span className="text-[10px] font-bold uppercase">Team Size</span>
            </div>
            <p className="text-xl font-black">{userData.teamSize || 0}</p>
            <p className="text-[10px] text-gray-500 mt-1">Direct: {userData.directReferrals || 0}</p>
          </div>
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <TrendingUp size={14} />
              <span className="text-[10px] font-bold uppercase">Team Earnings</span>
            </div>
            <p className="text-xl font-black text-green-500">{formatCurrency(userData.teamEarnings || 0)}</p>
            <p className="text-[10px] text-gray-500 mt-1">This Month</p>
          </div>
        </div>
      )}

      {/* Earnings Breakdown */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Earnings Breakdown</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] text-gray-400 font-bold uppercase">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements & Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
            <Flame className="text-orange-500" size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">Streak</p>
            <p className="text-lg font-black">{userData.streak || 0} Days</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center">
            <Award className="text-teal-500" size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">Tasks</p>
            <p className="text-lg font-black">{userData.tasksCompleted || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
