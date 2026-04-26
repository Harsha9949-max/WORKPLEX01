import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, TrendingUp, TrendingDown, Minus, Search } from 'lucide-react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export default function LeaderboardScreen() {
  const { userData, currentUser } = useAuth();
  const [venture, setVenture] = useState('BuyRix');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'leaderboard'),
      where('venture', '==', venture),
      limit(100)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      let data: any[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.earnings || 0) - (a.earnings || 0));
      setEntries(data.slice(0, 20));
      setLoading(false);
    }, (error) => {
      console.error("Leaderboard subscribe error:", error);
      setLoading(false);
    });

    return unsub;
  }, [venture]);

  const top3 = entries.slice(0, 3);
  const others = entries.slice(3);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black">Leaderboard</h1>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
          Resets in 4d 12h
        </div>
      </div>

      {/* Venture Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-6">
        {['BuyRix', 'Vyuma', 'Zaestify', 'Growplex'].map((v) => (
          <button
            key={v}
            onClick={() => setVenture(v)}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase whitespace-nowrap transition-all ${
              venture === v ? 'bg-[#00C9A7] text-black shadow-lg shadow-[#00C9A7]/20' : 'bg-white/5 text-gray-400'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Top 3 Section */}
      <div className="flex items-end justify-center gap-2 mb-10 mt-4 px-2">
        {/* Rank 2 */}
        {top3[1] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center"
          >
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-2xl border-2 border-gray-400 overflow-hidden bg-white/5">
                <img src={top3[1].photoURL || `https://ui-avatars.com/api/?name=${top3[1].name}`} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gray-400 rounded-lg flex items-center justify-center text-[10px] font-black text-black">2</div>
            </div>
            <p className="text-[10px] font-bold text-white truncate w-20 text-center mb-1">{top3[1].name}</p>
            <p className="text-xs font-black text-gray-400">{formatCurrency(top3[1].earnings)}</p>
          </motion.div>
        )}

        {/* Rank 1 */}
        {top3[0] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 flex flex-col items-center -mt-8"
          >
            <div className="relative mb-4">
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-6 left-1/2 -translate-x-1/2 text-[#FFD700]"
              >
                <Crown size={24} fill="currentColor" />
              </motion.div>
              <div className="w-20 h-20 rounded-3xl border-4 border-[#FFD700] overflow-hidden bg-white/5 shadow-[0_0_30px_rgba(255,215,0,0.2)]">
                <img src={top3[0].photoURL || `https://ui-avatars.com/api/?name=${top3[0].name}`} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#FFD700] rounded-xl flex items-center justify-center text-xs font-black text-black">1</div>
            </div>
            <p className="text-xs font-black text-white truncate w-24 text-center mb-1">{top3[0].name}</p>
            <p className="text-sm font-black text-[#FFD700]">{formatCurrency(top3[0].earnings)}</p>
          </motion.div>
        )}

        {/* Rank 3 */}
        {top3[2] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 flex flex-col items-center"
          >
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-2xl border-2 border-orange-600 overflow-hidden bg-white/5">
                <img src={top3[2].photoURL || `https://ui-avatars.com/api/?name=${top3[2].name}`} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-orange-600 rounded-lg flex items-center justify-center text-[10px] font-black text-black">3</div>
            </div>
            <p className="text-[10px] font-bold text-white truncate w-20 text-center mb-1">{top3[2].name}</p>
            <p className="text-xs font-black text-orange-600">{formatCurrency(top3[2].earnings)}</p>
          </motion.div>
        )}
      </div>

      {/* List Section */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {others.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`
                bg-[#111111] border border-white/5 rounded-2xl p-4 flex items-center justify-between
                ${entry.uid === currentUser?.uid ? 'border-[#00C9A7]/30 bg-[#00C9A7]/5' : ''}
              `}
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-gray-500 w-4">#{i + 4}</span>
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5">
                  <img src={entry.photoURL || `https://ui-avatars.com/api/?name=${entry.name}`} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">{entry.name}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase">
                    <TrendingUp size={10} className="text-green-500" />
                    <span>Rising</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black">{formatCurrency(entry.earnings)}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">This Week</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Sticky My Rank */}
      {userData && (
        <div className="fixed bottom-24 left-4 right-4 z-40">
          <div className="bg-[#1A1A1A] border border-[#00C9A7]/20 rounded-2xl p-4 flex items-center justify-between shadow-2xl shadow-black">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#00C9A7]/20 flex items-center justify-center text-[#00C9A7] font-black">
                #42
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Your Rank</p>
                <p className="text-sm font-black text-white">Keep pushing!</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-[#00C9A7]">{formatCurrency(userData.weeklyEarnings || 0)}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Earned</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
