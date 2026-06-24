import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCredits } from '../contexts/CreditContext'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/common/Button'
import { ROUTES } from '../lib/routes'
import { trackEvent, planKey, getPlanRevenue } from '../lib/radar'

export default function PurchaseSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  const { pendingGeneration, startPostPaymentGeneration } = useCredits()
  const { refreshProfile, user } = useAuth()
  const startedRef = useRef(false)
  const purchaseTrackedRef = useRef(false)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId || startedRef.current) return
    startedRef.current = true
    refreshProfile()

    startPostPaymentGeneration({
      onSubscriptionReady: (sub) => {
        if (!purchaseTrackedRef.current) {
          purchaseTrackedRef.current = true
          trackEvent('purchase', {
            plan: planKey(sub.plan),
            placement: 'stripe_success',
            source: 'stripe',
          }, getPlanRevenue(sub.plan))
        }
      },
    })
  }, [sessionId, user?.id, startPostPaymentGeneration, refreshProfile])

  useEffect(() => {
    if (pendingGeneration.status === 'success' && pendingGeneration.result?.resultImage) {
      navigate(ROUTES.dashboard, {
        replace: true,
        state: { result: pendingGeneration.result, unlocked: true },
      })
    }
  }, [pendingGeneration.status, pendingGeneration.result, navigate])

  if (!sessionId) {
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

  if (pendingGeneration.status === 'pending_subscription') {
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

  if (pendingGeneration.status === 'failed') {
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

  const isGenerating = ['waiting', 'generating'].includes(pendingGeneration.status)

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
          {isGenerating ? 'Création de ton design...' : t('purchaseSuccess.title')}
        </h1>
        <p className="text-brown-light/70 text-base mb-4">
          {isGenerating
            ? 'Génération IA en cours — environ 15 à 30 secondes. Tu peux continuer vers l\'app, elle apparaîtra dans ton historique.'
            : 'Activation de ton abonnement en cours...'}
        </p>
        <div className="w-8 h-8 border-2 border-nude-dark/30 border-t-brown rounded-full animate-spin mx-auto mb-6" />
        {isGenerating && (
          <Button onClick={() => navigate(ROUTES.dashboard)} variant="secondary" className="w-full">
            Continuer vers l'app
          </Button>
        )}
      </motion.div>
    </div>
  )
}
