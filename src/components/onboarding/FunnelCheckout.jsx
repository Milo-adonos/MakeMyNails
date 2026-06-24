import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  getSelectedPlan,
  startStripeCheckoutFromSelectedPlan,
} from '../../lib/funnelSession'
import Processing from './Processing'
import { ROUTES } from '../../lib/routes'
import { trackEvent, trackPageView, planKey, getPlanRevenue } from '../../lib/radar'

export default function FunnelCheckout() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const started = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.signup, { replace: true })
      return
    }

    if (!getSelectedPlan()) {
      navigate(ROUTES.pricing, { replace: true })
      return
    }

    if (started.current) return
    started.current = true

    trackPageView({ page: 'checkoutstripe', step: 'stripe_checkout' })

    const plan = getSelectedPlan()
    if (plan) {
      const revenue = getPlanRevenue(plan)
      trackEvent('checkout_started', { plan: planKey(plan), placement: 'funnel' }, revenue)
    }

    startStripeCheckoutFromSelectedPlan().catch((err) => {
      console.error(err)
      alert('Erreur: ' + (err?.message || 'Paiement impossible'))
      navigate(ROUTES.pricing, { replace: true })
    })
  }, [isAuthenticated, navigate])

  return (
    <Processing
      messages={[
        'Préparation du paiement...',
        'Redirection vers Stripe...',
        'Presque prête...',
      ]}
    />
  )
}
