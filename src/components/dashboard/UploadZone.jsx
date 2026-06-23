import { motion } from 'framer-motion'
import { Plus, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCredits } from '../../contexts/CreditContext'
import { ROUTES } from '../../lib/routes'

export default function UploadZone({ onStart }) {
  const { canGenerate } = useCredits()
  const { t } = useTranslation()

  const hasCredits = canGenerate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="font-heading text-3xl font-bold text-brown mb-4">
        {t('dashboard.newLookTitle')}
      </h1>

      <div className="bg-white rounded-3xl shadow-sm shadow-brown/5 overflow-hidden">
        {hasCredits ? (
          <button onClick={onStart} className="w-full flex flex-col items-center gap-4 p-8 group">
            <div className="w-16 h-16 bg-gradient-to-br from-nude to-beige rounded-2xl flex items-center justify-center shadow-sm shadow-nude-dark/20 group-hover:scale-105 transition-transform">
              <Plus className="w-8 h-8 text-brown" />
            </div>
            <div className="text-center">
              <p className="text-brown-light/50 text-sm">{t('dashboard.newLookSub')}</p>
            </div>
            <span className="inline-flex items-center gap-2 bg-brown text-offwhite px-6 py-2.5 rounded-xl font-medium text-sm group-hover:bg-brown-light transition-colors">
              {t('dashboard.newLook')}
            </span>
          </button>
        ) : (
          <div className="text-center p-8">
            <div className="w-12 h-12 bg-nude/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-brown-light/50" />
            </div>
            <p className="text-sm font-medium text-brown mb-1">{t('dashboard.noCredits')}</p>
            <Link
              to={ROUTES.dashboardPurchase}
              className="inline-flex items-center gap-2 bg-brown text-offwhite px-6 py-3 rounded-2xl font-medium text-sm hover:bg-brown-light transition-colors mt-4"
            >
              {t('dashboard.buyCredits')}
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  )
}
