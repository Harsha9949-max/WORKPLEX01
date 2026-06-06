import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Safely associates a user ID with a phone number in the phoneDirectory collection.
 * Supports multiple UIDs under a single phone number (admin feature).
 */
export async function associatePhoneWithUid(db: any, phone: string, uid: string) {
  if (!phone) return;
  const cleanPhone = phone.replace("+91", "").trim();
  const variations = [cleanPhone, `+91${cleanPhone}`];

  for (const p of variations) {
    const docRef = doc(db, 'phoneDirectory', p);
    try {
      const snap = await getDoc(docRef);
      let uids: string[] = [uid];
      
      if (snap.exists()) {
        const data = snap.data();
        if (data?.uids && Array.isArray(data.uids)) {
          uids = [...new Set([...data.uids, uid])];
        } else if (data?.uid) {
          uids = [...new Set([data.uid, uid])];
        }
      }
      
      await setDoc(docRef, {
        uid: uid, // legacy backward compatibility
        uids: uids,
        registeredAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error(`Error associating phone ${p} with uid ${uid}:`, err);
    }
  }
}

/**
 * Safely disassociates a user ID from a phone number in the phoneDirectory collection.
 * If other users still share this phone number, it retains the mapping for them.
 * If no other users are using it, it deletes the mapping document completely.
 */
export async function disassociatePhoneWithUid(db: any, phone: string, uid: string) {
  if (!phone) return;
  const cleanPhone = phone.replace("+91", "").trim();
  const variations = [cleanPhone, `+91${cleanPhone}`];

  for (const p of variations) {
    const docRef = doc(db, 'phoneDirectory', p);
    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) continue;

      const data = snap.data();
      let uids: string[] = [];

      if (data?.uids && Array.isArray(data.uids)) {
        uids = data.uids.filter((id: string) => id !== uid);
      } else if (data?.uid && data.uid !== uid) {
        uids = [data.uid];
      }

      if (uids.length > 0) {
        // Update the document to retain details for remaining users
        await setDoc(docRef, {
          uid: uids[uids.length - 1], // update fallback uid to last remaining
          uids: uids,
          registeredAt: serverTimestamp()
        }, { merge: true });
      } else {
        // No other users are using this phone number, safe to delete completely
        await deleteDoc(docRef);
      }
    } catch (err) {
      console.error(`Error disassociating phone ${p} with uid ${uid}:`, err);
    }
  }
}

/**
 * Checks if a phone number is already registered under an email different from currentEmail.
 * Returns true if the phone number is in use by another user.
 */
export async function checkPhoneDuplicate(db: any, phone: string, currentEmail: string): Promise<boolean> {
  if (!phone) return false;
  const cleanPhone = phone.replace("+91", "").trim();
  const variations = [cleanPhone, `+91${cleanPhone}`];

  for (const p of variations) {
    const docRef = doc(db, 'phoneDirectory', p);
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        let uidsToCheck: string[] = [];

        if (data?.uids && Array.isArray(data.uids)) {
          uidsToCheck = data.uids;
        } else if (data?.uid) {
          uidsToCheck = [data.uid];
        }

        for (const uid of uidsToCheck) {
          const userSnap = await getDoc(doc(db, 'users', uid));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData && userData.email && userData.email.toLowerCase() !== currentEmail.toLowerCase()) {
              return true; // Another user with different email uses this phone
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error checking phone duplicate for ${p}:`, err);
    }
  }

  // Double check the users collection for safety
  try {
    const q1 = query(collection(db, 'users'), where('phone', '==', cleanPhone));
    const q2 = query(collection(db, 'users'), where('phone', '==', `+91${cleanPhone}`));
    
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    
    const hasDifferentEmail = (snapshots: any[]) => {
      for (const snap of snapshots) {
        for (const d of snap.docs) {
          const u = d.data();
          if (u && u.email && u.email.toLowerCase() !== currentEmail.toLowerCase()) {
            return true;
          }
        }
      }
      return false;
    };

    if (hasDifferentEmail([snap1, snap2])) {
      return true;
    }
  } catch (err) {
    console.error("Error doing users collection fallback verification:", err);
  }

  return false;
}
