import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCredits } from '../contexts/CreditContext'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/common/Button'
import {
  getFunnelResult,
  clearFunnelResult,
  clearSelectedPlan,
  clearPendingCheckout,
} from '../lib/funnelSession'

export default function PurchaseSuccess() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { fetchHistory, fetchPurchases, fetchSubscription } = useCredits()
  const { refreshProfile } = useAuth()
  const [countdown, setCountdown] = useState(5)
  const funnelResult = useState(() => getFunnelResult())[0]

  const goToApp = () => {
    clearFunnelResult()
    clearSelectedPlan()
    clearPendingCheckout()
    navigate('/app', funnelResult ? { state: { result: funnelResult, unlocked: true } } : undefined)
  }

  useEffect(() => {
    setTimeout(() => {
      refreshProfile()
      fetchHistory()
      fetchPurchases()
      fetchSubscription()
    }, 2000)

    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          goToApp()
        }
        return c - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-offwhite to-nude-light/30 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="text-center max-w-sm"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
          className="w-24 h-24 bg-gradient-to-br from-nude to-beige rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-nude-dark/20"
        >
          <Sparkles className="w-12 h-12 text-brown" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-heading text-3xl font-bold text-brown mb-3"
        >
          {t('purchaseSuccess.title')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-brown-light/70 text-base mb-8 leading-relaxed"
        >
          {t('purchaseSuccess.subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <Button onClick={goToApp} className="w-full">
            {t('purchaseSuccess.cta')}
          </Button>
          <p className="text-xs text-brown-light/40">
            {t('purchaseSuccess.redirect', { count: countdown })}
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
