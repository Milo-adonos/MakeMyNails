import { motion } from 'framer-motion'
import { Sparkles, MessageCircle, Crown, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCredits } from '../../contexts/CreditContext'

export default function RecommendationCard({ onClick }) {
  const { hasEmmaAccess } = useCredits()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleClick = () => {
    if (hasEmmaAccess) {
      onClick()
    } else {
      navigate('/app/purchase')
    }
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="w-full bg-gradient-to-br from-nude via-nude-light to-beige-light rounded-3xl p-6 text-left relative overflow-hidden group"
    >
      <div className="absolute top-3 right-3 w-20 h-20 bg-white/20 rounded-full blur-2xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-beige/20 rounded-full blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-brown" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg font-semibold text-brown">Emma</h3>
              {!hasEmmaAccess && (
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  <Crown className="w-2.5 h-2.5" />
                  Exclusif IA
                </span>
              )}
            </div>
            <p className="text-[11px] text-brown-light/60 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {t('dashboard.recommendationsSub')}
            </p>
          </div>
        </div>

        {hasEmmaAccess ? (
          <p className="text-sm text-brown-light/70 leading-relaxed mb-4">
            {t('dashboard.recommendations')}
          </p>
        ) : (
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-3.5 h-3.5 text-brown-light/40 flex-shrink-0" />
            <p className="text-sm text-brown-light/50 leading-relaxed">
              {t('dashboard.recommendationsLocked')}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            <div className="w-6 h-6 rounded-full bg-rose-200 border-2 border-nude-light" />
            <div className="w-6 h-6 rounded-full bg-amber-200 border-2 border-nude-light" />
            <div className="w-6 h-6 rounded-full bg-violet-200 border-2 border-nude-light" />
          </div>
          <span className="text-xs text-brown-light/50">+2k looks créés ✨</span>
        </div>
      </div>

      <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-40 group-hover:opacity-60 transition-opacity">
        <div className="flex gap-1">
          <div className="w-2 h-6 rounded-full bg-brown/20 -rotate-6" />
          <div className="w-2 h-8 rounded-full bg-brown/25" />
          <div className="w-2 h-7 rounded-full bg-brown/20 rotate-6" />
        </div>
      </div>
    </motion.button>
  )
}
