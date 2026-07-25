import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CreditCard, 
  Truck, 
  User, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Mail, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Lock,
  BadgeCheck
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  shopSlug: string | undefined;
  resellerId?: string;
  resellerName?: string;
  razorpayConnected?: boolean;
}

export default function CheckoutModal({ isOpen, onClose, product, shopSlug, resellerId, resellerName, razorpayConnected = false }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Address, 2: Review, 3: Payment
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins countdown
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  // Generate unique captcha for secure COD
  const generateCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  // Trigger captcha when entering step 3
  useEffect(() => {
    if (step === 3) {
      generateCaptcha();
    }
  }, [step]);

  // Reservation timer during checkout
  useEffect(() => {
    if (!isOpen || step !== 2) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, step]);

  const formatMinutesSeconds = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopSlug) return;

    if (captchaInput !== captchaCode) {
      toast.error('Invalid security verification code. Please try again.');
      generateCaptcha();
      return;
    }

    setLoading(true);
    try {
      // Small artificial delay for professional gateway feel
      await new Promise(resolve => setTimeout(resolve, 1400));

      const orderData = {
        orderId: `WP-${Math.floor(10000 + Math.random() * 90000)}`,
        shopSlug,
        resellerId: resellerId || product?.ownerUID || '', 
        resellerName: resellerName || 'Partner',
        venture: product?.venture || 'BuyRix',
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email.trim(),
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        },
        items: [{
          productId: product?.productId || product?.id,
          productName: product?.name || product?.productData?.name || 'Product',
          quantity: 1,
          sellingPrice: product?.partnerSellingPrice,
          hvrsBasePrice: product?.hvrsBasePrice,
          margin: product?.partnerMargin || 0
        }],
        item: {
          productName: product?.name || product?.productData?.name || 'Product',
          quantity: 1
        },
        totalAmount: product?.partnerSellingPrice,
        totalMargin: product?.partnerMargin || 0,
        paymentMode: 'COD',
        status: 'new',
        resellerForwarded: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'partnerOrders'), orderData);
      
      toast.success('Order Placed Successfully!');
      onClose();
      navigate('/order-success', { state: { orderDetails: orderData } });
    } catch (error) {
      toast.error('Failed to submit order. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  // Pricing helper variables
  const finalPrice = product?.partnerSellingPrice || 0;
  const mrpPrice = Math.ceil(finalPrice * 1.25);
  const discountAmount = mrpPrice - finalPrice;

  // Render steps timeline
  const renderStepper = () => {
    const steps = [
      { id: 1, label: 'Delivery Address' },
      { id: 2, label: 'Order Summary' },
      { id: 3, label: 'Secure Pay' }
    ];

    return (
      <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-4 mb-5">
        {steps.map((s, index) => {
          const isCompleted = step > s.id;
          const isActive = step === s.id;
          return (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  isCompleted 
                    ? 'bg-[#10B981] text-black' 
                    : isActive 
                      ? 'bg-[#E8B84B] text-black ring-2 ring-[#E8B84B]/20 shadow-lg shadow-[#E8B84B]/10' 
                      : 'bg-white/5 border border-white/10 text-gray-500'
                }`}>
                  {isCompleted ? <Check size={14} className="stroke-[3]" /> : s.id}
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-extrabold hidden sm:inline ${
                  isActive ? 'text-[#E8B84B]' : isCompleted ? 'text-[#10B981]' : 'text-gray-500'
                }`}>
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-[2px] mx-2 transition-all duration-300 ${
                  step > s.id ? 'bg-[#10B981]' : 'bg-white/5'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'ONLINE' | 'COD'>(
    razorpayConnected ? 'ONLINE' : 'COD'
  );

  useEffect(() => {
    if (!razorpayConnected) {
      setSelectedPaymentMethod('COD');
    } else {
      setSelectedPaymentMethod('ONLINE');
    }
  }, [razorpayConnected]);

  const paymentMethods = razorpayConnected ? [
    { id: 'ONLINE', label: 'Online Pay (UPI / Cards / NetBanking)', description: 'Instant Razorpay Secure Settlement', disabled: false, icon: Zap },
    { id: 'COD', label: 'Cash On Delivery (COD)', description: 'Pay hard-cash on doorstep arrival', disabled: false, icon: ShieldCheck }
  ] : [
    { id: 'COD', label: 'Cash On Delivery (COD)', description: 'Pay hard-cash on doorstep arrival', disabled: false, icon: ShieldCheck }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-4xl bg-[#090909] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#0d0d0d]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#E8B84B]/10 rounded-xl flex items-center justify-center text-[#E8B84B]">
                  <ShieldCheck size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Fast Secure Checkout</h3>
                  <p className="text-[9px] text-[#10B981] font-black uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" /> Flipkart Shield Secured
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Split Grid Body */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-y-auto max-h-[80vh] no-scrollbar">
              
              {/* Left Segment: Active checkout Steps forms */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Stepper overview */}
                {renderStepper()}

                {/* STEP 1: Address credentials */}
                {step === 1 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">1. Shipping & Contact Details</h4>
                        <span className="bg-[#E8B84B]/10 text-[9px] uppercase tracking-widest text-[#E8B84B] font-extrabold px-2 py-0.5 rounded-full">Required</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                              <User size={10} className="text-[#E8B84B]" /> Full Name
                            </label>
                            <input
                              required
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              placeholder="e.g. Rahul Sharma"
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:border-[#E8B84B] outline-none transition-colors"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                              <Phone size={10} className="text-[#E8B84B]" /> Contact Phone
                            </label>
                            <input
                              required
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              placeholder="10-digit delivery contact"
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:border-[#E8B84B] outline-none transition-colors"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                            <Mail size={10} className="text-gray-400" /> Email Address
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="yourname@gmail.com (Optional for receipts)"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:border-[#E8B84B] outline-none transition-colors"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                            <MapPin size={10} className="text-[#E8B84B]" /> Complete Shipping Address
                          </label>
                          <textarea
                            required
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            placeholder="Flat/House No., Complex, Colony, Landmark detail"
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:border-[#E8B84B] outline-none resize-none transition-colors leading-relaxed"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">City</label>
                            <input
                              required
                              type="text"
                              value={formData.city}
                              onChange={(e) => setFormData({...formData, city: e.target.value})}
                              placeholder="City"
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:border-[#E8B84B] outline-none transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">State</label>
                            <input
                              required
                              type="text"
                              value={formData.state}
                              onChange={(e) => setFormData({...formData, state: e.target.value})}
                              placeholder="State"
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:border-[#E8B84B] outline-none transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Pincode</label>
                            <input
                              required
                              type="text"
                              maxLength={6}
                              value={formData.pincode}
                              onChange={(e) => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '')})}
                              placeholder="6-digit pincode"
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:border-[#E8B84B] outline-none transition-colors font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!formData.name || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
                          toast.error('Please fill in all requested fields to proceed.');
                          return;
                        }
                        if (formData.phone.length < 8) {
                          toast.error('Please specify a valid phone number.');
                          return;
                        }
                        if (formData.pincode.length !== 6) {
                          toast.error('Pincode must be exactly 6 digits.');
                          return;
                        }
                        setStep(2);
                      }}
                      className="w-full py-4.5 bg-[#E8B84B] text-black font-black uppercase text-xs tracking-wider rounded-2xl flex items-center justify-center gap-2 hover:bg-[#E8B84B]/95 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-[#E8B84B]/20"
                    >
                      Deliver to this address <ArrowRight size={14} className="stroke-[2.5]" />
                    </button>
                  </motion.div>
                ) : (
                  // Collapsed Address Info
                  <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex justify-between items-center transition-all">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-8 h-8 rounded-full bg-[#10B981]/15 flex items-center justify-center text-[#10B981]">
                        <CheckCircle2 size={16} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">1. Address Summary</span>
                          <span className="bg-white/5 text-[8px] uppercase tracking-wider text-gray-400 font-extrabold px-1.5 py-0.5 rounded">Active</span>
                        </div>
                        <p className="text-xs text-white font-extrabold mt-1">{formData.name} • {formData.phone}</p>
                        <p className="text-[11px] text-gray-400 font-medium leading-relaxed mt-0.5 line-clamp-1">{formData.address}, {formData.city}, {formData.state} - {formData.pincode}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setStep(1)} 
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-[#E8B84B] tracking-wider transition-colors shrink-0 cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                )}

                {/* STEP 2: Order summary review */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">2. Order Summary Reservation</h4>
                        <div className="flex items-center gap-1 text-orange-500 font-black text-[9px] uppercase bg-orange-500/10 px-2 py-0.5 rounded-full animate-pulse">
                          <AlertCircle size={10} /> Reserved: {formatMinutesSeconds(timeLeft)}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <img 
                          src={product?.images?.[0] || product?.productData?.image || 'https://via.placeholder.com/400'} 
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400';
                          }}
                          alt={product?.name || 'Product Thumbnail'}
                        />
                        <div className="space-y-1">
                          <h5 className="text-xs font-black text-white uppercase tracking-tight line-clamp-2">{product?.name || product?.productData?.name}</h5>
                          <p className="text-[9px] text-[#E8B84B] font-extrabold uppercase tracking-widest">Qty: 1 Unit</p>
                          <div className="flex items-baseline gap-2 pt-0.5">
                            <span className="text-xs font-black text-[#10B981] font-mono">{formatCurrency(finalPrice)}</span>
                            <span className="text-[10px] text-gray-500 line-through font-mono">{formatCurrency(mrpPrice)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-2 text-gray-300 font-bold">
                          <Truck className="text-[#10B981]" size={14} />
                          <span>Standard Deliver-Partner Inbound</span>
                        </div>
                        <span className="text-[#10B981] font-black uppercase tracking-widest">3 - 5 Days Free Transit</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="w-full py-4.5 bg-[#E8B84B] text-black font-black uppercase text-xs tracking-wider rounded-2xl flex items-center justify-center gap-2 hover:bg-[#E8B84B]/95 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-[#E8B84B]/20"
                    >
                      Continue To Secure Pay <ArrowRight size={14} className="stroke-[2.5]" />
                    </button>
                  </motion.div>
                )}

                {/* Collapsed Step 2 Summary */}
                {step > 2 && (
                  <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex justify-between items-center transition-all">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-8 h-8 rounded-full bg-[#10B981]/15 flex items-center justify-center text-[#10B981]">
                        <CheckCircle2 size={16} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">2. Order Summary</span>
                        <p className="text-xs text-white font-extrabold mt-1">1 Item • {product?.name || product?.productData?.name}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setStep(2)} 
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-[#E8B84B] tracking-wider transition-colors shrink-0 cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                )}

                {/* STEP 3: Complete Payment (Cash On Delivery Mode ONLY) */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="bg-[#111111] border border-white/5 rounded-3xl p-5 space-y-4">
                        <div className="border-b border-white/5 pb-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-white">3. Payment Mode Configuration</h4>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Left Panel: List of interactive checkout channels */}
                          <div className="md:w-2/5 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-4">
                            {paymentMethods.map(pm => {
                              const isSelected = selectedPaymentMethod === pm.id;
                              return (
                                <button
                                  type="button"
                                  key={pm.id}
                                  onClick={() => setSelectedPaymentMethod(pm.id as 'ONLINE' | 'COD')}
                                  className={`p-3 rounded-xl flex flex-col gap-1 transition-all text-left cursor-pointer ${
                                    isSelected 
                                      ? 'bg-[#E8B84B]/10 border border-[#E8B84B]/40 ring-1 ring-[#E8B84B]/20 text-white' 
                                      : 'border border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                                      isSelected ? 'text-[#E8B84B]' : 'text-gray-300'
                                    }`}>
                                      <pm.icon size={12} className={isSelected ? 'text-[#E8B84B]' : 'text-gray-400'} />
                                      {pm.label}
                                    </span>
                                    {isSelected && <BadgeCheck size={12} className="text-[#E8B84B]" />}
                                  </div>
                                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                                    {pm.description}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Right Panel: Selected Payment channel layout */}
                          <div className="md:w-3/5 pl-0 md:pl-2 flex flex-col justify-between space-y-4">
                            {selectedPaymentMethod === 'ONLINE' ? (
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <h5 className="text-[11px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                                    <Zap size={16} className="text-[#E8B84B]" /> Razorpay Online Settlement (UPI / Cards / NetBanking)
                                  </h5>
                                  <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                                    Pay instantly with Google Pay, PhonePe, Paytm, Credit/Debit Cards, or NetBanking. Real-time split settlement via Razorpay.
                                  </p>
                                </div>

                                <div className="bg-[#E8B84B]/10 border border-[#E8B84B]/20 rounded-xl p-3 space-y-1.5">
                                  <div className="flex justify-between text-[10px] font-bold text-gray-300">
                                    <span>Base Product & Transit Cost (HVRS):</span>
                                    <span className="font-mono text-white">₹{(product?.price || product?.productData?.price || 0)}</span>
                                  </div>
                                  <div className="flex justify-between text-[10px] font-bold text-[#10B981]">
                                    <span>Partner Margin Split (Direct Wallet):</span>
                                    <span className="font-mono">₹{((product?.partnerSellingPrice || product?.price || 0) - (product?.price || 0))}</span>
                                  </div>
                                  <p className="text-[8px] text-gray-400 uppercase font-black tracking-wider pt-1 border-t border-white/10">
                                    ✓ Instant automated split transaction powered by Razorpay Route & WorkPlex
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <h5 className="text-[11px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                                    <BadgeCheck size={16} className="text-[#10B981]" /> Cash On Delivery (COD) Enabled
                                  </h5>
                                  <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                                    Pay securely with cash or doorstep UPI scan upon parcel delivery. Partner margin reflects in wallet once marked delivered by HVRS logistics.
                                  </p>
                                </div>

                                {/* Secure Captcha layout inspired by Flipkart */}
                                <div className="bg-[#050505] border border-white/5 rounded-2xl p-4 space-y-3">
                                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Security Human Captcha</span>
                                    <button 
                                      type="button"
                                      onClick={generateCaptcha}
                                      className="text-[#E8B84B] hover:text-[#E8B84B]/80 flex items-center gap-1 text-[8px] uppercase tracking-widest font-black"
                                    >
                                      <RefreshCw size={10} /> Refresh PIN
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    {/* Captcha Display Frame with Security Line Mesh overlay */}
                                    <div className="bg-[#E8B84B]/5 border border-[#E8B84B]/30 text-[#E8B84B] tracking-[5px] px-4 py-2 rounded-xl font-bold text-xl select-none font-mono relative overflow-hidden flex items-center justify-center shrink-0">
                                      <div className="absolute inset-0 bg-[linear-gradient(45deg,#222_25%,transparent_25%),linear-gradient(-45deg,#222_25%,transparent_25%)] bg-[size:5px_5px] opacity-20 pointer-events-none" />
                                      <span className="relative z-10 select-none italic text-shadow-sm">{captchaCode}</span>
                                    </div>
                                    
                                    <input
                                      required={selectedPaymentMethod === 'COD'}
                                      type="text"
                                      maxLength={4}
                                      value={captchaInput}
                                      onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, ''))}
                                      placeholder="Enter Pin"
                                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-center text-xs font-black text-white focus:border-[#E8B84B] outline-none tracking-[5px] font-mono transition-colors"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || (selectedPaymentMethod === 'COD' && captchaInput !== captchaCode)}
                        className={`w-full py-4.5 ${
                          selectedPaymentMethod === 'ONLINE' ? 'bg-[#E8B84B] text-black' : 'bg-[#10B981] text-black'
                        } disabled:bg-gray-800 disabled:text-gray-500 flex justify-center items-center gap-2 font-black uppercase text-xs tracking-wider rounded-2xl transition-all cursor-pointer shadow-lg`}
                      >
                        {loading ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
                        ) : (
                          selectedPaymentMethod === 'ONLINE' ? (
                            <>Pay {formatCurrency(finalPrice)} Online via Razorpay <Zap size={14} /></>
                          ) : (
                            <>Confirm Order & Deliver (COD)</>
                          )
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

              </div>

              {/* Right Segment: Pricing Breakdown Summary Card (Flipkart-Inspired) */}
              <div className="lg:col-span-1 space-y-4">
                
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 space-y-4 sticky top-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-white/5 pb-3">Price Details</h4>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center text-gray-400">
                      <span>MRP (Total {product?.partnerSellingPrice ? '1 Item' : '0 Items'})</span>
                      <span className="font-mono text-white font-bold">{formatCurrency(mrpPrice)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Special Discount</span>
                      <span className="font-mono text-[#10B981] font-bold">- {formatCurrency(discountAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Secured Packing / Fees</span>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="text-gray-500 line-through">Rs. 49.00</span>
                        <span className="text-[#10B981] font-extrabold uppercase text-[10px]">FREE</span>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3.5 mt-3.5 flex justify-between items-center text-sm">
                      <span className="font-black text-white uppercase tracking-tight">Total Amount</span>
                      <span className="font-mono text-lg font-black text-[#E8B84B]">{formatCurrency(finalPrice)}</span>
                    </div>
                  </div>

                  <div className="bg-[#10B981]/10 border border-[#10B981]/20 p-3.5 rounded-xl text-center">
                    <p className="text-[10px] text-[#10B981] font-black uppercase tracking-wide leading-normal">
                      🎉 You will save {formatCurrency(discountAmount)} on this secure purchase!
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5 pt-3.5 text-[9px] text-gray-500 font-extrabold leading-relaxed border-t border-white/5">
                    <ShieldCheck size={16} className="text-gray-400 shrink-0 mt-0.5" />
                    <p className="uppercase tracking-wide">
                      100% Genuine and authentic items. Safe checkout protocols are actively deployed.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
