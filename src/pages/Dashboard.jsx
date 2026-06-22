import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CreditCounter from '../components/dashboard/CreditCounter'
import UploadZone from '../components/dashboard/UploadZone'
import RecommendationCard from '../components/dashboard/RecommendationCard'
import RecommendationChat from '../components/dashboard/RecommendationChat'
import NewVisualizationFlow from '../components/dashboard/NewVisualizationFlow'
import HistoryList from '../components/dashboard/HistoryList'
import SubscriptionPlans from '../components/pricing/SubscriptionPlans'
import { useCredits } from '../contexts/CreditContext'

function NoCreditsConversion({ onDismiss }) {
  const { t } = useTranslation()
  const { addCredits } = useCredits()
  const [loading, setLoading] = useState(null)

  const handleSubscribe = async (planId) => {
    setLoading(planId)
    try { await addCredits(planId) } catch { setLoading(null) }
  }

  return (
    <div className="pt-20 pb-24 px-5">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 pt-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-nude/50 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-8 h-8 text-brown-light/50" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-brown mb-3">
            {t('creditCheck.noCreditsTitle')}
          </h2>
          <p className="text-brown-light/60 text-base leading-relaxed">
            {t('creditCheck.noCreditsDesc')}
          </p>
        </motion.div>

        <SubscriptionPlans
          variant="compact"
          loading={loading}
          onSelect={handleSubscribe}
          ctaLabel={t('purchasePage.subscribeCta')}
          className="mb-4"
        />

        <p className="text-center text-xs text-brown-light/30 mb-4">{t('purchasePage.securePayment')}</p>

        <button
          onClick={onDismiss}
          className="w-full text-center text-xs text-brown-light/30 py-3 hover:text-brown-light/50 transition-colors"
        >
          {t('creditCheck.back')}
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [chatOpen, setChatOpen] = useState(false)
  const [flowOpen, setFlowOpen] = useState(false)
  const [conversionDismissed, setConversionDismissed] = useState(false)
  const { credits, isSubscribed } = useCredits()

  if (credits === 0 && !isSubscribed && !conversionDismissed) {
    return <NoCreditsConversion onDismiss={() => setConversionDismissed(true)} />
  }

  return (
    <>
      <div className="pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto space-y-6">
          <CreditCounter />
          <UploadZone onStart={() => setFlowOpen(true)} />
          <RecommendationCard onClick={() => setChatOpen(true)} />
          <HistoryList limit={3} />
        </div>
      </div>

      <AnimatePresence>
        {chatOpen && <RecommendationChat open={chatOpen} onClose={() => setChatOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {flowOpen && <NewVisualizationFlow open={flowOpen} onClose={() => setFlowOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
