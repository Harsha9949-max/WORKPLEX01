import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export function useSubmissions() {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const subsRef = collection(db, 'taskSubmissions');
    const q = query(subsRef, where('workerId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(subList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return { submissions, loading };
}
