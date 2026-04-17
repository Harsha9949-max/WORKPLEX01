import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { TrendingUp, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FeedItem {
  id: string;
  name: string;
  amount: number;
  source: string;
  timestamp: any;
  venture: string;
}

export default function LiveEarningsFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'liveFeed'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FeedItem[];
      setItems(newItems);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full overflow-hidden py-4">
      <div className="flex items-center gap-2 mb-3 px-4">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Live Activity Feed</span>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 px-4 no-scrollbar">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex-shrink-0 bg-[#111111] border border-white/5 rounded-2xl p-4 min-w-[200px] flex items-center gap-3 shadow-xl backdrop-blur-md"
            >
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                <TrendingUp size={18} className="text-green-500" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white truncate max-w-[80px]">{item.name}</span>
                  <span className="text-[10px] text-gray-500">earned</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-black text-green-500">Rs.{item.amount}</span>
                  <span className="text-[10px] text-gray-400 truncate max-w-[60px]">via {item.source}</span>
                </div>
                <div className="text-[9px] text-gray-600 mt-1 uppercase font-bold tracking-wider">
                  {item.timestamp ? formatDistanceToNow(item.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
