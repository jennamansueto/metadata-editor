import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Port from index_vuetify.php lines 126-135
// Translations come from the PHP backend via window.translation_messages
i18n.use(initReactI18next).init({
  resources: {
    default: {
      translation: window.translation_messages?.default || {},
    },
  },
  lng: 'default',
  fallbackLng: 'default',
  interpolation: {
    escapeValue: false,
  },
  // Suppress missing key warnings in console
  missingKeyHandler: false,
  parseMissingKeyHandler: (key: string) => key,
});

export default i18n;
