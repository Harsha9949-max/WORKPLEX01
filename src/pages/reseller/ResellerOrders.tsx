import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, firebaseConfig } from '../../lib/firebase';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import toast from 'react-hot-toast';
import { Search, ChevronRight, X, User, MapPin, Package, Clock, Truck, CheckCircle, AlertCircle, FileSpreadsheet, Sparkles, RefreshCw, ExternalLink, Mail, Send } from 'lucide-react';

const getOAuthAuthInstance = () => {
  const name = 'GoogleOAuthApp';
  const apps = getApps();
  const existingApp = apps.find(app => app.name === name);
  const app = existingApp || initializeApp(firebaseConfig, name);
  return getAuth(app);
};

export default function ResellerOrders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Google Sheets state variables
  const [sheetsToken, setSheetsToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [partnerShop, setPartnerShop] = useState<any>(null);

  // Global System Gmail state variables
  const [systemGmail, setSystemGmail] = useState<any>(null);
  const [systemGmailToken, setSystemGmailToken] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    const unsubGmail = onSnapshot(doc(db, 'systemConfig', 'gmail'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSystemGmail(data);
        if (data.gmailToken) {
          setSystemGmailToken(data.gmailToken);
        } else {
          setSystemGmailToken(null);
        }
      } else {
        setSystemGmail(null);
        setSystemGmailToken(null);
      }
    });
    return () => unsubGmail();
  }, []);

  const sendReceiptEmail = async (order: any) => {
    const activeToken = systemGmailToken;
    if (!activeToken) {
      toast.error('Global Gmail service is inactive. Please ask the Super Admin to activate the mail session on the Control Center.');
      return;
    }
    
    const customerEmail = order.customer?.email;
    if (!customerEmail) {
      toast.error('This customer did not provide an email address during checkout.');
      return;
    }
    
    setIsSendingEmail(true);
    const toastId = toast.loading(`Sending purchase receipt email to ${customerEmail}...`);
    
    try {
      const itemsHtml = order.items?.map((item: any) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; font-family: sans-serif; font-size: 14px;">
            <strong>${item.productName}</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; font-family: sans-serif; font-size: 14px;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-family: sans-serif; font-size: 14px; font-weight: bold;">
            Rs. ${item.sellingPrice * item.quantity}
          </td>
        </tr>
      `).join('') || '';

      const subject = `Order Receipt #${order.orderId} - Thank you for your purchase!`;
      const htmlBody = `
        <div style="max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #ffffff;">
          <div style="text-align: center; border-bottom: 2px solid #E8B84B; padding-bottom: 20px;">
            <h1 style="color: #0f172a; font-size: 24px; margin: 0 0 8px 0; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em;">${partnerShop?.shopName || 'WorkPlex Partner Store'}</h1>
            <p style="color: #64748b; font-size: 13px; margin: 0; font-weight: 500;">Your Trusted Sourcing & Reselling Partner</p>
          </div>
          
          <div style="padding: 24px 0;">
            <p style="font-size: 16px; margin-top: 0; color: #0f172a;">Hi <strong>${order.customer?.name}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
              Thank you for ordering with us! Your Cash on Delivery (COD) order has been successfully logged and processed. Here is your official store purchase receipt:
            </p>
            
            <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 20px; border-radius: 12px; margin: 24px 0;">
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px; font-weight: 600; width: 120px;">Order ID:</td>
                  <td style="color: #0f172a; text-align: right; padding-bottom: 8px; font-mono: yes; font-weight: 700;">${order.orderId}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px; font-weight: 600;">Date & Time:</td>
                  <td style="color: #0f172a; text-align: right; padding-bottom: 8px; font-weight: 600;">${order.createdAt?.toDate?.()?.toLocaleString() || new Date().toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Payment Mode:</td>
                  <td style="color: #0f172a; text-align: right; font-weight: 600;">Cash on Delivery (COD)</td>
                </tr>
              </table>
            </div>

            <h3 style="font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 32px; margin-bottom: 16px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Product Name</th>
                  <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; width: 60px;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; width: 100px;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 20px 12px; font-weight: 800; font-size: 16px; color: #0f172a;">Total Payable Amount:</td>
                  <td style="padding: 20px 12px; font-weight: 900; font-size: 18px; text-align: right; color: #d97706;">Rs. ${order.totalAmount}</td>
                </tr>
              </tfoot>
            </table>

            <h3 style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #334155; margin-top: 32px; margin-bottom: 12px;">Shipping Address:</h3>
            <p style="font-size: 13px; color: #475569; background-color: #f8fafc; border-left: 4px solid #cbd5e1; padding: 16px; border-radius: 8px; line-height: 1.5; margin: 0 0 24px 0;">
              <strong>Recipient:</strong> ${order.customer?.name || 'N/A'}<br/>
              <strong>Address:</strong> ${order.customer?.address || 'N/A'}, ${order.customer?.city || 'N/A'}, ${order.customer?.state || 'N/A'} - ${order.customer?.pincode || 'N/A'}<br/>
              <strong>Phone:</strong> ${order.customer?.phone || 'N/A'}
            </p>

            <div style="background-color: #fef3c7; border: 1px solid #fde68a; padding: 16px; border-radius: 12px;">
              <h4 style="margin: 0 0 6px 0; color: #b45309; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.025em;">💡 Store Policies:</h4>
              <p style="margin: 0; font-size: 12px; color: #78350f; line-height: 1.5; font-weight: 500;">
                ${partnerShop?.policies?.returnPolicy || '7 Days Standard return policy applies.'}<br/>
                ${partnerShop?.policies?.shippingPolicy || 'Ships in 3-5 business days.'}
              </p>
            </div>
          </div>

          <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 24px; font-size: 11px; color: #94a3b8; font-weight: 500; margin-top: 40px; line-height: 1.5;">
            <p style="margin: 0 0 4px 0;">Sent via WorkPlex Secure Client Services on behalf of ${partnerShop?.shopName || 'WorkPlex Partner'}</p>
            <p style="margin: 0;">This is a system transaction confirmation email. For support, please reply directly or get in touch with our helpdesk.</p>
          </div>
        </div>
      `;

      // MIME assembly
      const emailContent = [
        `To: ${customerEmail}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
        '',
        htmlBody
      ].join('\r\n');

      const encodedMime = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: encodedMime })
      });

      if (!response.ok) {
        throw new Error(`Gmail API returned status ${response.status}`);
      }

      toast.success(`Success! Transactional customer receipt sent to ${customerEmail}!`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(`Gmail Send error: ${err.message || String(err)}`, { id: toastId });
    } finally {
      setIsSendingEmail(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const unsubShop = onSnapshot(doc(db, 'partnerShops', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setPartnerShop(docSnap.data());
      }
    });
    return () => unsubShop();
  }, [currentUser]);

  const connectGoogleSheets = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      
      const toastId = toast.loading('Connecting and authenticating with Google Sheets...');
      const oauthAuth = getOAuthAuthInstance();
      const result = await signInWithPopup(oauthAuth, provider);
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Access token was not returned from Google Login');
      }
      
      const token = credential.accessToken;
      setSheetsToken(token);
      
      let sheetsEmail = result.user.email;
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        sheetsEmail = profile.email || result.user.email;
      }
      
      // Save info in partnerShops
      await setDoc(doc(db, 'partnerShops', currentUser!.uid), {
        googleSheetsEmail: sheetsEmail,
        isGoogleSheetsLinked: true
      }, { merge: true });
      
      toast.success(`Successfully connected with Google Sheets: ${sheetsEmail}`, { id: toastId });
    } catch (e: any) {
      console.error(e);
      if (e?.code === 'auth/cancelled-popup-request' || e?.code === 'auth/popup-closed-by-user') {
        toast.dismiss();
        toast.error('Google Sheets link was closed or cancelled by user.');
      } else {
        toast.error(`Google Sheets connection failed: ${e.message || String(e)}`);
      }
    }
  };

  const createOrdersSpreadsheet = async () => {
    if (!sheetsToken) {
      toast.error('Google Sheets session is inactive. Please connect to activate.');
      return;
    }
    
    const toastId = toast.loading('Initializing new Orders Log Google Spreadsheet...');
    try {
      const payload = {
        properties: {
          title: `WorkPlex Store Orders Log - ${partnerShop?.shopName || 'Partner Store'}`
        }
      };
      
      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sheetsToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        throw new Error(`Google Sheets API responded with status ${res.status}`);
      }
      
      const sheetData = await res.json();
      const spreadsheetId = sheetData.spreadsheetId;
      
      // Format headers
      const headers = [
        "Order ID", "Date", "Customer Name", "Phone", "Full Address", "Items & Quantity", "Total Price", "Earnings / Margin", "Payment Mode", "Order Status"
      ];
      
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sheetsToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [headers] })
      });
      
      // Update partnerShop document
      await setDoc(doc(db, 'partnerShops', currentUser!.uid), {
        googleSheetsId: spreadsheetId,
        googleSheetsTitle: `WorkPlex Store Orders Log - ${partnerShop?.shopName || 'Partner Store'}`
      }, { merge: true });
      
      toast.success('Spreadsheet initialized successfully! Syncing current records...', { id: toastId });
      
      // Instantly sync the current orders
      await syncOrdersToSheet(spreadsheetId, sheetsToken);
    } catch (e: any) {
      console.error(e);
      toast.error(`Failed to create spreadsheet: ${e.message || String(e)}`, { id: toastId });
    }
  };

  const syncOrdersToSheet = async (customId?: string, customToken?: string) => {
    const spreadsheetId = customId || partnerShop?.googleSheetsId;
    const activeToken = customToken || sheetsToken;
    
    if (!spreadsheetId) {
      toast.error('No connected orders spreadsheet found.');
      return;
    }
    if (!activeToken) {
      toast.error('Google Sheets session is inactive or has expired. Connect with Google Sheets first.');
      return;
    }
    
    setIsSyncing(true);
    const toastId = toast.loading('Syncing and uploading orders to Google Sheets...');
    
    try {
      // Clear sheet contents after head row to avoid stacking duplicates
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:Z5000:clear`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Convert orders array into row batches
      const rows = orders.map((order: any) => {
        const orderDate = order.createdAt?.toDate?.()?.toLocaleString() || new Date().toLocaleString();
        const itemsText = order.items?.map((item: any) => `${item.productName} (x${item.quantity || 1})`).join(', ') || 'N/A';
        const addressText = `${order.customer?.address || ''}, ${order.customer?.city || ''}, ${order.customer?.state || ''} - ${order.customer?.pincode || ''}`;
        
        return [
          order.orderId || 'N/A',
          orderDate,
          order.customer?.name || 'N/A',
          order.customer?.phone || 'N/A',
          addressText,
          itemsText,
          String(order.totalAmount || 0),
          String(order.totalMargin || 0),
          order.paymentMode || 'COD',
          order.status || 'new'
        ];
      });
      
      if (rows.length > 0) {
        const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:append?valueInputOption=USER_ENTERED`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values: rows })
        });
        
        if (!res.ok) {
          throw new Error(`Sheets Append API returned status ${res.status}`);
        }
      }
      
      toast.success(`Success! Connected Log synchronized ${rows.length} store sales orders to Google Sheets!`, { id: toastId });
    } catch (e: any) {
      console.error(e);
      toast.error(`Sync error: ${e.message || String(e)}`, { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'partnerOrders'),
      where('resellerId', '==', currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const ordersData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      ordersData.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
      });
      setOrders(ordersData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'partnerOrders'));

    return () => unsub();
  }, [currentUser]);

  const tabs = ['All', 'New', 'Forwarded', 'Accepted', 'Shipped', 'Delivered', 'Rejected', 'Cancelled'];

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'All' || order.status.toLowerCase() === activeTab.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (order.orderId || '').toLowerCase().includes(searchLower) ||
      (order.customer?.name || '').toLowerCase().includes(searchLower) ||
      (order.items?.[0]?.productName || '').toLowerCase().includes(searchLower);
    return matchesTab && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'new': return 'bg-[#F59E0B]/20 text-[#F59E0B]';
      case 'forwarded': return 'bg-[#3B82F6]/20 text-[#3B82F6]';
      case 'accepted': return 'bg-[#00C9A7]/20 text-[#00C9A7]';
      case 'shipped': return 'bg-[#8B5CF6]/20 text-[#8B5CF6]';
      case 'delivered': return 'bg-[#10B981]/20 text-[#10B981]';
      case 'rejected': return 'bg-[#EF4444]/20 text-[#EF4444]';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleForward = async (orderId: string) => {
    if (!window.confirm("Forward this order to HVRS admin for processing?")) return;
    try {
      await updateDoc(doc(db, 'partnerOrders', orderId), {
        status: 'forwarded',
        resellerForwarded: true,
        forwardedAt: serverTimestamp(),
        forwardedBy: currentUser?.uid
      });
      toast.success('Order forwarded successfully!');
      setSelectedOrder(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'partnerOrders');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-black text-white">Orders</h1>
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-[#2A2A2A] text-white pl-9 pr-4 py-2 rounded-lg text-sm focus:border-[#E8B84B] outline-none"
          />
        </div>
      </div>

      {/* Google Sheets Real-time Synchronization Panel */}
      <div className="bg-[#111111] p-6 rounded-xl border border-[#E8B84B]/20 relative overflow-hidden space-y-4 shadow-xl">
        <div className="absolute top-0 right-0 p-3 select-none">
          <Sparkles size={16} className="text-[#E8B84B] animate-pulse" />
        </div>
        
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="text-[#E8B84B]" size={20} />
          <h2 className="font-bold text-white uppercase tracking-widest text-xs">Google Sheets Live Synchronization</h2>
        </div>
        
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-3xl">
          Instantly backup, export, and manage your partner store sales logs directly on Google Sheets. Reduces platform database overhead and synchronizes in one click.
        </p>

        <div className="bg-[#1A1A1A] p-4 rounded-lg border border-[#2A2A2A] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-[9px] text-[#E8B84B] font-bold uppercase tracking-widest">Connection & Sync Status</div>
            {partnerShop?.isGoogleSheetsLinked ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-white font-bold">Connected: {partnerShop?.googleSheetsEmail}</span>
                </div>
                {partnerShop?.googleSheetsId ? (
                  <p className="text-[10px] text-gray-500 font-mono italic">
                    File ID: {partnerShop.googleSheetsId.substring(0, 8)}...
                  </p>
                ) : (
                  <p className="text-[10px] text-[#E8B84B] font-semibold">
                    ⚠️ Spreadsheet is offline. Initialize one below to establish automated synchronizations!
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-600" />
                <span className="text-xs text-gray-500">Google Sheets offline (Local Mode Only)</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!partnerShop?.isGoogleSheetsLinked ? (
              <button
                onClick={connectGoogleSheets}
                className="px-5 py-2.5 bg-[#E8B84B] text-black font-black text-xs uppercase tracking-wider rounded-lg hover:bg-[#E8B84B]/95 hover:shadow-[0_0_15px_rgba(232,184,75,0.25)] transition-all flex items-center justify-center gap-2"
              >
                Connect Google Sheets
              </button>
            ) : (
              <>
                {!sheetsToken ? (
                  <button
                    onClick={connectGoogleSheets}
                    className="px-4 py-2 bg-[#E8B84B] text-black font-black text-xs uppercase rounded-lg hover:bg-[#E8B84B]/90 transition-all flex items-center justify-center gap-1.5"
                  >
                    Activate Sheets Session
                  </button>
                ) : (
                  <>
                    {!partnerShop?.googleSheetsId ? (
                      <button
                        onClick={createOrdersSpreadsheet}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <FileSpreadsheet size={13} /> Create Log Spreadsheet
                      </button>
                    ) : (
                      <>
                        <button
                          disabled={isSyncing}
                          onClick={() => syncOrdersToSheet()}
                          className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Syncing...' : 'Sync Orders Log'}
                        </button>
                        
                        <a
                          href={`https://docs.google.com/spreadsheets/d/${partnerShop.googleSheetsId}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white border border-[#3A3A3A] font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <ExternalLink size={13} /> View spreadsheet
                        </a>
                      </>
                    )}
                  </>
                )}
                
                <button
                  onClick={async () => {
                    try {
                      await setDoc(doc(db, 'partnerShops', currentUser!.uid), {
                        isGoogleSheetsLinked: false,
                        googleSheetsEmail: null,
                        googleSheetsId: null,
                        googleSheetsTitle: null
                      }, { merge: true });
                      setSheetsToken(null);
                      toast.success('Disconnected Google Sheets successfully.');
                    } catch (e) {
                      toast.error('Failed to disconnect');
                    }
                  }}
                  className="px-3 py-2 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-lg text-xs font-bold transition-colors"
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Platform Brand Email Dispatch Notification */}
      <div className="bg-[#111111] p-6 rounded-xl border border-[#E8B84B]/20 relative overflow-hidden space-y-4 shadow-xl">
        <div className="absolute top-0 right-0 p-3 select-none">
          <Sparkles size={16} className="text-[#E8B84B] animate-pulse" />
        </div>
        
        <div className="flex items-center gap-2">
          <Mail className="text-[#E8B84B]" size={20} />
          <h2 className="font-bold text-white uppercase tracking-widest text-xs">Official Customer Notifications</h2>
        </div>
        
        <p className="text-[11px] text-gray-400 leading-relaxed max-w-3xl">
          The WorkPlex Super Admin has connected the platform's official high-deliverability Gmail dispatcher to send transactional order confirmations and purchase invoices automatically to your customers on checkout.
        </p>

        <div className="bg-[#1A1A1A] p-4 rounded-lg border border-[#2A2A2A] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-[9px] text-[#E8B84B] font-bold uppercase tracking-widest">Active Dispatch Email</div>
            {systemGmail?.isGmailLinked ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-white font-bold">Linked: {systemGmail?.gmailEmail}</span>
                </div>
                {systemGmailToken ? (
                  <span className="inline-block px-2 py-0.5 bg-green-950/40 text-green-400 border border-green-500/10 rounded text-[9px] font-mono italic">
                    active_session_live
                  </span>
                ) : (
                  <p className="text-[10px] text-amber-500 font-semibold">
                    ⚠️ Session is sleeping. The Super Admin needs to activate the Gmail session in the Control Center!
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-600" />
                <span className="text-xs text-gray-500">Google Mail offline (Transactional Emails Suspended)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        <div className="flex gap-2">
          {tabs.map(tab => {
            const count = tab === 'All' 
              ? orders.length 
              : orders.filter(o => o.status.toLowerCase() === tab.toLowerCase()).length;
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors border ${
                  activeTab === tab 
                    ? 'border-[#E8B84B] bg-[#E8B84B]/10 text-[#E8B84B]' 
                    : 'border-[#2A2A2A] bg-[#111111] text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                {tab} <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-black/20">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-[#111111] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#1A1A1A] text-gray-400 font-medium">
            <tr>
              <th className="px-6 py-4">Order ID / Date</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A2A]">
            {filteredOrders.map(order => (
              <tr key={order.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                <td className="px-6 py-4">
                  <div className="font-mono text-white font-bold">{order.orderId}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {order.createdAt?.toDate?.()?.toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-white font-medium">{order.customer?.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{order.customer?.city}</div>
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {order.items?.[0]?.productName} <span className="text-gray-500">x{order.items?.[0]?.quantity || 1}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-white font-bold">{formatCurrency(order.totalAmount)}</div>
                  <div className="text-[10px] font-bold text-gray-500 mt-1">{order.paymentMode}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <ChevronRight size={20} className="text-gray-500 ml-auto" />
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No orders found for this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredOrders.map(order => (
          <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-white font-bold text-sm tracking-tight">{order.orderId}</span>
                <p className="text-xs text-gray-500 mt-0.5">{order.createdAt?.toDate?.()?.toLocaleString()}</p>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm border-y border-[#2A2A2A] py-3">
              <div>
                <p className="text-gray-500 text-xs">Customer</p>
                <p className="text-white truncate">{order.customer?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs">Amount ({order.paymentMode})</p>
                <p className="text-[#E8B84B] font-bold">{formatCurrency(order.totalAmount)}</p>
              </div>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm truncate">{order.items?.[0]?.productName} <span className="text-gray-500">x{order.items?.[0]?.quantity || 1}</span></p>
            </div>
            
            <div className="flex gap-2 mt-2">
              {order.status === 'new' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleForward(order.id); }}
                  className="flex-1 bg-[#E8B84B] text-black py-2 rounded-lg text-xs font-bold shadow"
                >
                  Forward to Admin
                </button>
              )}
              <button className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] text-white py-2 rounded-lg text-xs font-bold">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Detail Drawer */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div 
              initial={{ x: '100%বাহিনীর' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full md:w-[400px] h-full bg-[#111111] border-l border-[#2A2A2A] overflow-y-auto flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[#2A2A2A] flex items-center justify-between sticky top-0 bg-[#111111]/90 backdrop-blur z-10">
                <div>
                  <h2 className="text-lg font-black text-white">{selectedOrder.orderId}</h2>
                  <p className="text-xs text-gray-500">{selectedOrder.createdAt?.toDate?.()?.toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-400 hover:text-white rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 flex-1">
                {/* Timeline */}
                <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Status Timeline</h3>
                  <div className="space-y-4">
                    <TimelineItem icon={Clock} label="Order Placed" date={selectedOrder.createdAt} active={true} color="text-blue-500" />
                    <TimelineItem icon={ChevronRight} label="Forwarded to Admin" date={selectedOrder.forwardedAt} active={!!selectedOrder.forwardedAt} color="text-yellow-500" />
                    <TimelineItem icon={CheckCircle} label="Accepted by Admin" date={selectedOrder.adminActionAt} active={selectedOrder.status === 'accepted' || selectedOrder.shippedAt} color="text-teal-500" />
                    <TimelineItem icon={Truck} label="Shipped" date={selectedOrder.shippedAt} active={!!selectedOrder.shippedAt} color="text-purple-500" />
                    {selectedOrder.status === 'rejected' ? (
                      <TimelineItem icon={AlertCircle} label="Rejected" date={selectedOrder.adminActionAt} active={true} color="text-red-500" />
                    ) : (
                      <TimelineItem icon={CheckCircle} label="Delivered" date={selectedOrder.deliveredAt} active={!!selectedOrder.deliveredAt} color="text-green-500" />
                    )}
                  </div>
                </div>

                {selectedOrder.status === 'rejected' && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-500">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-red-500/50">Rejection Reason</p>
                    <p className="text-sm font-medium">{selectedOrder.rejectionReason || 'No reason provided.'}</p>
                    <button className="mt-4 w-full py-2 bg-red-500 text-white rounded font-bold text-xs hover:bg-red-600 transition-colors">
                      Contact Support
                    </button>
                  </div>
                )}

                {/* Customer Details */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <User size={12} /> Customer Details
                  </h3>
                  <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A] text-sm text-gray-300 space-y-2">
                    <p><span className="text-gray-500">Name:</span> <span className="text-white font-medium">{selectedOrder.customer?.name}</span></p>
                    <p><span className="text-gray-500">Phone:</span> <span className="text-white font-medium">{selectedOrder.customer?.phone}</span></p>
                    <div className="flex gap-2">
                      <MapPin size={16} className="text-gray-500 shrink-0 mt-0.5" />
                      <p className="text-gray-400">
                        {selectedOrder.customer?.address}, {selectedOrder.customer?.city}, {selectedOrder.customer?.state} - {selectedOrder.customer?.pincode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <Package size={12} /> Product Details
                  </h3>
                  <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
                    {selectedOrder.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-white font-medium">{item.productName} <span className="text-gray-500">x{item.quantity}</span></span>
                        <span className="text-gray-300 font-mono">{formatCurrency(item.sellingPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Overview */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Payment Overview</h3>
                  <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A] text-sm">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Payment Mode</span>
                      <span className="text-white font-bold">{selectedOrder.paymentMode}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Order Total</span>
                      <span className="text-[#E8B84B] font-black">{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between py-1 mt-2 pt-2 border-t border-[#2A2A2A]">
                      <span className="text-gray-500">Your Margin</span>
                      <span className="text-[#10B981] font-black">{formatCurrency(selectedOrder.totalMargin)}</span>
                    </div>
                  </div>
                </div>

                {/* Margin Status */}
                {selectedOrder.deliveredAt && (
                   <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#2A2A2A]">
                     {selectedOrder.marginStatus === 'released' ? (
                       <p className="text-sm font-bold text-[#10B981] flex items-center gap-2">
                         <CheckCircle size={16} /> Margin Released to Wallet
                       </p>
                     ) : (
                       <div>
                         <p className="text-sm font-bold text-[#00C9A7] mb-2 flex items-center gap-2">
                           <Clock size={16} /> Margin releasing after 7 days of delivery
                         </p>
                         <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden">
                           <div className="bg-[#00C9A7] h-full" style={{ width: '40%' }}></div>
                         </div>
                       </div>
                     )}
                   </div>
                )}

                {/* Instant Gmail Transactional Alerts Panel */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[#E8B84B] flex items-center gap-1.5 pt-2">
                    <Mail size={12} /> Transactional Email Dispatcher
                  </h3>
                  <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 space-y-3">
                    {systemGmail?.isGmailLinked ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-bold uppercase">Sender Profile</span>
                          <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> {systemGmail.gmailEmail}
                          </span>
                        </div>
                        
                        {systemGmailToken ? (
                          selectedOrder.customer?.email ? (
                            <button
                              disabled={isSendingEmail}
                              onClick={() => sendReceiptEmail(selectedOrder)}
                              className="w-full py-2.5 bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-black font-black text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                              <Send size={12} /> {isSendingEmail ? 'Sending...' : 'Email Official Receipt'}
                            </button>
                          ) : (
                            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-amber-500 text-[11px] leading-tight font-medium">
                              ⚠️ This customer completed a mobile-only checkout and didn't specify an email address.
                            </div>
                          )
                        ) : (
                          <div className="space-y-2 text-center py-1">
                            <p className="text-[10px] text-amber-500 font-semibold">
                              ⚠️ Connection Session Sleeping
                            </p>
                            <p className="text-[10px] text-gray-400 leading-tight">
                              Ask the Super Admin to activate their dispatcher session in the Control Center.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          The global transactional email sender is currently offline or disconnected by the platform administrator.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedOrder.status === 'new' && (
                <div className="p-6 border-t border-[#2A2A2A] bg-[#1A1A1A]">
                  <button 
                    onClick={() => handleForward(selectedOrder.id)}
                    className="w-full py-4 bg-[#E8B84B] text-black font-black uppercase tracking-widest rounded-xl hover:bg-[#E8B84B]/90 transition-colors shadow-[0_0_20px_rgba(232,184,75,0.2)]"
                  >
                    Forward to Admin
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TimelineItem({ icon: Icon, label, date, active, color }: { icon: any, label: string, date: any, active: boolean, color: string }) {
  return (
    <div className={`flex gap-4 items-start ${active ? '' : 'opacity-40'}`}>
      <div className={`mt-0.5 ${active ? color : 'text-gray-500'}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className={`text-sm font-bold ${active ? 'text-white' : 'text-gray-500'}`}>{label}</p>
        {date && (
          <p className="text-[10px] text-gray-500">{date.toDate?.()?.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}
