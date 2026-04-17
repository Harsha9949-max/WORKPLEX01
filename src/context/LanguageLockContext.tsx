import React, { createContext, useContext, useEffect, useState } from 'react';
import i18next from 'i18next';
import { useAuth } from './AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface LanguageLockContextType {
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  isLocked: boolean;
}

const LanguageLockContext = createContext<LanguageLockContextType | undefined>(undefined);

export const IndianLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

export function LanguageLockProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, userData } = useAuth();
  const [language, setLangState] = useState(userData?.preferredLanguage || 'en');
  const [isLocked, setIsLocked] = useState(!!userData?.preferredLanguage);

  useEffect(() => {
    if (userData?.preferredLanguage) {
      setLangState(userData.preferredLanguage);
      setIsLocked(true);
      i18next.changeLanguage(userData.preferredLanguage);
    }
  }, [userData?.preferredLanguage]);

  const setLanguage = async (lang: string) => {
    if (isLocked) return;
    
    setLangState(lang);
    i18next.changeLanguage(lang);
    
    if (currentUser) {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        preferredLanguage: lang
      });
      setIsLocked(true);
    }
  };

  return (
    <LanguageLockContext.Provider value={{ language, setLanguage, isLocked }}>
      {children}
    </LanguageLockContext.Provider>
  );
}

export function useLanguageLock() {
  const context = useContext(LanguageLockContext);
  if (context === undefined) {
    throw new Error('useLanguageLock must be used within a LanguageLockProvider');
  }
  return context;
}
