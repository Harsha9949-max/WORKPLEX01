import React, { useState } from 'react';
import { formatCurrency } from '../../utils/couponUtils';
import { Calculator } from 'lucide-react';

export default function CommissionCalculator() {
  const [price, setPrice] = useState(1000);
  const margin = price * 0.175;
  const commission = margin * 0.10;

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[#2A2A2A] flex items-center gap-2">
        <Calculator size={18} className="text-[#3B82F6]" />
        <h3 className="text-white font-bold text-sm tracking-wide">COMMISSION SIMULATOR</h3>
      </div>
      <div className="p-4">
         <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-2 block">Simulate Product Price (RS)</label>
         <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black">₹</span>
            <input 
              type="number" 
              value={price || ''} 
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white py-3 pl-8 pr-4 rounded-xl focus:border-[#3B82F6] outline-none transition"
              placeholder="e.g. 1500"
            />
         </div>
         <div className="bg-[#1A1A1A] rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center bg-[#111111] p-2 rounded-lg">
               <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">HVRS Margin (17.5%)</span> 
               <span className="text-gray-300 font-mono text-sm">{formatCurrency(margin)}</span>
            </div>
            <div className="flex justify-between items-center bg-[#3B82F6]/10 border border-[#3B82F6]/20 p-3 rounded-lg">
               <span className="text-[#3B82F6] text-xs font-bold uppercase tracking-widest">Your Cut (10% of margin)</span> 
               <span className="text-[#3B82F6] font-black text-lg">{formatCurrency(commission)}</span>
            </div>
         </div>
      </div>
    </div>
  );
}
