import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCredits } from '../../contexts/CreditContext'

import { SUBSCRIPTION } from '../../lib/stripe'

const FEATURES = [
  'Générations illimitées',
  'Sauvegarde de tes designs',
  'Upload de tes inspis',
  'Envoi direct à ta nail artist',
  'Catalogue complet',
  'Support prioritaire',
]

export default function FunnelPricing() {
  const [billing, setBilling] = useState('monthly')
  const [designCount, setDesignCount] = useState(1247)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { addCredits } = useCredits()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setDesignCount((c) => c + Math.floor(Math.random() * 3))
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const monthlyPrice = '9,99€'
  const yearlyPrice = '7,99€'
  const strikethrough = billing === 'monthly' ? '19,99€' : '15,99€'
  const displayPrice = billing === 'monthly' ? monthlyPrice : yearlyPrice
  const period = billing === 'monthly' ? '/mois' : '/mois'

  const handleUnlock = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/onboarding/pricing')
      return
    }
    if (billing === 'yearly') {
      alert('L\'offre annuelle arrive bientôt — choisis Mensuel pour débloquer tes designs.')
      return
    }
    setLoading(true)
    try {
      await addCredits(SUBSCRIPTION.id)
    } catch (err) {
      console.error(err)
      alert('Erreur: ' + (err?.message || 'Paiement impossible'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-offwhite to-nude-light/30 px-4 py-12">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-brown mb-2">
            Débloque tes ongles parfaits
          </h1>
          <p className="text-brown-light/60 text-sm">
            Annulable à tout moment, sans engagement
          </p>
        </motion.div>

        <div className="flex justify-center mb-8">
          <div className="relative flex bg-nude/30 rounded-2xl p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                billing === 'monthly' ? 'bg-white text-brown shadow-sm' : 'text-brown-light/60'
              }`}
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-beige-dark text-offwhite text-[9px] font-bold px-2 py-0.5 rounded-full">
                PLUS POPULAIRE
              </span>
              Mensuel
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                billing === 'yearly' ? 'bg-white text-brown shadow-sm' : 'text-brown-light/60'
              }`}
            >
              Annuel
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative bg-white rounded-3xl p-6 shadow-lg shadow-brown/10"
        >
          <span className="absolute top-5 left-5 bg-brown text-offwhite text-xs font-bold px-2.5 py-1 rounded-full">
            -50%
          </span>

          <div className="text-center pt-6 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-beige-dark mb-2">
              Plan {SUBSCRIPTION.name}
            </p>
            <p className="text-brown-light/40 text-sm line-through mb-1">{strikethrough}</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-heading text-5xl font-bold text-brown">{displayPrice}</span>
              <span className="text-brown-light/60 text-sm">{period}</span>
            </div>
          </div>

          <ul className="space-y-3 mb-6">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-brown-light/80">
                <span className="w-5 h-5 rounded-full bg-nude/40 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-brown" />
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="w-full border-2 border-brown/20 text-brown py-3 rounded-2xl text-sm font-medium hover:bg-nude/20 transition-colors mb-4"
          >
            Satisfait ou remboursée
          </button>

          <button
            onClick={handleUnlock}
            disabled={loading}
            className="w-full bg-brown text-offwhite py-4 rounded-2xl font-semibold text-base hover:bg-brown-light transition-colors disabled:opacity-50 shadow-lg shadow-brown/20"
          >
            {loading ? 'Redirection...' : 'Débloquer mes designs →'}
          </button>

          <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-nude/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <p className="text-xs text-brown-light/60">
              <span className="font-semibold text-brown">{designCount.toLocaleString('fr-FR')}</span>
              {' '}designs créés aujourd&apos;hui
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
