import { db } from './firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

// a. generateTempPhone
export async function generateTempPhone(): Promise<string> {
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
  return `+91-TEMP-${randomStr}`;
}

// b. onFirstEarningTrigger (Client-side mock of Cloud trigger)
export async function onFirstEarningTrigger(userId: string, earnedAmount: number) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const data = snap.data();
    if (data.wallets?.temp > 0 && data.firstEarningCompleted === false) {
      // Simulate the backend unlocking the requirement for KYC
      await updateDoc(userRef, { firstEarningCompleted: true });
      return true; // Indicates the modal should trigger on the client
    }
  }
  return false;
}

// c. calculateProfileCompletion
export async function calculateProfileCompletion(userId: string, data: any): Promise<number> {
  let score = 0;
  if (data.photoURL && data.photoURL !== '') score += 15;
  if (data.kycCompletedAt) score += 30;
  if (data.bankAccount && data.bankAccount !== '') score += 25;
  
  if (data.role === 'Partner') {
    if (data.shopSetupDone) score += 20;
  } else {
    // If not partner, bypass shop requirements
    score += 20; 
  }

  if (data.emailVerified) score += 10;
  
  // If > 80, calculate and grant 50 trustPoints
  let trustPoints = data.trustPoints || 0;
  if (score >= 80 && trustPoints === 0) {
    trustPoints += 50;
  }

  // Auto-sync this computation with Firestore (mocking cloud trigger)
  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, { profileCompletion: score, trustPoints });
  } catch (e) {
    console.error("Profile sync restricted on client side", e);
  }

  return score;
}

// d. amlComplianceCheck
export async function amlComplianceCheck() {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('kycCompletedAt', '==', null));
  const snap = await getDocs(q);
  
  const flaggedUsers = [];
  snap.docs.forEach(doc => {
    const data = doc.data();
    if (data.wallets) {
      const total = (data.wallets.temp || 0) + (data.wallets.earned || 0) + (data.wallets.pending || 0);
      if (total > 10000) {
        flaggedUsers.push(doc.id);
        // We would update the doc here to set amlFlag to true,
        // simulated: updateDoc(doc.ref, { amlFlag: true })
      }
    }
  });
  return flaggedUsers;
}

// e. chatbotQuery
export async function chatbotQuery(message: string, language: string): Promise<string> {
  // In a real environment, this connects to OpenRouter (Gemma) using the Cloud Function backend.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`[${language.toUpperCase()}] I am your OpenRouter-powered AI assistant. You said: "${message}". How else can I assist with your onboarding, tasks, or payouts logic today?`);
    }, 1500);
  });
}

// Added Cloud Functions:

export async function checkDailyStreak(uid: string) {
  // Simulated Cloud Function logic for daily streak check.
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  const userData = userSnap.data();
  
  const lastActiveDate = userData?.lastActiveDate?.toDate() || new Date();
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let newStreak = userData.streak || 0;
  if (diffDays === 1) {
    newStreak += 1;
  } else if (diffDays > 1) {
    newStreak = 0;
  }
  
  if (newStreak !== userData.streak) {
     await updateDoc(userRef, { 
        streak: newStreak, 
        lastActiveDate: new Date() 
     });
     
     if (newStreak % 7 === 0 && newStreak > 0) {
        // Add Rs. 50 bonus
        const newBonus = (userData.wallets?.bonus || 0) + 50;
        await updateDoc(userRef, { 'wallets.bonus': newBonus });
     }
  }
}

export async function fetchAIPrediction(uid: string, pendingTasks: number, avgEarning: number, completionRate: number) {
   const cacheRef = doc(db, 'aiCache', `${uid}_prediction`);
   const cacheSnap = await getDoc(cacheRef);
   
   if (cacheSnap.exists()) {
      const data = cacheSnap.data();
      const ageHours = (new Date().getTime() - data.timestamp.toMillis()) / (1000 * 60 * 60);
      if (ageHours < 6) return data.prediction;
   }
   
   const prediction = `Complete ${pendingTasks} more tasks -> earn Rs.${(pendingTasks * avgEarning * completionRate).toFixed(0)} extra today!`;
   return prediction;
}

export async function generateMysteryTask(uid: string, role: string, venture: string) {
   // Simulated callable function for Mystery task
   const newTask = {
      title: 'Mystery Challenge: Flash Promo!',
      description: `Create 1 mystery marketing task for ${role} in ${venture}. High urgency. Post a flash promo link on your stories immediately.`,
      reward: 75,
      type: 'mystery',
      venture: venture,
      assignedTo: [uid],
      status: 'active',
      createdAt: new Date()
   };
   return newTask;
}

export async function checkLeadInactivity() {
   // Simulated cron job
   const usersRef = collection(db, 'users');
   const q = query(usersRef, where('role', '==', 'Lead Marketer'));
   const snap = await getDocs(q);

   for (const docSnap of snap.docs) {
      const user = docSnap.data();
      if (!user.lastActiveDate) continue;

      const lastActiveD = user.lastActiveDate.toDate();
      const diffDays = (new Date().getTime() - lastActiveD.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays >= 30 && !user.inactiveWarning) {
         await updateDoc(docSnap.ref, {
            inactiveWarning: true,
            warningStartDate: new Date(),
            teamTransferDeadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
         });
      } else if (user.inactiveWarning && user.warningStartDate) {
         const warningDays = (new Date().getTime() - user.warningStartDate.toDate().getTime()) / (1000 * 60 * 60 * 24);
         if (warningDays >= 7) {
            await updateDoc(docSnap.ref, {
               teamTransferred: true,
               teamSize: 0,
               inactiveWarning: false
            });
         }
      }
   }
}

export async function distributeTeamCommission(workerId: string, earnAmount: number) {
   // Simulated team commission distribution on task complete
   const workerSnap = await getDoc(doc(db, 'users', workerId));
   if (!workerSnap.exists()) return;
   
   const worker = workerSnap.data();
   if (worker.referredBy) {
      const leadSnap = await getDoc(doc(db, 'users', worker.referredBy));
      if (leadSnap.exists() && leadSnap.data().role === 'Lead Marketer') {
         const level1Comm = earnAmount * 0.05;
         // Add to lead wallet
         const leadWallets = leadSnap.data().wallets || {};
         await updateDoc(leadSnap.ref, {
            'wallets.pending': (leadWallets.pending || 0) + level1Comm
         });
      }
   }
}


