import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getSelectedPlan, isPendingCheckout } from '../lib/funnelSession'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated || !user) return

    const planId = getSelectedPlan()
    if (planId && isPendingCheckout()) {
      navigate('/onboarding/checkout', { replace: true })
      return
    }

    const createdAt = new Date(user.created_at)
    const now = new Date()
    const isNewUser = now - createdAt < 60000

    if (isNewUser && planId) {
      navigate('/onboarding/checkout', { replace: true })
      return
    }

    navigate(isNewUser ? '/onboarding' : '/app', { replace: true })
  }, [isAuthenticated, loading, user, navigate])

  return (
    <div className="min-h-screen bg-offwhite flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-nude-dark/30 border-t-brown rounded-full animate-spin" />
    </div>
  )
}
