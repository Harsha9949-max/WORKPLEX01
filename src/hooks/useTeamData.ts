import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export function useTeamData() {
  const { currentUser, userData } = useAuth();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [commissionLogs, setCommissionLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !userData) return;

    // 1. Team Members (if Lead or Manager)
    let teamUnsub = () => {};
    if (userData.role === 'Lead Marketer' || userData.role === 'Manager') {
      const q = query(
        collection(db, 'teams', currentUser.uid, 'members'),
        orderBy('joinedAt', 'desc')
      );
      teamUnsub = onSnapshot(q, (snapshot) => {
        setTeamMembers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }

    // 2. Referrals
    const refQ = query(
      collection(db, 'referrals'),
      where('referrerId', '==', currentUser.uid),
      orderBy('referredAt', 'desc')
    );
    const refUnsub = onSnapshot(refQ, (snapshot) => {
      setReferrals(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. Commission Logs
    const logQ = query(
      collection(db, 'commissionLogs'),
      where('workerId', '==', currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const logUnsub = onSnapshot(logQ, (snapshot) => {
      setCommissionLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      teamUnsub();
      refUnsub();
      logUnsub();
    };
  }, [currentUser, userData]);

  return { teamMembers, referrals, commissionLogs, loading };
}
