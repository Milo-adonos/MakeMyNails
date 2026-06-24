import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, KeyRound } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import GoogleSignInButton from '../auth/GoogleSignInButton'
import { supabase } from '../../lib/supabase'
import {
  getSelectedPlan,
  getPlanLabel,
} from '../../lib/funnelSession'
import { isMaintenanceMode } from '../../lib/maintenance'
import { ROUTES } from '../../lib/routes'
import { trackEvent } from '../../lib/radar'

export default function FunnelSignup({ onCheckout }) {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedPlan = getSelectedPlan()
  const planLabel = getPlanLabel(selectedPlan)

  const goToCheckout = async () => {
    for (let i = 0; i < 12; i++) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        if (onCheckout) onCheckout()
        else navigate(ROUTES.stripeCheckout, { replace: true })
        return
      }
      await new Promise((r) => setTimeout(r, 500))
    }
    setError('Confirme ton email ou reconnecte-toi pour continuer vers le paiement.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPlan) {
      navigate(ROUTES.pricing)
      return
    }
    setError('')
    setLoading(true)
    try {
      if (await isMaintenanceMode()) {
        setError('Les inscriptions sont temporairement suspendues.')
        return
      }
      await signup(email, password, '')
      trackEvent('signup', { placement: 'funnel', label: 'email' })
      goToCheckout()
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = () => {
    if (!selectedPlan) {
      navigate(ROUTES.pricing)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-offwhite to-nude-light/30 flex flex-col px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <div className="text-center mb-10">
            <img
              src="/logo.webp"
              alt="MakeMyNails"
              className="w-16 h-16 rounded-2xl object-cover mx-auto mb-6 shadow-lg shadow-nude-dark/20"
            />
            <h1 className="font-heading text-3xl font-bold text-brown mb-2">
              Crée ton compte pour débloquer
            </h1>
            {planLabel ? (
              <p className="text-brown-light/70 text-sm">
                Plan sélectionné : <span className="font-semibold text-brown">{planLabel}</span>
              </p>
            ) : (
              <p className="text-brown-light/60 text-sm">
                Choisis d&apos;abord ton abonnement
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-light/40" />
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-nude/50 rounded-2xl text-sm text-brown placeholder:text-brown-light/40 outline-none focus:ring-2 focus:ring-nude-dark/30"
              />
            </div>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-light/40" />
              <input
                type="password"
                placeholder="Mot de passe"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-nude/50 rounded-2xl text-sm text-brown placeholder:text-brown-light/40 outline-none focus:ring-2 focus:ring-nude-dark/30"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center bg-red-50 rounded-xl py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !selectedPlan}
              className="w-full bg-brown text-offwhite py-4 rounded-2xl font-semibold hover:bg-brown-light transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Création...' : 'Continuer vers le paiement →'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-nude/50" />
            <span className="text-xs text-brown-light/40">ou</span>
            <div className="flex-1 h-px bg-nude/50" />
          </div>

          <GoogleSignInButton onBeforeClick={handleGoogleAuth} disabled={!selectedPlan} />

          <Link
            to={`${ROUTES.login}?redirect=${encodeURIComponent(ROUTES.stripeCheckout)}&mode=login`}
            className="block text-center text-sm text-brown-light/60 mt-6 hover:text-brown transition-colors"
          >
            Déjà un compte ? Connexion
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
