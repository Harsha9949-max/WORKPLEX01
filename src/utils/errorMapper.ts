export function mapFirebaseError(error: any): string {
  const code = typeof error === 'string' ? error : error?.code || error?.message || 'unknown';

  if (code.includes('auth/too-many-requests')) {
    return 'Too many attempts. Try again in 1 hour.';
  }
  if (code.includes('auth/invalid-phone-number')) {
    return 'Please enter a valid Indian phone number.';
  }
  if (code.includes('permission-denied') || code.includes('auth/unauthorized')) {
    return 'Access denied. Please contact support.';
  }
  if (code.includes('unavailable') || code.includes('network-request-failed')) {
    return 'Connection lost. Check your internet.';
  }
  if (code.includes('auth/invalid-verification-code')) {
    return 'Invalid verification code. Please try again.';
  }
  if (code.includes('auth/user-not-found') || code.includes('auth/wrong-password')) {
    return 'Invalid credentials. Please check and try again.';
  }

  // Fallback
  return typeof error === 'string' ? error : (error?.message || 'An unexpected error occurred. Please try again.');
}
