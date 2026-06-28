import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SUBSCRIPTIONS } from '../../lib/stripe'
import { setSelectedPlan } from '../../lib/funnelSession'

function planI18nKey(planId) {
  return planId === 'sub_exclusif_ia' ? 'exclusif_ia' : 'premium'
}

function formatPrice(price, language) {
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(price)
}

export default function FunnelPricingPlans({ loading = null, onSelect }) {
  const { t, i18n } = useTranslation()
  const [selectedId, setSelectedId] = useState('sub_exclusif_ia')

  useEffect(() => {
    setSelectedPlan(selectedId)
  }, [selectedId])

  const selectedPlan = SUBSCRIPTIONS.find((p) => p.id === selectedId) || SUBSCRIPTIONS[1]
  const key = planI18nKey(selectedPlan.id)
  const features = t(`subscriptions.${key}.features`, { returnObjects: true })
  const isLoading = loading === selectedPlan.id
  const isPopular = selectedPlan.popular

  const handleToggle = (planId) => {
    setSelectedId(planId)
  }

  const handleCta = () => {
    onSelect?.(selectedPlan.id)
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="relative flex bg-white/90 p-1.5 rounded-2xl shadow-sm border border-nude/50 mb-8">
        {SUBSCRIPTIONS.map((plan) => {
          const isActive = plan.id === selectedId
          const planKey = planI18nKey(plan.id)
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => handleToggle(plan.id)}
              className={`relative flex-1 py-3.5 px-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? 'bg-brown text-offwhite shadow-md shadow-brown/15'
                  : 'text-brown-light/60 hover:text-brown'
              }`}
            >
              <span className="block">{t(`subscriptions.${planKey}.name`)}</span>
              {plan.popular && (
                <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-beige-dark text-brown' : 'bg-beige text-brown/80'
                }`}>
                  {t('pricing.mostPopular')}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPlan.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className={`relative rounded-3xl p-6 md:p-8 flex flex-col ${
            isPopular
              ? 'bg-brown text-offwhite shadow-xl shadow-brown/25'
              : 'bg-white shadow-lg shadow-brown/8 border border-nude/30'
          }`}
        >
          <div className="mb-6">
            <h2 className={`font-heading text-2xl font-semibold mb-4 ${
              isPopular ? 'text-offwhite' : 'text-brown'
            }`}>
              {t(`subscriptions.${key}.name`)}
            </h2>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-lg line-through ${
                  isPopular ? 'text-offwhite/45' : 'text-brown-light/40'
                }`}>
                  {formatPrice(selectedPlan.originalPrice, i18n.language)}
                </span>
                <span className={`font-heading text-2xl md:text-3xl font-black tracking-tight ${
                  isPopular ? 'text-beige' : 'text-beige-dark'
                }`}>
                  {t('funnel.pricing.discountBadge')}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className={`font-heading text-5xl font-bold ${
                  isPopular ? 'text-offwhite' : 'text-brown'
                }`}>
                  {formatPrice(selectedPlan.price, i18n.language)}
                </span>
                <span className={`text-base ${
                  isPopular ? 'text-offwhite/60' : 'text-brown-light/60'
                }`}>
                  /{t(`subscriptions.${key}.period`)}
                </span>
              </div>
            </div>
          </div>

          <ul className="space-y-3 mb-6 flex-1">
            {Array.isArray(features) && features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isPopular ? 'bg-offwhite/15' : 'bg-nude/50'
                }`}>
                  <Check className={`w-3 h-3 ${isPopular ? 'text-beige' : 'text-brown'}`} />
                </span>
                <span className={`text-sm leading-snug ${
                  isPopular ? 'text-offwhite/90' : 'text-brown-light/80'
                }`}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-3 mt-auto">
            <div
              className={`w-full py-3.5 rounded-2xl text-sm font-semibold text-center border-2 ${
                isPopular
                  ? 'border-offwhite/30 text-offwhite/90 bg-offwhite/5'
                  : 'border-brown/20 text-brown bg-transparent'
              }`}
            >
              {t('funnel.pricing.moneyBack')}
            </div>

            <button
              type="button"
              disabled={!!loading}
              onClick={handleCta}
              className={`w-full py-4 rounded-2xl font-semibold text-base transition-colors disabled:opacity-50 ${
                isPopular
                  ? 'bg-offwhite text-brown hover:bg-offwhite/90 shadow-lg'
                  : 'bg-brown text-offwhite hover:bg-brown-light shadow-lg shadow-brown/20'
              }`}
            >
              {isLoading ? t('common.loading') : t('funnel.pricing.cta')}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
