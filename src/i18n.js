import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import fr from './locales/fr.json'
import en from './locales/en.json'
import { applyDocumentLanguage, detectDeviceLanguage, LOCALE_STORAGE_KEY, normalizeLocale } from './lib/locale'

const initialLanguage = detectDeviceLanguage()
applyDocumentLanguage(initialLanguage)

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: initialLanguage,
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en'],
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      convertDetectedLanguage: (lng) => normalizeLocale(lng),
    },
    interpolation: {
      escapeValue: false,
    },
  })

i18n.on('languageChanged', (lng) => {
  applyDocumentLanguage(lng)
})

export default i18n
