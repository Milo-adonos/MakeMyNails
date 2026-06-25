import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getSelectedPlan,
  startStripeCheckoutFromSelectedPlan,
  persistFunnelStep,
} from '../../lib/funnelSession'
import Processing from './Processing'
import { ROUTES } from '../../lib/routes'

export default function FunnelCheckout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const started = useRef(false)
  const [error, setError] = useState(null)

  const checkoutMessages = useMemo(
    () => t('funnel.checkout.messages', { returnObjects: true }),
    [t],
  )

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
        const message = err?.message || t('funnel.checkout.paymentFailed')
        console.error(err)

        if (/connecte|authenti|non authent|log in|logged in/i.test(message)) {
          navigate(ROUTES.signup, { replace: true })
          return
        }

        setError(message)
      })

    return undefined
  }, [navigate, t])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-offwhite to-nude-light/30">
        <div className="text-center max-w-sm">
          <p className="font-heading text-xl font-bold text-brown mb-3">{t('funnel.checkout.unavailable')}</p>
          <p className="text-red-400/80 text-sm mb-6 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.pricing, { replace: true })}
            className="w-full bg-brown text-offwhite py-4 rounded-2xl font-semibold hover:bg-brown-light transition-colors"
          >
            {t('funnel.checkout.backToPricing')}
          </button>
        </div>
      </div>
    )
  }

  return <Processing messages={checkoutMessages} />
}
