import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ar from './locales/ar.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ru from './locales/ru.json';
import ur from './locales/ur.json';
import tr from './locales/tr.json';
import ms from './locales/ms.json';

export const RTL_LANGUAGES = ['ar', 'ur'];

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe' },
  { code: 'ms', label: 'Malay', nativeLabel: 'Bahasa Melayu' },
] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      es: { translation: es },
      fr: { translation: fr },
      ru: { translation: ru },
      ur: { translation: ur },
      tr: { translation: tr },
      ms: { translation: ms },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

// Set RTL direction on init and language change
function updateDirection(lng: string) {
  const dir = RTL_LANGUAGES.includes(lng) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
}

updateDirection(i18n.language);
i18n.on('languageChanged', updateDirection);

export default i18n;
