import { Timestamp } from 'firebase/firestore';

export const generateCouponCode = (venture: string): string => {
  const prefix = venture.substring(0, 2).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
};

export const calculateCommission = (price: number): number => {
  const margin = price * 0.175;
  return margin * 0.10;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('₹', 'Rs. ');
};
