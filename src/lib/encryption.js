import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

export const encryptPAN = (pan) => {
  if (!ENCRYPTION_KEY) {
    console.error("Encryption key missing");
    return pan;
  }
  return CryptoJS.AES.encrypt(pan, ENCRYPTION_KEY).toString();
};

export const decryptPAN = (encryptedPAN) => {
  if (!ENCRYPTION_KEY) return encryptedPAN;
  const bytes = CryptoJS.AES.decrypt(encryptedPAN, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
