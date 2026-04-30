import React, { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { safeStringify } from '../../utils/jsonUtils';

export default function AdminDocumentationPanel() {
  const [phone, setPhone] = useState('');
  const [data, setData] = useState(null);

  const searchData = async () => {
    const q = query(collection(db, 'users'), where('phone', '==', phone));
    const snap = await getDocs(q);
    if (!snap.empty) {
      setData(snap.docs[0].data());
    }
  };

  return (
    <div className="p-6 bg-[#0A0A0A] text-white min-h-screen">
      <h2 className="text-xl font-black mb-6">Admin Documentation Panel</h2>
      <input className="bg-[#111111] p-3 rounded-lg mb-4 w-full" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Search by phone..." />
      <button onClick={searchData} className="bg-[#E8B84B] text-black px-4 py-2 rounded-lg font-black">Search</button>
      {data && <pre className="mt-4 text-xs">{safeStringify(data, 2)}</pre>}
    </div>
  );
}
