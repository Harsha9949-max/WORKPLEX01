import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Award, Zap, Star, Shield, Lock, ChevronRight, CheckCircle, TrendingUp, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RewardsCenter() {
  const { userData } = useAuth();
  
  const currentEarnings = userData?.wallets?.earned || 0;

  const ranks = [
    { name: 'Bronze Explorer', threshold: 0, multiplier: '1.0x', icon: Star, color: 'text-amber-700' },
    { name: 'Silver Creator', threshold: 2500, multiplier: '1.2x', icon: Shield, color: 'text-gray-300' },
    { name: 'Gold Pro', threshold: 5000, multiplier: '1.5x', icon: Award, color: 'text-yellow-400' },
    { name: 'Platinum Elite', threshold: 10000, multiplier: '2.0x', icon: Zap, color: 'text-cyan-400' },
    { name: 'Diamond Legend', threshold: 25000, multiplier: '3.0x', icon: Sparkles, color: 'text-purple-400' }
  ];

  const currentRankIndex = ranks.reduce((acc, rank, idx) => (currentEarnings >= rank.threshold ? idx : acc), 0);
  const currentRank = ranks[currentRankIndex];
  const nextRank = ranks[currentRankIndex + 1] || currentRank;
  
  const nextRankThreshold = nextRank.threshold > 0 ? nextRank.threshold : 1;
  const progressPercent = currentRank === nextRank ? 100 : (currentEarnings / nextRankThreshold) * 100;
  const earningsRemaining = currentRank === nextRank ? 0 : nextRank.threshold - currentEarnings;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 md:pb-0 font-sans text-white md:p-8">
      <div className="p-4 md:p-0 max-w-7xl mx-auto space-y-8">
        
        {/* Header & Active Rank */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-br from-[#1A1A1A] to-[#111111] border border-[#2A2A2A] rounded-3xl p-6 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-24 h-24 bg-[#111111] border-4 border-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.2)]">
              <currentRank.icon size={48} className={currentRank.color} />
            </div>
            <div>
              <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Current Prestige Rank</h2>
              <h1 className="text-4xl font-black uppercase text-white tracking-tight mb-2 flex items-center gap-3">
                {currentRank.name} <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-1 rounded-lg">{currentRank.multiplier} Boost</span>
              </h1>
              {currentRank !== nextRank ? (
                <p className="text-sm font-medium text-gray-400">Unlock {nextRank.name} to maximize your network overrides.</p>
              ) : (
                <p className="text-sm font-medium text-gray-400">You have reached the maximum rank!</p>
              )}
            </div>
          </div>

          <div className="w-full md:w-1/3 bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 relative z-10">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Rank Progress</span>
              <span className="text-sm font-black text-white">Rs. {currentEarnings} <span className="text-gray-500">/ {currentRank === nextRank ? 'MAX' : `Rs. ${nextRankThreshold}`}</span></span>
            </div>
            <div className="h-3 bg-[#1A1A1A] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-300 rounded-full" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center mt-3">{earningsRemaining > 0 ? `Rs. ${earningsRemaining} remaining for ${nextRank.name}` : 'Max level reached'}</p>
          </div>
        </div>

        {/* Tier Progression Map */}
        <div>
          <h3 className="text-lg font-black uppercase text-white mb-6">Progression Path</h3>
          <div className="grid md:grid-cols-5 gap-4">
            {ranks.map((rank, idx) => {
              const Icon = rank.icon;
              const unlocked = currentEarnings >= rank.threshold;
              return (
                <div key={idx} className={`relative p-5 rounded-2xl border transition-all ${unlocked ? 'bg-[#111111] border-yellow-500/30' : 'bg-[#111111]/50 border-[#2A2A2A] opacity-70'}`}>
                  {unlocked ? (
                    <CheckCircle size={16} className="absolute top-4 right-4 text-emerald-500" />
                  ) : (
                    <Lock size={16} className="absolute top-4 right-4 text-gray-600" />
                  )}
                  
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${unlocked ? 'bg-[#1A1A1A]' : 'bg-[#0A0A0A]'}`}>
                    <Icon size={24} className={unlocked ? rank.color : 'text-gray-600'} />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{rank.name}</h4>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Rs. {rank.threshold} earned required</p>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-[#1A1A1A] px-2 py-1 rounded text-white">{rank.multiplier} earning</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Available Badges */}
        <div>
          <h3 className="text-lg font-black uppercase text-white mb-6 flex items-center gap-2"><Sparkles className="text-indigo-500"/> Achievement Badges</h3>
          <div className="grid md:grid-cols-3 gap-4">
            
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 flex items-center gap-4 hover:border-indigo-500/50 transition cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                <TrendingUp size={24} className="text-indigo-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Viral Creator</h4>
                <p className="text-xs text-gray-400 mb-2">Achieve 10k+ views on a single mission post.</p>
                <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full"><div className="w-[40%] bg-indigo-500 h-full rounded-full"></div></div>
              </div>
            </div>

            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 flex items-center gap-4 hover:border-emerald-500/50 transition cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Shield size={24} className="text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Loyal Leader</h4>
                <p className="text-xs text-gray-400 mb-2">Maintain a team of 50 active users for 30 days.</p>
                <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full"><div className="w-full bg-emerald-500 h-full rounded-full"></div></div>
              </div>
            </div>

            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-5 flex items-center gap-4 hover:border-pink-500/50 transition cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0">
                <Zap size={24} className="text-pink-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Task Machine</h4>
                <p className="text-xs text-gray-400 mb-2">Complete 100 missions with 100% approval.</p>
                <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full"><div className="w-[85%] bg-pink-500 h-full rounded-full"></div></div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
