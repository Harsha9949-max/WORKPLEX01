import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import toast from 'react-hot-toast';
import { Search, ChevronRight, X, ChevronDown, CheckCircle, Truck, Package, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AdminPartnerOrders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  // Modal states
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [courierPartner, setCourierPartner] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'partnerOrders'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'partnerOrders'));

    return () => unsub();
  }, []);

  const tabs = ['All', 'New', 'Forwarded', 'Accepted', 'Shipped', 'Delivered', 'Rejected', 'Cancelled'];

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'All' || order.status.toLowerCase() === activeTab.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (order.orderId || '').toLowerCase().includes(searchLower) ||
      (order.customer?.name || '').toLowerCase().includes(searchLower) ||
      (order.resellerName || '').toLowerCase().includes(searchLower);
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

  const todayStr = new Date().toDateString();
  const summary = {
    newToday: orders.filter(o => o.createdAt?.toDate?.().toDateString() === todayStr).length,
    pendingAuth: orders.filter(o => o.status === 'forwarded').length,
    acceptedToday: orders.filter(o => o.status === 'accepted' && o.adminActionAt?.toDate?.().toDateString() === todayStr).length,
    shippedToday: orders.filter(o => o.status === 'shipped' && o.shippedAt?.toDate?.().toDateString() === todayStr).length,
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string, extraData: any = {}) => {
    try {
      await updateDoc(doc(db, 'partnerOrders', orderId), {
        status: newStatus,
        lastUpdatedBy: currentUser?.uid,
        ...extraData
      });
      toast.success(`Order ${newStatus} successfully!`);
      if (selectedOrder?.id === orderId) {
         setSelectedOrder({ ...selectedOrder, status: newStatus, ...extraData });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'partnerOrders');
    }
  };

  const acceptOrder = (orderId: string) => {
    if (!window.confirm("Accept and process this order?")) return;
    handleStatusUpdate(orderId, 'accepted', { adminActionAt: serverTimestamp() });
    // Cloud function trigger handles notification
  };

  const rejectOrderSubmit = () => {
    if (!rejectReason.trim() || !selectedOrder) return;
    handleStatusUpdate(selectedOrder.id, 'rejected', { 
      rejectionReason: rejectReason,
      adminActionAt: serverTimestamp() 
    });
    setRejectModalOpen(false);
    setRejectReason('');
  };

  const shipOrderSubmit = () => {
    if (!trackingId.trim() || !courierPartner.trim() || !selectedOrder) return;
    handleStatusUpdate(selectedOrder.id, 'shipped', {
      trackingId,
      courierPartner,
      shippedAt: serverTimestamp()
    });
    setShipModalOpen(false);
    setTrackingId('');
    setCourierPartner('');
  };

  const deliverOrder = (orderId: string) => {
    if (!window.confirm("Confirm delivery of this order?")) return;
    handleStatusUpdate(orderId, 'delivered', {
      deliveredAt: serverTimestamp(),
      marginStatus: 'holding'
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Partner Orders</h1>
          <p className="text-sm text-gray-400">Manage orders forwarded by resellers</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text"
            placeholder="Search ID, Customer, Reseller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-[#2A2A2A] text-white pl-9 pr-4 py-2 rounded-lg text-sm focus:border-[#E8B84B] outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-[#2A2A2A] p-4 rounded-xl">
           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">New Today</p>
           <p className="text-2xl font-black text-white mt-1">{summary.newToday}</p>
        </div>
        <div className="bg-[#111111] border border-yellow-500/30 p-4 rounded-xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
           <p className="text-[10px] text-yellow-500/80 font-bold uppercase tracking-widest">Pending Review</p>
           <p className="text-2xl font-black text-yellow-500 mt-1">{summary.pendingAuth}</p>
        </div>
        <div className="bg-[#111111] border border-[#2A2A2A] p-4 rounded-xl">
           <p className="text-[10px] text-green-500/80 font-bold uppercase tracking-widest">Accepted Today</p>
           <p className="text-2xl font-black text-green-500 mt-1">{summary.acceptedToday}</p>
        </div>
        <div className="bg-[#111111] border border-[#2A2A2A] p-4 rounded-xl">
           <p className="text-[10px] text-blue-500/80 font-bold uppercase tracking-widest">Shipped Today</p>
           <p className="text-2xl font-black text-blue-500 mt-1">{summary.shippedToday}</p>
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

      {/* Main Table */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1A1A1A] text-gray-400 font-medium whitespace-nowrap">
              <tr>
                <th className="px-6 py-4">Order ID & Date</th>
                <th className="px-6 py-4">Reseller (Venture)</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                    <div className="font-mono text-white font-bold">{order.orderId}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {order.createdAt?.toDate?.()?.toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                    <div className="text-white font-medium">{order.resellerName}</div>
                    <div className="text-xs text-[#E8B84B] mt-1 font-bold">{order.venture}</div>
                  </td>
                  <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                    <div className="text-white font-medium">{order.customer?.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{order.customer?.city}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-300 max-w-[200px] truncate cursor-pointer" onClick={() => setSelectedOrder(order)}>
                    {order.items?.[0]?.productName} <span className="text-gray-500">x{order.items?.[0]?.quantity || 1}</span>
                  </td>
                  <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                    <div className="text-white font-bold">{formatCurrency(order.totalAmount)}</div>
                    <div className="text-[10px] font-bold text-gray-500 mt-1">{order.paymentMode}</div>
                  </td>
                  <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                    <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {order.status === 'forwarded' && (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); acceptOrder(order.id); }}
                          className="px-3 py-1.5 bg-[#00C9A7]/20 text-[#00C9A7] hover:bg-[#00C9A7]/30 rounded text-xs font-bold transition-colors border border-[#00C9A7]/30"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setRejectModalOpen(true); }}
                          className="px-3 py-1.5 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded text-xs font-bold transition-colors border border-red-500/30"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {order.status === 'accepted' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setShipModalOpen(true); }}
                        className="px-3 py-1.5 bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 rounded text-xs font-bold transition-colors border border-blue-500/30 w-full text-center whitespace-nowrap"
                      >
                        Mark Shipped
                      </button>
                    )}
                     {order.status === 'shipped' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); deliverOrder(order.id); }}
                        className="px-3 py-1.5 bg-green-500/20 text-green-500 hover:bg-green-500/30 rounded text-xs font-bold transition-colors border border-green-500/30 w-full text-center whitespace-nowrap"
                      >
                        Mark Delivered
                      </button>
                    )}
                    {['new', 'rejected', 'cancelled', 'delivered'].includes(order.status) && (
                       <button onClick={() => setSelectedOrder(order)} className="p-2 text-gray-500 hover:text-white rounded transition-colors inline-flex">
                         <ChevronRight size={18} />
                       </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* Order Detail Drawer */}
       <AnimatePresence>
        {selectedOrder && !rejectModalOpen && !shipModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full md:w-[450px] h-full bg-[#111111] border-l border-[#2A2A2A] overflow-y-auto flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
               <div className="p-6 border-b border-[#2A2A2A] flex items-center justify-between sticky top-0 bg-[#111111]/90 backdrop-blur z-10">
                <div>
                  <h2 className="text-lg font-black text-white">{selectedOrder.orderId}</h2>
                  <p className="text-xs text-[#E8B84B] font-bold">Reseller: {selectedOrder.resellerName}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-400 hover:text-white rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 flex-1">
                 {/* Quick Actions at Top */}
                 {selectedOrder.status === 'forwarded' && (
                  <div className="grid grid-cols-2 gap-3 pb-6 border-b border-[#2A2A2A]">
                     <button 
                         onClick={() => acceptOrder(selectedOrder.id)}
                         className="flex items-center justify-center gap-2 py-3 bg-[#00C9A7] text-black rounded-lg font-bold hover:opacity-90"
                      >
                         <CheckCircle size={18} /> Accept
                      </button>
                      <button 
                         onClick={() => setRejectModalOpen(true)}
                         className="flex items-center justify-center gap-2 py-3 bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg font-bold hover:bg-red-500/30"
                      >
                         <XCircle size={18} /> Reject
                      </button>
                  </div>
                 )}
                 {selectedOrder.status === 'accepted' && (
                  <div className="pb-6 border-b border-[#2A2A2A]">
                     <button 
                         onClick={() => setShipModalOpen(true)}
                         className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-lg font-bold hover:opacity-90"
                      >
                         <Truck size={18} /> Mark as Shipped
                      </button>
                  </div>
                 )}
                 {selectedOrder.status === 'shipped' && (
                  <div className="pb-6 border-b border-[#2A2A2A]">
                     <button 
                         onClick={() => deliverOrder(selectedOrder.id)}
                         className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-lg font-bold hover:opacity-90"
                      >
                         <Package size={18} /> Mark as Delivered
                      </button>
                  </div>
                 )}

                {/* Shipping Details */}
                {selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' ? (
                   <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-blue-500">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-blue-500/60">Shipping Info</p>
                      <p className="text-sm font-medium"><span className="text-blue-500/60">Courier:</span> {selectedOrder.courierPartner}</p>
                      <p className="text-sm font-medium"><span className="text-blue-500/60">Tracking ID:</span> <span className="font-mono text-white">{selectedOrder.trackingId}</span></p>
                   </div>
                ) : null}

                 {/* Customer */}
                 <div className="space-y-4">
                   <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Customer</h3>
                   <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                      <p className="text-white font-bold">{selectedOrder.customer?.name}</p>
                      <p className="text-gray-400 text-sm mt-1">{selectedOrder.customer?.phone}</p>
                      <p className="text-gray-400 text-sm mt-2">{selectedOrder.customer?.address}</p>
                      <p className="text-gray-400 text-sm">{selectedOrder.customer?.city}, {selectedOrder.customer?.state} - {selectedOrder.customer?.pincode}</p>
                   </div>
                 </div>

                 {/* Products */}
                 <div className="space-y-4">
                   <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Products</h3>
                   <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                     {selectedOrder.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-start text-sm py-2">
                           <div>
                              <p className="text-white font-medium">{item.productName}</p>
                              <p className="text-gray-500 text-xs mt-1">Qty: {item.quantity} × {formatCurrency(item.sellingPrice)}</p>
                           </div>
                           <span className="text-gray-300 font-mono font-bold">{formatCurrency(item.sellingPrice * item.quantity)}</span>
                        </div>
                      ))}
                   </div>
                 </div>

                 {selectedOrder.marginStatus && (
                    <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#2A2A2A]">
                      <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Margin Status</p>
                      {selectedOrder.marginStatus === 'holding' ? (
                        <span className="text-yellow-500 font-bold text-sm">Holding (Awaiting 7 days)</span>
                      ) : selectedOrder.marginStatus === 'released' ? (
                        <span className="text-green-500 font-bold text-sm">Released</span>
                      ) : (
                        <span className="text-gray-500 text-sm">{selectedOrder.marginStatus}</span>
                      )}
                    </div>
                 )}
              </div>
            </motion.div>
          </motion.div>
        )}
       </AnimatePresence>

       {/* Reject Modal */}
       <AnimatePresence>
        {rejectModalOpen && (
           <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex justify-center items-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
               initial={{ scale: 0.95 }}
               animate={{ scale: 1 }}
               exit={{ scale: 0.95 }}
               className="bg-[#111111] border border-[#2A2A2A] w-full max-w-md rounded-2xl p-6 space-y-6"
            >
               <h2 className="text-xl font-black text-white">Reject Order</h2>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reason for Rejection</label>
                  <textarea 
                     value={rejectReason}
                     onChange={(e) => setRejectReason(e.target.value)}
                     className="w-full bg-[#1A1A1A] border border-red-500/50 text-white rounded-lg p-3 outline-none focus:border-red-500 resize-none h-32"
                     placeholder="e.g. Out of stock, Unserviceable pin code..."
                  />
               </div>
               <div className="flex gap-3">
                  <button onClick={() => setRejectModalOpen(false)} className="flex-1 py-3 bg-[#1A1A1A] text-white rounded-lg font-bold hover:bg-[#2A2A2A]">Cancel</button>
                  <button 
                    onClick={rejectOrderSubmit}
                    disabled={!rejectReason.trim()}
                    className="flex-1 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 disabled:opacity-50"
                  >
                    Confirm Rejection
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
       </AnimatePresence>

       {/* Ship Modal */}
       <AnimatePresence>
        {shipModalOpen && (
           <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex justify-center items-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
               initial={{ scale: 0.95 }}
               animate={{ scale: 1 }}
               exit={{ scale: 0.95 }}
               className="bg-[#111111] border border-[#2A2A2A] w-full max-w-md rounded-2xl p-6 space-y-6"
            >
               <h2 className="text-xl font-black text-white">Mark as Shipped</h2>
               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Courier Partner</label>
                     <input 
                        type="text"
                        value={courierPartner}
                        onChange={(e) => setCourierPartner(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-lg p-3 outline-none focus:border-blue-500"
                        placeholder="Delhivery, Shiprocket, Blue Dart..."
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tracking ID</label>
                     <input 
                        type="text"
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-lg p-3 outline-none focus:border-blue-500 font-mono text-sm"
                        placeholder="AWB / Tracking Number"
                     />
                  </div>
               </div>
               <div className="flex gap-3">
                  <button onClick={() => setShipModalOpen(false)} className="flex-1 py-3 bg-[#1A1A1A] text-white rounded-lg font-bold hover:bg-[#2A2A2A]">Cancel</button>
                  <button 
                    onClick={shipOrderSubmit}
                    disabled={!trackingId.trim() || !courierPartner.trim()}
                    className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50"
                  >
                    Confirm Shipment
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
       </AnimatePresence>
    </div>
  );
}
