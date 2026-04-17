import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowUpRight, ShoppingBag } from 'lucide-react';

const CATEGORIES = [
  { name: 'Electronics', trend: '+12%', color: 'text-blue-400' },
  { name: 'Fashion', trend: '+8%', color: 'text-pink-400' },
  { name: 'Home Decor', trend: '+15%', color: 'text-green-400' },
];

export default function AIProductPicker() {
  return (
    <div className="bg-[#111111] border border-white/5 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Sparkles className="text-amber-500" size={18} />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">AI Recommended for Your Area</h3>
        </div>
        <button className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">View All</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className={`p-2 bg-white/5 rounded-xl ${cat.color}`}>
                <ShoppingBag size={20} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-green-500">
                <ArrowUpRight size={12} />
                {cat.trend}
              </div>
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{cat.name}</h4>
            <p className="text-[10px] text-gray-500 font-medium mt-1">Trending in your city</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
