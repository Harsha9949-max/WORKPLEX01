import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export function useWalletData() {
  const { currentUser } = useAuth();
  const [data, setData] = useState({
    wallets: { earned: 0, pending: 0, bonus: 0, savings: 0, withdrawn: 0 } as any,
    savingsPercent: 0,
    kycDone: false,
    transactions: [] as any[],
    withdrawals: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // 1. User Wallet & Profile
    const userUnsub = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
      if (doc.exists()) {
        const uData = doc.data();
        setData(prev => ({
          ...prev,
          wallets: uData.wallets || { earned: 0, pending: 0, bonus: 0, savings: 0, withdrawn: 0 },
          savingsPercent: uData.savingsPercent || 0,
          kycDone: uData.kycDone || false
        }));
      }
    });

    // 2. Transactions
    const txUnsub = onSnapshot(
      query(collection(db, 'users', currentUser.uid, 'transactions'), orderBy('timestamp', 'desc'), limit(20)),
      (snapshot) => {
        setData(prev => ({ ...prev, transactions: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) }));
      }
    );

    // 3. Withdrawals
    const wdUnsub = onSnapshot(
      query(collection(db, 'withdrawals'), where('workerId', '==', currentUser.uid), orderBy('requestedAt', 'desc'), limit(10)),
      (snapshot) => {
        setData(prev => ({ ...prev, withdrawals: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) }));
        setLoading(false);
      }
    );

    return () => { userUnsub(); txUnsub(); wdUnsub(); };
  }, [currentUser]);

  return { ...data, loading };
}
