import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  getSelectedPlan,
  startStripeCheckoutFromSelectedPlan,
  persistFunnelStep,
} from '../../lib/funnelSession'
import Processing from './Processing'
import { ROUTES } from '../../lib/routes'

export default function FunnelCheckout() {
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuth()
  const started = useRef(false)

  useEffect(() => {
    if (loading) return undefined

    if (!isAuthenticated) {
      navigate(ROUTES.signup, { replace: true })
      return undefined
    }

    if (!getSelectedPlan()) {
      navigate(ROUTES.pricing, { replace: true })
      return undefined
    }

    if (started.current) return undefined
    started.current = true

    persistFunnelStep('checkout')

    startStripeCheckoutFromSelectedPlan().catch((err) => {
      console.error(err)
      alert('Erreur: ' + (err?.message || 'Paiement impossible'))
      navigate(ROUTES.pricing, { replace: true })
    })

    return undefined
  }, [isAuthenticated, loading, navigate])

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
