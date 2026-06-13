import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, firebaseConfig } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, collection, addDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { 
  Mail, Sparkles, CheckCircle2, RotateCw, AlertCircle, 
  Send, ShieldCheck, HelpCircle, Eye, Info, RefreshCw, XCircle,
  Plus, Trash2, CreditCard, FileText, Check, History
} from 'lucide-react';
import toast from 'react-hot-toast';

const getOAuthAuthInstance = () => {
  const name = 'GoogleOAuthApp';
  const apps = getApps();
  const existingApp = apps.find(app => app.name === name);
  const app = existingApp || initializeApp(firebaseConfig, name);
  return getAuth(app);
};

export default function AdminEmailDispatcher() {
  const [activeTab, setActiveTab] = useState<'system' | 'receipt' | 'history'>('receipt');
  const [gmailConfig, setGmailConfig] = useState<any>(null);
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [showGcpApiWarning, setShowGcpApiWarning] = useState<boolean>(false);
  const [gcpProjectWarningUrl, setGcpProjectWarningUrl] = useState<string>('');
  
  // Sent Emails History States
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterType, setHistoryFilterType] = useState<'all' | 'receipt' | 'test'>('all');
  
  // Test Email SMTP controls
  const [testEmail, setTestEmail] = useState('workplex.sbs@gmail.com');
  const [testSubject, setTestSubject] = useState('WorkPlex System Deliverability Test');
  const [testBody, setTestBody] = useState('Hello! This is a test transmission verify dispatch message from your WorkPlex Admin Email Connection panel. If you receive this, the high-deliverability Gmail dispatcher is operational!');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Custom Receipt Builder States
  const [recipientEmail, setRecipientEmail] = useState('customer@orion.com');
  const [recipientName, setRecipientName] = useState('Rajesh Kumar');
  const [invoiceId, setInvoiceId] = useState(`WPX-${Math.floor(100000 + Math.random() * 900000)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedVenture, setSelectedVenture] = useState('BuyRix');
  const [customVentureName, setCustomVentureName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI / GPay');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING' | 'REFUNDED'>('PAID');
  const [paymentButtonLink, setPaymentButtonLink] = useState('https://rzp.io/l/workplex-invoice');
  const [receiptStyle, setReceiptStyle] = useState<'minimalist' | 'onyx' | 'golden'>('minimalist');
  const [taxPercent, setTaxPercent] = useState<number>(18);
  const [discountAmount, setDiscountAmount] = useState<number>(150);
  const [additionalTerms, setAdditionalTerms] = useState('Standard Terms: This receipt acts as official proof of payment. For refunds or dispute queries regarding services, please refer to the respective brand platform agreements.');
  const [isSendingReceipt, setIsSendingReceipt] = useState(false);

  const [receiptItems, setReceiptItems] = useState<Array<{ name: string; qty: number; rate: number }>>([
    { name: 'BuyRix Premium Reseller Starter Package', qty: 1, rate: 1499 },
    { name: 'Priority Integration Service Node Account', qty: 1, rate: 450 }
  ]);

  useEffect(() => {
    // Read global gmail settings
    const unsubGmail = onSnapshot(doc(db, 'systemConfig', 'gmail'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGmailConfig(data);
        
        // Safely check if the saved token has expired (Google access tokens expire in 1 hour)
        const updatedAtVal = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt ? new Date(data.updatedAt).getTime() : 0);
        const isExpired = !updatedAtVal || (Date.now() - updatedAtVal > 59 * 60 * 1000);
        
        if (data.gmailToken && !isExpired) {
          setGmailToken(data.gmailToken);
        } else {
          setGmailToken(null);
        }
      } else {
        setGmailConfig(null);
        setGmailToken(null);
      }
    });
    return () => unsubGmail();
  }, []);

  useEffect(() => {
    setIsLoadingHistory(true);
    const unsubHistory = onSnapshot(
      query(collection(db, 'sentEmails'), orderBy('sentAt', 'desc'), limit(100)),
      (snapshot) => {
        const logs: any[] = [];
        snapshot.forEach((doc) => {
          logs.push({ id: doc.id, ...doc.data() });
        });
        setSentEmails(logs);
        setIsLoadingHistory(false);
      },
      (error) => {
        console.error("Error loading email history:", error);
        setIsLoadingHistory(false);
      }
    );
    return () => unsubHistory();
  }, []);

  const connectGmail = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      provider.addScope('https://www.googleapis.com/auth/gmail.send');
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      
      const toastId = toast.loading('Connecting and authenticating brand Gmail address...');
      const oauthAuth = getOAuthAuthInstance();
      const result = await signInWithPopup(oauthAuth, provider);
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Access token was not returned from Google Login');
      }
      
      const token = credential.accessToken;
      setGmailToken(token);
      
      let gmailEmail = result.user.email;
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        gmailEmail = profile.email || result.user.email;
      }
      
      // Save info in global systemConfig
      await setDoc(doc(db, 'systemConfig', 'gmail'), {
        gmailEmail: gmailEmail,
        isGmailLinked: true,
        gmailToken: token,
        updatedAt: new Date()
      }, { merge: true });
      
      toast.success(`Successfully connected platform brand email: ${gmailEmail}`, { id: toastId });
    } catch (e: any) {
      console.error(e);
      if (e?.code === 'auth/cancelled-popup-request' || e?.code === 'auth/popup-closed-by-user') {
        toast.dismiss();
        toast.error('Gmail connection was closed or cancelled by user.');
      } else {
        toast.error(`Gmail connection failed: ${e.message || String(e)}`);
      }
    }
  };

  const disconnectGmail = async () => {
    try {
      await setDoc(doc(db, 'systemConfig', 'gmail'), {
        isGmailLinked: false,
        gmailEmail: null,
        gmailToken: null,
        updatedAt: new Date()
      }, { merge: true });
      setGmailToken(null);
      toast.success('Successfully disconnected Gmail brand dispatch address.');
    } catch (e) {
      toast.error('Failed to disconnect Gmail brand address.');
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailToken) {
      toast.error('Session is sleeping or disconnected. Please activate the Gmail session first.');
      return;
    }
    if (!testEmail) {
      toast.error('Recipient email address is required.');
      return;
    }

    setIsSendingTest(true);
    const toastId = toast.loading('Initiating system deliverability test via connected Gmail client...');
    try {
      // Build RFC 2822 formatting for high compatibility MIME sending
      const utf8Subject = `=?utf-8?B?${btoa(encodeURIComponent(testSubject).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }))}?=`;
      
      const emailContent = [
        `To: ${testEmail}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        `<div style="font-family: sans-serif; background-color: #0f172a; padding: 40px; color: #ffffff; border-radius: 20px; max-width: 600px; margin: auto;">`,
        `  <h2 style="color: #E8B84B; text-transform: uppercase; margin: 0 0 20px 0; font-size: 20px; font-weight: 800; letter-spacing: 0.05em;">WorkPlex Delivery Core</h2>`,
        `  <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">`,
        `    ${testBody.replace(/\n/g, '<br/>')}`,
        `  </p>`,
        `  <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;" />`,
        `  <p style="color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">`,
        `    Dispatcher address: ${gmailConfig?.gmailEmail || 'Brand Mailer'}<br/>`,
        `    Sent at: ${new Date().toLocaleString()}`,
        `  </p>`,
        `</div>`
      ].join('\r\n');

      const encodedMail = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${gmailToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raw: encodedMail,
          }),
        }
      );

      if (response.ok) {
        toast.success(`Deliverability text dispatched successfully! Check ${testEmail} to verify.`, { id: toastId });
        try {
          await addDoc(collection(db, 'sentEmails'), {
            recipientEmail: testEmail,
            recipientName: 'SMTP Tester',
            subject: testSubject,
            body: testBody,
            type: 'test',
            sentAt: new Date().toISOString(),
            venture: 'SYSTEM',
            status: null,
            amount: null,
            invoiceId: null,
            gmailSender: gmailConfig?.gmailEmail || 'Authenticated User'
          });
        } catch (dbErr) {
          console.error("Failed to store test email log in Firestore:", dbErr);
        }
      } else {
        const errorDetail = await response.json().catch(() => ({}));
        throw new Error(errorDetail?.error?.message || `Google API status ${response.status}`);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || String(err);
      if (errMsg.includes('disabled') || errMsg.includes('googleapis.com') || errMsg.includes('not been used') || errMsg.includes('1072862343098') || errMsg.includes('107286243098')) {
        setShowGcpApiWarning(true);
        const match = errMsg.match(/https:\/\/console\.developers\.google\.com\/[^ ]+/);
        if (match) {
          setGcpProjectWarningUrl(match[0].replace(/[^a-zA-Z0-9=?&_:\/\.-]/g, ''));
        } else {
          setGcpProjectWarningUrl('https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=workplex-hvrs');
        }
      }
      toast.error(`Deliverability test failed: ${errMsg}`, { id: toastId });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Computations for customized receipt
  const subtotal = receiptItems.reduce((acc, current) => acc + (Number(current.qty || 0) * Number(current.rate || 0)), 0);
  const absoluteDiscount = Math.min(Number(discountAmount || 0), subtotal);
  const taxableBase = Math.max(0, subtotal - absoluteDiscount);
  const computedTax = Math.round(taxableBase * (Number(taxPercent || 0) / 100));
  const finalTotalAmount = Math.max(0, taxableBase + computedTax);

  const filteredLogs = sentEmails.filter((log) => {
    if (historyFilterType !== 'all' && log.type !== historyFilterType) {
      return false;
    }
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase().trim();
      const name = (log.recipientName || '').toLowerCase();
      const email = (log.recipientEmail || '').toLowerCase();
      const invoice = (log.invoiceId || '').toLowerCase();
      const venture = (log.selectedVenture || log.venture || '').toLowerCase();
      return name.includes(q) || email.includes(q) || invoice.includes(q) || venture.includes(q);
    }
    return true;
  });

  const handleDeleteLog = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const toastId = toast.loading("Purging dispatch record from database...");
    try {
      await deleteDoc(doc(db, 'sentEmails', id));
      toast.success("Log record purged successfully.", { id: toastId });
      if (selectedLog?.id === id) {
        setSelectedLog(null);
      }
    } catch (err: any) {
      console.error("Failed to delete log:", err);
      toast.error(`Purge failed: ${err.message || String(err)}`, { id: toastId });
    }
  };

  const getVentureDisplayName = () => {
    if (selectedVenture === 'Other') {
      return customVentureName || 'WORKPLEX OUTPOST';
    }
    return selectedVenture;
  };

  const getVentureColorStyles = () => {
    switch (selectedVenture) {
      case 'BuyRix': return { bg: '#4f46e5', text: '#ffffff', accent: 'text-indigo-400' };
      case 'Vyuma': return { bg: '#8b5cf6', text: '#ffffff', accent: 'text-purple-400' };
      case 'Growplex': return { bg: '#10b981', text: '#ffffff', accent: 'text-emerald-400' };
      case 'Zaestify': return { bg: '#ec4899', text: '#ffffff', accent: 'text-pink-400' };
      default: return { bg: '#f59e0b', text: '#000000', accent: 'text-amber-400' };
    }
  };

  // Dynamic receipt HTML composer
  const composeReceiptHTML = () => {
    const isDarkOnyx = receiptStyle === 'onyx';
    const isGolden = receiptStyle === 'golden';
    
    // Background and color variables for inline tables
    const bodyBgColor = isDarkOnyx ? '#0E0E10' : (isGolden ? '#09080A' : '#F8FAFC');
    const containerBgColor = isDarkOnyx ? '#161619' : (isGolden ? '#1B1710' : '#FFFFFF');
    const primaryTextColor = isDarkOnyx ? '#FFFFFF' : (isGolden ? '#F9F6F0' : '#0F172A');
    const secondaryTextColor = isDarkOnyx ? '#94A3B8' : (isGolden ? '#D4C49E' : '#475569');
    const borderOutlineColor = isDarkOnyx ? '#2A2A2F' : (isGolden ? '#E8B84B' : '#E2E8F0');
    const brandColor = isGolden ? '#E8B84B' : (isDarkOnyx ? '#F59E0B' : '#0F172A');
    const statusBg = paymentStatus === 'PAID' ? '#D1FAE5' : (paymentStatus === 'REFUNDED' ? '#FEE2E2' : '#FEF3C7');
    const statusTextClr = paymentStatus === 'PAID' ? '#065F46' : (paymentStatus === 'REFUNDED' ? '#991B1B' : '#92400E');

    const titleAccentHtml = isGolden ? 'border: 2px solid #E8B84B; border-radius: 12px; font-family: Playfair Display, serif;' : '';

    const itemsRowsHtml = receiptItems.map((item, idx) => `
      <tr style="border-bottom: 1px solid ${borderOutlineColor};">
        <td style="padding: 14px 10px; font-size: 13px; color: ${primaryTextColor}; font-family: inherit; font-weight: 500;">
          ${item.name || `Custom Line Item ${idx + 1}`}
        </td>
        <td align="center" style="padding: 14px 10px; font-size: 13px; color: ${secondaryTextColor}; font-family: inherit;">
          ${item.qty}
        </td>
        <td align="right" style="padding: 14px 10px; font-size: 13px; color: ${secondaryTextColor}; font-family: inherit;">
          ₹${Number(item.rate || 0).toLocaleString('en-IN')}
        </td>
        <td align="right" style="padding: 14px 10px; font-size: 13px; color: ${primaryTextColor}; font-family: inherit; font-weight: bold;">
          ₹${(Number(item.qty || 0) * Number(item.rate || 0)).toLocaleString('en-IN')}
        </td>
      </tr>
    `).join('');

    return `
      <table cellpadding="0" cellspacing="0" width="100%" style="background-color: ${bodyBgColor}; padding: 30px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: ${containerBgColor}; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: 1px solid ${borderOutlineColor}; border-collapse: separate; ${titleAccentHtml}">
              
              <!-- TOP BRAND HEADER -->
              <tr style="background-color: ${isDarkOnyx ? '#1F1F24' : (isGolden ? '#110D07' : '#1E293B')}; color: #ffffff;">
                <td style="padding: 32px 24px;">
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="vertical-align: middle;">
                        <h1 style="font-size: 26px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: -0.01em; color: ${isGolden ? '#E8B84B' : '#ffffff'};">
                          ${getVentureDisplayName()}
                        </h1>
                        <p style="font-size: 11px; font-weight: bold; color: ${isGolden ? '#D4C49E' : '#94A3B8'}; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.12em;">Official Transaction receipt</p>
                      </td>
                      <td align="right" style="vertical-align: middle;">
                        <span style="background-color: ${statusBg}; color: ${statusTextClr}; font-size: 11px; font-weight: 900; text-transform: uppercase; padding: 6px 14px; border-radius: 99px; letter-spacing: 0.05em; display: inline-block;">
                          ${paymentStatus}
                        </span>
                        <p style="font-size: 11px; color: ${isGolden ? '#D4C49E' : '#94A3B8'}; margin: 12px 0 0 0;">INV No. <strong style="color: ${isGolden ? '#E8B84B' : '#ffffff'};">${invoiceId}</strong></p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- BILLED CLIENT METRICS -->
              <tr>
                <td style="padding: 24px; border-bottom: 1px dashed ${borderOutlineColor};">
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td width="55%" style="vertical-align: top;">
                        <p style="font-size: 10px; color: ${secondaryTextColor}; text-transform: uppercase; font-weight: bold; margin: 0 0 6px 0; letter-spacing: 0.05em;">Client Details:</p>
                        <strong style="font-size: 15px; color: ${primaryTextColor}; display: block; margin-bottom: 2px;">${recipientName || 'Unlabeled Customer'}</strong>
                        <span style="font-size: 12px; color: ${secondaryTextColor};">${recipientEmail}</span>
                      </td>
                      <td width="45%" align="right" style="vertical-align: top;">
                        <p style="font-size: 10px; color: ${secondaryTextColor}; text-transform: uppercase; font-weight: bold; margin: 0 0 6px 0; letter-spacing: 0.05em;">Receipt Info:</p>
                        <table cellpadding="0" cellspacing="0" align="right">
                          <tr>
                            <td style="font-size: 12px; color: ${secondaryTextColor}; padding-right: 10px; text-align: right;">Date:</td>
                            <td style="font-size: 12px; color: ${primaryTextColor}; font-weight: bold; text-align: right;">${invoiceDate}</td>
                          </tr>
                          <tr>
                            <td style="font-size: 12px; color: ${secondaryTextColor}; padding-right: 10px; text-align: right; padding-top: 4px;">Channel:</td>
                            <td style="font-size: 12px; color: ${primaryTextColor}; font-weight: bold; text-align: right; padding-top: 4px;">${paymentMethod}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- ITEM PACK DECK -->
              <tr>
                <td style="padding: 24px 24px 10px 24px;">
                  <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                    <thead>
                      <tr style="border-bottom: 2px solid ${brandColor};">
                        <th align="left" style="font-size: 11px; text-transform: uppercase; color: ${secondaryTextColor}; padding-bottom: 10px; font-weight: 700; letter-spacing: 0.05em;">Line Description</th>
                        <th align="center" style="font-size: 11px; text-transform: uppercase; color: ${secondaryTextColor}; padding-bottom: 10px; font-weight: 700; width: 60px; letter-spacing: 0.05em;">Qty</th>
                        <th align="right" style="font-size: 11px; text-transform: uppercase; color: ${secondaryTextColor}; padding-bottom: 10px; font-weight: 700; width: 90px; letter-spacing: 0.05em;">Rate</th>
                        <th align="right" style="font-size: 11px; text-transform: uppercase; color: ${secondaryTextColor}; padding-bottom: 10px; font-weight: 700; width: 100px; letter-spacing: 0.05em;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsRowsHtml}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- CALC SUMMARY DRAWER -->
              <tr>
                <td style="padding: 0 24px 28px 24px;">
                  <table cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px dotted ${borderOutlineColor}; padding-top: 18px;">
                    <tr>
                      <td width="50%" style="vertical-align: top;">
                        <div style="background-color: ${isDarkOnyx ? '#1E1E22' : (isGolden ? '#14110A' : '#F1F5F9')}; padding: 12px 14px; border-radius: 12px; margin-right: 15px; border: 1px solid ${borderOutlineColor};">
                          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${brandColor}; display: block; margin-bottom: 4px;">Dynamic Verification Status</span>
                          <span style="font-size: 11px; color: ${secondaryTextColor}; font-family: monospace;">Signed off securely of system gateway ${gmailConfig?.gmailEmail || ''}</span>
                        </div>
                      </td>
                      <td width="50%" style="vertical-align: top;">
                        <table cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td style="font-size: 12px; color: ${secondaryTextColor}; padding-bottom: 8px;">Subtotal:</td>
                            <td align="right" style="font-size: 12px; color: ${primaryTextColor}; font-weight: 600; padding-bottom: 8px;">₹${subtotal.toLocaleString('en-IN')}</td>
                          </tr>
                          ${absoluteDiscount > 0 ? `
                          <tr>
                            <td style="font-size: 12px; color: #EF4444; padding-bottom: 8px;">Campaign Promo:</td>
                            <td align="right" style="font-size: 12px; color: #EF4444; font-weight: bold; padding-bottom: 8px;">-₹${absoluteDiscount.toLocaleString('en-IN')}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="font-size: 12px; color: ${secondaryTextColor}; padding-bottom: 8px;">Surcharge GST (${taxPercent}%):</td>
                            <td align="right" style="font-size: 12px; color: ${primaryTextColor}; font-weight: 600; padding-bottom: 8px;">₹${computedTax.toLocaleString('en-IN')}</td>
                          </tr>
                          <tr style="border-top: 2px solid ${brandColor};">
                            <td style="font-size: 14px; font-weight: 900; color: ${primaryTextColor}; padding-top: 12px; text-transform: uppercase; letter-spacing: -0.01em;">Amount Paid:</td>
                            <td align="right" style="font-size: 18px; font-weight: 900; color: ${brandColor}; padding-top: 12px;">₹${finalTotalAmount.toLocaleString('en-IN')}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              ${paymentStatus === 'PENDING' && paymentButtonLink ? `
              <!-- PENDING PAYMENT ACTION BUTTON -->
              <tr>
                <td style="padding: 0 24px 24px 24px;" align="center">
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center" style="background-color: ${isDarkOnyx ? '#1E1B16' : (isGolden ? '#1C150A' : '#FEF3C7')}; border: 1px solid ${isGolden ? '#E8B84B' : '#F59E0B'}; border-radius: 16px; padding: 20px; text-align: center;">
                        <p style="margin: 0 0 12px 0; font-size: 11px; text-transform: uppercase; font-weight: bold; color: ${isGolden ? '#E8B84B' : '#D97706'}; letter-spacing: 0.05em; font-family: sans-serif;">This invoice is currently PENDING payment</p>
                        <a href="${paymentButtonLink}" target="_blank" style="background-color: ${isGolden ? '#E8B84B' : '#000000'}; color: ${isGolden ? '#000000' : '#E8B84B'}; border: ${isGolden ? 'none' : '1px solid #E8B84B'}; font-size: 12px; font-weight: 950; text-decoration: none; text-transform: uppercase; padding: 12px 24px; border-radius: 10px; display: inline-block; letter-spacing: 0.08em; font-family: sans-serif; box-shadow: 0 4px 12px rgba(232, 184, 75, 0.15);">
                          💳 PAY INVOICE ONLINE
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ` : ''}

              <!-- LEGAL AND SYSTEM DISCLAIMER -->
              <tr style="background-color: ${isDarkOnyx ? '#131317' : (isGolden ? '#141009' : '#F8FAFC')};">
                <td style="padding: 24px; text-align: center; border-top: 1px solid ${borderOutlineColor};">
                  <p style="font-size: 11px; color: ${secondaryTextColor}; line-height: 1.6; margin: 0 0 12px 0;">
                    ${additionalTerms}
                  </p>
                  <p style="font-size: 9px; color: ${secondaryTextColor}; text-transform: uppercase; margin: 0; letter-spacing: 0.08em; font-weight: 700;">
                    Processed & Transmitted Natively via Brand Authentcated Channel ${gmailConfig?.gmailEmail || ''}
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    `;
  };

  const handleSendCustomReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailToken) {
      toast.error('GMAIL SESSION ASLEEP: Please connect/auth your brand Gmail above to initiate transactions.');
      return;
    }
    if (!recipientEmail) {
      toast.error('Recipient email address is strictly required.');
      return;
    }
    if (receiptItems.some(i => !i.name || Number(i.rate) < 0 || Number(i.qty) <= 0)) {
      toast.error('Invoice contains empty or negative priced descriptions, please fix them.');
      return;
    }

    setIsSendingReceipt(true);
    const toastId = toast.loading(`Dispatching official ₹${finalTotalAmount.toLocaleString('en-IN')} receipt to ${recipientEmail}...`);
    
    try {
      const ventureName = getVentureDisplayName();
      const subjectLine = `[Official Receipt #${invoiceId}] Transaction Confirmation - ${ventureName}`;
      
      // Setup RFC 2822 formatting
      const utf8Subject = `=?utf-8?B?${btoa(encodeURIComponent(subjectLine).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }))}?=`;

      const finalHtml = composeReceiptHTML();
      
      const emailContent = [
        `To: ${recipientEmail}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        finalHtml
      ].join('\r\n');

      const encodedMail = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${gmailToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: encodedMail }),
        }
      );

      if (response.ok) {
        toast.success(`Secure dynamic receipt #${invoiceId} dispatched to client successfully!`, { id: toastId });
        try {
          await addDoc(collection(db, 'sentEmails'), {
            recipientEmail,
            recipientName,
            subject: subjectLine,
            body: finalHtml,
            type: 'receipt',
            sentAt: new Date().toISOString(),
            venture: getVentureDisplayName(),
            status: paymentStatus,
            amount: finalTotalAmount,
            invoiceId,
            gmailSender: gmailConfig?.gmailEmail || 'Authenticated User',
            receiptItems,
            paymentButtonLink: paymentStatus === 'PENDING' ? paymentButtonLink : null,
            style: receiptStyle
          });
        } catch (dbErr) {
          console.error("Failed to store receipt email log in Firestore:", dbErr);
        }
        // Regenerate consecutive invoice ID
        setInvoiceId(`WPX-${Math.floor(100000 + Math.random() * 900000)}`);
      } else {
        const errorDetail = await response.json().catch(() => ({}));
        throw new Error(errorDetail?.error?.message || `Google REST Status ${response.status}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Receipt delivery aborted: ${err.message || String(err)}`, { id: toastId });
    } finally {
      setIsSendingReceipt(false);
    }
  };

  const handleAddItem = () => {
    setReceiptItems([...receiptItems, { name: '', qty: 1, rate: 100 }]);
  };

  const handleUpdateItem = (index: number, key: 'name' | 'qty' | 'rate', value: any) => {
    const backup = [...receiptItems];
    backup[index] = {
      ...backup[index],
      [key]: key === 'name' ? value : (value === '' ? '' : Number(value))
    };
    setReceiptItems(backup);
  };

  const handleDeleteItem = (index: number) => {
    if (receiptItems.length <= 1) {
      toast.error('The custom invoice receipt must contain at least 1 transactional line item.');
      return;
    }
    setReceiptItems(receiptItems.filter((_, idx) => idx !== index));
  };

  const handleDeleteReceipt = async (id: string, invoiceId: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete the log for invoice #${invoiceId}? This deletion is irreversible.`)) {
      return;
    }
    const toastId = toast.loading(`Purging dispatch registry log for #${invoiceId}...`);
    try {
      await deleteDoc(doc(db, 'sentEmails', id));
      toast.success(`Dispatch log for #${invoiceId} has been purged.`, { id: toastId });
      if (selectedLog?.id === id) {
        setSelectedLog(null);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Purge failed: ${e.message || String(e)}`, { id: toastId });
    }
  };

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2A2A2A] pb-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter text-center sm:text-left">Platform Email Center</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1 text-center sm:text-left">
            Configure System-Wide Customer Transactional Deliveries & Secure Mail Routing
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-[#111] border border-[#222] p-1.5 rounded-2xl flex gap-1 self-center sm:self-auto">
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'system' 
                ? 'bg-[#E8B84B] text-black font-extrabold shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={14} /> Mail Connection
          </button>
          <button
            onClick={() => setActiveTab('receipt')}
            className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'receipt' 
                ? 'bg-[#E8B84B] text-black font-extrabold shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText size={14} /> Custom Receipts
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'history' 
                ? 'bg-[#E8B84B] text-black font-extrabold shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <History size={14} /> Sent Logs
          </button>
        </div>
      </div>

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Main Status & Configuration Panel */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111111] border border-[#2A2A2A] p-8 rounded-[40px] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 select-none opacity-10">
                <Sparkles size={80} className="text-[#E8B84B] animate-pulse" />
              </div>

              <div className="flex items-center gap-3 border-b border-[#2A2A2A] pb-6 mb-6">
                <div className="p-3 bg-[#E8B84B]/10 text-[#E8B84B] rounded-xl">
                  <Mail size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-widest">Brand Gmail Dispatch Connection</h2>
                  <p className="text-[10px] text-[#E8B84B] font-bold uppercase tracking-wider">Authentication Core</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Establish a system-wide unified mail relay bypass. By securely linking the WorkPlex brand transactional Gmail address, all partner sales receipts, product dispatch logs, worker registration keys, and token alerts will transmit directly of this account. Saves up to ₹1.2 Lakh on premium paid monthly SMTP dispatch credits.
              </p>

              <div className="bg-[#1A1A1A] p-5 rounded-2xl border border-[#2A2A2A] space-y-4 mb-8">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Sender Account Status</span>
                  {gmailConfig?.isGmailLinked ? (
                    <span className="text-xs text-green-400 font-bold flex items-center gap-1.5 bg-green-500/10 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      {gmailConfig.gmailEmail}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 font-bold flex items-center gap-1.5 bg-gray-500/10 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                      Offline / Sleeping
                    </span>
                  )}
                </div>

                {gmailConfig?.isGmailLinked && (
                  <div className="flex items-center justify-between border-t border-[#2A2A2A]/50 pt-3 text-xs">
                    <span className="text-gray-500 font-bold uppercase text-[10px]">Transmission Session</span>
                    {gmailToken ? (
                      <span className="text-green-400 font-mono font-bold bg-green-500/10 px-2 py-0.5 rounded text-[10px]">
                        active_session_live
                      </span>
                    ) : (
                      <span className="text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                        <AlertCircle size={10} /> session_asleep
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {!gmailConfig?.isGmailLinked ? (
                  <button
                    onClick={connectGmail}
                    className="flex-1 py-4 bg-[#E8B84B] text-black font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-[#d4a63f] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#E8B84B]/10 hover:scale-[1.01]"
                  >
                    <Mail size={16} /> Connect & Route Brand Gmail
                  </button>
                ) : (
                  <>
                    {!gmailToken ? (
                      <button
                        onClick={connectGmail}
                        className="flex-1 py-4 bg-[#E8B84B] text-black font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-[#d4a63f] transition-all flex items-center justify-center gap-2"
                      >
                        <RotateCw size={16} className="animate-spin-slow" /> Wake Up / Activate Session
                      </button>
                    ) : (
                      <div className="flex-1 py-4 bg-green-500/10 text-green-400 border border-green-500/20 rounded-2xl text-[11px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
                        <CheckCircle2 size={16} /> Operational & Transmitting Live
                      </div>
                    )}

                    <button
                      onClick={disconnectGmail}
                      className="px-6 py-4 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-2xl text-xs font-bold transition-all"
                    >
                      Disconnect Integration
                    </button>
                  </>
                )}
              </div>
            </motion.div>

            {/* Integration Knowledge Panel */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#111111] border border-[#2A2A2A] p-8 rounded-[40px] space-y-6"
            >
              <div className="flex items-center gap-3 border-b border-[#2A2A2A] pb-4">
                <div className="p-2 bg-[#E8B84B]/10 text-[#E8B84B] rounded-lg">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Platform Integration Overview</h3>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="text-xs font-bold font-mono text-[#E8B84B] bg-[#E8B84B]/10 w-6 h-6 rounded-full flex items-center justify-center shrink-0">01</div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-tight">Enterprise Delivery Bypass</h4>
                    <p className="text-[11px] text-gray-400 mt-1">This architecture replaces third-party commercial transaction emails. Emails sent are natively authenticated via Google's high-reputation servers (Gmail API), meaning 99.9% inbox hit rates with zero spam foldering.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="text-xs font-bold font-mono text-[#E8B84B] bg-[#E8B84B]/10 w-6 h-6 rounded-full flex items-center justify-center shrink-0">02</div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-tight">Automatic Reseller Synchronization</h4>
                    <p className="text-[11px] text-gray-400 mt-1">When any reseller goes to their "Orders Log" board, they do not have to link their personal email accounts. The platform pulls this global connection state seamlessly to send transactional emails to customers on their behalf.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Interactive test deliverability console */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-[#111111] border border-[#2A2A2A] p-8 rounded-[40px] space-y-6 relative"
            >
              <div className="flex items-center gap-3 border-b border-[#2A2A2A] pb-4">
                <div className="p-2 bg-[#E8B84B]/10 text-[#E8B84B] rounded-lg">
                  <Send size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Interactive Test Console</h3>
                  <p className="text-[9px] text-[#E8B84B] font-bold uppercase tracking-wider">Test Deliverability Instantly</p>
                </div>
              </div>

              <form onSubmit={handleSendTestEmail} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Recipient Address (To)</label>
                  <input 
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="e.g. administrator@gmail.com"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-2xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#E8B84B] focus:border-transparent outline-none transition-all placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Test Subject Line</label>
                  <input 
                    type="text"
                    value={testSubject}
                    onChange={(e) => setTestSubject(e.target.value)}
                    placeholder="Email Subject"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-2xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#E8B84B] focus:border-transparent outline-none transition-all placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Email Body Payload</label>
                  <textarea 
                    value={testBody}
                    onChange={(e) => setTestBody(e.target.value)}
                    rows={4}
                    placeholder="Payload content HTML structure Supported"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-2xl p-4 text-xs focus:ring-1 focus:ring-[#E8B84B] focus:border-transparent outline-none transition-all placeholder:text-gray-600 resize-none h-32"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingTest || !gmailToken}
                  className="w-full py-3.5 bg-[#E8B84B] disabled:bg-gray-800 disabled:text-gray-600 text-black font-black text-xs uppercase tracking-wider rounded-2xl transition-colors flex items-center justify-center gap-2"
                >
                  {isSendingTest ? (
                    <>
                      <RotateCw size={14} className="animate-spin" /> Transmitting Deliverability Payload...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Send Deliverability Trial
                    </>
                  )}
                </button>

                {showGcpApiWarning && (
                  <div className="bg-[#E8B84B]/10 border border-[#E8B84B]/20 rounded-2xl p-5 space-y-3.5 text-left">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle size={16} className="text-[#E8B84B] shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <h4 className="text-[11px] text-white font-extrabold uppercase tracking-wide">Gmail API Activation Required</h4>
                        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                          The Google Cloud project credentials you connected do not have the Gmail API enabled. You must enable it in your GCP project console to start delivering transactional emails.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-[#2A2A2A]">
                      <p className="text-[9px] text-[#E8B84B] font-bold uppercase tracking-wider">Direct API Activation Links:</p>
                      
                      <a 
                        href="https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=workplex-hvrs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-[#E8B84B]/5 hover:bg-[#E8B84B]/15 border border-[#E8B84B]/20 rounded-xl text-[10px] font-bold text-[#E8B84B] transition-all hover:scale-[1.01]"
                      >
                        👉 Enable on Project (workplex-hvrs)
                      </a>

                      {gcpProjectWarningUrl && gcpProjectWarningUrl.includes('project=') && (
                        <a 
                          href={gcpProjectWarningUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 bg-[#1A1A1A] hover:bg-[#222] border border-[#2A2A2A] rounded-xl text-[10px] font-mono text-gray-300 word-break breakdown transition-all hover:scale-[1.01]"
                        >
                          👉 Enable on Project ({gcpProjectWarningUrl.split('project=')[1]})
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {!gmailToken ? (
                  <div className="bg-[#EF4444]/5 border border-[#EF4444]/10 rounded-2xl p-4 flex items-start gap-2.5">
                    <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[9px] text-[#EF4444] font-semibold leading-relaxed uppercase">
                      Test console locked. You must establish or wake up the Brand Gmail Connection first in order to trigger deliverability dispatches.
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-4 flex items-start gap-2.5">
                    <CheckCircle2 size={14} className="text-green-400 shrink-0 mt-0.5" />
                    <p className="text-[9px] text-green-400 font-semibold leading-relaxed uppercase">
                      Gmail Authentication verified! You can send real-time HTML tests to check inbox formatting and deliverability rates.
                    </p>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        </div>
      )}

      {activeTab === 'receipt' && (
        /* CUSTOM TRANSACTIONAL RECEIPTS tab */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Form Side - Edit Variables */}
          <div className="xl:col-span-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-[32px] space-y-6"
            >
              <div className="flex items-center gap-2.5 border-b border-[#2A2A2A] pb-4">
                <div className="p-2 bg-[#E8B84B]/10 text-[#E8B84B] rounded-lg">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Receipt Meta Customizer</h3>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Configure variables of the client transaction billing</p>
                </div>
              </div>

              {/* Billed To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Recipient Name</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Ajay Kumar"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#E8B84B] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Recipient Email (Delivery)</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. client@orion.com"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#E8B84B] focus:border-transparent outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Invoice ID & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Invoice Number ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={invoiceId}
                      onChange={(e) => setInvoiceId(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#E8B84B] focus:border-transparent outline-none transition-all font-mono font-bold"
                    />
                    <button 
                      type="button"
                      onClick={() => setInvoiceId(`WPX-${Math.floor(100000 + Math.random() * 900000)}`)}
                      className="absolute right-2.5 top-2.5 text-[#E8B84B] hover:text-white transition-colors"
                      title="Generate random invoice ID"
                    >
                      <RefreshCw size={12} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Invoice Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#E8B84B] focus:border-transparent outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Brand Venture category selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Active Venture Source</label>
                  <select
                    value={selectedVenture}
                    onChange={(e) => {
                      setSelectedVenture(e.target.value);
                      if (e.target.value !== 'Other') {
                        setCustomVentureName('');
                      }
                    }}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-[#E8B84B] outline-none transition-all font-bold"
                  >
                    <option value="BuyRix">🛒 BUYRIX (E-commerce)</option>
                    <option value="Vyuma">🎥 VYUMA (Creator Network)</option>
                    <option value="Growplex">📈 GROWPLEX (B2B Agency)</option>
                    <option value="Zaestify">🛍️ ZAESTIFY (Apparel Fashion)</option>
                    <option value="Other">✨ Other (Custom Name)</option>
                  </select>
                </div>
                {selectedVenture === 'Other' && (
                  <div>
                    <label className="block text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Custom Venture Brand Name</label>
                    <input
                      type="text"
                      value={customVentureName}
                      onChange={(e) => setCustomVentureName(e.target.value)}
                      placeholder="e.g. WORKPLEX INC"
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#E8B84B] outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Payment Channel & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Payment Method / Route</label>
                  <input
                    type="text"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="e.g. UPI / scan_qr"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#E8B84B] focus:border-transparent outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Payment Status Status</label>
                  <div className="flex gap-1.5 mt-0.5">
                    {(['PAID', 'PENDING', 'REFUNDED'] as const).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setPaymentStatus(status)}
                        className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${
                          paymentStatus === status
                            ? (status === 'PAID' ? 'bg-green-500/10 border-green-500 text-green-400' : status === 'REFUNDED' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-amber-500/10 border-amber-500 text-amber-400')
                            : 'bg-transparent border-[#2A2A2A] text-gray-500 hover:text-white'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Link (Optional - only when status is PENDING) */}
              {paymentStatus === 'PENDING' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  className="bg-[#18181B] border border-amber-500/20 p-4 rounded-2xl space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-amber-500 animate-pulse" />
                    <span className="text-[10px] text-amber-500 font-black uppercase tracking-wider">Dynamic Payment Gateway Link (Optional)</span>
                  </div>
                  <p className="text-[9px] text-gray-400 leading-relaxed">
                    Provide an online payment url (e.g. UPI intent, Razorpay link, or Stripe payment link). A prominent secure checkout CTA button will be automatically embedded in the generated receipt.
                  </p>
                  <input
                    type="url"
                    value={paymentButtonLink}
                    onChange={(e) => setPaymentButtonLink(e.target.value)}
                    placeholder="e.g. https://rzp.io/l/workplex-invoice"
                    className="w-full bg-[#111113] border border-[#2A2A2A] text-white rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-[#E8B84B] focus:border-transparent outline-none transition-all font-mono"
                  />
                </motion.div>
              )}

              {/* Dynamics item tables */}
              <div className="space-y-3.5 pt-2 border-t border-[#2A2A2A]/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Purchased Billable Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 bg-[#E8B84B] hover:bg-white text-black font-black text-[9px] uppercase tracking-widest rounded flex items-center gap-1 transition-all"
                  >
                    <Plus size={10} strokeWidth={3} /> Add row
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {receiptItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-[#18181A] p-2.5 rounded-xl border border-[#2A2A2A] relative group">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                          placeholder={`Line Description e.g., Item ${idx + 1}`}
                          className="w-full bg-transparent text-white text-xs outline-none focus:border-b focus:border-[#E8B84B]/40 py-0.5 placeholder:text-gray-600 font-bold"
                        />
                      </div>
                      <div className="w-12">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleUpdateItem(idx, 'qty', e.target.value)}
                          placeholder="Qty"
                          className="w-full bg-[#111] border border-[#222] text-white text-center rounded px-1 py-0.5 text-xs font-mono"
                          min="1"
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleUpdateItem(idx, 'rate', e.target.value)}
                          placeholder="Rate (₹)"
                          className="w-full bg-[#111] border border-[#222] text-white text-right rounded px-1.5 py-0.5 text-xs font-mono"
                          min="0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(idx)}
                        className="p-1 hover:text-red-500 text-gray-600 transition-colors"
                        title="Delete this row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Taxes vs Discount percentages */}
              <div className="grid grid-cols-2 gap-4 border-t border-[#2A2A2A]/40 pt-4">
                <div>
                  <label className="block text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">Promo Discount Deductions (₹)</label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-[#E8B84B] font-mono"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">State GST / Tax Percent (%)</label>
                  <input
                    type="number"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-[#E8B84B] font-mono"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Additional Terms */}
              <div>
                <label className="block text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Footer Notes and Additional Terms</label>
                <textarea
                  value={additionalTerms}
                  onChange={(e) => setAdditionalTerms(e.target.value)}
                  rows={2}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl p-3.5 text-xs focus:ring-1 focus:ring-[#E8B84B] outline-none transition-all placeholder:text-gray-600 resize-none h-16 leading-relaxed"
                />
              </div>

              {/* Primary action dispatches */}
              <button
                onClick={handleSendCustomReceipt}
                disabled={isSendingReceipt || !gmailToken}
                className="w-full py-4 bg-[#E8B84B] hover:bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-800 disabled:text-gray-600"
              >
                {isSendingReceipt ? (
                  <>
                    <RotateCw size={14} className="animate-spin" /> DISPATCHING SYSTEM TRANSACTION GATEWAY...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Send Customized Transaction Receipt
                  </>
                )}
              </button>

              {!gmailToken && (
                <p className="text-[10px] text-red-400 text-center font-bold uppercase tracking-wide">
                  ⚠️ SENDING BLOCKED: Please wake up the Brand Gmail Connection on tab 1 first.
                </p>
              )}
            </motion.div>
          </div>

          {/* Right Side - Real-Time Dynamic Aesthetic Receipt Preview */}
          <div className="xl:col-span-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-[32px] space-y-5 flex flex-col h-full"
            >
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
                <div className="flex items-center gap-2">
                  <Eye className="text-[#E8B84B]" size={16} />
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Live Dynamic Template Preview</h3>
                    <p className="text-[9px] text-[#E8B84B] font-bold uppercase tracking-wider">Inspect formatting before transacting</p>
                  </div>
                </div>

                {/* Template style chooses */}
                <div className="flex bg-[#1A1A1A] p-1 rounded-xl border border-[#2A2A2A]">
                  {(['minimalist', 'onyx', 'golden'] as const).map(style => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setReceiptStyle(style)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                        receiptStyle === style
                          ? 'bg-[#E8B84B] text-black'
                          : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rendered Live paper template preview depending on style */}
              <div className="flex-1 rounded-[20px] overflow-hidden p-0.5 border border-[#2A2A2A] bg-black">
                <div 
                  className={`p-6 md:p-8 rounded-[18px] max-w-full font-sans transition-all text-left overflow-y-auto max-h-[560px] ${
                    receiptStyle === 'onyx' 
                      ? 'bg-[#121214] text-white' 
                      : (receiptStyle === 'golden' ? 'bg-[#18140D] text-[#ECE1C9] border-2 border-[#E8B84B]/40' : 'bg-white text-slate-800')
                  }`}
                >
                  {/* Top Brand Header */}
                  <div className="flex justify-between items-start border-b pb-6 border-dashed border-gray-300 dark:border-gray-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: getVentureColorStyles().bg }}></span>
                        <h2 className={`text-2xl font-black uppercase tracking-tight ${
                          receiptStyle === 'minimalist' ? 'text-slate-900' : (receiptStyle === 'golden' ? 'text-[#E8B84B]' : 'text-white')
                        }`}>
                          {getVentureDisplayName()}
                        </h2>
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                        receiptStyle === 'minimalist' ? 'text-slate-400' : 'text-[#E8B84B]'
                      }`}>Official Purchase Receipt</p>
                    </div>

                    <div className="text-right">
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                        paymentStatus === 'PAID' ? 'bg-green-500/15 text-green-400' : (paymentStatus === 'REFUNDED' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400')
                      }`}>
                        {paymentStatus}
                      </span>
                      <p className="text-[10px] font-mono font-semibold mt-3 text-gray-500">
                        INV No: <span className={receiptStyle === 'minimalist' ? 'text-slate-900' : 'text-white'}>{invoiceId}</span>
                      </p>
                    </div>
                  </div>

                  {/* Customer Information segment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 border-b border-dashed border-gray-300 dark:border-gray-800">
                    <div>
                      <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wide block mb-1">Billed To Client:</span>
                      <p className={`text-sm font-black ${receiptStyle === 'minimalist' ? 'text-slate-800' : 'text-white'}`}>
                        {recipientName || 'Unlabeled Customer'}
                      </p>
                      <p className="text-xs font-mono text-gray-500 leading-tight mt-0.5">{recipientEmail || 'no-email@workplex.com'}</p>
                    </div>
                    <div className="md:text-right">
                      <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wide block mb-1">Receipt Details:</span>
                      <p className="text-xs text-gray-500">
                        Date: <span className={`font-mono font-bold ${receiptStyle === 'minimalist' ? 'text-slate-800' : 'text-white'}`}>{invoiceDate}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Route: <span className={`font-mono font-bold ${receiptStyle === 'minimalist' ? 'text-slate-800' : 'text-white'}`}>{paymentMethod}</span>
                      </p>
                    </div>
                  </div>

                  {/* Item Description Pack */}
                  <div className="py-4">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-300 dark:border-gray-800">
                          <th className="pb-2 font-black uppercase text-[9px] text-gray-400">Line Description</th>
                          <th className="pb-2 text-center font-black uppercase text-[9px] text-gray-400 w-12">Qty</th>
                          <th className="pb-2 text-right font-black uppercase text-[9px] text-gray-400 w-20">Rate</th>
                          <th className="pb-2 text-right font-black uppercase text-[9px] text-gray-400 w-24">Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receiptItems.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-200 dark:border-gray-900">
                            <td className={`py-3.5 pr-2 font-bold ${receiptStyle === 'minimalist' ? 'text-slate-700' : 'text-gray-200'}`}>
                              {item.name || `Dynamic Line Item ${idx + 1}`}
                            </td>
                            <td className="py-3.5 text-center font-mono text-gray-500">{item.qty}</td>
                            <td className="py-3.5 text-right font-mono text-gray-500">₹{(Number(item.rate || 0)).toLocaleString('en-IN')}</td>
                            <td className={`py-3.5 text-right font-mono font-extrabold ${receiptStyle === 'minimalist' ? 'text-slate-800' : 'text-white'}`}>
                              ₹{(Number(item.qty || 0) * Number(item.rate || 0)).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Right Summaries Recap */}
                  <div className="flex flex-col md:flex-row gap-4 py-4 border-t border-dashed border-gray-300 dark:border-gray-800 mt-2">
                    <div className="flex-1 md:pr-4">
                      <div className={`p-3 rounded-xl border ${
                        receiptStyle === 'minimalist' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-gray-800'
                      }`}>
                        <span className="text-[8px] font-black uppercase tracking-wider text-[#E8B84B] block mb-1">
                          Enterprise Secure Gateway signature
                        </span>
                        <p className="text-[10px] text-gray-400 leading-snug font-mono">
                          Natively authorized through authenticated admin relay. Deliverability rating 99.9%.
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-64 space-y-2 text-xs">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal Value:</span>
                        <span className="font-mono font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      {absoluteDiscount > 0 && (
                        <div className="flex justify-between text-red-500 font-semibold">
                          <span>Promo Discount:</span>
                          <span className="font-mono font-bold">-₹{absoluteDiscount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-500">
                        <span>Surcharge GST ({taxPercent}%):</span>
                        <span className="font-mono font-bold">₹{computedTax.toLocaleString('en-IN')}</span>
                      </div>
                      <div className={`flex justify-between pt-2 border-t-2 ${
                        receiptStyle === 'minimalist' ? 'border-slate-800 text-slate-900' : (receiptStyle === 'golden' ? 'border-[#E8B84B] text-[#E8B84B]' : 'border-white text-white')
                      } font-black text-sm uppercase`}>
                        <span>Grand Total:</span>
                        <span className="font-mono text-[16px] font-black">₹{finalTotalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {paymentStatus === 'PENDING' && paymentButtonLink && (
                    <div className={`my-6 p-5 rounded-2xl border text-center transition-all ${
                      receiptStyle === 'onyx' 
                        ? 'bg-[#1E1B16] border-amber-500/20' 
                        : (receiptStyle === 'golden' ? 'bg-[#1C150A] border-[#E8B84B]/30' : 'bg-amber-50 border-amber-200')
                    }`}>
                      <p className={`text-[10px] font-black uppercase tracking-wider mb-2.5 ${
                        receiptStyle === 'minimalist' ? 'text-amber-800' : 'text-[#E8B84B]'
                      }`}>
                        Action Required: Pending Secure Payment
                      </p>
                      <a 
                        href={paymentButtonLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
                          receiptStyle === 'golden'
                            ? 'bg-[#E8B84B] text-black hover:bg-white'
                            : (receiptStyle === 'onyx' ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-amber-600 hover:bg-amber-700 text-white')
                        }`}
                      >
                        <CreditCard size={12} /> Pay Invoice Online
                      </a>
                    </div>
                  )}

                  {/* Preview Footer Terms */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-900 mt-6 text-center text-[10px] text-gray-400 leading-relaxed uppercase tracking-wider font-extrabold max-w-sm mx-auto">
                    <p className="normal-case font-medium mb-3">{additionalTerms}</p>
                    <p className="text-[8px] text-gray-400">Invoice: {invoiceId} • Secured via Google OAuth REST API</p>
                  </div>

                </div>
              </div>

            </motion.div>
          </div>

        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2A2A2A] pb-4 gap-2">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
                <History className="text-[#E8B84B]" size={20} /> Sent Emails & Receipt Logs
              </h2>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-1">
                Real-time tracking ledger of brand-dispatched transactional invoices
              </p>
            </div>
            {sentEmails.length > 0 && (
              <span className="text-[10px] font-extrabold tracking-widest bg-[#E8B84B]/10 text-[#E8B84B] px-3 py-1.5 rounded-xl border border-[#E8B84B]/20 uppercase self-start sm:self-center">
                {sentEmails.length} DISPATCHES LOGGED
              </span>
            )}
          </div>

          {isLoadingHistory ? (
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-[32px] p-20 flex flex-col items-center justify-center space-y-4">
              <RotateCw className="text-[#E8B84B] animate-spin" size={32} />
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider font-mono">Loading dynamic audit ledger...</p>
            </div>
          ) : sentEmails.length === 0 ? (
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-[32px] p-20 text-center space-y-4">
              <div className="p-4 bg-gray-900 text-gray-500 rounded-full w-fit mx-auto">
                <Mail size={32} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">No Dispatches Logged</h3>
                <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  No custom transaction receipts have been sent since your brand Gmail integration was configured, or logs were purged.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* List View */}
              <div className={selectedLog ? 'lg:col-span-6 space-y-4' : 'lg:col-span-12 space-y-4'}>
                {sentEmails.map((log) => {
                  const itemsSummary = log.receiptItems || log.items || [];
                  const isPaid = log.status === 'PAID';
                  const isRefunded = log.status === 'REFUNDED';
                  const isPending = log.status === 'PENDING';
                  
                  return (
                    <motion.div
                      key={log.id}
                      layoutId={`log-card-${log.id}`}
                      className={`bg-[#111] border transition-all duration-200 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:scale-[1.01] ${
                        selectedLog?.id === log.id 
                          ? 'border-[#E8B84B] bg-[#141416]' 
                          : 'border-[#2A2A2A] hover:border-[#3A3A3A]'
                      }`}
                      onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                    >
                      <div className="space-y-3 flex-1 min-w-0">
                        {/* Title Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-black text-[#E8B84B]">
                            #{log.invoiceId || 'N/A'}
                          </span>
                          
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isPaid 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/25' 
                              : isRefunded 
                                ? 'bg-red-500/10 text-red-500 border border-red-500/25' 
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/25'
                          }`}>
                            {log.status || 'PAID'}
                          </span>

                          <span className="text-[9px] font-bold uppercase tracking-wide bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                            {log.venture || 'WorkPlex'}
                          </span>
                        </div>

                        {/* Recipient info & total */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                          <div className="text-xs font-semibold text-gray-200 truncate">
                            Billed to: <span className="text-gray-400 text-[11px] font-mono">{log.recipientEmail}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            Client: <span className="font-bold text-white">{log.recipientName || 'Unlabeled'}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1 font-mono">
                            Sent at: {log.sentAt ? new Date(log.sentAt).toLocaleString() : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Dispatched via: <span className="font-mono text-[10px] text-[#E8B84B]">{log.gmailSender || 'system'}</span>
                          </div>
                        </div>

                        {/* Line items mini recap */}
                        {itemsSummary.length > 0 && (
                          <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider flex items-center gap-1.5 pt-1 border-t border-[#2A2A2A]/40 mt-1">
                            <span>Includes {itemsSummary.length} line items:</span>
                            <span className="text-gray-400 font-mono truncate max-w-xs normal-case font-medium">
                              {itemsSummary.map((it: any) => `${it.qty}x ${it.name}`).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Control Actions */}
                      <div className="flex items-center gap-3 self-end md:self-center shrink-0 border-t border-[#2A2A2A]/40 md:border-t-0 pt-3 md:pt-0">
                        <div className="text-right">
                          <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Grand Total</p>
                          <p className="text-sm font-black text-white font-mono">
                            ₹{(Number(log.amount || 0)).toLocaleString('en-IN')}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLog(log.id, e);
                          }}
                          className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 animate-none cursor-pointer"
                          title="Delete dispatch log"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Collateral Template Preview Panel */}
              {selectedLog && (
                <div className="lg:col-span-6 space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-[#111] border border-[#2A2A2A] rounded-3xl p-6 space-y-4 sticky top-6"
                  >
                    <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <Eye size={14} className="text-[#E8B84B]" /> Transmitted Receipt Preview
                        </h3>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                          Invoice #{selectedLog.invoiceId}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedLog(null)}
                        className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-[#2A2A2A] transition-colors"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>

                    {/* Metadata stats */}
                    <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2A2A2A]/60 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[9px] text-gray-500 font-bold uppercase block">Recipient</span>
                        <span className="text-white font-mono break-all">{selectedLog.recipientEmail}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 font-bold uppercase block">Name</span>
                        <span className="text-white font-bold">{selectedLog.recipientName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 font-bold uppercase block">Total Amount Paid</span>
                        <span className="text-[#E8B84B] font-black font-mono">₹{Number(selectedLog.amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 font-bold uppercase block">Payment Method</span>
                        <span className="text-gray-300 font-mono font-medium">{selectedLog.paymentMethod || 'UPI / QR'}</span>
                      </div>
                    </div>

                    {/* Render exact compiled email HTML via sandboxed iframe (highly secure) */}
                    <div className="border border-[#2C2C2F] rounded-2xl overflow-hidden bg-[#0A0A0B] h-[480px] w-full relative">
                      <iframe
                        srcDoc={selectedLog.body}
                        title="HTML email body sandbox preview"
                        className="w-full h-full border-none"
                        style={{ background: '#F8FAFC' }}
                        sandbox="allow-popups allow-popups-to-escape-sandbox"
                      />
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
