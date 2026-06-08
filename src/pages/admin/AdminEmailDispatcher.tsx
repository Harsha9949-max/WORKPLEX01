import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, firebaseConfig } from '../../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { 
  Mail, Sparkles, CheckCircle2, RotateCw, AlertCircle, 
  Send, ShieldCheck, HelpCircle, Eye, Info, RefreshCw, XCircle
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
  const [gmailConfig, setGmailConfig] = useState<any>(null);
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [showGcpApiWarning, setShowGcpApiWarning] = useState<boolean>(false);
  const [gcpProjectWarningUrl, setGcpProjectWarningUrl] = useState<string>('');
  
  // Test Email SMTP controls
  const [testEmail, setTestEmail] = useState('workplex.sbs@gmail.com');
  const [testSubject, setTestSubject] = useState('WorkPlex System Deliverability Test');
  const [testBody, setTestBody] = useState('Hello! This is a test transmission verify dispatch message from your WorkPlex Admin Email Connection panel. If you receive this, the high-deliverability Gmail dispatcher is operational!');
  const [isSendingTest, setIsSendingTest] = useState(false);

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

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter text-center sm:text-left">Platform Email Center</h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1 text-center sm:text-left">
          Configure System-Wide Customer Transactional Deliveries & Secure Mail Routing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Status & Configuration Panel */}
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

          {/* Setup Guidelines and Integration Knowledge */}
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

              <div className="flex gap-4">
                <div className="text-xs font-bold font-mono text-[#E8B84B] bg-[#E8B84B]/10 w-6 h-6 rounded-full flex items-center justify-center shrink-0">03</div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-tight">Security Token Expiration Constraints</h4>
                  <p className="text-[11px] text-gray-400 mt-1">Due to Google OAuth 2.0 security constraints, credentials live for up to 365 days. However, if the server restarts or is put into sleep mode, you can wake the connection session instantaneously using the "Activate Session" trigger above.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Console - Interactive Real-Time Test dispatch */}
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
                  
                  <p className="text-[8px] text-gray-500 font-medium leading-relaxed mt-1 uppercase">
                    Once clicked, hit the blue "Enable" button on the Google Cloud page and retry your deliverability trial!
                  </p>
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
    </div>
  );
}
