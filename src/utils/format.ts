import { format as dateFnsFormat } from 'date-fns';

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

/**
 * Safely parses any Firestore Timestamp, Serialized Timestamp Object, String or Date into a native JS Date.
 */
export const parseDate = (val: any): Date | null => {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) return val;
  // If it's a Firestore Timestamp instance with .toDate()
  if (typeof val.toDate === 'function') {
    return val.toDate();
  }
  // If it is a serialized Firestore Timestamp { seconds: number } or { _seconds: number }
  if (typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000);
  }
  if (typeof val._seconds === 'number') {
    return new Date(val._seconds * 1000);
  }
  // ISO strings, milliseconds, etc.
  const isStringOrNo = typeof val === 'string' || typeof val === 'number';
  if (isStringOrNo) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }
  return null;
};

/**
 * Safely formats any Firestore Timestamp, JSON-serialized Timestamp, Date or String using date-fns format.
 */
export const safeFormatDate = (val: any, formatStr: string = 'dd MMM yyyy'): string => {
  const d = parseDate(val);
  if (!d) return 'N/A';
  try {
    return dateFnsFormat(d, formatStr);
  } catch (err) {
    console.warn(`Failed to format date: ${d}`, err);
    return 'N/A';
  }
};

