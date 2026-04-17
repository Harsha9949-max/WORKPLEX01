import { Timestamp } from 'firebase/firestore';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('₹', 'Rs. ');
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'submitted': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'approved': return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
    default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

export const getVentureColor = (venture: string): string => {
  switch (venture) {
    case 'BuyRix': return 'bg-blue-500/10 text-blue-400';
    case 'Vyuma': return 'bg-purple-500/10 text-purple-400';
    case 'TrendyVerse': return 'bg-pink-500/10 text-pink-400';
    case 'Growplex': return 'bg-green-500/10 text-green-400';
    default: return 'bg-gray-500/10 text-gray-400';
  }
};

export const checkDeadlineExpired = (deadline: Timestamp): boolean => {
  return deadline.toDate().getTime() < Date.now();
};
