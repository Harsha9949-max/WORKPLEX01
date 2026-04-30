import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, CheckCircle } from 'lucide-react';

export default function ResellerEarnings() {
  const { currentUser } = useAuth();
  const [wallet, setWallet] = useState({ balance: 0, pending: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    
    // Listen to wallet
    const unsubWallet = onSnapshot(collection(db, 'users', currentUser.uid, 'wallets'), (snap) => {
      let bal = 0;
      let pend = 0;
      snap.forEach(doc => {
        if (doc.id === 'main') bal = doc.data().balance || 0;
        if (doc.id === 'pending') pend = doc.data().balance || 0;
      });
      setWallet({ balance: bal, pending: pend });
    }, (e) => handleFirestoreError(e, OperationType.GET, 'wallets'));

    // Listen to partner withdrawal transactions etc..
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid)
    );

    const unsubTx = onSnapshot(q, (snap) => {
       let docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
       docs.sort((a: any, b: any) => {
          const dateA = a.timestamp?.toMillis?.() || 0;
          const dateB = b.timestamp?.toMillis?.() || 0;
          return dateB - dateA;
       });
       setTransactions(docs);
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'transactions'));

    return () => {
       unsubWallet();
       unsubTx();
    };
  }, [currentUser]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-white">Earnings & Wallet</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-2xl relative overflow-hidden">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#E8B84B]/10 rounded-full blur-2xl"></div>
           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
             <Wallet size={14} className="text-[#E8B84B]" /> Available Balance
           </p>
           <h2 className="text-4xl font-black text-white">{formatCurrency(wallet.balance)}</h2>
           <button className="mt-6 w-full py-3 bg-[#E8B84B] text-black font-black uppercase tracking-widest text-sm rounded-xl hover:bg-[#E8B84B]/90 transition-colors shadow">
              Withdraw Funds
           </button>
        </div>

        <div className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-2xl relative overflow-hidden">
           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
             <Clock size={14} className="text-[#00C9A7]" /> Pending Margin
           </p>
           <h2 className="text-4xl font-black text-white">{formatCurrency(wallet.pending)}</h2>
           <p className="text-xs text-gray-400 mt-2">Releases to available balance 7 days after delivery.</p>
        </div>
      </div>

      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl overflow-hidden mt-8">
         <div className="p-6 border-b border-[#2A2A2A]">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Transaction History</h2>
         </div>
         <div className="divide-y divide-[#2A2A2A]">
            {transactions.length > 0 ? transactions.map(tx => (
               <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-full flex-shrink-0 ${tx.type === 'credit' ? 'bg-[#00C9A7]/20 text-[#00C9A7]' : 'bg-red-500/20 text-red-500'}`}>
                        {tx.type === 'credit' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                     </div>
                     <div>
                        <p className="text-white font-bold text-sm">{tx.description || (tx.type === 'credit' ? 'Margin Released' : 'Withdrawal')}</p>
                        <p className="text-xs text-gray-500">{tx.timestamp?.toDate?.()?.toLocaleString()}</p>
                     </div>
                  </div>
                  <div className={`text-right font-black font-mono ${tx.type === 'credit' ? 'text-[#00C9A7]' : 'text-white'}`}>
                     {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
               </div>
            )) : (
               <div className="p-12 text-center text-gray-500 text-sm font-medium">No transactions yet.</div>
            )}
         </div>
      </div>
    </div>
  );
}
