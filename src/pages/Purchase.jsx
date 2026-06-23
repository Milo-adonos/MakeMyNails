import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCredits } from '../contexts/CreditContext'
import { useAuth } from '../contexts/AuthContext'
import SubscriptionPlans from '../components/pricing/SubscriptionPlans'
import { ROUTES } from '../lib/routes'

export default function Purchase() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { addCredits } = useCredits()
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(null)

  const handleSubscribe = async (planId) => {
    if (!isAuthenticated) {
      navigate(`${ROUTES.login}?redirect=${ROUTES.dashboardPurchase}`)
      return
    }

    setLoading(planId)
    try {
      await addCredits(planId)
    } catch (err) {
      console.error(err)
      alert('Erreur: ' + (err?.message || JSON.stringify(err)))
      setLoading(null)
    }
  }

  return (
    <div className="app-shell px-4">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-brown-light/60 hover:text-brown transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t('purchasePage.back')}</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-heading text-3xl font-bold text-brown mb-2">{t('purchasePage.title')}</h1>
          <p className="text-brown-light/60 mb-8">{t('purchasePage.subtitle')}</p>

          <SubscriptionPlans
            variant="compact"
            loading={loading}
            onSelect={handleSubscribe}
            ctaLabel={t('purchasePage.subscribeCta')}
          />
        </motion.div>

        {!isAuthenticated && (
          <p className="text-center text-sm text-brown-light/60 mt-6">
            {t('purchasePage.loginRequired')}
          </p>
        )}

        <p className="text-center text-xs text-brown-light/40 mt-8">
          {t('purchasePage.securePayment')}
        </p>
        <p className="text-center text-xs text-brown-light/40 mt-2">
          {t('purchasePage.cancelAnytime')}
        </p>
      </div>
    </div>
  )
}
