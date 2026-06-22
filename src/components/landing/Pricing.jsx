import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { LANDING_VIEWPORT } from '../../lib/motion'
import SubscriptionPlans from '../pricing/SubscriptionPlans'

export default function Pricing() {
  const { t } = useTranslation()

  return (
    <section id="pricing" className="py-24 px-4 bg-gradient-to-b from-transparent to-nude/10 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={LANDING_VIEWPORT}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-brown mb-4">
            {t('pricing.title')}
          </h2>
          <p className="text-brown-light/70 text-lg max-w-md mx-auto">
            {t('pricing.subtitle')}
          </p>
        </motion.div>

        <SubscriptionPlans variant="landing" ctaLabel={t('pricing.choose')} />

        <p className="text-center text-xs text-brown-light/40 mt-8">
          {t('pricing.cancelAnytime')}
        </p>
      </div>
    </section>
  )
}
