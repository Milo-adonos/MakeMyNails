import { motion } from 'framer-motion'
import { Check, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SUBSCRIPTIONS } from '../../lib/stripe'
import Button from '../common/Button'
import { ROUTES } from '../../lib/routes'

import { LANDING_VIEWPORT } from '../../lib/motion'

function formatPrice(price) {
  return price.toFixed(2).replace('.', ',') + '€'
}

export default function SubscriptionPlans({
  variant = 'landing',
  loading = null,
  onSelect,
  ctaLabel,
  className = '',
}) {
  const { t } = useTranslation()
  const isCompact = variant === 'compact'
  const isFunnel = variant === 'funnel'

  const gridClass = isCompact
    ? 'space-y-3'
    : isFunnel
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto'
      : 'grid md:grid-cols-2 gap-6 max-w-3xl mx-auto'

  return (
    <div className={`${gridClass} ${className}`}>
      {SUBSCRIPTIONS.map((plan, i) => {
        const isPopular = plan.popular
        const isLoading = loading === plan.id

        const card = (
          <div
            className={`relative h-full flex flex-col transition-all duration-300 rounded-3xl p-6 md:p-8 ${
              isPopular
                ? 'bg-brown text-offwhite shadow-xl shadow-brown/20 md:scale-[1.02]'
                : 'bg-white shadow-sm shadow-brown/5 hover:shadow-md'
            } ${isCompact ? 'p-5' : ''}`}
          >
            {isPopular && (
              <div className={`absolute ${isCompact ? '-top-2.5 left-5' : '-top-3 left-1/2 -translate-x-1/2'} z-10`}>
                <div className="bg-beige-dark text-brown px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                  {!isCompact && <Star className="w-3 h-3 fill-brown" />}
                  {t('pricing.mostPopular')}
                </div>
              </div>
            )}

            <div className="mb-5">
              <h3 className={`font-heading text-xl md:text-2xl font-semibold mb-1 ${isPopular ? 'text-offwhite' : 'text-brown'}`}>
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mt-3">
                <span className={`font-heading text-4xl md:text-5xl font-bold ${isPopular ? 'text-offwhite' : 'text-brown'}`}>
                  {formatPrice(plan.price)}
                </span>
                <span className={`text-sm ${isPopular ? 'text-offwhite/60' : 'text-brown-light/60'}`}>
                  /{plan.period}
                </span>
              </div>
            </div>

            <ul className={`space-y-2.5 mb-6 flex-1 ${isCompact ? 'mb-4' : ''}`}>
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isPopular ? 'bg-offwhite/15' : 'bg-nude/40'
                  }`}>
                    <Check className={`w-3 h-3 ${isPopular ? 'text-beige' : 'text-brown'}`} />
                  </span>
                  <span className={`text-sm leading-snug ${isPopular ? 'text-offwhite/85' : 'text-brown-light/75'}`}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {onSelect ? (
              <button
                type="button"
                disabled={!!loading}
                onClick={() => onSelect(plan.id)}
                className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-colors disabled:opacity-50 ${
                  isPopular
                    ? 'bg-offwhite text-brown hover:bg-offwhite/90'
                    : 'bg-brown text-offwhite hover:bg-brown-light'
                }`}
              >
                {isLoading ? t('common.loading') : (ctaLabel || t('pricing.subscribe'))}
              </button>
            ) : (
              <Link to={ROUTES.welcome}>
                <Button variant={isPopular ? 'secondary' : 'outline'} className="w-full justify-center">
                  {ctaLabel || t('pricing.subscribe')}
                </Button>
              </Link>
            )}
          </div>
        )

        if (isFunnel) {
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {card}
            </motion.div>
          )
        }

        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={LANDING_VIEWPORT}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            {card}
          </motion.div>
        )
      })}
    </div>
  )
}
