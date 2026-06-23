import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Upload, Sparkles, ChevronRight, Shirt, Wand2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { generateNailVisualization } from '../../lib/api'
import { useCredits } from '../../contexts/CreditContext'
import Processing from '../onboarding/Processing'
import { ROUTES } from '../../lib/routes'

const occasionKeys = ['wedding', 'work', 'party', 'vacation', 'date', 'everyday', 'other']
const occasionIcons = {
  wedding: '💍', work: '💼', party: '🥂', vacation: '🌴',
  date: '🌹', everyday: '☀️', other: '✨',
}

const recommendations = {
  wedding: [
    { name: 'French Élégance', shape: 'almond', style: 'french', length: 'medium', desc: 'Classique et raffiné, parfait pour le grand jour' },
    { name: 'Nude Perlé', shape: 'oval', style: 'minimalist', length: 'medium', desc: 'Doux et lumineux avec une touche nacrée' },
    { name: 'Glamour Rosé', shape: 'ballerina', style: 'gradient', length: 'long', desc: 'Dégradé rose pour un effet romantique' },
  ],
  work: [
    { name: 'Nude Discret', shape: 'square', style: 'minimalist', length: 'short', desc: 'Propre et professionnel, passe partout' },
    { name: 'French Courte', shape: 'oval', style: 'french', length: 'short', desc: 'Classique et adapté au bureau' },
    { name: 'Rosé Subtil', shape: 'almond', style: 'color', length: 'short', desc: 'Touche de couleur douce et élégante' },
  ],
  party: [
    { name: 'Chrome Party', shape: 'coffin', style: 'chrome', length: 'long', desc: 'Effet miroir pour briller toute la soirée' },
    { name: 'Nail Art Festif', shape: 'stiletto', style: 'nailart', length: 'long', desc: 'Créatif et audacieux, tu seras remarquée' },
    { name: 'Dégradé Sunset', shape: 'almond', style: 'gradient', length: 'medium', desc: 'Couleurs chaudes et vibrantes' },
  ],
  vacation: [
    { name: 'Corail Estival', shape: 'oval', style: 'color', length: 'medium', desc: 'Couleur vive et joyeuse pour la plage' },
    { name: 'Pastel Doux', shape: 'almond', style: 'gradient', length: 'medium', desc: 'Tons pastel relaxants et frais' },
    { name: 'Minimale Chic', shape: 'square', style: 'minimalist', length: 'short', desc: 'Simple et pratique pour voyager' },
  ],
  date: [
    { name: 'Rouge Passion', shape: 'almond', style: 'color', length: 'medium', desc: 'Classique séducteur, indémodable' },
    { name: 'French Romantique', shape: 'ballerina', style: 'french', length: 'medium', desc: 'Élégance douce pour charmer' },
    { name: 'Dégradé Rosé', shape: 'oval', style: 'gradient', length: 'medium', desc: 'Romantique et féminin' },
  ],
  everyday: [
    { name: 'Nude Naturel', shape: 'oval', style: 'minimalist', length: 'short', desc: 'Naturel et soigné au quotidien' },
    { name: 'French Soft', shape: 'square', style: 'french', length: 'short', desc: 'Classique léger pour tous les jours' },
    { name: 'Couleur Douce', shape: 'almond', style: 'color', length: 'short', desc: 'Touche de couleur subtile' },
  ],
  other: [
    { name: 'Amande Chic', shape: 'almond', style: 'minimalist', length: 'medium', desc: 'Polyvalent et élégant' },
    { name: 'Nail Art Créatif', shape: 'coffin', style: 'nailart', length: 'medium', desc: 'Original et unique à ton image' },
    { name: 'Chrome Moderne', shape: 'stiletto', style: 'chrome', length: 'long', desc: 'Futuriste et tendance' },
  ],
}

function BotMessage({ text, delay = 0, children }) {
  const [visible, setVisible] = useState(delay === 0)

  useEffect(() => {
    if (delay > 0) {
      const t = setTimeout(() => setVisible(true), delay)
      return () => clearTimeout(t)
    }
  }, [delay])

  if (!visible) {
    return (
      <div className="flex gap-2.5 items-end">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nude to-beige flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-brown" />
        </div>
        <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-brown-light/30 rounded-full animate-pulse" />
            <span className="w-2 h-2 bg-brown-light/30 rounded-full animate-pulse [animation-delay:0.2s]" />
            <span className="w-2 h-2 bg-brown-light/30 rounded-full animate-pulse [animation-delay:0.4s]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5 items-end">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nude to-beige flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-brown" />
      </div>
      <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm max-w-[80%]">
        <p className="text-sm text-brown leading-relaxed">{text}</p>
        {children}
      </div>
    </motion.div>
  )
}

function UserMessage({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
      <div className="bg-brown text-offwhite rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
        {children}
      </div>
    </motion.div>
  )
}

export default function RecommendationChat({ open, onClose, onSelect: externalOnSelect }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { canGenerate, createVisualization, completeVisualization, uploadBlobUrl } = useCredits()
  const [step, setStep] = useState('welcome')
  const [photo, setPhoto] = useState(null)
  const [outfitPhoto, setOutfitPhoto] = useState(null)
  const [outfitSkipped, setOutfitSkipped] = useState(false)
  const [occasion, setOccasion] = useState(null)
  const [recos, setRecos] = useState([])
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState(null)
  const chatEndRef = useRef(null)
  const fileRef = useRef(null)
  const cameraRef = useRef(null)
  const outfitFileRef = useRef(null)
  const outfitCameraRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [step, photo, outfitPhoto, outfitSkipped, occasion])

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = function () {
      setPhoto(reader.result)
      setTimeout(() => setStep('outfit'), 800)
    }
    reader.readAsDataURL(file)
  }

  const handleOutfitFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = function () {
      setOutfitPhoto(reader.result)
      setTimeout(() => setStep('occasion'), 800)
    }
    reader.readAsDataURL(file)
  }

  const skipOutfit = () => {
    setOutfitSkipped(true)
    setTimeout(() => setStep('occasion'), 300)
  }

  const handleOccasion = (key) => {
    setOccasion(key)
    setRecos(recommendations[key] || recommendations.other)
    setTimeout(() => setStep('results'), 600)
  }

  const handleEmmaGenerate = async () => {
    if (!photo || !occasion) return
    if (!canGenerate()) {
      onClose()
      navigate(ROUTES.dashboardPurchase)
      return
    }

    setGenerating(true)
    setGenerationError(null)

    try {
      let vizId = null
      const originalImageUrl = await uploadBlobUrl(photo)
      const vizResult = await createVisualization({
        shape: 'oval',
        style: 'nailart',
        length: 'medium',
        originalImageUrl,
      })
      vizId = vizResult?.visualization_id

      const result = await generateNailVisualization({
        photo,
        mode: 'emma',
        occasion,
        occasionLabel: t(`emma.occasions.${occasion}`),
        outfitPhoto,
      }, vizId)

      if (vizId && result.resultImage) {
        await completeVisualization(vizId, result.resultImage)
        result.id = vizId
      }

      onClose()
      navigate(ROUTES.result, { state: { result, locked: false } })
    } catch (err) {
      setGenerationError(err.message || t('common.error'))
      setGenerating(false)
    }
  }

  const handleSelectReco = (reco) => {
    onClose()
    if (externalOnSelect) {
      externalOnSelect({ ...reco, photo, outfitPhoto })
    } else {
      navigate(ROUTES.welcome, {
        state: {
          preselectedShape: reco.shape,
          preselectedStyle: reco.style,
          preselectedLength: reco.length,
          photo,
          outfitPhoto,
        },
      })
    }
  }

  const reset = () => {
    setStep('welcome')
    setPhoto(null)
    setOutfitPhoto(null)
    setOutfitSkipped(false)
    setOccasion(null)
    setRecos([])
    setGenerating(false)
    setGenerationError(null)
  }

  if (!open) return null

  if (generating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-offwhite"
      >
        <Processing messages={[
          'Emma analyse ton occasion...',
          'Création de ton design sur mesure...',
          'Presque prêt...',
        ]}
        />
      </motion.div>
    )
  }

  const occasionLabel = occasion ? t(`emma.occasions.${occasion}`) : ''

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-offwhite w-full max-w-md md:rounded-3xl rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-nude/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-nude to-beige flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-brown" />
            </div>
            <div>
              <p className="font-heading text-base font-semibold text-brown">Emma</p>
              <p className="text-[10px] text-green-500 font-medium">Online</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-nude/30 transition-colors">
            <X className="w-5 h-5 text-brown-light" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          <BotMessage text={t('dashboard.emmaChat.welcome')} />

          {step === 'welcome' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex gap-2 pl-10">
              <button onClick={() => cameraRef.current?.click()} className="flex items-center gap-2 bg-brown text-offwhite px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-brown-light transition-colors">
                <Camera className="w-4 h-4" />{t('dashboard.emmaChat.photoCamera')}
              </button>
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 bg-nude text-brown px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-nude-dark transition-colors">
                <Upload className="w-4 h-4" />{t('dashboard.emmaChat.photoGallery')}
              </button>
            </motion.div>
          )}

          {photo && (
            <UserMessage>
              <img src={photo} alt="hand" className="w-40 h-40 object-cover rounded-xl" />
            </UserMessage>
          )}

          {(step === 'outfit' || step === 'occasion' || step === 'results') && (
            <BotMessage text={t('dashboard.emmaChat.outfitQuestion')} delay={step === 'outfit' ? 500 : 0} />
          )}

          {step === 'outfit' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="pl-10 flex flex-wrap gap-2">
              <button onClick={() => outfitCameraRef.current?.click()} className="flex items-center gap-2 bg-brown text-offwhite px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-brown-light transition-colors">
                <Shirt className="w-4 h-4" />{t('dashboard.emmaChat.outfitCamera')}
              </button>
              <button onClick={() => outfitFileRef.current?.click()} className="flex items-center gap-2 bg-nude text-brown px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-nude-dark transition-colors">
                <Upload className="w-4 h-4" />{t('dashboard.emmaChat.photoGallery')}
              </button>
              <button onClick={skipOutfit} className="flex items-center gap-2 bg-white border border-nude/40 text-brown-light/60 px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-nude/10 transition-colors">
                {t('dashboard.emmaChat.outfitSkip')}
              </button>
            </motion.div>
          )}

          {outfitPhoto && (
            <UserMessage>
              <img src={outfitPhoto} alt="outfit" className="w-40 h-40 object-cover rounded-xl" />
            </UserMessage>
          )}
          {!outfitPhoto && outfitSkipped && (
            <UserMessage>
              <p className="text-sm opacity-70 italic">{t('dashboard.emmaChat.outfitSkipped')}</p>
            </UserMessage>
          )}

          {(step === 'occasion' || step === 'results') && (
            <BotMessage
              text={outfitPhoto ? t('dashboard.emmaChat.occasionQuestion_outfit') : t('dashboard.emmaChat.occasionQuestion_no_outfit')}
              delay={step === 'occasion' ? 500 : 0}
            />
          )}

          {step === 'occasion' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="pl-10 flex flex-wrap gap-2">
              {occasionKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => handleOccasion(key)}
                  className="flex items-center gap-1.5 bg-white border border-nude/40 text-brown px-3.5 py-2 rounded-full text-sm font-medium hover:bg-nude/20 hover:border-nude-dark/30 transition-all"
                >
                  <span>{occasionIcons[key]}</span>
                  <span>{t(`emma.occasions.${key}`)}</span>
                </button>
              ))}
            </motion.div>
          )}

          {occasion && (
            <UserMessage>
              <p className="text-sm">{occasionIcons[occasion]} {occasionLabel}</p>
            </UserMessage>
          )}

          {step === 'results' && (
            <>
              <BotMessage
                text={t('dashboard.emmaChat.resultsIntro', {
                  occasion: occasionLabel,
                  outfitSuffix: outfitPhoto ? t('dashboard.emmaChat.resultsSuffix_outfit') : '',
                })}
                delay={400}
              />
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="pl-10">
                <button
                  onClick={handleEmmaGenerate}
                  className="w-full flex items-center justify-center gap-2 bg-brown text-offwhite px-5 py-3.5 rounded-2xl text-sm font-semibold hover:bg-brown-light transition-colors mb-4"
                >
                  <Wand2 className="w-4 h-4" />
                  {t('dashboard.emmaChat.generateCta', { occasion: occasionLabel })}
                </button>
                {generationError && (
                  <p className="text-xs text-red-500 text-center mb-3">{generationError}</p>
                )}
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="pl-10 space-y-2.5">
                {recos.map((reco, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.4 + i * 0.15 }}
                    onClick={() => handleSelectReco(reco)}
                    className="w-full bg-white rounded-2xl p-4 text-left border border-nude/30 hover:border-beige-dark/30 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-heading font-semibold text-brown text-sm">{reco.name}</span>
                      <ChevronRight className="w-4 h-4 text-brown-light/30 group-hover:text-beige-dark transition-colors" />
                    </div>
                    <p className="text-xs text-brown-light/60 leading-relaxed">{reco.desc}</p>
                    <div className="flex gap-2 mt-2.5">
                      <span className="text-[10px] bg-nude/30 text-brown-light px-2 py-0.5 rounded-full capitalize">{reco.shape}</span>
                      <span className="text-[10px] bg-beige/30 text-brown-light px-2 py-0.5 rounded-full capitalize">{reco.style}</span>
                      <span className="text-[10px] bg-nude-light text-brown-light px-2 py-0.5 rounded-full capitalize">{reco.length}</span>
                    </div>
                  </motion.button>
                ))}
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }} onClick={reset} className="w-full text-center text-xs text-brown-light/50 hover:text-brown py-2 transition-colors">
                  {t('dashboard.emmaChat.restart')}
                </motion.button>
              </motion.div>
            </>
          )}

          <div ref={chatEndRef} />
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
        <input ref={outfitFileRef} type="file" accept="image/*" onChange={handleOutfitFile} className="hidden" />
        <input ref={outfitCameraRef} type="file" accept="image/*" capture="environment" onChange={handleOutfitFile} className="hidden" />
      </motion.div>
    </motion.div>
  )
}
