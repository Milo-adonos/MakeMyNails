import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Upload, Image } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '../common/Button'

export default function PhotoCapture({ onNext, onBack, onPhotoSelect }) {
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const { t } = useTranslation()
  const [preview, setPreview] = useState(null)

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

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />

        <div className="flex gap-3 w-full">
          <Button variant="ghost" onClick={onBack} className="flex-1">{t('onboarding.back')}</Button>
          <Button onClick={() => onNext(preview)} disabled={!preview} className="flex-1">{t('onboarding.continue')}</Button>
        </div>
      </div>
    </div>
  )
}
