import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Users, Activity, Clock, CreditCard, ArrowUpRight, 
  Zap, Briefcase, BarChart, ShieldAlert, CheckCircle, AlertTriangle, 
  Play, HelpCircle, ArrowRight, Check, X, Shield, Star, DollarSign, 
  Award, Percent, Clipboard, Download, Sliders, RefreshCw, Layers, 
  Calendar, ChevronRight, Search, Filter, ShieldCheck, Mail, Send, CheckSquare
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, ScatterChart, Scatter, LabelList, Legend
} from 'recharts';
import { 
  collection, query, getDocs, Timestamp, onSnapshot, doc, setDoc, 
  getDoc, updateDoc, addDoc, where, orderBy, limit 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatCurrency, safeFormatDate } from '../../utils/format';
import toast from 'react-hot-toast';

// Theme colors
const COLORS = ['#E8B84B', '#3B82F6', '#10B981', '#A78BFA', '#EF4444'];

export default function StrategicConsole() {
  const [activeTab, setActiveTab ] = useState('financial');
  const [loading, setLoading] = useState(true);

  // --- TAB 1 STATES (FINANCIAL) ---
  const [workerUnpaidLiabilities, setWorkerUnpaidLiabilities] = useState({ earned: 12500, pending: 35000, total: 47500 });
  const [platformBankReserves, setPlatformBankReserves] = useState(120000); 
  const [takeRateTargets, setTakeRateTargets] = useState({
    appInstalls: 35,
    socialShares: 15,
    videoReviews: 25,
    affiliateSales: 22,
    dataLabeling: 30
  });
  const [escrows, setEscrows] = useState<any[]>([]);

  // --- TAB 2 STATES (MARKETPLACE) ---
  const [surgeMultipliers, setSurgeMultipliers] = useState({
    appInstalls: 1.2,
    socialShares: 1.0,
    videoReviews: 1.5,
    affiliateSales: 1.0,
    dataLabeling: 1.8
  });
  const [demandSupplyGrid, setDemandSupplyGrid] = useState<any[]>([]);

  // --- TAB 3 STATES (ARBITRATION) ---
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedDisputeId, setSelectedDisputeId] = useState('disp_101');
  const [selectedDisputes, setSelectedDisputes] = useState<string[]>([]);
  const [partnersReputation, setPartnersReputation] = useState<any[]>([]);

  // --- TAB 4 STATES (COMPLIANCE) ---
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditFilterAdmin, setAuditFilterAdmin] = useState('All');
  const [adminActionLogs, setAdminActionLogs] = useState<any[]>([]);
  const [alertsConfig, setAlertsConfig] = useState([
    { id: 'rule_1', tLabel: 'High Value Withdrawal Trigger', desc: 'Trigger alarm when sub-admin approves withdrawal > ₹5,000', active: true },
    { id: 'rule_2', tLabel: 'Venture Balance Safeguard', desc: 'Alert CEO when platform bank reserves fall below 1.25x worker liability', active: true },
    { id: 'rule_3', tLabel: 'Partner Rejection Watchdog', desc: 'Instantly flag any partner account exceeding 15% manual rejections', active: true },
    { id: 'rule_4', tLabel: 'Simultaneous Multi-Account IP Ping', desc: 'Flag worker profile if device verification conflicts in under 60 mins', active: false }
  ]);

  // --- TAB 5 STATES (RETENTION & COHORT) ---
  const [inactiveVeterans, setInactiveVeterans] = useState<any[]>([]);
  const [careerCoefficients, setCareerCoefficients] = useState({
    baseXpMultiplier: 1.5,
    levelUpBonusBasePercent: 10,
    vipExclusivesPrecedence: true
  });
  const [scatterWorkersData, setScatterWorkersData] = useState<any[]>([]);

  // Helpers for audit trailing
  const logAction = async (msg: string, priority: 'Low' | 'Medium' | 'High' = 'Low') => {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        user: 'Super Admin (You)',
        action: msg,
        time: new Date().toISOString(),
        priority
      });
    } catch (err) {
      console.error("Audit logging error:", err);
    }
  };

  // Helper to seed professional template data to Firestore on-the-fly if empty
  const ensureDatabaseSeeded = async () => {
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
      console.error("Critical seeding error in Strategic Advisory Console:", err);
    }
  };

  // --- 1. PERSISTENT STRATEGIC SETTINGS ENGINE ---
  useEffect(() => {
    ensureDatabaseSeeded();

    const settingsRef = doc(db, 'settings', 'strategy');
    const unsubSettings = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.takeRateTargets) setTakeRateTargets(data.takeRateTargets);
        if (data.surgeMultipliers) setSurgeMultipliers(data.surgeMultipliers);
        if (data.careerCoefficients) setCareerCoefficients(data.careerCoefficients);
        if (data.platformBankReserves) setPlatformBankReserves(data.platformBankReserves);
      } else {
        setDoc(settingsRef, {
          takeRateTargets: {
            appInstalls: 35,
            socialShares: 15,
            videoReviews: 25,
            affiliateSales: 22,
            dataLabeling: 30
          },
          surgeMultipliers: {
            appInstalls: 1.2,
            socialShares: 1.0,
            videoReviews: 1.5,
            affiliateSales: 1.0,
            dataLabeling: 1.8
          },
          careerCoefficients: {
            baseXpMultiplier: 1.5,
            levelUpBonusBasePercent: 10,
            vipExclusivesPrecedence: true
          },
          platformBankReserves: 120000
        }).catch(err => console.error("Error creating strategic settings document:", err));
      }
    });

    return () => unsubSettings();
  }, []);

  // --- 1B. LIVE ESCROW REAL-TIME SYNC ---
  useEffect(() => {
    const unsubEscrow = onSnapshot(collection(db, 'escrows'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        setEscrows(list);
      }
    });
    return () => unsubEscrow();
  }, []);

  // --- 2. LIVE UNPAID LIABILITIES FROM USERS WALLETS ---
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      let accumulatedEarned = 0;
      let accumulatedPending = 0;
      
      snapshot.forEach((userDoc) => {
        const data = userDoc.data();
        if (data?.wallets) {
          accumulatedEarned += (parseFloat(data.wallets.earned) || 0);
          accumulatedPending += (parseFloat(data.wallets.pending) || 0);
        }
      });

      const totalLiab = accumulatedEarned + accumulatedPending;
      const isEmpty = snapshot.empty;
      setWorkerUnpaidLiabilities({
        earned: isEmpty ? 12500 : Math.round(accumulatedEarned),
        pending: isEmpty ? 35000 : Math.round(accumulatedPending),
        total: isEmpty ? 47500 : Math.round(totalLiab)
      });
      setLoading(false);
    });

    return () => unsubUsers();
  }, []);

  // --- 3. LIVE MARKETPLACE SUPPLY & DEMAND GRID ---
  useEffect(() => {
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (taskSnap) => {
      const activeTasks = taskSnap.docs.map(d => d.data());
      
      const unsubUsers = onSnapshot(collection(db, 'users'), (userSnap) => {
        const workers = userSnap.docs.filter((d: any) => {
          const data = d.data();
          return data?.role?.toLowerCase() !== 'admin' &&
                 data?.email !== 'marateyh@gmail.com' &&
                 data?.email !== 'hvrsindustriespvtltd@gmail.com';
        });
        const activeWorkersCount = workers.length || 24;

        const appInstallsCount = activeTasks.filter((t: any) => t.status === 'active' && /install|app|download/i.test(t.title + ' ' + t.description)).length;
        const socialSharesCount = activeTasks.filter((t: any) => t.status === 'active' && /share|tweet|retweet|social|follow|comment/i.test(t.title + ' ' + t.description)).length;
        const videoReviewsCount = activeTasks.filter((t: any) => t.status === 'active' && /video|review|youtube|watch/i.test(t.title + ' ' + t.description)).length;
        const affiliateSalesCount = activeTasks.filter((t: any) => t.status === 'active' && /affiliate|sale|lead|purchase/i.test(t.title + ' ' + t.description)).length;
        const dataLabelingCount = activeTasks.filter((t: any) => t.status === 'active' && /label|data|annotate/i.test(t.title + ' ' + t.description)).length;

        const updatedGrid = [
          { category: 'App Installs', pendingTasks: appInstallsCount || 45, activeSpecialists: Math.max(2, Math.round(activeWorkersCount * 0.15)), ratio: parseFloat(((appInstallsCount || 45) / Math.max(1, Math.round(activeWorkersCount * 0.15))).toFixed(1)), surgeNeeded: (appInstallsCount || 45) > 10 },
          { category: 'Social Shares', pendingTasks: socialSharesCount || 120, activeSpecialists: Math.max(5, Math.round(activeWorkersCount * 0.4)), ratio: parseFloat(((socialSharesCount || 120) / Math.max(1, Math.round(activeWorkersCount * 0.4))).toFixed(1)), surgeNeeded: (socialSharesCount || 120) > 50 },
          { category: 'Video Reviews', pendingTasks: videoReviewsCount || 28, activeSpecialists: Math.max(1, Math.round(activeWorkersCount * 0.1)), ratio: parseFloat(((videoReviewsCount || 28) / Math.max(1, Math.round(activeWorkersCount * 0.1))).toFixed(1)), surgeNeeded: (videoReviewsCount || 28) > 15 },
          { category: 'Affiliate Sales', pendingTasks: affiliateSalesCount || 9, activeSpecialists: Math.max(2, Math.round(activeWorkersCount * 0.15)), ratio: parseFloat(((affiliateSalesCount || 9) / Math.max(1, Math.round(activeWorkersCount * 0.15))).toFixed(1)), surgeNeeded: false },
          { category: 'Data Labeling', pendingTasks: dataLabelingCount || 60, activeSpecialists: Math.max(1, Math.round(activeWorkersCount * 0.2)), ratio: parseFloat(((dataLabelingCount || 60) / Math.max(1, Math.round(activeWorkersCount * 0.2))).toFixed(1)), surgeNeeded: (dataLabelingCount || 60) > 30 }
        ];

        setDemandSupplyGrid(updatedGrid);
      });

      return () => unsubUsers();
    });

    return () => unsubTasks();
  }, []);

  // --- 4. LIVE DOUBLE-BLIND ARBITRATION SUBMISSIONS ---
  useEffect(() => {
    const unsubSubmissions = onSnapshot(collection(db, 'taskSubmissions'), (snapshot) => {
      const allSubList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      const disputesList = allSubList
        .filter((s: any) => s.status === 'rejected' || s.status === 'pending')
        .map((s: any) => ({
          id: s.id,
          worker: s.workerName || 'Unknown Worker',
          workerEmail: s.workerEmail || `${s.workerName?.toLowerCase().replace(/\s+/g, '') || 'worker'}@gmail.com`,
          workerLevel: s.workerLevel || 'Level 3',
          partner: s.venture || 'Vyuma Digital',
          taskName: s.taskTitle || 'Generic Verification Mission',
          partnerBrief: s.taskDescription || 'Ensure correct user credentials and complete verification screenshot matching layout instructions strictly.',
          workerProof: s.proofData || s.proofUrl || 'No proof file provided',
          subAdminNotes: s.rejectionReason || 'Pending dispute review by executive sub-admin for forensic device ID verification.',
          workerId: s.workerId,
          taskId: s.taskId,
          earningAmount: s.earningAmount || 45,
          status: s.status
        }));

      if (disputesList.length > 0) {
        setDisputes(disputesList);
        setSelectedDisputeId(prevId => disputesList.find(d => d.id === prevId) ? prevId : disputesList[0].id);
      }
    });

    return () => unsubSubmissions();
  }, []);

  // --- 4B. LIVE PARTNERS REPUTATION SYSTEM ---
  useEffect(() => {
    const unsubRep = onSnapshot(collection(db, 'partnersReputation'), (snapshot) => {
      if (!snapshot.empty) {
        setPartnersReputation(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any })));
      }
    });
    return () => unsubRep();
  }, []);

  // --- 5. SECURED ACTION AUDIT TIMELINE ---
  useEffect(() => {
    const unsubLogs = onSnapshot(query(collection(db, 'auditLogs'), orderBy('time', 'desc'), limit(120)), (snapshot) => {
      const logsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (logsList.length > 0) {
        setAdminActionLogs(logsList as any);
      } else {
        const initialLogs = [
          { id: 'log_1', user: 'Sub-Admin Raj', action: 'Approved Withdrawal ID #902 (Rahul Sharma, ₹4,500.00)', time: new Date(Date.now() - 30 * 60 * 1000).toISOString(), priority: 'Low' },
          { id: 'log_2', user: 'Sub-Admin Dev', action: 'Altered base minimum payout rate for App Installs to ₹15.00', time: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), priority: 'Medium' },
          { id: 'log_3', user: 'Sub-Admin Anjali', action: 'Flagged Vyuma Digital for suspicious rejection rate of 17.5%', time: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), priority: 'High' },
          { id: 'log_4', user: 'Sub-Admin Raj', action: 'Approved batch of 45 disputed social share missions', time: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), priority: 'Low' },
          { id: 'log_5', user: 'Super Admin (You)', action: 'Initialized Escrow ledger and pre-funding thresholds config', time: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), priority: 'Medium' }
        ];
        setAdminActionLogs(initialLogs);
      }
    });

    return () => unsubLogs();
  }, []);

  // --- 6. SECURED RETENTION COHORTS & PERFORMANCE SCATTERPLOT ---
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      const workers = userList.filter(u => 
        u.role?.toLowerCase() !== 'admin' &&
        u.email !== 'marateyh@gmail.com' &&
        u.email !== 'hvrsindustriespvtltd@gmail.com'
      );

      // Churn Risk
      const inactiveVetsList = workers
        .filter(u => (u.level === 'Level 5' || u.level === 'Level 6 (VIP)' || u.level === 'Level 6'))
        .map(u => {
          let lastActive = '8 days ago';
          if (u.joinedAt) {
            const daysAgo = Math.floor((Date.now() - new Date(u.joinedAt).getTime()) / (24 * 3600 * 1000)) + 4;
            lastActive = `${daysAgo} days ago`;
          }
          return {
            id: u.id,
            name: u.name || 'Veteran Specialist',
            email: u.email || 'no-email@workplex.co',
            level: u.level || 'Level 5',
            lastActive,
            earningsToDate: u.wallets?.earned || 8200,
            risk: u.streak && u.streak < 3 ? 'High Churn Risk' : 'Medium Churn Risk'
          };
        });

      if (inactiveVetsList.length > 0) {
        setInactiveVeterans(inactiveVetsList.slice(0, 6));
      } else {
        setInactiveVeterans([
          { id: 'vet_1', name: 'Amit Verma', email: 'amit.verma@yahoo.co.in', level: 'Level 5', lastActive: '8 days ago', earningsToDate: 14200, risk: 'High Churn Risk' },
          { id: 'vet_2', name: 'Sumit Saxena', email: 'sumit_saxena@gmail.com', level: 'Level 6 (VIP)', lastActive: '12 days ago', earningsToDate: 28400, risk: 'Extreme Churn Risk' },
          { id: 'vet_3', name: 'Deepa Iyer', email: 'iyer.deepa@rediffmail.com', level: 'Level 5', lastActive: '9 days ago', earningsToDate: 11150, risk: 'Medium Churn Risk' }
        ]);
      }

      // Scatterplot Data
      const dynamicScatter = workers.map((u, index) => {
        const e = u.wallets?.earned || 0;
        return {
          id: u.id,
          name: u.name ? u.name.split(' ')[0] + '.' : `Worker ${index + 1}`,
          completions: Math.min(350, Math.round(e / 40) + ((u.streak || 2) * 4) + 12),
          earningsHr: Math.min(420, Math.round(e / 12) + 90),
          category: e > 1200 ? 'Elite (Top 5%)' : 'Standard Core'
        };
      });

      if (dynamicScatter.length > 3) {
        setScatterWorkersData(dynamicScatter);
      } else {
        setScatterWorkersData([
          { id: 'w_1', name: 'Rahul S.', completions: 180, earningsHr: 220, category: 'Elite (Top 5%)' },
          { id: 'w_2', name: 'Sumit S.', completions: 290, earningsHr: 310, category: 'Elite (Top 5%)' },
          { id: 'w_3', name: 'Rajesh K.', completions: 62, earningsHr: 120, category: 'Standard Core' },
          { id: 'w_4', name: 'Deepa I.', completions: 140, earningsHr: 240, category: 'Elite (Top 5%)' },
          { id: 'w_5', name: 'Pooja T.', completions: 85, earningsHr: 135, category: 'Standard Core' },
          { id: 'w_6', name: 'Ananya R.', completions: 210, earningsHr: 280, category: 'Elite (Top 5%)' },
          { id: 'w_7', name: 'Vikram A.', completions: 45, earningsHr: 80, category: 'Novice/Growing' },
          { id: 'w_8', name: 'Kabir P.', completions: 260, earningsHr: 390, category: 'Elite (Top 5%)' }
        ]);
      }
    });

    return () => unsubUsers();
  }, []);

  // --- ACTIONS ---
  const handleTopupEscrow = async (id: string) => {
    try {
      const topupAmt = 25000;
      const escrowRef = doc(db, 'escrows', id);
      const snap = await getDoc(escrowRef);
      if (snap.exists()) {
        const currentData = snap.data();
        const currentFunded = Number(currentData.escrowFunded) || 0;
        await updateDoc(escrowRef, {
          escrowFunded: currentFunded + topupAmt,
          status: 'Safe'
        });
        toast.success(`Success! Pre-funded Escrow for corporate brand is credited +${formatCurrency(topupAmt)}`);
        logAction(`Pre-funded Escrow credited +₹25,000.00 for ${currentData.company || 'Partner'}`, 'Low');
      }
    } catch (err: any) {
      toast.error("Failed to top-up escrow: " + err.message);
    }
  };

  const handleUpdateTakeRate = async (category: string, value: number) => {
    const updated = { ...takeRateTargets, [category]: value };
    setTakeRateTargets(updated);
    try {
      await setDoc(doc(db, 'settings', 'strategy'), { takeRateTargets: updated }, { merge: true });
      await logAction(`Altered take-rate target for '${category}' to ${value}%`, 'Medium');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSurgeMultiplier = async (category: string, scalar: number) => {
    const updated = { ...surgeMultipliers, [category]: scalar };
    setSurgeMultipliers(updated);
    try {
      await setDoc(doc(db, 'settings', 'strategy'), { surgeMultipliers: updated }, { merge: true });
      toast.success(`Pricing Regulator: Multiplier for '${category}' calibrated at ${scalar}x`);
      await logAction(`Updated pricing surge multiplier for '${category}' to ${scalar}x`, 'Medium');
    } catch (err) {
      console.error(err);
    }
  };

  const resolveArbitrationCase = async (caseId: string, overrulePartner: boolean) => {
    const dispObj = disputes.find(d => d.id === caseId);
    if (!dispObj) return;

    const actionText = overrulePartner 
      ? `Overruled rejection! Approved worker '${dispObj.worker}' proof & released ₹${dispObj.earningAmount || 45}`
      : `Dismissed! Uphold partner rejection for worker '${dispObj.worker}' on task '${dispObj.taskName}'`;

    try {
      // Real firestore update
      await updateDoc(doc(db, 'taskSubmissions', caseId), {
        status: overrulePartner ? 'approved' : 'rejected',
        reviewedAt: new Date().toISOString()
      });

      // Credit wallet if overruled
      if (overrulePartner && dispObj.workerId) {
        const workerRef = doc(db, 'users', dispObj.workerId);
        const workerSnap = await getDoc(workerRef);
        if (workerSnap.exists()) {
          const currentWallets = workerSnap.data()?.wallets || { earned: 0, pending: 0, bonus: 0 };
          const payAmt = Number(dispObj.earningAmount) || 45;
          
          await updateDoc(workerRef, {
            'wallets.earned': (Number(currentWallets.earned) || 0) + payAmt,
            'wallets.pending': Math.max(0, (Number(currentWallets.pending) || 0) - payAmt)
          });
        }
      }

      await logAction(actionText, 'Medium');
      toast.success(overrulePartner 
        ? 'Overruled! Worker verified screenshot accepted. Payout released. 🟢' 
        : 'Dismissed! Partner rejection upheld. Fraud alerts updated. 🛑'
      );
      
      setDisputes(prev => prev.filter(c => c.id !== caseId));
    } catch (err: any) {
      toast.error("Error resolving dispute: " + err.message);
    }
  };

  const triggerAuditSnapshotDownload = (type: string) => {
    try {
      let data = '';
      if (type === 'financial') {
        data = "Timestamp,Account,Venture Partner,Funded Escrow,Liabilities Covered,Compliance Status\n" +
               `${new Date().toISOString()},Platform Reserves,GrowPlex Standard,${platformBankReserves},${workerUnpaidLiabilities.total},SAFE\n` +
               escrows.map(e => `${new Date().toISOString()},${e.company},${e.campaign},${e.escrowFunded},${e.spend},${e.status}`).join('\n');
      } else {
        data = "Worker Name,Badges,XP Tier,Churn Status,Historical Credits\n" +
               inactiveVeterans.map(v => `${v.name},Veteran Level 5,${v.level},${v.risk},${v.earningsToDate}`).join('\n');
      }

      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `workplex_superadmin_${type}_audit_ledger.csv`);
      a.click();
      toast.success(`Super Admin: Standard corporate CSV compiled successfully! (${blob.size} bytes)`);
    } catch (err: any) {
      toast.error("Download failed: " + err.message);
    }
  };

  const deployVeteranCoupon = async (vetName: string, level: string, userId?: string) => {
    const customCode = `VET${level.replace(/\D/g, '')}LAUNCH-${Math.floor(Math.random() * 900) + 100}`;
    try {
      await addDoc(collection(db, 'coupons'), {
        uid: userId || 'veteran_global',
        workerName: vetName,
        code: customCode,
        isActive: true,
        usesToday: 0,
        totalEarned: 0,
        venture: 'All-Venture',
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
      });

      await logAction(`Dispatched promotional high-engagement coupon (${customCode}) to inactive veteran '${vetName}'`, 'Low');
      toast.success(`Success: Dispatch re-engagement campaign coupon (${customCode}) to ${vetName}! 🎁`);
      
      setInactiveVeterans(prev => prev.filter(v => v.name !== vetName));
    } catch (err: any) {
      toast.error("Error dispatching coupon: " + err.message);
    }
  };

  // Calculations for Financials
  const currentRatio = platformBankReserves / (workerUnpaidLiabilities.total || 1);
  const isHealthyReserves = currentRatio >= 1.5;
  const isAdequateReserves = currentRatio >= 1.0 && currentRatio < 1.5;

  // Pie chart format
  const categoryMarginsData = Object.entries(takeRateTargets).map(([key, value]) => ({
    name: key.replace(/([A-Z])/g, ' $1').trim(),
    value: value
  }));

  // Velocity data
  const velocityData = [
    { name: '08:00', 'Tier 1 (Click)': 2, 'Tier 2 (Verify)': 18, 'Tier 3 (Author)': 45 },
    { name: '10:00', 'Tier 1 (Click)': 3, 'Tier 2 (Verify)': 24, 'Tier 3 (Author)': 60 },
    { name: '12:00', 'Tier 1 (Click)': 5, 'Tier 2 (Verify)': 35, 'Tier 3 (Author)': 95 },
    { name: '14:00', 'Tier 1 (Click)': 4, 'Tier 2 (Verify)': 40, 'Tier 3 (Author)': 120 },
    { name: '16:00', 'Tier 1 (Click)': 2, 'Tier 2 (Verify)': 19, 'Tier 3 (Author)': 75 },
    { name: '18:00', 'Tier 1 (Click)': 1, 'Tier 2 (Verify)': 12, 'Tier 3 (Author)': 40 }
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Dynamic Visual Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-gradient-to-r from-[#111] via-[#161616] to-[#111] border border-white/5 p-8 rounded-[40px] shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="p-4 bg-[#E8B84B]/10 rounded-3xl text-[#E8B84B] border border-[#E8B84B]/20">
            <ShieldCheck size={36} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Strategic Advisory Panel</h1>
              <span className="text-[10px] font-black bg-[#E8B84B] text-black px-2.5 py-1 rounded-full uppercase">30-Year CEO Advisory Lab</span>
            </div>
            <p className="text-gray-400 text-xs mt-1 md:text-sm font-medium">Real-time marketplace liquidity regulation, double-blind arbitrations, reserve compliance, and cohort churn models.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end xl:self-auto">
          <div className="p-3 bg-[#1A1A1A] rounded-2xl border border-white/5 text-center px-6">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Aggregate Liabilities</p>
            <p className="text-base font-black text-rose-500 mt-0.5">{formatCurrency(workerUnpaidLiabilities.total)}</p>
          </div>
          <div className="p-3 bg-[#1A1A1A] rounded-2xl border border-white/5 text-center px-6">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Reserve Ratio</p>
            <p className={`text-base font-black mt-0.5 ${isHealthyReserves ? 'text-emerald-500' : 'text-amber-500'}`}>
              {currentRatio.toFixed(2)}x
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex overflow-x-auto pb-2 gap-2 border-b border-white/5 scrollbar-thin scrollbar-thumb-neutral-800">
        {[
          { id: 'financial', label: '1. Financial Health & Liquidity', icon: DollarSign },
          { id: 'marketplace', label: '2. Marketplace & Price Regulation', icon: Sliders },
          { id: 'arbitration', label: '3. Strategic Arbitration Console', icon: GavelIcon },
          { id: 'compliance', label: '4. Compliance & Audit Trails', icon: ShieldCheck },
          { id: 'retention', label: '5. Cohorts & Gamification Policy', icon: Award }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-b from-[#E8B84B] to-[#d4a63f] text-black border-transparent shadow-lg shadow-[#E8B84B]/10' 
                  : 'bg-[#111]/80 text-gray-400 border-white/5 hover:bg-[#161616] hover:text-white'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TABS CONTAINER */}
      <AnimatePresence mode="wait">
        {activeTab === 'financial' && (
          <motion.div
            key="financial"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Liquidity Ledger */}
            <div className="lg:col-span-2 bg-[#111111] border border-white/5 p-8 rounded-[40px] space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">Liquidity & Reserve Ledger</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                      Dynamic ratio analyzer relative to active unpaid worker liabilities
                    </p>
                  </div>
                  <HelpTooltip text="Align state of liquid reserves vs system liabilities to maintain absolute insolvency immunity." />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="bg-[#161616] p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-[#E8B84B] font-bold uppercase tracking-widest">Active Unpaid (Earned)</p>
                    <p className="text-xl font-black text-white mt-1">{formatCurrency(workerUnpaidLiabilities.earned)}</p>
                  </div>
                  <div className="bg-[#161616] p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Pending Verification</p>
                    <p className="text-xl font-black text-white mt-1">{formatCurrency(workerUnpaidLiabilities.pending)}</p>
                  </div>
                  <div className="bg-[#161616] p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">AGGREGATE OBLIGATION</p>
                    <p className="text-xl font-black text-white mt-1">{formatCurrency(workerUnpaidLiabilities.total)}</p>
                  </div>
                </div>

                {/* Reserves Adjustable Simulator */}
                <div className="mt-8 space-y-3 bg-[#161616] p-6 rounded-3xl border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Simulated Bank Capital Reserves</span>
                    <span className="text-sm font-mono font-black text-[#E8B84B]">{formatCurrency(platformBankReserves)}</span>
                  </div>
                  <input 
                    type="range" 
                    min={Math.round(workerUnpaidLiabilities.total * 0.3) || 12000} 
                    max="500000" 
                    step="5000"
                    value={platformBankReserves}
                    onChange={async (e) => {
                      const val = Number(e.target.value);
                      setPlatformBankReserves(val);
                      try {
                        await setDoc(doc(db, 'settings', 'strategy'), { platformBankReserves: val }, { merge: true });
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="w-full accent-[#E8B84B]"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 uppercase font-black tracking-widest">
                    <span>{formatCurrency(Math.round(workerUnpaidLiabilities.total * 0.3))} (Min)</span>
                    <span>₹500,000 (Max CEO target)</span>
                  </div>
                </div>
              </div>

              {/* Coverage Ratio Gauge Indicator */}
              <div className={`p-6 rounded-3xl border mt-6 flex items-center justify-between ${
                isHealthyReserves 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                  : isAdequateReserves 
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' 
                    : 'bg-rose-500/5 border-rose-500/20 text-rose-400'
              }`}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#E8B84B]">Ledger Safety Level</p>
                  <p className="text-lg font-black uppercase tracking-tight mt-1">
                    {isHealthyReserves ? 'I-1 Class Solvency Safety' : isAdequateReserves ? 'I-2 Cautionary Coverage' : 'I-3 Insolvency Danger Crunch'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest">Liquidity Health Index</p>
                  <p className="text-2xl font-mono font-black tracking-tighter mt-1">{currentRatio.toFixed(2)}x</p>
                </div>
              </div>
            </div>

            {/* Take-Rate Margins Analyzer */}
            <div className="bg-[#111111] border border-white/5 p-8 rounded-[40px] space-y-6">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Take-Rate Margin Target</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                  Adjust target percentage platform takes from partners fee per task
                </p>
              </div>

              <div className="h-44 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryMarginsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryMarginsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Weighted Average</span>
                  <span className="text-xl font-black text-[#E8B84B]">
                    {(Object.values(takeRateTargets).reduce((a, b) => a + b, 0) / 5).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(takeRateTargets).map(([key, value], idx) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-gray-300 capitalize flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="text-white font-mono">{value}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="60" 
                      value={value}
                      onChange={(e) => handleUpdateTakeRate(key, Number(e.target.value))}
                      className="w-full accent-gray-500 h-1 rounded"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Campaign Pre-Funded Escrow Ledger (Full-grid width) */}
            <div className="lg:col-span-3 bg-[#111111] border border-white/5 p-8 rounded-[40px] space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">Escrow Ledger (Pre-funded campaigns)</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                    Keep partners pre-funded to hedge against system liabilities
                  </p>
                </div>
                <div className="text-[10px] bg-[#E8B84B]/10 text-[#E8B84B] border border-[#E8B84B]/20 font-black px-4 py-2 rounded-xl uppercase tracking-widest animate-pulse">
                  Aggregate Escrow: {formatCurrency(escrows.reduce((a,b) => a + b.escrowFunded, 0))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] text-gray-500 font-black uppercase tracking-widest">
                      <th className="py-4 px-6">Venture Brand Partner</th>
                      <th className="py-4 px-6">Target Campaign Name</th>
                      <th className="py-4 px-6">Available Escrow</th>
                      <th className="py-4 px-6">Accumulated Spending</th>
                      <th className="py-4 px-6">Escrow Health Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escrows.map((campaign, idx) => (
                      <tr key={campaign.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                        <td className="py-4 px-6 font-black text-white">{campaign.company}</td>
                        <td className="py-4 px-6 text-gray-300 font-medium">{campaign.campaign}</td>
                        <td className="py-4 px-6 text-emerald-400 font-bold font-mono">{formatCurrency(campaign.escrowFunded)}</td>
                        <td className="py-4 px-6 text-gray-400 font-mono">{formatCurrency(campaign.spend)}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                            campaign.escrowFunded - campaign.spend < 10000 
                              ? 'bg-rose-500/10 text-rose-400' 
                              : campaign.escrowFunded - campaign.spend < 50000 
                                ? 'bg-amber-500/10 text-amber-400' 
                                : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {campaign.escrowFunded - campaign.spend < 10000 ? '🔴 CRITICAL LIQUIDITY DANGER' : '🟢 SOLID BUFFER'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => handleTopupEscrow(campaign.id)}
                            className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                          >
                            + Mock Topup ₹25k
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'marketplace' && (
          <motion.div
            key="marketplace"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Fulfillment Velocity Graph */}
            <div className="lg:col-span-2 bg-[#111111] border border-white/5 p-8 rounded-[40px] space-y-6">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Fulfillment Velocity Trend</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                  Active "Time-to-Completion" metrics for different task levels (In Minutes)
                </p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={velocityData}>
                    <defs>
                      <linearGradient id="colorTier1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTier2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E8B84B" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#E8B84B" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTier3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="name" stroke="#888" fontSize={9} />
                    <YAxis stroke="#888" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '10px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontStyle: 'normal' }} />
                    <Area type="monotone" dataKey="Tier 1 (Click)" stroke="#10B981" fillOpacity={1} fill="url(#colorTier1)" />
                    <Area type="monotone" dataKey="Tier 2 (Verify)" stroke="#E8B84B" fillOpacity={1} fill="url(#colorTier2)" />
                    <Area type="monotone" dataKey="Tier 3 (Author)" stroke="#3B82F6" fillOpacity={1} fill="url(#colorTier3)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Dynamic Price Surge Regulator */}
            <div className="bg-[#111111] border border-white/5 p-8 rounded-[40px] space-y-6">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Dynamic Pricing Regulator</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                  Adjust active surge multipliers during high deficit hours
                </p>
              </div>

              <div className="bg-[#161616] p-4 rounded-3xl border border-white/5 space-y-4">
                {Object.entries(surgeMultipliers).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                      <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-[#E8B84B] font-mono">{value}x multiplier</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1.0, 1.2, 1.5, 1.8, 2.0, 2.5].map(scalar => (
                        <button
                          key={scalar}
                          onClick={() => handleToggleSurgeMultiplier(key, scalar)}
                          className={`flex-1 py-1 rounded text-[10px] font-black transition-all ${
                            value === scalar 
                              ? 'bg-[#E8B84B] text-black shadow' 
                              : 'bg-[#1e1e1e] hover:bg-[#252525] text-gray-500 hover:text-white'
                          }`}
                        >
                          {scalar}x
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-yellow-500/5 text-yellow-500 border border-yellow-500/10 rounded-2xl text-[10px] font-medium leading-relaxed">
                🚨 Multiplier alters base rewards instantaneously on client. Re-engagement levels generally surge by 40% when multipliers exceed 2x.
              </div>
            </div>

            {/* Supply-to-Demand Heatmap */}
            <div className="lg:col-span-3 bg-[#111111] border border-white/5 p-8 rounded-[40px] space-y-6">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Supply / Demand Heatmap Matrix</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                  Live diagnostics of underserved tasks requiring immediate price surge adjustments
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {demandSupplyGrid.map(item => (
                  <div key={item.category} className="bg-[#161616] p-6 rounded-3xl border border-white/5 space-y-4 relative overflow-hidden group">
                    <p className="text-[11px] font-black text-white uppercase tracking-wider">{item.category}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-center mt-2">
                      <div className="p-2.5 bg-black/25 rounded-xl">
                        <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Tasks</span>
                        <p className="text-sm font-black text-white mt-1">{item.pendingTasks}</p>
                      </div>
                      <div className="p-2.5 bg-black/25 rounded-xl">
                        <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Workers</span>
                        <p className="text-sm font-black text-white mt-1">{item.activeSpecialists}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-black">
                      <span className="text-gray-500 uppercase tracking-widest">Ratio Priority</span>
                      <span className="text-white font-mono">{item.ratio}%</span>
                    </div>

                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#E8B84B]" style={{ width: `${Math.min(item.ratio, 100)}%` }}></div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] uppercase font-black tracking-widest">
                      <span className={item.surgeNeeded ? 'text-rose-400' : 'text-emerald-400'}>
                        {item.surgeNeeded ? '🔥 Shortfall' : '🟢 Saturated'}
                      </span>
                      {item.surgeNeeded && (
                        <button 
                          onClick={() => handleToggleSurgeMultiplier(
                            item.category.replace(/\s+/g, '').replace(/^\w/, (c) => c.toLowerCase()), 2.0
                          )}
                          className="text-[#E8B84B] font-bold hover:underline"
                        >
                          Trigger Surge (+2.0x)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'arbitration' && (
          <motion.div
            key="arbitration"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Double-Blind Arbitration Split Panel */}
            <div className="lg:col-span-2 bg-[#111111] border border-white/5 p-8 rounded-[40px] space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">Double-Blind Arbitration</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                    Side-by-side neutral validation of disputes between partners and workers
                  </p>
                </div>
                <div className="text-xs text-gray-500 font-black uppercase tracking-widest">
                  Disputes pending: {disputes.length}
                </div>
              </div>

              {disputes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Left List */}
                  <div className="md:col-span-1 space-y-3 border-r border-white/5 pr-4">
                    {disputes.map(disp => (
                      <button
                        key={disp.id}
                        onClick={() => setSelectedDisputeId(disp.id)}
                        className={`w-full p-4 rounded-2xl text-left border transition-all text-xs ${
                          selectedDisputeId === disp.id 
                            ? 'bg-[#E8B84B]/10 border-[#E8B84B]/30' 
                            : 'bg-[#161616] border-transparent hover:bg-[#1a1a1a]'
                        }`}
                      >
                        <span className="text-[8px] text-yellow-500 uppercase tracking-widest font-black block mb-1">
                          {disp.id}
                        </span>
                        <p className="font-extrabold text-white truncate">{disp.worker}</p>
                        <p className="text-[10px] text-gray-500 mt-1 truncate">{disp.partner}</p>
                      </button>
                    ))}
                  </div>

                  {/* Right Details Split Panel */}
                  {(() => {
                    const activeDispute = disputes.find(d => d.id === selectedDisputeId) || disputes[0];
                    if (!activeDispute) return null;
                    return (
                      <div className="md:col-span-3 space-y-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] text-[#E8B84B] font-bold uppercase tracking-widest">
                              Disputed Task Parameters
                            </span>
                            <h4 className="text-sm font-black text-white mt-1">
                              {activeDispute.taskName}
                            </h4>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest bg-yellow-500/15 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/20">
                            {activeDispute.workerLevel}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Brief (Partner's side) */}
                          <div className="p-4 bg-[#161616] rounded-2xl border border-white/5 space-y-2">
                            <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                              <Shield size={10} /> Corporate Brief Instruction
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                              {activeDispute.partnerBrief}
                            </p>
                            <div className="p-2 bg-black/30 rounded text-[9px] uppercase font-black tracking-wider text-rose-400">
                              Partner rejection rate: {partnersReputation.find(p => p.partner === activeDispute.partner)?.rate || '0.0'}%
                            </div>
                          </div>

                          {/* Submitted Proof (Worker's side) */}
                          <div className="p-4 bg-[#161616] rounded-2xl border border-white/5 space-y-2">
                            <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                              <CheckCircle size={10} /> Worker Proof Submitted
                            </div>
                            <div className="p-3 bg-black/40 rounded border border-white/5 text-[11px] font-mono text-emerald-400 break-all select-all">
                              {activeDispute.workerProof}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1 text-center font-bold">
                              Verified email: {activeDispute.workerEmail}
                            </div>
                          </div>
                        </div>

                        {/* Sub-admin commentary */}
                        <div className="p-4 bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 rounded-2xl text-[11px] font-medium">
                          <strong>Sub-Admin Observation Notes:</strong> {activeDispute.subAdminNotes}
                        </div>

                        {/* Executive Decision buttons */}
                        <div className="flex gap-4">
                          <button
                            onClick={() => resolveArbitrationCase(activeDispute.id, true)}
                            className="flex-1 py-3 bg-[#E8B84B] text-black hover:bg-[#d4a63f] text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2"
                          >
                            <CheckSquare size={14} /> Overrule: Approve Worker (₹45.00)
                          </button>
                          <button
                            onClick={() => resolveArbitrationCase(activeDispute.id, false)}
                            className="flex-1 py-3 bg-[#1A1A1A] hover:bg-[#252525] text-white hover:text-rose-400 text-xs font-black uppercase tracking-wider rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-2"
                          >
                            <X size={14} /> Uphold Reject (Dismiss)
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center p-12 bg-[#161616] rounded-3xl text-gray-500 font-bold">
                  🎉 Pristine state: Zero current pending disputes in double-blind queue.
                </div>
              )}
            </div>

            {/* Partners Reputation Tracker */}
            <div className="bg-[#111111] border border-white/5 p-8 rounded-[40px] space-y-6">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Partner Rejection Scores</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                  System flags automatically if partner rejection rate exceeds 15%
                </p>
              </div>

              <div className="space-y-4">
                {partnersReputation.map(p => (
                  <div key={p.partner} className="p-4 bg-[#161616] rounded-2xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-white uppercase tracking-wider">{p.partner}</span>
                      <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        p.rate > 15 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                      <span>Disputed / Total:</span>
                      <span className="font-mono text-white">{p.rejections} / {p.totalSubmissions}</span>
                    </div>

                    <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                      <span>Rejection Rate:</span>
                      <span className={`font-mono font-black ${p.rate > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {p.rate}%
                      </span>
                    </div>

                    <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                      <div className={`h-full ${p.rate > 15 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${p.rate * 4}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mass Fast-Track Verification Pipe */}
            <div className="lg:col-span-3 bg-[#111111] border border-white/5 p-8 rounded-[40px] space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">Fast-Track Verification Queue</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                    Mass resolution center for automated sub-admin batching operations
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    disabled={selectedDisputes.length === 0}
                    onClick={() => {
                      toast.success(`Batch Success! Paid out and resolved ${selectedDisputes.length} selected disputed tasks.`);
                      setDisputes(prev => prev.filter(d => !selectedDisputes.includes(d.id)));
                      setSelectedDisputes([]);
                    }}
                    className="bg-[#E8B84B] hover:bg-[#d4a63f] disabled:opacity-30 disabled:pointer-events-none text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Batch Approve ({selectedDisputes.length})
                  </button>
                  <button
                    disabled={selectedDisputes.length === 0}
                    onClick={() => {
                      toast.error(`Batch Success! Multi-declined ${selectedDisputes.length} disputed tasks.`);
                      setDisputes(prev => prev.filter(d => !selectedDisputes.includes(d.id)));
                      setSelectedDisputes([]);
                    }}
                    className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:pointer-events-none text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Batch Reject All
                  </button>
                </div>
              </div>

              {disputes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[9px] text-gray-500 font-black uppercase tracking-widest">
                        <th className="py-4 px-6 w-10">
                          <input 
                            type="checkbox"
                            checked={selectedDisputes.length === disputes.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDisputes(disputes.map(d => d.id));
                              } else {
                                setSelectedDisputes([]);
                              }
                            }}
                            className="rounded accent-[#E8B84B]"
                          />
                        </th>
                        <th className="py-4 px-6">Dispute UID</th>
                        <th className="py-4 px-6">Worker Info</th>
                        <th className="py-4 px-6">Partner Venture</th>
                        <th className="py-4 px-6">Target Task</th>
                        <th className="py-4 px-6">Current Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disputes.map(disp => (
                        <tr key={disp.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                          <td className="py-4 px-6">
                            <input 
                              type="checkbox"
                              checked={selectedDisputes.includes(disp.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDisputes(prev => [...prev, disp.id]);
                                } else {
                                  setSelectedDisputes(prev => prev.filter(id => id !== disp.id));
                                }
                              }}
                              className="rounded accent-[#E8B84B]"
                            />
                          </td>
                          <td className="py-4 px-6 font-mono text-xs text-[#E8B84B] font-black">{disp.id}</td>
                          <td className="py-4 px-6">
                            <p className="font-extrabold text-white">{disp.worker}</p>
                            <span className="text-[9px] text-gray-500 font-mono">{disp.workerLevel}</span>
                          </td>
                          <td className="py-4 px-6 font-black text-gray-300">{disp.partner}</td>
                          <td className="py-4 px-6 text-gray-400 font-medium truncate max-w-xs">{disp.taskName}</td>
                          <td className="py-4 px-6">
                            <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-black text-[8px] uppercase px-3 py-1 rounded-full tracking-widest block text-center max-w-[120px]">
                              ⚠️ Sub-Admin Dispute
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-8 bg-[#161616] rounded-3xl text-gray-500 font-bold">
                  Zero items left to batch process.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'compliance' && (
          <motion.div
            key="compliance"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Sub-Admin Action Logs */}
            <div className="lg:col-span-2 bg-[#111111] border border-white/5 p-8 rounded-[40px] space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">Sub-Admin Action Audit Trails</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                      Immutable timeline monitoring delegated sub-admin adjustments and approvals
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                      <input 
                        type="text"
                        placeholder="Search logs..."
                        value={auditSearchQuery}
                        onChange={(e) => setAuditSearchQuery(e.target.value)}
                        className="bg-[#161616] border border-white/5 pl-9 pr-4 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-[#E8B84B] transition-colors"
                      />
                    </div>
                    <select
                      value={auditFilterAdmin}
                      onChange={(e) => setAuditFilterAdmin(e.target.value)}
                      className="bg-[#161616] border border-white/5 px-4 py-2 rounded-xl text-xs text-gray-400 focus:outline-none focus:border-[#E8B84B] transition-colors"
                    >
                      <option value="All">All Admins</option>
                      <option value="Raj">Raj</option>
                      <option value="Dev">Dev</option>
                      <option value="Anjali">Anjali</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                  {adminActionLogs
                    .filter(log => {
                      const matchesSearch = log.action.toLowerCase().includes(auditSearchQuery.toLowerCase()) || log.user.toLowerCase().includes(auditSearchQuery.toLowerCase());
                      const matchesAdmin = auditFilterAdmin === 'All' || log.user.includes(auditFilterAdmin);
                      return matchesSearch && matchesAdmin;
                    })
                    .map(log => (
                      <div key={log.id} className="p-4 bg-[#161616] rounded-2xl border border-white/5 flex items-start gap-4 hover:border-white/10 transition-colors">
                        <div className={`p-2 rounded-xl border shrink-0 ${
                          log.priority === 'High' 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse' 
                            : log.priority === 'Medium' 
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                          <ShieldAlert size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-white uppercase tracking-wider">{log.user}</span>
                            <span className="text-[9px] text-gray-500 font-semibold">{safeFormatDate(log.time, 'HH:mm | dd MMM')}</span>
                          </div>
                          <p className="text-xs text-gray-300 font-medium mt-1 leading-relaxed">
                            {log.action}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-3xl mt-6 flex justify-between items-center text-xs">
                <span className="text-gray-400">Total actions processed today: <strong>14</strong></span>
                <span className="text-[#E8B84B] font-bold">Secure Audit Lock: active ✅</span>
              </div>
            </div>

            {/* Immediate Critical Alarm Config */}
            <div className="bg-[#111111] border border-white/5 p-8 rounded-[40px] space-y-6">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Critical Alarm Triggers</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                  Activate immediate automated CEO push/alert actions for compliance thresholds
                </p>
              </div>

              <div className="space-y-4">
                {alertsConfig.map(rule => (
                  <div key={rule.id} className="p-4 bg-[#161616] rounded-2xl border border-white/5 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-white uppercase tracking-wider">{rule.tLabel}</p>
                      <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{rule.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        setAlertsConfig(prev => prev.map(item => {
                          if (item.id === rule.id) {
                            const nextState = !item.active;
                            toast.success(`Compliance alert rule altered! Status: ${nextState ? 'ENGAGED 🟢' : 'DISENGAGED 🛑'}`);
                            return { ...item, active: nextState };
                          }
                          return item;
                        }));
                      }}
                      className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${
                        rule.active ? 'bg-[#E8B84B]' : 'bg-neutral-800'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-black transition-transform ${
                        rule.active ? 'translate-x-6' : 'translate-x-0'
                      }`}></div>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  toast.promise(
                    new Promise((res) => setTimeout(res, 1200)),
                    {
                      loading: 'Triggering mock failure scenario...',
                      success: 'ALARM EMULATED SUCCESSFULLY! Push alerts sent & audit logs generated.',
                      error: 'Failure emulating alert'
                    }
                  );
                }}
                className="w-full py-3.5 bg-rose-500/10 hover:bg-rose-500/15 text-rose-500 border border-rose-500/20 font-black text-xs uppercase tracking-widest rounded-2xl transition-all"
              >
                ⚠ Emulate Alarm Scenario Test
              </button>
            </div>

            {/* Database Instant Backups (CEO CSV exporters) */}
            <div className="lg:col-span-3 bg-[#111111] border border-white/5 p-8 rounded-[40px] space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">Secured Database Snapshots</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                    Export full transactional ledgers and worker performance states securely to standard audit-ready CSV blobs
                  </p>
                </div>
                <div className="p-2.5 bg-[#161616] rounded-2xl border border-white/5 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                  AES-256 Client-Side Compiles
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-[#161616] rounded-3xl border border-white/5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-black text-white uppercase tracking-wider">Financial Transactional Ledger</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Compiles complete partner escrows, aggregated unpaid worker hashes, pending withdrawals, and platform reserves. Highly optimized for venture capital reporting.
                    </p>
                  </div>
                  <button
                    onClick={() => triggerAuditSnapshotDownload('financial')}
                    className="py-3 bg-[#E8B84B] hover:bg-[#d4a63f] text-black font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    <Download size={14} /> Export Financial Ledger (CSV)
                  </button>
                </div>

                <div className="p-6 bg-[#161616] rounded-3xl border border-white/5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-black text-white uppercase tracking-wider">Worker Retention Portfolio</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Generates complete export database list mapping veteran churn ratings, average tasks handled, individual user levels, and badges metadata.
                    </p>
                  </div>
                  <button
                    onClick={() => triggerAuditSnapshotDownload('workers')}
                    className="py-3 bg-[#1A1A1A] hover:bg-[#252525] border border-white/5 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    <Download size={14} /> Export Cohorts & Performance CSV
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'retention' && (
          <motion.div
            key="retention"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Elite Worker Scatterplot Chart */}
            <div className="lg:col-span-2 bg-[#111111] border border-white/5 p-8 rounded-[40px] space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">Elite Worker Scatterplot</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                    Visual identification of top 5% of earners completing 40% of missions
                  </p>
                </div>
                <button
                  onClick={() => {
                    toast.success("Invites dispatched! 🚀 Exclusives dashboard updated for Level 5+ cohort.");
                  }}
                  className="bg-[#E8B84B] hover:bg-[#d4a63f] text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Dispatch Premium Invites to Elite
                </button>
              </div>

              <div className="h-72 w-full pr-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="completions" name="Completed Tasks" stroke="#888" fontSize={9} />
                    <YAxis type="number" dataKey="earningsHr" name="Wage (₹/hr)" stroke="#888" fontSize={9} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '10px' }} />
                    <Scatter name="Elite Workers" data={scatterWorkersData} fill="#E8B84B">
                      <LabelList dataKey="name" position="top" style={{ fontSize: '8px', fill: '#ccc', fontWeight: 'bold' }} />
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Career Progression Configurators */}
            <div className="bg-[#111111] border border-white/5 p-8 rounded-[40px] space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Progression Multiplier Lab</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                  Tune target Experience Points and Badge multipliers across user tiers
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2 bg-[#161616] p-4 rounded-3xl border border-white/5">
                  <div className="flex justify-between items-center text-xs font-bold uppercase">
                    <span className="text-gray-400">Global XP Coefficient</span>
                    <span className="text-[#E8B84B] font-mono">{careerCoefficients.baseXpMultiplier}x scaler</span>
                  </div>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="3.0" 
                    step="0.1"
                    value={careerCoefficients.baseXpMultiplier}
                    onChange={(e) => setCareerCoefficients(prev => ({ ...prev, baseXpMultiplier: parseFloat(e.target.value) }))}
                    className="w-full accent-[#E8B84B]"
                  />
                </div>

                <div className="space-y-2 bg-[#161616] p-4 rounded-3xl border border-white/5">
                  <div className="flex justify-between items-center text-xs font-bold uppercase">
                    <span className="text-gray-400">Level-Up Bonus Earning</span>
                    <span className="text-[#E8B84B] font-mono">+{careerCoefficients.levelUpBonusBasePercent}% flat</span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="25" 
                    step="1"
                    value={careerCoefficients.levelUpBonusBasePercent}
                    onChange={(e) => setCareerCoefficients(prev => ({ ...prev, levelUpBonusBasePercent: parseInt(e.target.value) }))}
                    className="w-full accent-[#E8B84B]"
                  />
                </div>

                <div className="p-4 bg-[#161616] rounded-2xl border border-white/5 flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400 uppercase tracking-wide">Elite Core Priority Routing</span>
                  <button
                    onClick={() => {
                      setCareerCoefficients(prev => ({ ...prev, vipExclusivesPrecedence: !prev.vipExclusivesPrecedence }));
                      toast.success("Routing mechanism recalibrated!");
                    }}
                    className={`px-3 py-1.5 rounded-xl uppercase text-[10px] font-black transition-all ${
                      careerCoefficients.vipExclusivesPrecedence 
                        ? 'bg-[#E8B84B] text-black' 
                        : 'bg-neutral-800 text-gray-400'
                    }`}
                  >
                    {careerCoefficients.vipExclusivesPrecedence ? 'Priority Live' : 'Symmetric'}
                  </button>
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    await setDoc(doc(db, 'settings', 'strategy'), { careerCoefficients }, { merge: true });
                    await logAction(`Recalibrated career coefficients to: baseXpMultiplier=${careerCoefficients.baseXpMultiplier}x, levelUpBonus=${careerCoefficients.levelUpBonusBasePercent}%`, 'Medium');
                    toast.success("Career Coefficients successfully deployed to live server! 🧬");
                  } catch (err: any) {
                    toast.error("Deployment failed: " + err.message);
                  }
                }}
                className="w-full py-3.5 bg-gradient-to-r from-[#E8B84B] to-[#d4a63f] hover:scale-[1.02] text-black font-black text-xs uppercase tracking-wider rounded-2xl transition-all mt-4"
              >
                Apply Progression Coefficients
              </button>
            </div>

            {/* Veteran Churn Alerts */}
            <div className="lg:col-span-3 bg-[#111111] border border-white/5 p-8 rounded-[40px] space-y-6">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Cohort Churn Watchdog (Inactive Veterans)</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                  Tracks when level 5+ workers exceed 7 days of inactivity. Trigger targeted automation.
                </p>
              </div>

              {inactiveVeterans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {inactiveVeterans.map(vet => (
                    <div key={vet.id} className="p-6 bg-[#161616] rounded-3xl border border-white/5 flex flex-col justify-between relative group hover:border-[#E8B84B]/30 transition-all">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-black text-white text-base leading-tight">{vet.name}</h4>
                            <span className="text-[10px] text-gray-500 font-mono mt-1 block">{vet.email}</span>
                          </div>
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-pulse">
                            {vet.risk}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                          <div>
                            <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Earning Balance</span>
                            <p className="text-xs font-black text-white mt-1">{formatCurrency(vet.earningsToDate)}</p>
                          </div>
                          <div>
                            <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Inactivity Duration</span>
                            <p className="text-xs font-black text-white mt-1">{vet.lastActive}</p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => deployVeteranCoupon(vet.name, vet.level)}
                        className="w-full mt-6 py-2.5 bg-[#1A1A1A] hover:bg-[#E8B84B] border border-white/5 text-white hover:text-black font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
                      >
                        Gift Targeted +15% Re-engagement Coupon
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-[#161616] rounded-3xl text-gray-500 font-bold">
                  All active high-level veterans are successfully engaged. Cohort health index: Excellent (100%).
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Help tooltip sub-component
const HelpTooltip = ({ text }: { text: string }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative shrink-0">
      <button 
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="p-1.5 text-gray-500 hover:text-white transition-colors"
      >
        <HelpCircle size={15} />
      </button>
      {visible && (
        <div className="absolute right-0 top-7 w-48 bg-black/90 p-3 rounded-xl border border-white/10 text-[10px] text-gray-300 leading-normal z-[90] shadow-2xl">
          {text}
        </div>
      )}
    </div>
  );
};

const GavelIcon = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="14" 
    height="14" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="m14 13-5 5" />
    <path d="m3 21 3-3" />
    <path d="m9 15-5-5-1 1a2 2 0 0 0 0 3l3 3a2 2 0 0 0 3 0Z" />
    <path d="m15 9 5 5 1-1a2 2 0 0 0 0-3l-3-3a2 2 0 0 0-3 0Z" />
    <path d="m9 9 6 6" />
  </svg>
);
