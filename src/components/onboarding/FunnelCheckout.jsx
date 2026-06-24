import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getSelectedPlan,
  startStripeCheckoutFromSelectedPlan,
  persistFunnelStep,
} from '../../lib/funnelSession'
import Processing from './Processing'
import { ROUTES } from '../../lib/routes'

export default function FunnelCheckout() {
  const navigate = useNavigate()
  const started = useRef(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (started.current) return undefined

    if (!getSelectedPlan()) {
      navigate(ROUTES.pricing, { replace: true })
      return undefined
    }

    started.current = true
    persistFunnelStep('checkout')

    startStripeCheckoutFromSelectedPlan()
      .catch((err) => {
        started.current = false
        const message = err?.message || 'Paiement impossible'
        console.error(err)

        if (/connecte|authenti|non authent/i.test(message)) {
          navigate(ROUTES.signup, { replace: true })
          return
        }

        setError(message)
      })

    return undefined
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-offwhite to-nude-light/30">
        <div className="text-center max-w-sm">
          <p className="font-heading text-xl font-bold text-brown mb-3">Paiement indisponible</p>
          <p className="text-red-400/80 text-sm mb-6 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.pricing, { replace: true })}
            className="w-full bg-brown text-offwhite py-4 rounded-2xl font-semibold hover:bg-brown-light transition-colors"
          >
            Retour aux tarifs
          </button>
        </div>
      </div>
    )
  }

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
