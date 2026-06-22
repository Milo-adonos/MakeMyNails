import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, Image, Sparkles, Lock, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from '../common/Button'

export default function PhotoCapture({ onNext, onBack, onPhotoSelect }) {
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [preview, setPreview] = useState(null)
  const [showTeaser, setShowTeaser] = useState(false)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    onPhotoSelect(url)
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 bg-gradient-to-b from-offwhite to-nude-light/30">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="font-heading text-3xl font-bold text-brown mb-3">
            {t('onboarding.photo.title')}
          </h2>
          <p className="text-brown-light/70">
            {t('onboarding.photo.subtitle')}
          </p>
        </motion.div>

        {preview ? (
          <div className="w-full rounded-3xl mb-8 shadow-lg overflow-hidden">
            <img src={preview} style={{ display: 'block', width: '100%', height: 'auto' }} />
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full aspect-square rounded-3xl border-2 border-dashed border-nude-dark/30 flex flex-col items-center justify-center gap-6 mb-8 bg-white/50"
          >
            <div className="w-20 h-20 bg-nude/30 rounded-full flex items-center justify-center">
              <Image className="w-10 h-10 text-brown-light/40" />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-2 bg-brown text-offwhite px-5 py-3 rounded-2xl font-medium text-sm hover:bg-brown-light transition-colors"
              >
                <Camera className="w-4 h-4" />
                {t('onboarding.photo.camera')}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-nude text-brown px-5 py-3 rounded-2xl font-medium text-sm hover:bg-nude-dark transition-colors"
              >
                <Upload className="w-4 h-4" />
                {t('onboarding.photo.gallery')}
              </button>
            </div>
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => setShowTeaser(true)}
          className="flex items-center gap-2.5 bg-gradient-to-r from-nude/40 to-beige-light/40 border border-nude/50 px-5 py-3 rounded-2xl mb-6 hover:from-nude/60 hover:to-beige-light/60 transition-all group"
        >
          <div className="w-7 h-7 bg-white/70 rounded-lg flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-beige-dark" />
          </div>
          <span className="text-sm text-brown-light/80 group-hover:text-brown transition-colors">
            {t('onboarding.photo.teaserSkip').includes('sans') || t('onboarding.photo.teaserSkip').includes('without')
              ? t('onboarding.photo.recommendationBanner').replace('<bold>', '').replace('</bold>', '')
              : t('onboarding.photo.recommendationBanner').replace('<bold>', '').replace('</bold>', '')}
          </span>
        </motion.button>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />

        <div className="flex gap-3 w-full">
          <Button variant="ghost" onClick={onBack} className="flex-1">{t('onboarding.back')}</Button>
          <Button onClick={() => onNext(preview)} disabled={!preview} className="flex-1">{t('onboarding.continue')}</Button>
        </div>
      </div>

      <AnimatePresence>
        {showTeaser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-brown/40 backdrop-blur-sm px-4 pb-6"
            onClick={() => setShowTeaser(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="bg-gradient-to-br from-nude/60 via-beige-light/40 to-nude-dark/20 px-6 pt-8 pb-6 text-center">
                <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Sparkles className="w-7 h-7 text-beige-dark" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-brown mb-1">
                  {t('onboarding.photo.teaserTitle')}
                </h3>
                <div className="inline-flex items-center gap-1.5 bg-white/60 px-3 py-1 rounded-full mt-2">
                  <Lock className="w-3 h-3 text-brown-light/60" />
                  <span className="text-xs font-medium text-brown-light/70">{t('onboarding.photo.teaserBadge')}</span>
                </div>
              </div>

              <div className="px-6 pt-5 pb-6">
                <p className="text-sm text-brown-light/80 text-center leading-relaxed mb-5">
                  {t('onboarding.photo.teaserDescription')}
                </p>
                <div className="space-y-3 mb-6">
                  {[
                    t('onboarding.photo.teaserStep1'),
                    t('onboarding.photo.teaserStep2'),
                    t('onboarding.photo.teaserStep3'),
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-brown-light/70">
                      <div className="w-5 h-5 rounded-full bg-nude/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">{i + 1}</span>
                      </div>
                      {step}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/app/profile')}
                  className="w-full bg-brown text-offwhite py-3.5 rounded-2xl font-semibold text-sm hover:bg-brown-light transition-colors mb-2.5"
                >
                  {t('onboarding.photo.teaserCta')}
                </button>
                <button
                  onClick={() => setShowTeaser(false)}
                  className="w-full text-brown-light/60 py-2.5 text-sm hover:text-brown transition-colors"
                >
                  {t('onboarding.photo.teaserSkip')}
                </button>
              </div>

              <button
                onClick={() => setShowTeaser(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/60 rounded-full flex items-center justify-center hover:bg-white transition-colors"
              >
                <X className="w-4 h-4 text-brown-light/60" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
