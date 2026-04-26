/**
 * Cloud Functions for Firebase
 * This file serves as the specification for backend cloud functions
 * 
 * 1. RELEASE_PARTNER_MARGINS: Scheduled daily at 02:00 IST
 * 2. NEW_ORDER_NOTIFICATION: Triggers on new partnerOrders
 * 3. ORDER_STATUS_UPDATE_NOTIFICATION: Triggers on partnerOrders status change
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// 1. RELEASE_PARTNER_MARGINS
exports.releasePartnerMargins = functions.pubsub.schedule('0 2 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const sevenDaysAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    // In actual production, ensure indexes are built for this query
    const ordersSnap = await db.collection('partnerOrders')
      .where('status', '==', 'delivered')
      .where('marginStatus', '==', 'holding')
      .where('deliveredAt', '<=', sevenDaysAgo)
      .get();
      
    if (ordersSnap.empty) return null;
    
    const batch = db.batch();
    
    ordersSnap.forEach(doc => {
      const order = doc.data();
      const resellerId = order.resellerId;
      const margin = order.totalMargin || 0;
      
      // Update order status
      batch.update(doc.ref, { 
        marginStatus: 'released',
        marginReleasedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Credit wallet
      const walletRef = db.collection('users').doc(resellerId).collection('wallets').doc('main');
      const pendingWalletRef = db.collection('users').doc(resellerId).collection('wallets').doc('pending');
      
      batch.set(walletRef, { balance: admin.firestore.FieldValue.increment(margin) }, { merge: true });
      batch.set(pendingWalletRef, { balance: admin.firestore.FieldValue.increment(-margin) }, { merge: true });
      
      // Create transaction record
      const txRef = db.collection('transactions').doc();
      batch.set(txRef, {
         userId: resellerId,
         type: 'credit',
         category: 'partner_margin',
         amount: margin,
         wallet: 'main',
         description: `Margin released: Order #${order.orderId || doc.id}`,
         timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    return null;
});

// 2. NEW_ORDER_NOTIFICATION
exports.newOrderNotification = functions.firestore.document('partnerOrders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    // Logic for notifications to reseller and admin
    console.log('New partner order created:', order.orderId);
    return null;
});

// 3. ORDER_STATUS_UPDATE_NOTIFICATION
exports.orderStatusNotification = functions.firestore.document('partnerOrders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.status === after.status) return null;
    console.log(`Order ${after.orderId} status changed from ${before.status} to ${after.status}`);
    
    // Logic for notifications (push, FCM etc)
    return null;
});
