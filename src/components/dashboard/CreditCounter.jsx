import { motion } from 'framer-motion'
import { Plus, Crown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCredits } from '../../contexts/CreditContext'
import { ROUTES } from '../../lib/routes'

export default function CreditCounter() {
  const { credits, isSubscribed, subscription } = useCredits()
  const { t } = useTranslation()

  const planLabel = subscription?.plan === 'exclusif_ia' ? 'Exclusif IA' : 'Premium'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-6 text-offwhite bg-gradient-to-r from-brown to-brown-light"
    >
      <div className="flex items-center justify-between">
        <div>
          {isSubscribed && (
            <div className="flex items-center gap-1.5 mb-2">
              <Crown className="w-3.5 h-3.5 text-beige" />
              <span className="text-xs font-semibold text-beige">{planLabel}</span>
            </div>
          )}
          <p className="text-offwhite/60 text-sm mb-1">{t('dashboard.creditsLabel')}</p>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-4xl font-bold">{isSubscribed ? '∞' : credits}</span>
            {!isSubscribed && (
              <span className="text-offwhite/50 text-sm">
                {credits !== 1 ? t('dashboard.creditsUnitPlural') : t('dashboard.creditsUnit')}
              </span>
            )}
          </div>
          {isSubscribed && subscription?.current_period_end && (
            <p className="text-offwhite/50 text-xs mt-2">
              Renouvellement le {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/10">
            {isSubscribed ? (
              <Crown className="w-7 h-7 text-beige" />
            ) : (
              <img src="/logo.webp" alt="MakeMyNails" className="w-10 h-10 rounded-xl object-cover opacity-80" />
            )}
          </div>
        </div>
      </div>
      <Link
        to={ROUTES.dashboardPurchase}
        className="mt-4 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition-colors py-2.5 rounded-xl text-sm font-medium"
      >
        {isSubscribed ? (
          t('dashboard.manageSubscription')
        ) : (
          <>
            <Plus className="w-4 h-4" />
            {t('dashboard.getMoreLooks')}
          </>
        )}
      </Link>
    </motion.div>
  )
}
