import React from 'react';
import { useCoupon, useCouponUsages } from '../hooks/useCoupon';
import CouponHeroCard from '../components/coupon/CouponHeroCard';
import CommissionCalculator from '../components/coupon/CommissionCalculator';
import { formatCurrency } from '../utils/couponUtils';

export default function CouponDashboard() {
  const { coupon, loading } = useCoupon();
  const { usages } = useCouponUsages();

  if (loading) return <div className="text-white p-4">Loading...</div>;
  if (!coupon) return <div className="text-white p-4">No coupon found.</div>;

  const totalEarned = usages.reduce((acc, u) => acc + u.commissionAmount, 0);
  const pending = usages.filter(u => !u.released).reduce((acc, u) => acc + u.commissionAmount, 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 pb-24 text-white">
      <h1 className="text-2xl font-bold mb-6">My Coupon Code</h1>
      
      <CouponHeroCard coupon={coupon} />
      
      <div className="grid grid-cols-3 gap-4 my-6">
        <div className="bg-[#111111] p-4 rounded-xl text-center">
          <p className="text-gray-500 text-xs">Used Today</p>
          <p className="text-xl font-bold">{coupon.usageCount}</p>
        </div>
        <div className="bg-[#111111] p-4 rounded-xl text-center">
          <p className="text-gray-500 text-xs">Earned</p>
          <p className="text-xl font-bold text-green-500">{formatCurrency(totalEarned)}</p>
        </div>
        <div className="bg-[#111111] p-4 rounded-xl text-center">
          <p className="text-gray-500 text-xs">Pending</p>
          <p className="text-xl font-bold text-yellow-500">{formatCurrency(pending)}</p>
        </div>
      </div>

      <CommissionCalculator />
    </div>
  );
}
