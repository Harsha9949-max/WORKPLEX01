import { useState, useEffect } from 'react';
import { doc, collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { startOfWeek } from 'date-fns';

export const useMarketerData = (uid?: string) => {
  const [userData, setUserData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [coupon, setCoupon] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // User data listener
  useEffect(() => {
    if (!uid) return;
    const unsubUser = onSnapshot(
      doc(db, 'users', uid),
      (snap) => setUserData(snap.data())
    );
    return () => unsubUser();
  }, [uid]);

  // Tasks listener (this week)
  useEffect(() => {
    if (!uid) return;
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const unsubTasks = onSnapshot(
      query(
        collection(db, 'tasks'),
        where('assignedTo', 'array-contains', uid),
        where('weekStartDate', '>=', weekStart),
        orderBy('weekStartDate', 'desc')
      ),
      (snap) => setTasks(
        snap.docs.map(d => ({
          id: d.id, ...d.data()
        }))
      )
    );
    return () => unsubTasks();
  }, [uid]);

  // Coupon listener
  useEffect(() => {
    if (!uid) return;
    const unsubCoupon = onSnapshot(
      doc(db, 'coupons', uid),
      (snap) => setCoupon(snap.data())
    );
    return () => unsubCoupon();
  }, [uid]);

  // Transactions listener (last 20)
  useEffect(() => {
    if (!uid) return;
    const unsubTx = onSnapshot(
      query(
        collection(db, `users/${uid}/transactions`),
        orderBy('timestamp', 'desc'),
        limit(20)
      ),
      (snap) => setTransactions(
        snap.docs.map(d => ({
          id: d.id, ...d.data()
        }))
      )
    );
    return () => unsubTx();
  }, [uid]);

  // Announcements listener
  useEffect(() => {
    const unsubAnn = onSnapshot(
      query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc'),
        limit(5)
      ),
      (snap) => setAnnouncements(
        snap.docs.map(d => d.data())
      )
    );
    return () => unsubAnn();
  }, []);

  return {
    userData, 
    tasks, 
    coupon,
    transactions, 
    announcements,
    wallets: userData?.wallets || { earned: 0, pending: 0, bonus: 0, savings: 0 },
    streak: userData?.streak || 0,
    level: userData?.level || 1,
    venture: userData?.venture || 'BuyRix',
    role: userData?.role || 'Promoter'
  };
};
