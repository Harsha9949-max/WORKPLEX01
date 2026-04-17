import React, { useState } from 'react';
import { formatCurrency } from '../../utils/couponUtils';

export default function CommissionCalculator() {
  const [price, setPrice] = useState(1000);
  const margin = price * 0.175;
  const commission = margin * 0.10;

  return (
    <div className="bg-[#111111] border border-white/5 rounded-2xl p-6">
      <h3 className="text-white font-bold mb-4">Commission Simulator</h3>
      <input 
        type="number" 
        value={price} 
        onChange={(e) => setPrice(Number(e.target.value))}
        className="w-full bg-[#1A1A1A] text-white p-3 rounded-lg mb-4"
      />
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-400"><span>Product Price:</span> <span>{formatCurrency(price)}</span></div>
        <div className="flex justify-between text-gray-400"><span>HVRS Margin (17.5%):</span> <span>{formatCurrency(margin)}</span></div>
        <div className="flex justify-between text-[#E8B84B] font-bold"><span>Your Commission (10% of margin):</span> <span>{formatCurrency(commission)}</span></div>
      </div>
    </div>
  );
}
