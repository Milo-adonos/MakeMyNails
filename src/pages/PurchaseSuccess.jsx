import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCredits } from '../contexts/CreditContext'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/common/Button'
import {
  getFunnelResult,
  clearFunnelSession,
  mapVisualizationToResult,
} from '../lib/funnelSession'

export default function PurchaseSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  const { fetchHistory, fetchPurchases, fetchSubscription, waitForActiveSubscription } = useCredits()
  const { refreshProfile, user } = useAuth()
  const [status, setStatus] = useState('loading')
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      setStatus('invalid')
      return
    }

    let cancelled = false

    const run = async () => {
      refreshProfile()
      const sub = await waitForActiveSubscription(25)
      if (cancelled) return

      await fetchHistory()
      await fetchPurchases()
      await fetchSubscription()

      if (!sub) {
        setStatus('pending')
        return
      }

      const funnelResult = getFunnelResult()
      let result = funnelResult

      const items = await fetchHistory()
      if (!result && items.length > 0) {
        const latest = items.find((v) => v.result_image_url)
        if (latest) result = mapVisualizationToResult(latest)
      }

      clearFunnelSession()
      setStatus('success')

      navigate('/app', {
        replace: true,
        state: result ? { result, unlocked: true } : undefined,
      })
    }

    run()
    return () => { cancelled = true }
  }, [sessionId, user?.id])

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-brown-light/70 mb-4">Session de paiement invalide.</p>
          <Button onClick={() => navigate('/app/purchase')} className="w-full">
            Retour aux abonnements
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-brown-light/70 mb-4">
            Paiement reçu — activation en cours. Rafraîchis dans quelques secondes.
          </p>
          <Button onClick={() => navigate('/app')} className="w-full">
            Aller au dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-offwhite to-nude-light/30 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-nude to-beige rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-nude-dark/20">
          <Sparkles className="w-12 h-12 text-brown animate-pulse" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-brown mb-3">
          {t('purchaseSuccess.title')}
        </h1>
        <p className="text-brown-light/70 text-base mb-4">
          Activation de ton abonnement en cours...
        </p>
        <div className="w-8 h-8 border-2 border-nude-dark/30 border-t-brown rounded-full animate-spin mx-auto" />
      </motion.div>
    </div>
  )
}
