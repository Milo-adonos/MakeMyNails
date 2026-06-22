import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCredits } from '../../contexts/CreditContext'
import { getSelectedPlan, clearPendingCheckout } from '../../lib/funnelSession'
import Processing from './Processing'

export default function FunnelCheckout() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { addCredits } = useCredits()
  const started = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/onboarding/signup', { replace: true })
      return
    }

    const planId = getSelectedPlan()
    if (!planId) {
      navigate('/onboarding/pricing', { replace: true })
      return
    }

    if (started.current) return
    started.current = true
    clearPendingCheckout()

    addCredits(planId).catch((err) => {
      console.error(err)
      alert('Erreur: ' + (err?.message || 'Paiement impossible'))
      navigate('/onboarding/pricing', { replace: true })
    })
  }, [isAuthenticated, addCredits, navigate])

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
