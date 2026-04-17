import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Truck, User, Phone, MapPin, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { db } from '../../lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  shopSlug: string | undefined;
}

export default function CheckoutModal({ isOpen, onClose, product, shopSlug }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    upi: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopSlug) return;

    setLoading(true);
    try {
      // Razorpay Dummy Simulation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const orderData = {
        shopSlug,
        customerDetails: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          upiId: formData.upi
        },
        items: [{
          productId: product.productId,
          name: product.productData.name,
          quantity: 1,
          sellingPrice: product.partnerSellingPrice,
          margin: product.partnerMargin
        }],
        totalAmount: product.partnerSellingPrice,
        totalPartnerMargin: product.partnerMargin,
        status: 'pending',
        marginStatus: 'holding',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'partnerOrders'), orderData);
      
      setSuccess(true);
      toast.success('Order Placed Successfully!');
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 3000);
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-lg bg-[#111111] border border-white/10 rounded-[48px] overflow-hidden shadow-2xl"
          >
            {success ? (
              <div className="p-12 text-center space-y-6">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
                  <CheckCircle2 size={48} className="text-black" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Order Success!</h3>
                  <p className="text-gray-500 text-sm font-bold mt-2 uppercase tracking-widest leading-relaxed">
                    Your order for {product?.productData?.name} has been placed.
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">A tracking link has been sent to your phone via WhatsApp.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tighter">Quick Checkout</h3>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Safe & Secured</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-3 bg-white/5 rounded-full hover:bg-white/10">
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                  {/* Order Preview */}
                  <div className="flex gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
                    <img src={product?.productData?.image} className="w-16 h-16 rounded-2xl object-cover" />
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-tight">{product?.productData?.name}</h4>
                      <p className="text-lg font-black text-teal-500">Rs.{product?.partnerSellingPrice}</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5"><User size={12}/> Name</label>
                        <input
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Your full name"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-teal-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5"><Phone size={12}/> Phone</label>
                        <input
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="Delivery contact"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-teal-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5"><MapPin size={12}/> Shipping Address</label>
                      <textarea
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        placeholder="Complete address with landmark"
                        rows={3}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-teal-500 outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5"><CreditCard size={12}/> UPI ID (for Refund)</label>
                      <input
                        required
                        value={formData.upi}
                        onChange={(e) => setFormData({...formData, upi: e.target.value})}
                        placeholder="yourname@upi"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-3 bg-teal-500/5 p-4 rounded-2xl border border-teal-500/10">
                      <ShieldCheck className="text-teal-500 shrink-0" size={20} />
                      <p className="text-[10px] text-teal-500/80 font-bold uppercase tracking-tight leading-relaxed">
                        Secure transaction via Razorpay. Encrypted at HVRS Master Merchant level.
                      </p>
                    </div>

                    <button
                      disabled={loading}
                      className="w-full bg-teal-500 text-black py-6 rounded-[32px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-teal-500/30"
                    >
                      {loading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
                      ) : (
                        <>Pay Rs.{product?.partnerSellingPrice} <ArrowRight size={20} /></>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
