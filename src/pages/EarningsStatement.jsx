import React, { useState } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/format';

export default function EarningsStatement() {
  const { currentUser, userData } = useAuth();
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [statement, setStatement] = useState(null);

  const generateStatement = async () => {
    // Logic to generate statement data and fetch it
    toast.success('Generating statement...');
    // Simulated statement data
    setStatement({
      period: `${month + 1}/${year}`,
      totalGross: 5000,
      totalWithdrawn: 3000,
      balance: 2000
    });
  };

  return (
    <div className="p-6 bg-[#0A0A0A] text-white min-h-screen">
      <h2 className="text-xl font-black mb-6">Earnings Statement</h2>
      <div className="flex gap-4 mb-6">
        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="bg-[#111111] p-2 rounded-lg text-sm">
          {[...Array(12).keys()].map(m => <option key={m} value={m}>{m + 1}</option>)}
        </select>
        <button onClick={generateStatement} className="bg-[#E8B84B] text-black px-4 py-2 rounded-lg font-black text-xs">Generate</button>
      </div>
      {statement && (
        <div className="bg-[#111111] p-6 rounded-2xl space-y-4">
          <p>Total Gross: {formatCurrency(statement.totalGross)}</p>
          <button className="flex items-center gap-2 text-teal-500"><Download size={16}/> Download PDF</button>
        </div>
      )}
    </div>
  );
}
