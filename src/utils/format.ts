/**
 * Formats a number as Indian Rupee (Rs.)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('₹', 'Rs. ');
};

/**
 * Formats seconds into HH:MM:SS
 */
export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
};

/**
 * Calculates percentage progress
 */
export const calculateProgress = (current: number, target: number): number => {
  return Math.min(Math.round((current / target) * 100), 100);
};
