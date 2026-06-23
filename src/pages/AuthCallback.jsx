import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  getSelectedPlan,
  startStripeCheckoutFromSelectedPlan,
} from '../lib/funnelSession'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading } = useAuth()
  const handled = useRef(false)

  useEffect(() => {
    if (loading || handled.current) return
    if (!isAuthenticated || !user) return

    handled.current = true

    const run = async () => {
      const selectedPlan = getSelectedPlan()

      if (selectedPlan) {
        try {
          await startStripeCheckoutFromSelectedPlan()
        } catch (err) {
          console.error(err)
          navigate('/onboarding/pricing', { replace: true })
        }
        return
      }

      navigate('/app', { replace: true })
    }

    run()
  }, [isAuthenticated, loading, user, navigate])

  return (
    <div className="min-h-screen bg-offwhite flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-nude-dark/30 border-t-brown rounded-full animate-spin" />
    </div>
  )
}
