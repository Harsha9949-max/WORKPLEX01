import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  getDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Zap, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PhoneCall, 
  Mail, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  User, 
  Store, 
  Key, 
  FileText,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { safeFormatDate } from '../../utils/format';

interface RazorpayRequest {
  id: string; // partner UID
  uid: string;
  partnerName: string;
  email: string;
  phone: string;
  shopName: string;
  shopSlug: string;
  type: 'credential_submission' | 'callback_request';
  merchantId?: string;
  keyId?: string;
  accountId?: string;
  preferredTime?: string;
  notes?: string;
  status: 'pending_verification' | 'assistance_requested' | 'active' | 'rejected';
  createdAt?: any;
  updatedAt?: any;
  adminNotes?: string;
}

export default function AdminRazorpayOnboarding() {
  const [requests, setRequests] = useState<RazorpayRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  
  // Selected modal for approval / editing
  const [selectedReq, setSelectedReq] = useState<RazorpayRequest | null>(null);
  const [editKeyId, setEditKeyId] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // Listen to real-time razorpayRequests collection
    const q = collection(db, 'razorpayRequests');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: RazorpayRequest[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as RazorpayRequest));

      // Sort by creation time (newest first)
      list.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
      });

      setRequests(list);
      setLoading(false);
    }, (error) => {
      console.error("Error loading razorpayRequests:", error);
      toast.error("Failed to load Razorpay requests");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenApproveModal = (req: RazorpayRequest) => {
    setSelectedReq(req);
    setEditKeyId(req.keyId || 'rzp_live_' + Math.random().toString(36).substring(2, 12));
    setEditAccountId(req.accountId || req.merchantId || 'acc_' + Math.random().toString(36).substring(2, 12));
    setAdminNotes(req.adminNotes || '');
  };

  const handleApprove = async () => {
    if (!selectedReq) return;
    if (!editKeyId.trim()) {
      toast.error("Please provide or confirm a Razorpay Key ID");
      return;
    }

    setActionLoading(true);
    try {
      const targetUid = selectedReq.uid || selectedReq.id;

      // 1. Update razorpayRequests document
      await updateDoc(doc(db, 'razorpayRequests', targetUid), {
        status: 'active',
        keyId: editKeyId.trim(),
        accountId: editAccountId.trim(),
        adminNotes: adminNotes.trim(),
        updatedAt: new Date()
      });

      // 2. Update partnerShops document
      await updateDoc(doc(db, 'partnerShops', targetUid), {
        razorpayStatus: 'active',
        razorpayConnected: true,
        razorpayKeyId: editKeyId.trim(),
        razorpayAccountId: editAccountId.trim(),
        paymentGateway: {
          razorpayConnected: true,
          razorpayKeyId: editKeyId.trim(),
          razorpayAccountId: editAccountId.trim()
        }
      }).catch(err => console.log("partnerShops update warning:", err));

      // 3. Update users document
      await updateDoc(doc(db, 'users', targetUid), {
        razorpayStatus: 'active',
        razorpayConnected: true,
        razorpayKeyId: editKeyId.trim(),
        razorpayAccountId: editAccountId.trim(),
        paymentGateway: {
          razorpayConnected: true,
          razorpayKeyId: editKeyId.trim(),
          razorpayAccountId: editAccountId.trim()
        }
      }).catch(err => console.log("users update warning:", err));

      toast.success(`Razorpay Online Payments activated for ${selectedReq.partnerName}!`);
      setSelectedReq(null);
    } catch (err: any) {
      console.error("Approve error:", err);
      toast.error(err.message || "Failed to activate Razorpay integration");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (req: RazorpayRequest) => {
    if (!confirm(`Are you sure you want to set status to Rejected for ${req.partnerName}?`)) return;

    try {
      const targetUid = req.uid || req.id;
      await updateDoc(doc(db, 'razorpayRequests', targetUid), {
        status: 'rejected',
        updatedAt: new Date()
      });

      await updateDoc(doc(db, 'partnerShops', targetUid), {
        razorpayStatus: 'rejected',
        razorpayConnected: false
      }).catch(() => {});

      await updateDoc(doc(db, 'users', targetUid), {
        razorpayStatus: 'rejected',
        razorpayConnected: false
      }).catch(() => {});

      toast.success(`Request marked as rejected for ${req.partnerName}`);
    } catch (err: any) {
      toast.error("Failed to reject request");
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.partnerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.phone?.includes(searchTerm) ||
      req.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.merchantId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === 'ALL' || req.status === filterStatus;

    const matchesType = 
      filterType === 'ALL' || req.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingCount = requests.filter(r => r.status === 'pending_verification' || r.status === 'assistance_requested').length;
  const activeCount = requests.filter(r => r.status === 'active').length;
  const callbackCount = requests.filter(r => r.type === 'callback_request' && r.status !== 'active').length;

  return (
    <div className="space-y-8 p-6 text-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider flex items-center gap-2 text-white">
            <Zap className="text-[#E8B84B]" size={28} /> Razorpay Partner Onboarding Portal
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Verify partner merchant details, resolve 24hr callback requests, and manage active Razorpay online gateways.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#111111] border border-[#2A2A2A] px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block">Pending Queue</span>
            <span className="text-lg font-black text-[#E8B84B] font-mono">{pendingCount}</span>
          </div>
          <div className="bg-[#111111] border border-[#2A2A2A] px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block">24h Callback Requests</span>
            <span className="text-lg font-black text-amber-400 font-mono">{callbackCount}</span>
          </div>
          <div className="bg-[#111111] border border-[#2A2A2A] px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block">Live Online Stores</span>
            <span className="text-lg font-black text-green-400 font-mono">{activeCount}</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#111111] p-4 rounded-xl border border-[#2A2A2A]">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by Partner Name, Email, Phone, Shop..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-[#E8B84B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#1A1A1A] p-1 rounded-xl border border-[#2A2A2A]">
            {[
              { id: 'ALL', label: 'All Status' },
              { id: 'pending_verification', label: 'Pending Review' },
              { id: 'assistance_requested', label: 'Callback Requests' },
              { id: 'active', label: 'Approved Live' },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setFilterStatus(s.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  filterStatus === s.id ? 'bg-[#E8B84B] text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
          <RefreshCw className="animate-spin text-[#E8B84B]" size={24} />
          <span className="text-xs font-mono uppercase tracking-widest">Loading Razorpay Queue...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-12 text-center space-y-3">
          <Zap className="mx-auto text-gray-600" size={36} />
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">No Razorpay Requests Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            There are no onboarding or callback assistance requests matching your current search filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map(req => {
            const isPending = req.status === 'pending_verification' || req.status === 'assistance_requested';
            const isCallback = req.type === 'callback_request';

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-[#111111] border p-6 rounded-2xl transition-all space-y-4 ${
                  req.status === 'active'
                    ? 'border-green-500/20 bg-green-500/[0.02]'
                    : isCallback
                    ? 'border-amber-500/30 bg-amber-500/[0.02]'
                    : 'border-[#2A2A2A] hover:border-[#E8B84B]/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
                  {/* Partner Overview */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        <User size={18} className="text-[#E8B84B]" />
                        {req.partnerName || 'WorkPlex Partner'}
                      </h3>
                      
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        req.status === 'active'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : isCallback
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : req.status === 'rejected'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {req.status === 'active' && '✓ Approved & Live'}
                        {req.status === 'pending_verification' && '🕒 Pending Credential Review'}
                        {req.status === 'assistance_requested' && '📞 24h Callback Requested'}
                        {req.status === 'rejected' && '✕ Rejected'}
                      </span>

                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-black/40 px-2.5 py-0.5 rounded border border-white/5">
                        {isCallback ? 'Type: 24h Setup Call' : 'Type: Merchant Onboarding'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap pt-1">
                      <span className="flex items-center gap-1 font-mono text-gray-300">
                        <Mail size={12} className="text-gray-500" /> {req.email || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-gray-300">
                        <PhoneCall size={12} className="text-gray-500" /> {req.phone || 'N/A'}
                      </span>
                      {req.shopName && (
                        <span className="flex items-center gap-1 text-gray-300">
                          <Store size={12} className="text-gray-500" /> {req.shopName} ({req.shopSlug})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action buttons */}
                  <div className="flex items-center gap-3">
                    {req.phone && (
                      <a
                        href={`tel:${req.phone}`}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs rounded-xl border border-white/10 flex items-center gap-1.5 transition-all"
                      >
                        <PhoneCall size={14} className="text-green-400" /> Call Partner
                      </a>
                    )}
                    {req.phone && (
                      <a
                        href={`https://wa.me/91${req.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold text-xs rounded-xl border border-green-500/20 flex items-center gap-1.5 transition-all"
                      >
                        WhatsApp
                      </a>
                    )}

                    <button
                      onClick={() => handleOpenApproveModal(req)}
                      className="px-4 py-2 bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Zap size={14} /> {req.status === 'active' ? 'Edit / Update Credentials' : 'Verify & Activate Gateway'}
                    </button>
                  </div>
                </div>

                {/* Submitted Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/40 p-4 rounded-xl border border-white/5 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-1">Razorpay Merchant / Account ID</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-200 font-bold">{req.merchantId || req.accountId || 'Not provided'}</span>
                      {(req.merchantId || req.accountId) && (
                        <button onClick={() => copyToClipboard(req.merchantId || req.accountId || '', `merchant-${req.id}`)}>
                          {copiedId === `merchant-${req.id}` ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-gray-500 hover:text-white" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-1">Preferred Time / Notes</span>
                    <span className="text-gray-300">{req.preferredTime || req.notes || 'None specified'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-1">Request Timestamp</span>
                    <span className="text-gray-400 font-mono">
                      {req.createdAt ? safeFormatDate(req.createdAt) : 'Recently'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Approval & Credential Assignment Modal */}
      <AnimatePresence>
        {selectedReq && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111111] border border-[#2A2A2A] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-[#2A2A2A] flex justify-between items-center bg-[#1A1A1A]">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Zap className="text-[#E8B84B]" size={18} /> Verify & Activate Gateway
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    For: {selectedReq.partnerName} ({selectedReq.email})
                  </p>
                </div>
                <button onClick={() => setSelectedReq(null)} className="text-gray-400 hover:text-white">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-[#E8B84B]/10 border border-[#E8B84B]/20 p-3.5 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-[#E8B84B] block uppercase tracking-wider text-[10px]">WorkPlex Razorpay Integration</span>
                  <p className="text-gray-300 leading-relaxed">
                    Once approved, online checkout (UPI / Google Pay / Cards) will instantly go LIVE on partner shop: <span className="text-white font-bold">{selectedReq.shopName}</span>. Product cost will route to HVRS while profit margin settles to partner.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Razorpay Key ID (Client-Facing)</label>
                  <input
                    type="text"
                    value={editKeyId}
                    onChange={(e) => setEditKeyId(e.target.value)}
                    placeholder="rzp_live_xxxxxxxxxxxxxx"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-xl text-xs font-mono outline-none focus:border-[#E8B84B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Razorpay Merchant / Account ID (Linked Settlement)</label>
                  <input
                    type="text"
                    value={editAccountId}
                    onChange={(e) => setEditAccountId(e.target.value)}
                    placeholder="acc_xxxxxxxxxxxxxx"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-2.5 rounded-xl text-xs font-mono outline-none focus:border-[#E8B84B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Admin Internal Notes (Optional)</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. Verified via WhatsApp onboarding call on 24th..."
                    rows={2}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-2 text-xs rounded-xl outline-none focus:border-[#E8B84B]"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-[#2A2A2A] bg-[#1A1A1A]/50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleReject(selectedReq)}
                  className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-xl border border-red-500/20 transition-all"
                >
                  Reject Request
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReq(null)}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleApprove}
                    className="px-5 py-2.5 bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    {actionLoading ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck size={16} /> Activate Online Gateway
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
