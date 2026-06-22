import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Mail, KeyRound } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function FunnelSignup({ onSuccess }) {
  const { signup } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signup(email, password, '')
      onSuccess()
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
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
            <p className="text-brown-light/60 text-sm">
              Gratuit et en 30 secondes
            </p>
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
              disabled={loading}
              className="w-full bg-brown text-offwhite py-4 rounded-2xl font-semibold hover:bg-brown-light transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Création...' : 'Continuer →'}
            </button>
          </form>

          <Link
            to={`/login?redirect=${encodeURIComponent('/onboarding/pricing')}&mode=login`}
            className="block text-center text-sm text-brown-light/60 mt-6 hover:text-brown transition-colors"
          >
            Déjà un compte ? Connexion
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
