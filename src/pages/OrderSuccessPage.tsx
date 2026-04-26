import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Package, Truck } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export default function OrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderDetails = location.state?.orderDetails;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold">Order not found.</h1>
        <button onClick={() => navigate('/')} className="mt-4 text-[#E8B84B] underline">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col relative overflow-hidden">
      {/* Decorative Lights */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E8B84B]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#10B981]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center relative z-10 py-20">
        
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           className="flex flex-col items-center text-center space-y-6"
        >
           <motion.div 
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             transition={{ type: 'spring', damping: 12, delay: 0.2 }}
             className="w-24 h-24 bg-[#10B981]/20 rounded-full flex justify-center items-center relative"
           >
              <div className="absolute inset-0 border-2 border-[#10B981] rounded-full animate-ping opacity-20"></div>
              <CheckCircle2 size={48} className="text-[#10B981]" />
           </motion.div>

           <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Order Reserved!</h1>
              <p className="text-gray-400 mt-4 max-w-md mx-auto">Your order <strong className="text-white">#{orderDetails.orderId}</strong> has been successfully placed. Your partner will forward it to the admin team soon.</p>
           </div>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
           className="mt-12 bg-[#111111] border border-[#2A2A2A] rounded-3xl p-6 md:p-8"
        >
           <h2 className="text-lg font-bold uppercase tracking-widest border-b border-[#2A2A2A] pb-4 mb-6">Order Details</h2>

           <div className="space-y-6">
              <div className="flex items-start gap-4">
                 <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0">
                    <Package size={20} className="text-[#E8B84B]" />
                 </div>
                 <div className="flex-1">
                    <p className="text-white font-medium text-lg">{orderDetails.item?.productName || 'Product'}</p>
                    <p className="text-gray-500">Qty: {orderDetails.item?.quantity || 1}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-gray-500 text-sm">Total Price</p>
                    <p className="text-2xl font-black text-[#E8B84B]">{formatCurrency(orderDetails.totalAmount)}</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-[#2A2A2A]">
                 <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Delivery Address</p>
                    <p className="text-white font-medium">{orderDetails.customer?.name}</p>
                    <p className="text-gray-400 text-sm">{orderDetails.customer?.address}</p>
                    <p className="text-gray-400 text-sm">{orderDetails.customer?.city}, {orderDetails.customer?.state} - {orderDetails.customer?.pincode}</p>
                 </div>
                 <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Payment Method</p>
                    <div className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex items-center gap-3">
                       <Truck size={20} className="text-[#00C9A7]" />
                       <div>
                          <p className="text-white font-bold">Cash on Delivery</p>
                          <p className="text-xs text-gray-500">Pay when you receive</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.6 }}
           className="mt-8 flex justify-center"
        >
           <button 
              onClick={() => navigate(`/shop/${orderDetails.shopSlug}`)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
           >
              Continue Shopping <ChevronRight size={16} />
           </button>
        </motion.div>
      </div>
    </div>
  );
}
