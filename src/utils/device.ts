import CryptoJS from 'crypto-js';

/**
 * Generates a unique device fingerprint hash
 * @returns A SHA-256 hash string
 */
export const generateDeviceFingerprint = (): string => {
  const data = [
    navigator.userAgent,
    screen.width,
    screen.height,
    navigator.language,
    new Date().getTimezoneOffset()
  ].join('|');
  
  return CryptoJS.SHA256(data).toString();
};
