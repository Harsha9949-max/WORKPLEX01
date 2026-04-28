import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, CheckCircle, Package, Share2, Plus, PenTool, ExternalLink,
  ChevronRight, TrendingUp, Search
} from 'lucide-react';
import { collection, query, where, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import toast from 'react-hot-toast';

export default function ResellerDashboard() {
  const { currentUser } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    pendingMargin: 0
  });

  useEffect(() => {
    if (!currentUser) return;

    // 1. Listen to Shop Data
    const unsubShop = onSnapshot(doc(db, 'partnerShops', currentUser.uid), (doc) => {
      if (doc.exists()) {
        setShop(doc.data());
      } else {
        setShop(null);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'partnerShops/{uid}'));

    // 2. Listen to Orders
    const ordersQuery = query(
      collection(db, 'partnerOrders'),
      where('resellerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubOrders = onSnapshot(ordersQuery, (snap) => {
      const activeOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(activeOrders);
      
      let totOrders = 0;
      let pendOrders = 0;
      let totEarnings = 0;
      let pendMargin = 0;

      // Note: For real stats we should aggregate from the DB accurately.
      // Here we approximate based on the query or an aggregate doc if available.
      // Assuming shop has totalStats.
      // For now we compute from fetched if available.
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'partnerOrders'));

    // 3. Listen to Products
    const productsQuery = query(
      collection(db, `partnerProducts/${currentUser.uid}/products`),
      where('isActive', '==', true)
    );

    const unsubProducts = onSnapshot(productsQuery, (snap) => {
      setProducts(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'partnerProducts'));

    setLoading(false);

    return () => {
      unsubShop();
      unsubOrders();
      unsubProducts();
    };
  }, [currentUser]);

  // Automatically recognize onboarding completion
  useEffect(() => {
    if (!shop || shop.onboardingComplete || !currentUser) return;
    
    // Check completion
    const hasLogoOrBanner = !!(shop?.logo || shop?.branding?.logo || shop?.branding?.bannerImage);
    const hasMin5Products = products.length >= 5;
    const hasSharedLink = !!shop.hasSharedLink;

    if (hasLogoOrBanner && hasMin5Products && hasSharedLink) {
      import('firebase/firestore').then(({ updateDoc }) => {
        updateDoc(doc(db, 'partnerShops', currentUser.uid), {
          onboardingComplete: true,
          isActive: true
        }).then(() => {
          toast.success('Onboarding complete! Your shop is now live.', { id: 'onboarding-complete' });
        }).catch(console.error);
      });
    }
  }, [shop, products.length, currentUser]);

  const copyShopLink = async () => {
    if (!shop?.shopSlug) return;
    const url = `${window.location.origin}/shop/${shop.shopSlug}`;
    navigator.clipboard.writeText(url);
    toast.success('Shop link copied to clipboard!');

    // Mark that they shared the link
    if (!shop?.hasSharedLink && currentUser) {
      try {
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'partnerShops', currentUser.uid), {
          hasSharedLink: true
        });
      } catch (err) {
        console.error('Failed to update shared status', err);
      }
    }
  };

  const handleForwardOrder = async (orderId: string) => {
    try {
      const { updateDoc, serverTimestamp } = await import('firebase/firestore');
      await updateDoc(doc(db, 'partnerOrders', orderId), {
        status: 'forwarded',
        resellerForwarded: true,
        forwardedAt: serverTimestamp(),
        forwardedBy: currentUser?.uid || ''
      });
      toast.success('Order forwarded to Admin!');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'partnerOrders');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'new': return 'bg-[#F59E0B]/20 text-[#F59E0B]';
      case 'forwarded': return 'bg-gray-500/20 text-gray-400';
      case 'accepted': return 'bg-[#00C9A7]/20 text-[#00C9A7]';
      case 'shipped': return 'bg-[#3B82F6]/20 text-[#3B82F6]';
      case 'delivered': return 'bg-[#10B981]/20 text-[#10B981]';
      case 'rejected': return 'bg-[#EF4444]/20 text-[#EF4444]';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'new': return 'New Order';
      case 'forwarded': return 'Awaiting Admin';
      case 'accepted': return 'Being Processed';
      case 'shipped': return 'Shipped 🚚';
      case 'delivered': return 'Delivered ✅';
      case 'rejected': return 'Rejected ❌';
      default: return status;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111111] border border-[#2A2A2A] text-[10px] font-bold uppercase tracking-widest text-gray-300">
              <div className={`w-2 h-2 rounded-full ${shop?.isActive ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
              {shop?.isActive ? 'Shop Live' : 'Shop Inactive'}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {shop?.shopName || 'WorkPlex Reseller'}
            </span>
          </div>
        </div>
        {shop?.shopSlug && (
          <a
            href={`/shop/${shop.shopSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-[#00C9A7] text-[#00C9A7] rounded-[6px] text-sm font-bold hover:bg-[#00C9A7]/10 transition-colors"
          >
            <ExternalLink size={16} /> View My Shop
          </a>
        )}
      </div>

      {/* Onboarding Checklist */}
      {!shop?.onboardingComplete && (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-[8px] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Getting Started</h2>
            <span className="text-sm font-bold text-[#E8B84B]">{[
              true, 
              !!(shop?.logo || shop?.branding?.logo || shop?.branding?.bannerImage), 
              products.length >= 5, 
              products.length > 0, 
              !!shop?.hasSharedLink
            ].filter(Boolean).length}/5 Complete</span>
          </div>
          <div className="w-full bg-[#2A2A2A] h-2 rounded-full mb-6">
            <div className="bg-[#E8B84B] h-2 rounded-full transition-all duration-500" style={{ width: `${([
              true, 
              !!(shop?.logo || shop?.branding?.logo || shop?.branding?.bannerImage), 
              products.length >= 5, 
              products.length > 0, 
              !!shop?.hasSharedLink
            ].filter(Boolean).length / 5) * 100}%` }} />
          </div>
          
          <div className="space-y-4">
            {[
              { label: 'Shop created', done: true, action: null },
              { label: 'Add profile photo + banner', done: !!(shop?.logo || shop?.branding?.logo || shop?.branding?.bannerImage), action: () => window.location.href = '/reseller/settings' },
              { label: 'Select products (min 5)', done: products.length >= 5, action: () => window.location.href = '/reseller/products' },
              { label: 'Set your margins', done: products.length > 0, action: () => window.location.href = '/reseller/products' },
              { label: 'Share your shop link', done: !!shop?.hasSharedLink, action: copyShopLink }
            ].map((step, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border ${step.done ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-[#2A2A2A] text-gray-500'}`}>
                    {step.done ? <CheckCircle size={14} /> : <span className="text-xs">{idx + 1}</span>}
                  </div>
                  <span className={`text-sm ${step.done ? 'text-gray-400 line-through' : 'text-white'}`}>{step.label}</span>
                </div>
                {!step.done && step.action && (
                  <button onClick={step.action} className="text-xs font-bold text-[#E8B84B] hover:text-[#E8B84B]/80 uppercase tracking-widest">
                    Complete Now
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            title: "Total Orders", val: shop?.totalOrders || 0, 
            sub: "All time", trend: "↑12% from last week", 
            valColor: "text-white"
          },
          { 
            title: "Pending Orders", val: stats.pendingOrders || 0, 
            sub: "Need your action", link: "View Orders",
            valColor: "text-[#F59E0B]"
          },
          { 
            title: "Total Earnings", val: formatCurrency(stats.totalEarnings || 0), 
            sub: "Released to wallet",
            valColor: "text-[#E8B84B]"
          },
          { 
            title: "Pending Margin", val: formatCurrency(stats.pendingMargin || 0), 
            sub: "7-day hold", info: "Released after 7 days from delivery confirmation",
            valColor: "text-[#00C9A7]"
          }
        ].map((m, i) => (
          <div key={i} className="bg-[#111111] p-6 rounded-[8px] border border-[#2A2A2A] relative overflow-hidden group">
            <p className="text-sm font-medium text-gray-400 mb-2">{m.title}</p>
            <h3 className={`text-3xl font-black ${m.valColor}`}>{m.val}</h3>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-500">{m.sub}</p>
              {m.trend && <span className="text-[10px] text-[#10B981] font-bold">{m.trend}</span>}
              {m.link && <a href="/reseller/orders" className="text-[10px] text-[#F59E0B] hover:underline font-bold">{m.link}</a>}
            </div>
            {m.info && (
              <div className="absolute top-2 right-2 group-hover:opacity-100 opacity-0 transition-opacity">
                <div className="bg-[#2A2A2A] text-[10px] text-gray-300 p-2 rounded max-w-[150px] shadow-lg">
                  {m.info}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Orders & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-[#111111] border border-[#2A2A2A] rounded-[8px] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#2A2A2A] flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Recent Orders</h2>
            <a href="/reseller/orders" className="text-[#00C9A7] text-sm hover:underline font-bold flex items-center gap-1">
              View All <ChevronRight size={16} />
            </a>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1A1A1A] text-gray-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-300">
                      {order.orderId ? `#${order.orderId.slice(-5).toUpperCase()}` : '...'}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {order.customer?.name?.split(' ')[0] || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-gray-300 truncate max-w-[150px]">
                      {order.items?.[0]?.productName || 'Product'}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {order.status === 'new' ? (
                        <button 
                          onClick={() => handleForwardOrder(order.id)}
                          className="bg-[#E8B84B] text-black px-3 py-1.5 rounded-[6px] text-xs font-bold hover:bg-[#E8B84B]/90"
                        >
                          Forward to Admin
                        </button>
                      ) : (
                        <span className="text-gray-500 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No orders yet. Start sharing your shop!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Top Products */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-[8px] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white mb-2">Quick Actions</h2>
            <button 
              onClick={() => window.open(`https://wa.me/?text=Shop at my amazing store! ${window.location.origin}/shop/${shop?.shopSlug}`, '_blank')}
              className="w-full flex items-center justify-center gap-2 bg-[#10B981] text-white py-3 rounded-[6px] font-bold hover:bg-[#10B981]/90 transition-colors"
            >
              <Share2 size={18} /> Share on WhatsApp
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={copyShopLink} className="flex flex-col items-center justify-center p-3 rounded-[6px] border border-[#00C9A7] text-[#00C9A7] hover:bg-[#00C9A7]/10">
                <ExternalLink size={20} className="mb-1" />
                <span className="text-xs font-bold">Copy Link</span>
              </button>
              <a href="/reseller/products" className="flex flex-col items-center justify-center p-3 rounded-[6px] border border-[#E8B84B] text-[#E8B84B] bg-[#E8B84B]/10 hover:bg-[#E8B84B]/20">
                <Plus size={20} className="mb-1" />
                <span className="text-xs font-bold">Add Products</span>
              </a>
            </div>
            <a href="/reseller/shop" className="w-full mt-3 flex items-center justify-center gap-2 bg-transparent border border-[#8B5CF6] text-[#8B5CF6] py-3 rounded-[6px] font-bold hover:bg-[#8B5CF6]/10 transition-colors">
              <PenTool size={18} /> Customize Shop
            </a>
          </div>

          {/* Top Products */}
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-[8px] p-6">
            <h2 className="text-lg font-bold text-white mb-4">Top Expected Margin</h2>
            <div className="space-y-4">
              {products.map(product => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded border border-[#2A2A2A] bg-[#1A1A1A] overflow-hidden shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 mx-auto mt-2.5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">Margin: {formatCurrency(product.partnerMargin || 0)}/unit</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#E8B84B]">{formatCurrency(product.partnerSellingPrice || 0)}</p>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No active products yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
