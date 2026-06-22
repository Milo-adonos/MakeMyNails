import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { normalizeLocale } from '../lib/locale'
import Hero from '../components/landing/Hero'
import Footer from '../components/layout/Footer'

const Steps = lazy(() => import('../components/landing/Steps'))
const EmmaSection = lazy(() => import('../components/landing/EmmaSection'))
const Pricing = lazy(() => import('../components/landing/Pricing'))
const Testimonials = lazy(() => import('../components/landing/Testimonials'))

function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = normalizeLocale(i18n.language)

  return (
    <div className="flex items-center gap-1 bg-nude/30 rounded-xl p-1">
      <button
        onClick={() => i18n.changeLanguage('fr')}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${current === 'fr' ? 'bg-white text-brown shadow-sm' : 'text-brown-light/60 hover:text-brown'}`}
      >
        FR
      </button>
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${current === 'en' ? 'bg-white text-brown shadow-sm' : 'text-brown-light/60 hover:text-brown'}`}
      >
        EN
      </button>
    </div>
  )
}

export default function Landing() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-offwhite">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.webp" alt="MakeMyNails" className="w-8 h-8 rounded-xl object-cover" width="32" height="32" />
            <span className="font-heading text-xl font-semibold text-brown">MakeMyNails</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#steps" className="text-sm text-brown-light/70 hover:text-brown transition-colors">{t('nav.howItWorks')}</a>
            <a href="#emma" className="text-sm text-brown-light/70 hover:text-brown transition-colors">{t('nav.emma')}</a>
            <a href="#pricing" className="text-sm text-brown-light/70 hover:text-brown transition-colors">{t('nav.pricing')}</a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              to="/login"
              className="bg-brown text-offwhite px-5 py-2 rounded-xl text-sm font-medium hover:bg-brown-light transition-colors"
            >
              {t('nav.login')}
            </Link>
          </div>
        </div>
      </nav>

      <Hero />

      <Suspense fallback={null}>
        <Steps />
        <EmmaSection />
        <Pricing />
        <Testimonials />
      </Suspense>

      <Footer />
    </div>
  )
}
