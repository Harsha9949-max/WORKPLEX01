export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('₹', 'Rs. ');
};

export const validateUPI = (upiId: string): boolean => {
  return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(upiId);
};

export const getWalletColor = (wallet: string): string => {
  switch (wallet) {
    case 'earned': return 'text-green-500';
    case 'pending': return 'text-yellow-500';
    case 'bonus': return 'text-purple-500';
    case 'savings': return 'text-blue-500';
    default: return 'text-gray-500';
  }
};
