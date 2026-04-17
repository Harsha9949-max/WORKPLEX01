import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default_secret_key_for_development';

/**
 * Encrypts a string using AES
 * @param data The string to encrypt
 * @returns The encrypted string
 */
export const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

/**
 * Decrypts an AES encrypted string
 * @param encryptedData The string to decrypt
 * @returns The decrypted string
 */
export const decryptData = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
