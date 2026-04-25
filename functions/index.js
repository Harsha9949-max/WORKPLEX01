const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const Razorpay = require('razorpay');
admin.initializeApp();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const AI_MODEL = 'google/gemma-2-27b-it:free';

/**
 * Helper to call OpenRouter API with caching
 */
async function callOpenRouter(systemPrompt, userPrompt, cacheKey, ttlHours = 6) {
  const db = admin.firestore();
  
  // 1. Check Cache
  if (cacheKey) {
    const cacheDoc = await db.collection('aiCache').doc(cacheKey).get();
    if (cacheDoc.exists) {
      const data = cacheDoc.data();
      if (data.expiresAt.toDate() > new Date()) {
        return data.data;
      }
    }
  }

  // 2. Call API
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  try {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://workplex-01.vercel.app',
          'X-Title': 'WorkPlex AI'
        }
      }
    );

    const result = JSON.parse(response.data.choices[0].message.content);

    // 3. Save to Cache
    if (cacheKey) {
      await db.collection('aiCache').doc(cacheKey).set({
        key: cacheKey,
        data: result,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + ttlHours * 3600000))
      });
    }

    return result;
  } catch (error) {
    console.error('OpenRouter API Error:', error.message);
    await db.collection('aiErrors').add({
      function: 'callOpenRouter',
      error: error.message,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    throw error;
  }
}

exports.generateAIPredictions = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  
  const { pendingTasksCount, avgEarning, completionRate } = data;
  const uid = context.auth.uid;
  const cacheKey = `prediction_${uid}`;

  const systemPrompt = 'You are a gig worker earnings predictor. Respond only in valid JSON format.';
  const userPrompt = `Worker has ${pendingTasksCount} tasks pending. Average earning ${avgEarning}. Completion rate ${completionRate}%. Predict today earnings potential. Return JSON: {"predictedEarning": number, "motivationalMessage": "string"}`;

  try {
    return await callOpenRouter(systemPrompt, userPrompt, cacheKey);
  } catch (error) {
    return { predictedEarning: 0, motivationalMessage: "Keep working hard!" };
  }
});

exports.reviewProofContent = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  
  const { proofText, proofType, venture } = data;
  const systemPrompt = 'You are a content quality reviewer for a gig platform. Respond only in valid JSON format.';
  const userPrompt = `Rate this content for ${venture} marketing work. Content: ${proofText}. Return JSON: {"score": number, "reason": "string", "status": "approved"}`;

  try {
    const result = await callOpenRouter(systemPrompt, userPrompt, null); // No cache
    if (result.score < 5 || result.status !== "approved") {
      return { status: "rejected", reason: result.reason || 'AI review failed quality.' };
    }
    return { status: "pending_admin", reason: result.reason };
  } catch (error) {
    return { status: "pending_admin", reason: "AI review unavailable" };
  }
});

exports.detectFraud = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const users = await db.collection('users').limit(100).get(); // Batching
    
    for (const userDoc of users.docs) {
      const user = userDoc.data();
      const systemPrompt = 'You are a fraud detection system. Respond only in valid JSON format.';
      const userPrompt = `Analyze behavior: logins per day: ${user.loginsPerDay || 0}, tasks per day: ${user.tasksCompletedPerDay || 0}, submission speed: ${user.avgSubmissionTime || 0}s. Is this suspicious? Return JSON: {"fraudScore": number, "indicators": ["string"], "recommendation": "string"}`;
      
      try {
        const result = await callOpenRouter(systemPrompt, userPrompt, null);
        if (result.fraudScore && result.fraudScore > 70) {
          await db.collection('fraudAlerts').add({
            workerId: userDoc.id,
            fraudScore: result.fraudScore,
            indicators: result.indicators || [],
            status: result.fraudScore > 90 ? "suspended" : "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          if (result.fraudScore > 90) {
            await userDoc.ref.update({ suspended: true });
          }
        }
      } catch (error) {
        console.error('Fraud detection error for user', userDoc.id);
      }
    }
    return null;
  });

exports.dailyTaskGenerator = functions.pubsub
  .schedule('0 6 * * *') // 6 AM daily
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const db = admin.firestore();
    const roles = ['Promoter', 'Content Creator', 'Marketer'];
    const ventures = ['BuyRix', 'Vyuma', 'Growplex'];

    for (const role of roles) {
      for (const venture of ventures) {
        const systemPrompt = 'You are a task creator for a gig economy platform. Respond only in valid JSON format.';
        const userPrompt = `Generate 3 unique marketing tasks for a ${role} worker in ${venture} venture. Return JSON array: [{"title": "string", "description": "string", "earnAmount": number}]`;
        
        try {
          const tasksResponse = await callOpenRouter(systemPrompt, userPrompt, `daily_tasks_${role}_${venture}`);
          
          const tasks = Array.isArray(tasksResponse) ? tasksResponse : tasksResponse.tasks || [];
          if (!Array.isArray(tasks)) continue;

          const batch = db.batch();
          tasks.forEach(task => {
            if(!task.title) return;
            const taskRef = db.collection('tasks').doc();
            batch.set(taskRef, {
              ...task,
              role,
              venture,
              status: 'active',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 3600000))
            });
          });
          await batch.commit();
        } catch (error) {
          console.error(`Task generation failed for ${role} in ${venture}`);
        }
      }
    }
    return null;
  });

exports.processWithdrawal = functions.firestore
  .document('withdrawals/{withdrawalId}')
  .onUpdate(async (change, context) => {
    const withdrawal = change.after.data();
    const previousWithdrawal = change.before.data();

    if (withdrawal.status !== 'approved' || previousWithdrawal.status === 'approved') {
      return null;
    }

    try {
      console.log('Processing payout for:', withdrawal.amount);
      await admin.firestore().collection('withdrawals').doc(context.params.withdrawalId).update({
        status: 'paid',
        paidAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return null;
    } catch (error) {
      console.error('Payout error:', error);
      return null;
    }
  });

exports.autoPromoteToLead = functions.pubsub
  .schedule('0 1 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const db = admin.firestore();
    const qualifyingUsers = await db.collection('users')
      .where('role', '==', 'Marketer')
      .where('monthlyEarned', '>=', 50000)
      .where('activeMonths', '>=', 3)
      .get();
    
    const batch = db.batch();
    qualifyingUsers.forEach(doc => {
      batch.update(doc.ref, {
        role: 'Lead Marketer',
        promotedAt: admin.firestore.Timestamp.now(),
        teamSize: 0,
        directReferrals: 0
      });
    });
    
    await batch.commit();
    return null;
  });

exports.distributeCommissions = functions.firestore
  .document('taskSubmissions/{submissionId}')
  .onUpdate(async (change, context) => {
    const submission = change.after.data();
    const prevSubmission = change.before.data();

    if (submission.status !== 'approved' || prevSubmission.status === 'approved') {
      return null;
    }

    const db = admin.firestore();
    const workerId = submission.workerId;
    const earnAmount = submission.earnAmount;

    // 1. Get worker's referrer
    const workerDoc = await db.collection('users').doc(workerId).get();
    const workerData = workerDoc.data();
    const referrerId = workerData.referredBy;

    if (!referrerId) return null;

    // 2. Level 1 Commission (5%)
    const l1Commission = earnAmount * 0.05;
    await db.collection('users').doc(referrerId).update({
      'wallets.pending': admin.firestore.FieldValue.increment(l1Commission),
      teamEarnings: admin.firestore.FieldValue.increment(earnAmount)
    });

    await db.collection('commissionLogs').add({
      workerId: referrerId,
      type: 'team_commission',
      sourceWorkerId: workerId,
      amount: l1Commission,
      percentage: 5,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      taskId: submission.taskId
    });

    // 3. Level 2 Commission (3%)
    const referrerDoc = await db.collection('users').doc(referrerId).get();
    const referrerData = referrerDoc.data();
    const l2ReferrerId = referrerData.referredBy;

    if (l2ReferrerId) {
      const l2Commission = earnAmount * 0.03;
      await db.collection('users').doc(l2ReferrerId).update({
        'wallets.pending': admin.firestore.FieldValue.increment(l2Commission)
      });

      await db.collection('commissionLogs').add({
        workerId: l2ReferrerId,
        type: 'manager_commission',
        sourceWorkerId: workerId,
        amount: l2Commission,
        percentage: 3,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        taskId: submission.taskId
      });
    }

    return null;
  });

exports.dailyStreakJob = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const db = admin.firestore();
    const users = await db.collection('users').get();
    const batch = db.batch();
    users.forEach(doc => {
      const data = doc.data();
      const lastActive = data.lastActiveDate?.toDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (lastActive && lastActive >= today) {
        batch.update(doc.ref, { streak: admin.firestore.FieldValue.increment(1) });
      } else {
        batch.update(doc.ref, { streak: 0 });
      }
    });

    await batch.commit();
    return null;
  });

exports.checkBadgesAndLevels = functions.firestore
  .document('taskSubmissions/{submissionId}')
  .onUpdate(async (change, context) => {
    const submission = change.after.data();
    if (submission.status !== 'approved') return null;

    const db = admin.firestore();
    const userRef = db.collection('users').doc(submission.workerId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    const updates = {};
    const newBadges = [...(userData.badges || [])];

    if (userData.tasksCompleted === 1 && !newBadges.includes('first_sale')) {
      newBadges.push('first_sale');
    }

    const totalEarned = userData.totalEarned || 0;
    let newLevel = userData.level;
    if (totalEarned >= 100000) newLevel = 'Legend';
    else if (totalEarned >= 50000) newLevel = 'Platinum';
    else if (totalEarned >= 25000) newLevel = 'Gold';
    else if (totalEarned >= 5000) newLevel = 'Silver';

    if (newLevel !== userData.level) {
      updates.level = newLevel;
    }

    if (newBadges.length !== (userData.badges || []).length) {
      updates.badges = newBadges;
    }

    if (Object.keys(updates).length > 0) {
      await userRef.update(updates);
    }
    return null;
  });

exports.incomeRatioTracker = functions.firestore
  .document('transactions/{uid}/{txId}')
  .onCreate(async (snap, context) => {
    const tx = snap.data();
    const uid = context.params.uid;
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);

    if (tx.category === 'task_approved') {
      await userRef.update({ taskIncome: admin.firestore.FieldValue.increment(tx.amount) });
    } else if (tx.category === 'team_commission') {
      await userRef.update({ referralIncome: admin.firestore.FieldValue.increment(tx.amount) });
    }

    const userDoc = await userRef.get();
    const data = userDoc.data();
    const total = (data.taskIncome || 0) + (data.referralIncome || 0);
    if (total > 0) {
      const ratio = (data.referralIncome || 0) * 100 / total;
      await userRef.update({ incomeRatio: ratio });
      if (ratio > 50) {
        await db.collection('fraudAlerts').add({ type: 'mlm_ratio_alert', uid, timestamp: admin.firestore.FieldValue.serverTimestamp() });
      }
    }
  });

exports.checkPanThreshold = functions.firestore
  .document('users/{uid}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    if ((newData.wallets?.earned || 0) >= 2500 && !newData.pan) {
      await change.after.ref.update({ panRequired: true });
    }
  });

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();
  const firstName = user.displayName ? user.displayName.split(' ')[0].toLowerCase() : 'worker';
  let username = `${firstName}${Math.floor(1000 + Math.random() * 9000)}`;
  
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 5) {
    const existing = await db.collection('publicProfiles').doc(username).get();
    if (!existing.exists) {
      isUnique = true;
    } else {
      username = `${firstName}${Math.floor(1000 + Math.random() * 9000)}`;
      attempts++;
    }
  }

  await db.collection('publicProfiles').doc(username).set({
    uid: user.uid,
    displayName: user.displayName || 'Worker',
    joinedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return null;
});

exports.notifyLiveEarnings = functions.firestore
  .document('transactions/{id}')
  .onCreate(async (snap, context) => {
    const tx = snap.data();
    if (tx.type !== 'credit') return null;

    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(tx.userId).get();
    const userData = userDoc.data();

    if (!userData) return null;

    await db.collection('liveFeed').add({
      uid: tx.userId,
      name: userData.name,
      amount: tx.amount,
      source: tx.source || 'Task',
      venture: userData.venture || '',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    const payload = {
      notification: {
        title: '💸 New Earning!',
        body: `${userData.name} just earned Rs.${tx.amount} from ${tx.source || 'WorkPlex'}!`,
      },
      topic: 'live_feed'
    };

    return admin.messaging().send(payload).catch(() => null);
  });

exports.onAnnouncement = functions.firestore
  .document('announcements/{announcementId}')
  .onCreate(async (snap, context) => {
    const announcement = snap.data();
    let topic = 'all_workers';
    
    if (announcement.audience === 'By Venture') {
      topic = `venture_${announcement.targetVenture.toLowerCase()}`;
    } else if (announcement.audience === 'By Role') {
      topic = `role_${announcement.targetRole.toLowerCase().replace(' ', '_')}`;
    }

    const payload = {
      notification: {
        title: '📢 New Announcement',
        body: announcement.text,
      },
      topic: topic
    };

    return admin.messaging().send(payload).catch(() => null);
  });

exports.releasePartnerMargins = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const db = admin.firestore();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const pendingOrders = await db.collection('partnerOrders')
      .where('marginStatus', '==', 'holding')
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
      .get();

    if (pendingOrders.empty) return null;

    const batch = db.batch();
    for (const orderDoc of pendingOrders.docs) {
      const order = orderDoc.data();
      
      batch.update(orderDoc.ref, { marginStatus: 'released' });

      const shopDoc = await db.collection('partnerShops').where('shopSlug', '==', order.shopSlug).limit(1).get();
      if (!shopDoc.empty) {
        const partnerData = shopDoc.docs[0].data();
        const partnerUID = partnerData.ownerUID;
        const userRef = db.collection('users').doc(partnerUID);
        
        batch.update(userRef, {
          'wallets.pending': admin.firestore.FieldValue.increment(order.totalPartnerMargin)
        });

        const txRef = db.collection('transactions').doc();
        batch.set(txRef, {
          userId: partnerUID,
          amount: order.totalPartnerMargin,
          type: 'credit',
          source: `Shop Margin: ${orderDoc.id}`,
          status: 'completed',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        batch.update(shopDoc.docs[0].ref, {
          totalSales: admin.firestore.FieldValue.increment(order.totalAmount)
        });
      }
    }

    await batch.commit();
    return null;
  });
