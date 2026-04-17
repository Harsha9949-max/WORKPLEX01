import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronRight, 
  Mail, 
  Phone, 
  Calendar,
  TrendingUp,
  UserPlus,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTeamData } from '../hooks/useTeamData';
import { formatCurrency } from '../utils/format';
import { format } from 'date-fns';

export default function TeamManagement() {
  const navigate = useNavigate();
  const { teamMembers, loading } = useTeamData();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredMembers = teamMembers.filter(m => {
    const matchesSearch = m.memberName.toLowerCase().includes(search.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'level1') return matchesSearch && m.level === 1;
    if (filter === 'level2') return matchesSearch && m.level === 2;
    if (filter === 'inactive') return matchesSearch && !m.isActive;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black">Team Management</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
            {teamMembers.length} Total Members
          </p>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Users size={14} />
            <span className="text-[10px] font-bold uppercase">Active Members</span>
          </div>
          <p className="text-xl font-black">{teamMembers.filter(m => m.isActive).length}</p>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <TrendingUp size={14} />
            <span className="text-[10px] font-bold uppercase">Growth</span>
          </div>
          <p className="text-xl font-black text-teal-500">+{teamMembers.filter(m => {
            const joined = m.joinedAt?.toDate();
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return joined > weekAgo;
          }).length}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-[#E8B84B]/50 transition-colors"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['all', 'level1', 'level2', 'inactive'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap transition-colors ${
                filter === f ? 'bg-[#E8B84B] text-black' : 'bg-white/5 text-gray-400'
              }`}
            >
              {f.replace('level', 'Level ')}
            </button>
          ))}
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center relative">
                  <span className="text-lg font-bold">{member.memberName[0]}</span>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#111111] ${member.isActive ? 'bg-green-500' : 'bg-gray-600'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{member.memberName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Level {member.level}</span>
                    <span className="w-1 h-1 bg-gray-700 rounded-full" />
                    <span className="text-[10px] font-bold text-[#E8B84B] uppercase">{member.memberRole}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-black">{formatCurrency(member.totalEarnings || 0)}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Earnings</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredMembers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-700 mb-4" size={48} />
            <p className="text-gray-500 font-bold">No members found</p>
          </div>
        )}
      </div>
    </div>
  );
}
