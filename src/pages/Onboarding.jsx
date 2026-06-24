import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, RotateCcw } from 'lucide-react'
import Welcome from '../components/onboarding/Welcome'
import ManicureSelectionSteps from '../components/funnel/ManicureSelectionSteps'
import FunnelSignup from '../components/onboarding/FunnelSignup'
import FunnelPricing from '../components/onboarding/FunnelPricing'
import FunnelCheckout from '../components/onboarding/FunnelCheckout'
import { serializeFunnelGenPayload } from '../lib/api'
import {
  persistFunnelStep,
  getFunnelStep,
  persistFunnelGenData,
} from '../lib/funnelSession'
import { FUNNEL_STEP_PATH, funnelStepFromPath } from '../lib/routes'
import {
  buildGenPayload,
  EMPTY_MANICURE_DATA,
  getManicureProgressPercent,
  INSPO_DEFAULTS,
  MANICURE_SELECTION_STEPS,
} from '../lib/manicureFunnel'

export default function Onboarding() {
  const navigate = useNavigate()
  const location = useLocation()
  const processingRef = useRef(null)
  const preselectHandled = useRef(false)
  const restoredRef = useRef(false)

  const [step, setStep] = useState(() => {
    if (typeof window === 'undefined') return 'welcome'
    return funnelStepFromPath(window.location.pathname) || getFunnelStep() || 'welcome'
  })
  const [generationError, setGenerationError] = useState(null)
  const [skipStyleSteps, setSkipStyleSteps] = useState(false)

  const [data, setData] = useState(EMPTY_MANICURE_DATA)

  const goTo = useCallback((nextStep, { replace = false } = {}) => {
    setStep(nextStep)
    const path = FUNNEL_STEP_PATH[nextStep]
    if (path && path !== window.location.pathname) {
      navigate(path, { replace })
    }
    if (['pricing', 'signup', 'checkout', 'processing'].includes(nextStep)) {
      persistFunnelStep(nextStep)
    }
  }, [navigate])

  useEffect(() => {
    const fromPath = funnelStepFromPath(location.pathname)
    if (fromPath) setStep(fromPath)
  }, [location.pathname])

  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true

    const fromPath = funnelStepFromPath(location.pathname)
    if (fromPath === 'pricing' || fromPath === 'signup' || fromPath === 'checkout') return

    const savedStep = getFunnelStep()
    if (!savedStep) return

    const targetStep = savedStep === 'checkout'
      ? 'checkout'
      : ['pricing', 'signup'].includes(savedStep)
        ? savedStep
        : savedStep === 'result'
          ? 'pricing'
          : null

    if (!targetStep) return

    setStep(targetStep)
    persistFunnelStep(targetStep)
    navigate(FUNNEL_STEP_PATH[targetStep], { replace: true })
  }, [location.pathname, navigate])

  const enterProcessing = useCallback((genData) => {
    if (!genData.photo) {
      goTo('photo')
      return
    }

    setGenerationError(null)
    processingRef.current = serializeFunnelGenPayload(genData)
      .then((stored) => {
        persistFunnelGenData(stored)
      })
      .catch((err) => {
        setGenerationError(err.message || 'Une erreur est survenue.')
        processingRef.current = null
        throw err
      })

    goTo('processing')
  }, [goTo])

  const handleProcessingComplete = useCallback(async () => {
    try {
      await processingRef.current
      processingRef.current = null
      goTo('pricing', { replace: true })
    } catch {
      processingRef.current = null
    }
  }, [goTo])

  useEffect(() => {
    if (preselectHandled.current) return
    const s = location.state
    if (!s?.photo) return
    preselectHandled.current = true

    const newData = {
      photo: s.photo,
      shape: s.preselectedShape || null,
      style: s.preselectedStyle || null,
      length: s.preselectedLength || null,
      outfitPhoto: s.outfitPhoto || null,
    }
    setData((d) => ({ ...d, ...newData }))
    window.history.replaceState({}, '')

    if (newData.shape && newData.style && newData.length) {
      enterProcessing(buildGenPayload(newData))
    } else if (newData.photo) {
      goTo('inspiration')
    }
  }, [location.state, enterProcessing, goTo])

  const handleInspirationNext = (inspirationUrl) => {
    if (inspirationUrl) {
      setSkipStyleSteps(true)
      const genData = buildGenPayload({
        ...data,
        inspirationPhoto: inspirationUrl,
        ...INSPO_DEFAULTS,
      })
      setData((d) => ({ ...d, inspirationPhoto: inspirationUrl, ...INSPO_DEFAULTS }))
      enterProcessing(genData)
    }
  }

  const handleInspirationSkip = () => {
    setSkipStyleSteps(false)
    goTo('shape')
  }

  const handleLengthNext = (length) => {
    const genData = buildGenPayload({ ...data, length: length || data.length })
    if (!genData.shape || !genData.style || !genData.length) return
    enterProcessing(genData)
  }

  const showProgress = MANICURE_SELECTION_STEPS.includes(step)
  const progressPercent = getManicureProgressPercent(step, skipStyleSteps)

  if (generationError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-offwhite to-nude-light/30">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-brown mb-3">Oups, une erreur est survenue.</h2>
          <p className="text-red-400/70 text-xs mb-8 font-mono bg-red-50 rounded-xl px-3 py-2">{generationError}</p>
          <button
            onClick={() => {
              setGenerationError(null)
              processingRef.current = null
              goTo(skipStyleSteps ? 'inspiration' : 'length')
            }}
            className="w-full bg-brown text-offwhite py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-brown-light transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Réessayer
          </button>
        </motion.div>
      </div>
    )
  }

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return <Welcome onNext={() => goTo('photo')} />
      case 'photo':
      case 'inspiration':
      case 'shape':
      case 'style':
      case 'length':
      case 'processing':
        return (
          <ManicureSelectionSteps
            step={step}
            data={data}
            setData={setData}
            goTo={goTo}
            onPhotoBack={() => goTo('welcome')}
            onInspirationNext={handleInspirationNext}
            onInspirationSkip={handleInspirationSkip}
            onLengthNext={handleLengthNext}
            processingFake={step === 'processing'}
            onProcessingComplete={handleProcessingComplete}
            processingMessages={[
              'Analyse de ta main...',
              'Création de ton design...',
              'Presque prête...',
            ]}
            processingHint="Préparation de ton aperçu — 8 secondes"
          />
        )
      case 'signup':
        return <FunnelSignup onCheckout={() => goTo('checkout')} />
      case 'pricing':
        return <FunnelPricing onGoSignup={() => goTo('signup')} />
      case 'checkout':
        return <FunnelCheckout />
      default:
        return <Welcome onNext={() => goTo('photo')} />
    }
  }

  return (
    <div className="relative">
      {showProgress && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-nude/30">
          <motion.div
            className="h-full bg-gradient-to-r from-nude-dark to-beige-dark"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
