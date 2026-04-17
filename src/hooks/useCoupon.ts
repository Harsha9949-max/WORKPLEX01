import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export function useCoupon() {
  const { currentUser } = useAuth();
  const [coupon, setCoupon] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'coupons', currentUser.uid), (doc) => {
      setCoupon(doc.exists() ? { id: doc.id, ...doc.data() } : null);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  return { coupon, loading };
}

export function useCouponUsages() {
  const { currentUser } = useAuth();
  const [usages, setUsages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'couponUsages'),
      where('ownerId', '==', currentUser.uid),
      orderBy('usedAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setUsages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  return { usages, loading };
}
