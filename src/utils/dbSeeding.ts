import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  query, 
  where 
} from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';

/**
 * Ensures that the system is seeded with mock data on first load.
 */
export const ensureDatabaseSeeded = async (db: Firestore) => {
  try {
    // 1. Seed Escrows if empty
    const escrowsRef = collection(db, 'escrows');
    const escrowsSnap = await getDocs(escrowsRef);
    if (escrowsSnap.empty) {
      const defaultEscrows = [
        { id: 'esc_1', company: 'GrowPlex Brands', campaign: 'Mobile Launch Blast', escrowFunded: 150000, spend: 35000, status: 'Active' },
        { id: 'esc_2', company: 'Zaestify Inc', campaign: 'Viral Wave Generator', escrowFunded: 245000, spend: 180000, status: 'Active' },
        { id: 'esc_3', company: 'BuyRix Corp', campaign: 'E-commerce Affiliate Multiply', escrowFunded: 85000, spend: 82000, status: 'At Risk' },
        { id: 'esc_4', company: 'Vyuma Digital', campaign: 'Social Loyalty Drive', escrowFunded: 310000, spend: 45000, status: 'Safe' }
      ];
      for (const item of defaultEscrows) {
        await setDoc(doc(db, 'escrows', item.id), {
          company: item.company,
          campaign: item.campaign,
          escrowFunded: item.escrowFunded,
          spend: item.spend,
          status: item.status
        });
      }
    }

    // 2. Seed Partners Reputation if empty
    const repRef = collection(db, 'partnersReputation');
    const repSnap = await getDocs(repRef);
    if (repSnap.empty) {
      const defaultReps = [
        { id: 'rep_1', partner: 'Vyuma Digital', totalSubmissions: 1200, rejections: 210, rate: 17.5, status: 'Flagged (Auto-Review)', payoutDelay: 'Average 4.2 days' },
        { id: 'rep_2', partner: 'Zaestify Marketing', totalSubmissions: 3400, rejections: 310, rate: 9.1, status: 'Excellent', payoutDelay: 'Average 1.1 days' },
        { id: 'rep_3', partner: 'BuyRix Corp', totalSubmissions: 950, rejections: 110, rate: 11.5, status: 'Safe', payoutDelay: 'Average 2.4 days' },
        { id: 'rep_4', partner: 'GrowPlex Brands', totalSubmissions: 410, rejections: 12, rate: 2.9, status: 'Excellent', payoutDelay: 'Average 0.5 days' }
      ];
      for (const item of defaultReps) {
        await setDoc(doc(db, 'partnersReputation', item.id), {
          partner: item.partner,
          totalSubmissions: item.totalSubmissions,
          rejections: item.rejections,
          rate: item.rate,
          status: item.status,
          payoutDelay: item.payoutDelay
        });
      }
    }

    // 3. Seed Veteran Users if fewer than 2 veteran level 5/6 workers exist in DB
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    const docsVal = usersSnap.docs.map(doc => doc.data());
    const veteransCount = docsVal.filter(u => u.role !== 'admin' && (u.level === 'Level 5' || u.level === 'Level 6 (VIP)' || u.level === 'Level 6')).length;
    
    if (veteransCount < 2) {
      const mockVets = [
        {
          id: 'vet_user_amit',
          name: 'Amit Verma',
          email: 'amit.verma@yahoo.co.in',
          phone: '+919876543210',
          age: 29,
          role: 'Worker',
          venture: 'Vyuma',
          level: 'Level 5',
          streak: 1,
          joinedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
          deviceFingerprint: 'dev_fp_amit_v_938',
          wallets: { earned: 14200, pending: 200, bonus: 0 },
          contractSigned: true,
          kycDone: true,
          trustPoints: 850
        },
        {
          id: 'vet_user_sumit',
          name: 'Sumit Saxena',
          email: 'sumit_saxena@gmail.com',
          phone: '+919988776655',
          age: 32,
          role: 'Worker',
          venture: 'BuyRix',
          level: 'Level 6 (VIP)',
          joinedAt: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
          deviceFingerprint: 'dev_fp_sumit_s_102',
          wallets: { earned: 28400, pending: 0, bonus: 0 },
          contractSigned: true,
          kycDone: true,
          streak: 0,
          trustPoints: 940
        },
        {
          id: 'vet_user_deepa',
          name: 'Deepa Iyer',
          email: 'iyer.deepa@rediffmail.com',
          phone: '+919123456789',
          age: 26,
          role: 'Worker',
          venture: 'Growplex',
          level: 'Level 5',
          joinedAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
          deviceFingerprint: 'dev_fp_deepa_i_441',
          wallets: { earned: 11150, pending: 650, bonus: 0 },
          contractSigned: true,
          kycDone: true,
          streak: 2,
          trustPoints: 810
        }
      ];

      for (const item of mockVets) {
        const docSnap = await getDocs(query(collection(db, 'users'), where('email', '==', item.email)));
        if (docSnap.empty) {
          await setDoc(doc(db, 'users', item.id), item);
        }
      }
    }

    // 4. Seed Disputed Submissions if none exist
    const subsRef = collection(db, 'taskSubmissions');
    const subsSnap = await getDocs(subsRef);
    if (subsSnap.empty) {
      const mockDisputes = [
        {
          id: 'disp_101',
          taskId: 'task_app_launch_otp',
          taskTitle: 'Install Growplex App & Submit OTP Verified UI Screenshot',
          taskDescription: 'Users must provide a live verified screen proving the account matching phone number matches Aadhaar KYC. Rejection allowed if screenshot is cropped or credentials mismatch.',
          workerId: 'vet_user_amit',
          workerName: 'Rahul Sharma',
          workerEmail: 'rahul.sharma@gmail.com',
          workerLevel: 'Level 5',
          venture: 'Vyuma Digital',
          proofData: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=300 (Sub-admin matched: Mobile device ID OK. IMEI consistent.)',
          proofText: 'Uploaded screenshot showing fully verified status on device ID: GrowPlex928XG.',
          rejectionReason: 'Partner claimed screenshot was a duplicate, but forensic device fingerprint check shows it is unique and taken on Rahul\'s registered device.',
          earningAmount: 45,
          status: 'rejected',
          submittedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
        },
        {
          id: 'disp_102',
          taskId: 'task_youtube_comment',
          taskTitle: 'Comment & Retweet Campaign Live Launch',
          taskDescription: 'Leave a positive comment on YouTube launch video, minimum 15 words. Keep active for 30 days.',
          workerId: 'vet_user_deepa',
          workerName: 'Ananya Roy',
          workerEmail: 'ananya.roy99@gmail.com',
          workerLevel: 'Level 3',
          venture: 'Zaestify Marketing',
          proofData: 'Tweet ID #923849. Verified comments criteria (Length: 22 words).',
          proofText: 'Great platform! It works really smoothly and payouts are incredibly fast. Recommend to everyone!',
          rejectionReason: 'Partner claimed comment was AI-generated, but syntax is simple conversational Hindi-English and perfectly legitimate.',
          earningAmount: 15,
          status: 'rejected',
          submittedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
        },
        {
          id: 'disp_103',
          taskId: 'task_corporate_signup',
          taskTitle: 'Purchase Trial Lead Signup',
          taskDescription: 'Fill corporate form with verified corporate domain email. Free non-corporate domain emails automatically marked invalid.',
          workerId: 'vet_user_sumit',
          workerName: 'Kabir Patel',
          workerEmail: 'kabir.patel.co@gmail.com',
          workerLevel: 'Level 6 (VIP)',
          venture: 'BuyRix Corp',
          proofData: 'Signed up with kabir@workplex.co corporate domain. Received confirmation.',
          proofText: 'Successful corporate registration complete. Registered under domain workplex.co.',
          rejectionReason: 'Partner rejected lead because email was custom, claiming they only wanted Fortune-500 domains, which was NOT in the initial brief.',
          earningAmount: 120,
          status: 'rejected',
          submittedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
        }
      ];

      for (const item of mockDisputes) {
        await setDoc(doc(db, 'taskSubmissions', item.id), item);
      }
    }
  } catch (err) {
    console.error("Critical seeding error in helper:", err);
  }
};
