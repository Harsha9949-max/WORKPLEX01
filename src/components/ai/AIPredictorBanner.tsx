import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, TrendingUp } from 'lucide-react';
import { useAI } from '../../hooks/useAI';
import { formatCurrency } from '../../utils/format';

interface Props {
  pendingTasksCount: number;
  avgEarning: number;
  completionRate: number;
}

export default function AIPredictorBanner({ pendingTasksCount, avgEarning, completionRate }: Props) {
  const { callAI, loading } = useAI();
  const [prediction, setPrediction] = useState<{ predictedEarning: number; motivationalMessage: string } | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      const result = await callAI('generateAIPredictions', {
        pendingTasksCount,
        avgEarning,
        completionRate
      }) as { predictedEarning: number; motivationalMessage: string } | null;
      if (result) setPrediction(result);
    };

    if (pendingTasksCount > 0) {
      fetchPrediction();
    }
  }, [pendingTasksCount]);

  if (!prediction && !loading) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      {/* Animated Gradient Border */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-amber-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
      
      <div className="relative bg-[#111111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 bg-white/5 rounded-2xl" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-white/5 rounded w-3/4" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
              <Brain className="text-teal-400" size={32} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest bg-teal-500/10 px-2 py-0.5 rounded-full">AI Prediction</span>
                <Sparkles size={12} className="text-amber-500 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-white leading-tight">
                You can earn <span className="text-amber-400">{formatCurrency(prediction.predictedEarning)}</span> extra today!
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-1 italic">
                "{prediction.motivationalMessage}"
              </p>
            </div>

            <div className="hidden sm:block">
              <TrendingUp className="text-teal-500/30" size={48} />
            </div>
          </div>
        )}

        {/* Shimmer Effect */}
        {loading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        )}
      </div>
    </motion.div>
  );
}
