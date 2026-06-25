export const LOCALE_STORAGE_KEY = 'i18nextLng'

export function normalizeLocale(language) {
  const code = String(language || '').toLowerCase()
  if (code.startsWith('en')) return 'en'
  if (code.startsWith('fr')) return 'fr'
  return 'fr'
}

/** Prefer saved choice, then shell-detected language, then device language. */
export function detectDeviceLanguage() {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored) return normalizeLocale(stored)
  } catch {
    // private browsing
  }

  if (typeof window !== 'undefined' && window.__MMN_LANG__) {
    return normalizeLocale(window.__MMN_LANG__)
  }

  const candidates = typeof navigator !== 'undefined'
    ? (navigator.languages?.length ? navigator.languages : [navigator.language || 'fr'])
    : ['fr']

  for (const language of candidates) {
    const code = String(language).toLowerCase()
    if (code.startsWith('en')) return 'en'
    if (code.startsWith('fr')) return 'fr'
  }

  return 'fr'
}

export function applyDocumentLanguage(language) {
  const locale = normalizeLocale(language)
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
  return locale
}
