import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translationResources } from './translations';

i18n
  .use(initReactI18next)
  .init({
    resources: translationResources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
