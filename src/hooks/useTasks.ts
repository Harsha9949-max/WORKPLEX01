import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export function useTasks() {
  const { currentUser, userData } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !userData) return;

    const tasksRef = collection(db, 'tasks');
    // Query for tasks assigned to user or 'all'
    const q = query(
      tasksRef,
      where('assignedTo', 'in', [[currentUser.uid], 'all'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(taskList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, userData]);

  return { tasks, loading };
}
