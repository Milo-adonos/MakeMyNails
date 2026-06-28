import { motion } from 'framer-motion'
import { Plus, Crown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCredits } from '../../contexts/CreditContext'
import { ROUTES } from '../../lib/routes'

export default function CreditCounter() {
  const { creditsRemaining, isSubscribed, isUnlimited, subscription } = useCredits()
  const { t, i18n } = useTranslation()

  const planLabel = subscription?.plan === 'exclusif_ia'
    ? t('subscriptions.exclusif_ia.name')
    : t('subscriptions.premium.name')

  const resetDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString(
      i18n.language === 'en' ? 'en-US' : 'fr-FR',
    )
    : null

  if (!isSubscribed) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-6 text-offwhite bg-gradient-to-r from-brown to-brown-light"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Crown className="w-3.5 h-3.5 text-beige" />
            <span className="text-xs font-semibold text-beige">{planLabel}</span>
          </div>
          <p className="text-offwhite/60 text-sm mb-1">{t('dashboard.creditsLabel')}</p>
          <div className="flex items-baseline gap-2">
            {isUnlimited ? (
              <span className="font-heading text-4xl font-bold">{t('dashboard.unlimited')}</span>
            ) : (
              <>
                <span className="font-heading text-4xl font-bold">{creditsRemaining}</span>
                <span className="text-offwhite/50 text-sm">
                  / 20 {t('dashboard.creditsRemainingSuffix')}
                </span>
              </>
            )}
          </div>
          {resetDate && (
            <p className="text-offwhite/50 text-xs mt-2">
              {t('dashboard.creditsReset', { date: resetDate })}
            </p>
          )}
        </div>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/10">
          <Crown className="w-7 h-7 text-beige" />
        </div>
      </div>
      <Link
        to={ROUTES.dashboardPurchase}
        className="mt-4 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition-colors py-2.5 rounded-xl text-sm font-medium"
      >
        {isUnlimited ? (
          t('dashboard.manageSubscription')
        ) : (
          <>
            <Plus className="w-4 h-4" />
            {t('dashboard.upgradeToExclusif')}
          </>
        )}
      </Link>
    </motion.div>
  )
}
