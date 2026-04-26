import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ResellerPerformance() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('This Month');

  useEffect(() => {
    if (!currentUser) return;
    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, 'partnerOrders'),
          where('resellerId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'partnerOrders');
      }
      setLoading(false);
    };
    fetchOrders();
  }, [currentUser]);

  // Aggregate Data
  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  
  // Dummy conversion rate
  const conversionRate = totalOrders > 0 ? ((totalOrders / (totalOrders * 3.5)) * 100).toFixed(1) : 0;

  // Chart Data Preparation (Mocking dates based on existing orders)
  const chartDataMap: { [date: string]: { date: string, placed: number, delivered: number } } = {};
  orders.forEach(order => {
    const d = order.createdAt?.toDate?.() || new Date();
    const dateStr = `${d.getDate()}/${d.getMonth()+1}`;
    if (!chartDataMap[dateStr]) chartDataMap[dateStr] = { date: dateStr, placed: 0, delivered: 0 };
    chartDataMap[dateStr].placed += 1;
    if (order.status === 'delivered') {
      chartDataMap[dateStr].delivered += 1;
    }
  });

  const chartData = Object.values(chartDataMap).sort((a,b) => a.date.localeCompare(b.date)).slice(-10);
  while(chartData.length < 5) {
     chartData.unshift({ date: '-', placed: 0, delivered: 0 });
  }

  // Status Data for Donut Chart
  const statuses = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = [
    { name: 'Delivered', value: statuses['delivered'] || 0, color: '#10B981' },
    { name: 'In Progress', value: (statuses['new'] || 0) + (statuses['forwarded'] || 0) + (statuses['accepted'] || 0) + (statuses['shipped'] || 0), color: '#3B82F6' },
    { name: 'Rejected', value: statuses['rejected'] || 0, color: '#EF4444' },
    { name: 'Cancelled', value: statuses['cancelled'] || 0, color: '#6B7280' }
  ].filter(d => d.value > 0);

  // Top Products
  const prodMap = orders.reduce((acc, order) => {
    const item = order.items?.[0];
    if (item) {
      if (!acc[item.productId]) {
        acc[item.productId] = { name: item.productName, orders: 0, revenue: 0, margin: 0 };
      }
      acc[item.productId].orders += 1;
      acc[item.productId].revenue += item.sellingPrice * item.quantity;
      acc[item.productId].margin += item.margin * item.quantity;
    }
    return acc;
  }, {} as Record<string, any>);
  const topProducts = Object.values(prodMap).sort((a: any, b: any) => b.orders - a.orders).slice(0, 5);

  if (loading) {
    return <div className="p-8 text-white h-screen flex justify-center items-center">Loading Performance Data...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-[#111111] p-4 rounded-xl border border-[#2A2A2A]">
        <h1 className="text-xl font-black text-white">Performance Overview</h1>
        <select 
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-[#1A1A1A] border border-[#2A2A2A] text-white px-4 py-2 rounded-lg text-sm outline-none focus:border-[#E8B84B]"
        >
          <option>This Week</option>
          <option>This Month</option>
          <option>All Time</option>
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: totalOrders, sub: 'Orders placed' },
          { label: 'Total Sales', value: formatCurrency(totalSales), sub: 'Gross revenue' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, sub: 'Est. view to order' },
          { label: 'Avg Order Value', value: formatCurrency(avgOrderValue), sub: 'Per transaction' }
        ].map((met, i) => (
          <div key={i} className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-xl">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{met.label}</p>
            <p className="text-2xl font-black text-white mt-1">{met.value}</p>
            <p className="text-xs text-gray-400 mt-2">{met.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111111] border border-[#2A2A2A] p-6 rounded-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Sales Trend</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                <XAxis dataKey="date" stroke="#6B7280" tick={{fontSize: 12}} />
                <YAxis stroke="#6B7280" tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="placed" name="Orders Placed" stroke="#3B82F6" strokeWidth={3} dot={{r: 4, fill: '#3B82F6', strokeWidth: 0}} />
                <Line type="monotone" dataKey="delivered" name="Orders Delivered" stroke="#10B981" strokeWidth={3} dot={{r: 4, fill: '#10B981', strokeWidth: 0}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#2A2A2A] p-6 rounded-xl flex flex-col">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Order Status</h2>
          {pieData.length > 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-3xl font-black text-white">{totalOrders}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Total</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 w-full">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">No data available</div>
          )}
        </div>
      </div>

      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#2A2A2A]">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Top Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1A1A1A] text-gray-400 font-medium">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4 text-center">Orders</th>
                <th className="px-6 py-4 text-right">Revenue Generated</th>
                <th className="px-6 py-4 text-right text-[#10B981]">Total Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {topProducts.map((p: any, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{p.name}</td>
                  <td className="px-6 py-4 text-center text-gray-300">{p.orders}</td>
                  <td className="px-6 py-4 text-right text-gray-300 font-mono">{formatCurrency(p.revenue)}</td>
                  <td className="px-6 py-4 text-right text-[#10B981] font-bold font-mono">{formatCurrency(p.margin)}</td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No product sales yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
