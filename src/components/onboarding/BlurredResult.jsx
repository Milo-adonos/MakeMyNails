import { motion } from 'framer-motion'
import { optimizeImageUrl } from '../../lib/supabase'

export default function BlurredResult({ result, onUnlock }) {
  const resultImg = result?.result_image_url || result?.resultImage
  const originalImg = optimizeImageUrl(result?.original_image_url || result?.originalImage)

  return (
    <div className="min-h-screen bg-gradient-to-b from-offwhite to-nude-light/30 px-4 py-8 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <div className="relative w-full rounded-3xl overflow-hidden shadow-xl aspect-[3/4] mb-8">
          {resultImg ? (
            <img
              src={resultImg}
              alt="Résultat"
              className="w-full h-full object-cover"
              style={{ filter: 'blur(12px)', transform: 'scale(1.08)' }}
            />
          ) : originalImg ? (
            <img
              src={originalImg}
              alt="Aperçu"
              className="w-full h-full object-cover"
              style={{ filter: 'blur(12px)', transform: 'scale(1.08)' }}
            />
          ) : (
            <div className="w-full h-full bg-nude/30" />
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center bg-brown/20 backdrop-blur-[1px] px-6 text-center">
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
