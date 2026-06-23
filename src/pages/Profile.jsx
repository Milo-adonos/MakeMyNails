import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, LogOut, Package } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCredits } from '../contexts/CreditContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { createPortalSession } from '../lib/stripe'
import Button from '../components/common/Button'
import { ROUTES } from '../lib/routes'

export default function Profile() {
  const { t, i18n } = useTranslation()
  const { credits, purchases, subscription, isSubscribed } = useCredits()
  const { user, profile, logout, login, signup, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  const planLabel = subscription?.plan === 'exclusif_ia' ? 'Exclusif IA' : 'Premium'
  const looksDisplay = isSubscribed ? '∞' : credits

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await signup(email, password, name)
      }
      setMode(null)
      setEmail('')
      setPassword('')
      setName('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.landing)
  }

  const openSubscriptionPortal = async () => {
    setPortalLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Non connectée')
      const url = await createPortalSession(session.access_token)
      window.location.href = url
    } catch (err) {
      alert(err.message || 'Impossible d\'ouvrir la gestion d\'abonnement')
      setPortalLoading(false)
    }
  }

  return (
    <div className="app-shell px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="font-heading text-3xl font-bold text-brown">{t('profilePage.title')}</h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-sm shadow-brown/5"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-nude to-beige rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-brown" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold text-brown">
                {isAuthenticated ? (profile?.name || user.email) : t('profilePage.guest')}
              </h2>
              <p className="text-sm text-brown-light/60">
                {isAuthenticated ? user.email : t('profilePage.guestHint')}
              </p>
            </div>
          </div>

          {!isAuthenticated && !mode && (
            <div className="mt-4 flex gap-3">
              <Button size="sm" onClick={() => setMode('login')} className="flex-1">
                {t('profilePage.login')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMode('signup')} className="flex-1">
                {t('profilePage.signup')}
              </Button>
            </div>
          )}

          {!isAuthenticated && mode && (
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {mode === 'signup' && (
                <input
                  type="text"
                  placeholder={t('profilePage.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-nude/50 bg-offwhite text-brown text-sm focus:outline-none focus:ring-2 focus:ring-beige/50"
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-nude/50 bg-offwhite text-brown text-sm focus:outline-none focus:ring-2 focus:ring-beige/50"
              />
              <input
                type="password"
                placeholder={t('profilePage.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-nude/50 bg-offwhite text-brown text-sm focus:outline-none focus:ring-2 focus:ring-beige/50"
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" onClick={() => setMode(null)} className="flex-1" type="button">
                  {t('profilePage.cancel')}
                </Button>
                <Button size="sm" className="flex-1" type="submit" disabled={loading}>
                  {loading ? '...' : mode === 'login' ? t('profilePage.loginCta') : t('profilePage.signupCta')}
                </Button>
              </div>
            </form>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-sm shadow-brown/5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-nude/30 rounded-xl flex items-center justify-center overflow-hidden">
                <img src="/logo.webp" alt="MakeMyNails" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-medium text-brown">{t('profilePage.yourLooks')}</p>
                <p className="text-sm text-brown-light/60">
                  <span className="font-semibold text-brown">{looksDisplay}</span>
                  {' '}
                  {isSubscribed
                    ? t('profilePage.unlimitedLooks')
                    : (credits !== 1 ? t('profilePage.looksToCreatePlural') : t('profilePage.looksToCreate'))}
                </p>
              </div>
            </div>
            {!isSubscribed && (
              <Link to={ROUTES.dashboardPurchase} className="text-sm text-beige-dark font-medium hover:text-brown transition-colors">
                {t('profilePage.getMore')}
              </Link>
            )}
          </div>
        </motion.div>

        {isAuthenticated && isSubscribed && subscription && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-3xl p-6 shadow-sm shadow-brown/5"
          >
            <h3 className="font-heading text-lg font-semibold text-brown mb-2">
              {t('profilePage.subscription')}
            </h3>
            <p className="text-sm font-medium text-brown">{planLabel}</p>
            <p className="text-xs text-brown-light/60 mt-1">
              {t('profilePage.activeUntil')}{' '}
              {new Date(subscription.current_period_end).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <button
              type="button"
              onClick={openSubscriptionPortal}
              disabled={portalLoading}
              className="mt-4 w-full bg-brown text-offwhite py-3 rounded-2xl font-semibold text-sm hover:bg-brown-light transition-colors disabled:opacity-50"
            >
              {portalLoading ? '...' : t('profilePage.manageSubscription')}
            </button>
            <button
              type="button"
              onClick={openSubscriptionPortal}
              disabled={portalLoading}
              className="mt-3 w-full text-[10px] text-brown-light/40 hover:text-brown-light/60 transition-colors"
            >
              {t('profilePage.cancelSubscription')}
            </button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-sm shadow-brown/5"
        >
          <h3 className="font-heading text-lg font-semibold text-brown mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-brown-light/60" />
            {t('profilePage.purchases')}
          </h3>
          {purchases.length === 0 ? (
            <p className="text-sm text-brown-light/50 text-center py-4">{t('profilePage.noPurchases')}</p>
          ) : (
            <div className="space-y-3">
              {purchases.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-nude/20 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-brown">
                      {p.pack_id === 'sub_premium' ? 'Premium' : p.pack_id === 'sub_exclusif_ia' ? 'Exclusif IA' : p.pack_id}
                    </p>
                    <p className="text-xs text-brown-light/50">
                      {new Date(p.created_at).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-brown">{Number(p.amount).toFixed(2)}€</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm shadow-brown/5 hover:shadow-md transition-shadow"
            >
              <LogOut className="w-5 h-5 text-red-400" />
              <span className="text-sm font-medium text-red-400">{t('profilePage.logout')}</span>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
