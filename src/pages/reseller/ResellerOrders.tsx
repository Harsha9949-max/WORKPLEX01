import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import toast from 'react-hot-toast';
import { Search, ChevronRight, X, User, MapPin, Package, Clock, Truck, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResellerOrders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

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
