import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Image } from 'lucide-react'
import Button from '../common/Button'

export default function InspirationCapture({ onNext, onBack, onInspirationSelect, onSkip }) {
  const fileInputRef = useRef(null)
  const [preview, setPreview] = useState(null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    onInspirationSelect(url)
    onNext(url)
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
            Tu as une inspi d&apos;ongles ?
          </h2>
          <p className="text-brown-light/70">
            Montre-nous ce que tu veux, on l&apos;adapte à ta main
          </p>
        </motion.div>

        {preview ? (
          <div className="w-full rounded-3xl mb-8 shadow-lg overflow-hidden">
            <img src={preview} alt="Inspiration" style={{ display: 'block', width: '100%', height: 'auto' }} />
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full aspect-square rounded-3xl border-2 border-dashed border-nude-dark/30 flex flex-col items-center justify-center gap-4 mb-8 bg-white/50"
          >
            <div className="w-20 h-20 bg-nude/30 rounded-full flex items-center justify-center">
              <Image className="w-10 h-10 text-brown-light/40" />
            </div>
          </motion.div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

        <div className="w-full space-y-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-brown text-offwhite py-4 rounded-2xl font-semibold flex items-center justify-center gap-2.5 hover:bg-brown-light transition-colors"
          >
            <Upload className="w-5 h-5" />
            Ajouter une photo d&apos;inspi
          </button>

          <button
            onClick={onSkip}
            className="w-full text-brown-light/60 py-3 text-sm hover:text-brown transition-colors"
          >
            Continuer sans inspi →
          </button>
        </div>

        <div className="mt-6 w-full">
          <Button variant="ghost" onClick={onBack} className="w-full">
            Retour
          </Button>
        </div>
      </div>
    </div>
  )
}
