import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { 
  Award, 
  Flame, 
  Star, 
  Crown, 
  Share2, 
  CheckCircle2, 
  Users, 
  ExternalLink,
  ChevronRight,
  Shield,
  Zap,
  Target,
  Trophy,
  Rocket,
  Gem
} from 'lucide-react';
import { format } from 'date-fns';
import { BADGES } from '../constants/gamification';
import SkeletonLoader from '../components/dashboard/SkeletonLoader';
import { Logo } from '../components/ui/Logo';
import toast from 'react-hot-toast';

export default function PublicProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      
      const q = query(collection(db, 'publicProfiles'), where('__name__', '==', username));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        setProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [username]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied!');
  };

  if (loading) return <SkeletonLoader />;

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-black text-white mb-4">User Not Found</h1>
        <p className="text-gray-500 mb-8 max-w-xs">The worker profile you're looking for doesn't exist or is private.</p>
        <Link to="/" className="bg-[#E8B84B] text-black font-black px-8 py-4 rounded-2xl">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-[#E8B84B]/5 to-transparent pointer-events-none" />
      
      <div className="max-w-md mx-auto px-6 pt-12 pb-32 relative z-10">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-[#111111]/80 backdrop-blur-2xl border border-white/10 rounded-[48px] p-8 shadow-2xl mb-8 group"
        >
          {/* Gold Border Glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500/20 to-amber-500/0 rounded-[48px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-[36px] bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border-4 border-[#E8B84B] flex items-center justify-center p-1 overflow-hidden shadow-2xl">
                <img 
                  src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${profile.id}&backgroundColor=transparent`}
                  alt={profile.displayName}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-[#111111] p-1.5 rounded-2xl shadow-lg">
                <CheckCircle2 size={16} className="text-black" />
              </div>
            </div>

            <h1 className="text-3xl font-black text-white mb-2">@{profile.id}</h1>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-[#E8B84B]">{profile.venture}</span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400">{profile.role}</span>
            </div>

            {/* Public Stats Grid */}
            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="bg-black/40 rounded-3xl p-5 border border-white/5 flex flex-col items-center">
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <Star size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Level</span>
                </div>
                <span className="text-xl font-black text-white">{profile.level || 'Bronze'}</span>
              </div>
              
              <div className="bg-black/40 rounded-3xl p-5 border border-white/5 flex flex-col items-center">
                <div className="flex items-center gap-2 text-red-500 mb-1">
                  <Flame size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Streak</span>
                </div>
                <span className="text-xl font-black text-white">{profile.streakRecord || 0} Days</span>
              </div>
            </div>

            {/* Earnings (If public) */}
            {profile.totalEarned && (
              <div className="w-full bg-[#E8B84B]/10 border border-[#E8B84B]/20 rounded-3xl p-6 mb-8 flex items-center justify-between group cursor-default">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E8B84B]/60">Verified Earnings</span>
                  <div className="text-2xl font-black text-white flex items-center gap-1">
                    Rs.{profile.totalEarned.toLocaleString()}
                  </div>
                </div>
                <div className="w-12 h-12 bg-[#E8B84B] rounded-2xl flex items-center justify-center shadow-lg shadow-[#E8B84B]/20">
                  <Crown size={24} className="text-black" />
                </div>
              </div>
            )}

            {/* Badge Showcase */}
            <div className="w-full text-left">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Award size={16} className="text-gray-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Achievements</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {profile.badges?.map((badgeId: string) => {
                  const badge = BADGES.find(b => b.id === badgeId);
                  if (!badge) return null;
                  const Icon = badge.icon;
                  return (
                    <motion.div
                      key={badgeId}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="aspect-square bg-[#1A1A1A] border border-white/5 rounded-2xl flex items-center justify-center p-2"
                      title={badge.name}
                    >
                      <Icon className="text-[#E8B84B]" size={24} />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <div className="space-y-4">
          <button 
            onClick={handleShare}
            className="w-full py-5 bg-white/5 border border-white/10 rounded-[32px] text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
          >
            <Share2 size={18} />
            Copy Profile Link
          </button>
          
          <Link 
            to={`/onboarding?ref=${profile.uid}`}
            className="w-full py-6 bg-[#E8B84B] text-black rounded-[32px] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#E8B84B]/20"
          >
            Join My Team
            <ChevronRight size={20} />
          </Link>
        </div>

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-2 gap-4 opacity-50">
          <div className="flex items-center gap-3 px-2">
            <Shield size={16} className="text-gray-400" />
            <span className="text-[10px] uppercase font-bold text-gray-400">Verified Worker</span>
          </div>
          <div className="flex items-center gap-3 px-2">
            <Users size={16} className="text-gray-400" />
            <span className="text-[10px] uppercase font-bold text-gray-400">Team Leader</span>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-gray-700">
          Member since {profile.joinedAt ? format(profile.joinedAt.toDate(), 'MM/yyyy') : 'Unrecorded'}
        </p>
      </div>

      {/* Footer Branding */}
      <div className="fixed bottom-0 left-0 w-full p-8 flex justify-center bg-gradient-to-t from-[#0A0A0A] to-transparent">
        <Link to="/" className="opacity-50 hover:opacity-100 transition-opacity">
          <Logo variant="mono" size="xs" />
        </Link>
      </div>
    </div>
  );
}
