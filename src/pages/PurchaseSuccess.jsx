import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCredits } from '../contexts/CreditContext'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/common/Button'
import { generateFromFunnelPayload } from '../lib/api'
import {
  getFunnelGenData,
  getFunnelResult,
  clearFunnelSession,
} from '../lib/funnelSession'
import { ROUTES } from '../lib/routes'
import { trackEvent, planKey, getPlanRevenue } from '../lib/radar'

export default function PurchaseSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  const {
    fetchHistory,
    fetchPurchases,
    fetchSubscription,
    waitForActiveSubscription,
    createVisualization,
    completeVisualization,
    uploadBlobUrl,
  } = useCredits()
  const { refreshProfile, user } = useAuth()
  const [status, setStatus] = useState('loading')
  const sessionId = searchParams.get('session_id')
  const purchaseTracked = useRef(false)

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

      if (!purchaseTracked.current) {
        purchaseTracked.current = true
        const plan = planKey(sub.plan)
        trackEvent('purchase', {
          plan,
          placement: 'stripe_success',
          source: 'stripe',
        }, getPlanRevenue(sub.plan))
      }

      const stored = getFunnelGenData()
      const pendingPreview = getFunnelResult()
      let result = pendingPreview

      if (stored && (!result?.resultImage || result?.pendingGeneration)) {
        setStatus('generating')
        try {
          let vizId = null
          const originalImageUrl = await uploadBlobUrl(stored.photoDataUrl)
          const vizResult = await createVisualization({
            shape: stored.shape,
            style: stored.style,
            length: stored.length,
            originalImageUrl,
          })
          vizId = vizResult?.visualization_id

          result = await generateFromFunnelPayload(stored, vizId)

          if (vizId && result.resultImage) {
            await completeVisualization(vizId, result.resultImage)
          }

          trackEvent('generation_complete', {
            mode: result.mode || stored.mode || 'onboarding',
            placement: 'post_payment',
          })
        } catch (err) {
          console.error(err)
          if (!cancelled) {
            setStatus('generation_failed')
          }
          return
        }
      }

      if (cancelled) return

      clearFunnelSession()
      setStatus('success')

      navigate(ROUTES.dashboard, {
        replace: true,
        state: result?.resultImage ? { result, unlocked: true } : undefined,
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
          <Button onClick={() => navigate(ROUTES.dashboardPurchase)} className="w-full">
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
          <Button onClick={() => navigate(ROUTES.dashboard)} className="w-full">
            Aller au dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'generation_failed') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-brown-light/70 mb-4">
            Paiement confirmé, mais la génération a échoué. Réessaie depuis le dashboard.
          </p>
          <Button onClick={() => navigate(ROUTES.dashboard)} className="w-full">
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
          {status === 'generating' ? 'Création de ton design...' : t('purchaseSuccess.title')}
        </h1>
        <p className="text-brown-light/70 text-base mb-4">
          {status === 'generating'
            ? 'Génération IA en cours — environ 15 à 30 secondes'
            : 'Activation de ton abonnement en cours...'}
        </p>
        <div className="w-8 h-8 border-2 border-nude-dark/30 border-t-brown rounded-full animate-spin mx-auto" />
      </motion.div>
    </div>
  )
}
