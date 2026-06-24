import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getOriginalDisplayUrl } from '../../lib/originalImage'
import { createBlurredPreview, createFunnelPaywallPreview } from '../../lib/previewImage'

const PAYWALL_PREVIEW_FILTER = 'blur(64px) saturate(0.25) contrast(0.75) brightness(1.08)'
const STANDARD_PREVIEW_FILTER = 'blur(18px)'

export default function BlurredResult({ result, onUnlock }) {
  const isPaywallPreview = !!result?.pendingGeneration
  const fullResultImg = result?.result_image_url || result?.resultImage
  const storedPreview = result?.previewImage
  const originalImg = getOriginalDisplayUrl(result)
  const [previewSrc, setPreviewSrc] = useState(storedPreview || null)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    if (storedPreview) {
      setPreviewSrc(storedPreview)
      return
    }

    if (isPaywallPreview) {
      const source = result?.originalImageData || result?.originalImage || originalImg
      if (!source) return
      createFunnelPaywallPreview(source).then((src) => {
        if (src) setPreviewSrc(src)
      })
      return
    }

    if (!fullResultImg) return
    createBlurredPreview(fullResultImg).then((src) => {
      if (src) setPreviewSrc(src)
    })
  }, [fullResultImg, storedPreview, isPaywallPreview, result?.originalImageData, result?.originalImage, originalImg])

  const displaySrc = previewSrc || (isPaywallPreview ? null : originalImg)

  return (
    <div className="min-h-screen bg-gradient-to-b from-offwhite to-nude-light/30 px-4 py-8 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <div className="relative w-full rounded-3xl overflow-hidden shadow-xl aspect-[3/4] mb-8 bg-nude/20 select-none">
          {displaySrc ? (
            <>
              <img
                src={displaySrc}
                alt="Aperçu flouté"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className={`w-full h-full object-cover ${isPaywallPreview ? 'scale-[1.35]' : 'scale-110'}`}
                style={{ filter: isPaywallPreview ? PAYWALL_PREVIEW_FILTER : STANDARD_PREVIEW_FILTER }}
                onLoad={() => setImageLoaded(true)}
              />
              {imageLoaded && (
                <div
                  className={`absolute inset-0 pointer-events-none ${
                    isPaywallPreview
                      ? 'bg-offwhite/65 backdrop-blur-2xl'
                      : 'bg-offwhite/30'
                  }`}
                  aria-hidden="true"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-nude/30 animate-pulse" />
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="font-heading text-3xl font-bold text-brown mb-3">
                Ton design est prêt ✨
              </h2>
              <p className="text-brown-light/80 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                Débloque ton résultat pour voir tes ongles parfaits
              </p>
              <button
                onClick={onUnlock}
                className="w-full max-w-xs bg-brown text-offwhite py-4 px-8 rounded-2xl font-semibold hover:bg-brown-light transition-colors shadow-lg shadow-brown/20"
              >
                Débloquer mon design →
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
