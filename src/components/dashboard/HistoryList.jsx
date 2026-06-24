import { motion } from 'framer-motion'
import { Sparkles, ChevronRight } from 'lucide-react'
import { useCredits } from '../../contexts/CreditContext'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { optimizeImageUrl } from '../../lib/supabase'
import { getOriginalDisplayUrl } from '../../lib/originalImage'
import { ROUTES } from '../../lib/routes'

export default function HistoryList({ limit }) {
  const { history } = useCredits()
  const { t } = useTranslation()
  const items = limit ? history.slice(0, limit) : history

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-xl font-semibold text-brown">{t('dashboard.historyTitle')}</h3>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-sm shadow-brown/5 text-center">
          <Sparkles className="w-10 h-10 text-nude-dark/30 mx-auto mb-3" />
          <p className="text-brown-light/50 text-sm">{t('dashboard.historyEmpty')}</p>
          <p className="text-brown-light/40 text-xs mt-1">{t('dashboard.historyEmptyHint')}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-xl font-semibold text-brown">{t('dashboard.historyTitle')}</h3>
        {limit && history.length > limit && (
          <Link to={ROUTES.dashboardHistory} className="text-sm text-brown-light/60 hover:text-brown flex items-center gap-1">
            {t('dashboard.historySeeAll')} <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="space-y-3">
        {items.map((item) => {
          const originalImg = getOriginalDisplayUrl(item, 120)
          const resultImg = item.result_image_url || item.resultImage
          const isProcessing = item.status === 'pending' && !resultImg

          return (
          <Link
            key={item.id}
            to={ROUTES.dashboardResult(item.id)}
            className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm shadow-brown/5 hover:shadow-md transition-shadow"
          >
            <div className="w-16 h-14 rounded-xl overflow-hidden flex-shrink-0 flex border border-nude/30">
              <div className="w-1/2 h-full bg-nude/20 relative">
                {originalImg ? (
                  <img src={originalImg} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] text-brown-light/40 px-0.5 text-center leading-tight">
                    {t('result.before')}
                  </div>
                )}
              </div>
              <div className="w-1/2 h-full bg-nude/20 relative border-l border-nude/30">
                {resultImg ? (
                  <img src={optimizeImageUrl(resultImg, 120)} alt="" className="w-full h-full object-cover" />
                ) : isProcessing ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-nude-dark/30 border-t-brown rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-heading text-sm text-brown-light/30">
                    {item.style?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-brown capitalize">{item.style} · {item.shape}</p>
              <p className="text-xs text-brown-light/50 mt-0.5">
                {isProcessing
                  ? t('dashboard.historyProcessing')
                  : new Date(item.created_at || item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-brown-light/30" />
          </Link>
        )})}
      </div>
    </motion.div>
  )
}
