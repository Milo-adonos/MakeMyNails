import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, RotateCcw } from 'lucide-react'
import Welcome from '../components/onboarding/Welcome'
import PhotoCapture from '../components/onboarding/PhotoCapture'
import InspirationCapture from '../components/onboarding/InspirationCapture'
import ShapeSelector from '../components/onboarding/ShapeSelector'
import StyleSelector from '../components/onboarding/StyleSelector'
import LengthSelector from '../components/onboarding/LengthSelector'
import Processing from '../components/onboarding/Processing'
import BlurredResult from '../components/onboarding/BlurredResult'
import FunnelSignup from '../components/onboarding/FunnelSignup'
import FunnelPricing from '../components/onboarding/FunnelPricing'
import FunnelCheckout from '../components/onboarding/FunnelCheckout'
import { generateNailVisualization } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useCredits } from '../contexts/CreditContext'
import { persistFunnelResult, getFunnelResult, persistFunnelStep, getFunnelStep } from '../lib/funnelSession'
import { createBlurredPreview } from '../lib/previewImage'

const INSPO_DEFAULTS = { shape: 'oval', style: 'nailart', length: 'medium' }

function buildGenPayload(data, overrides = {}) {
  const hasInspo = !!data.inspirationPhoto
  return {
    photo: data.photo,
    mode: hasInspo ? 'inspiration' : 'onboarding',
    shape: data.shape,
    style: data.style,
    length: data.length,
    customNote: data.customNote,
    inspirationPhoto: data.inspirationPhoto,
    outfitPhoto: data.outfitPhoto,
    ...overrides,
  }
}

export default function Onboarding() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { createVisualization, completeVisualization, uploadBlobUrl, isSubscribed } = useCredits()
  const generationRef = useRef(null)
  const preselectHandled = useRef(false)

  const [step, setStep] = useState(() => {
    if (typeof window === 'undefined') return 'welcome'
    const path = window.location.pathname
    if (path === '/onboarding/pricing') return 'pricing'
    if (path === '/onboarding/signup') return 'signup'
    if (path === '/onboarding/checkout') return 'checkout'
    return getFunnelStep() || 'welcome'
  })
  const [result, setResult] = useState(null)
  const [generationError, setGenerationError] = useState(null)
  const [skipStyleSteps, setSkipStyleSteps] = useState(false)

  const [data, setData] = useState({
    photo: null,
    shape: null,
    style: null,
    length: null,
    customNote: '',
    inspirationPhoto: null,
    outfitPhoto: null,
  })

  useEffect(() => {
    if (location.pathname === '/onboarding/pricing') {
      setStep('pricing')
    } else if (location.pathname === '/onboarding/signup') {
      setStep('signup')
    } else if (location.pathname === '/onboarding/checkout') {
      setStep('checkout')
    }
  }, [location.pathname])

  useEffect(() => {
    const saved = getFunnelResult()
    if (saved && !result) {
      setResult(saved)
      const savedStep = getFunnelStep()
      if (savedStep === 'result' || savedStep === 'pricing' || savedStep === 'signup') {
        setStep(savedStep)
      } else {
        setStep('result')
        persistFunnelStep('result')
      }
    }
  }, [])

  useEffect(() => {
    if (result) persistFunnelResult(result)
  }, [result])

  const goTo = (nextStep) => {
    setStep(nextStep)
    if (['result', 'pricing', 'signup', 'checkout', 'processing'].includes(nextStep)) {
      persistFunnelStep(nextStep)
    }
  }

  const runGeneration = useCallback(async (genData) => {
    let vizId = null
    if (isAuthenticated && isSubscribed) {
      const originalImageUrl = await uploadBlobUrl(genData.photo)
      const vizResult = await createVisualization({
        shape: genData.shape,
        style: genData.style,
        length: genData.length,
        originalImageUrl,
      })
      vizId = vizResult?.visualization_id
    }

    const generated = await generateNailVisualization(genData, vizId)

    if (generated.resultImage) {
      const previewImage = await createBlurredPreview(generated.resultImage)
      if (previewImage) generated.previewImage = previewImage
    }

    if (isAuthenticated && isSubscribed && vizId && generated.resultImage) {
      await completeVisualization(vizId, generated.resultImage)
    }

    return generated
  }, [isAuthenticated, isSubscribed, createVisualization, completeVisualization, uploadBlobUrl])

  const enterProcessing = useCallback((genData) => {
    if (!genData.photo) {
      goTo('photo')
      return
    }
    generationRef.current = runGeneration(genData)
      .then((res) => {
        setResult(res)
        return res
      })
      .catch((err) => {
        setGenerationError(err.message || 'Une erreur est survenue.')
        throw err
      })
    goTo('processing')
  }, [runGeneration])

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
  }, [location.state, enterProcessing])

  useEffect(() => {
    if (step !== 'processing' || !generationRef.current) return

    let cancelled = false

    generationRef.current
      .then((res) => {
        if (!cancelled && res) goTo('result')
      })
      .catch(() => {
        if (!cancelled) generationRef.current = null
      })

    return () => { cancelled = true }
  }, [step])

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

  const handleUnlock = () => {
    if (isAuthenticated && isSubscribed) {
      navigate('/app', { state: { result, unlocked: true } })
      return
    }
    goTo('pricing')
    navigate('/onboarding/pricing', { replace: true })
  }

  const goToSignup = () => {
    goTo('signup')
    navigate('/onboarding/signup')
  }

  const goToCheckout = () => {
    goTo('checkout')
    navigate('/onboarding/checkout')
  }

  const showProgress = ['photo', 'inspiration', 'shape', 'style', 'length'].includes(step)
  const progressSteps = skipStyleSteps
    ? ['photo', 'inspiration']
    : ['photo', 'inspiration', 'shape', 'style', 'length']
  const progressPercent = showProgress
    ? ((progressSteps.indexOf(step) + 1) / progressSteps.length) * 100
    : 0

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
              generationRef.current = null
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
        return (
          <PhotoCapture
            onNext={(photo) => {
              if (photo) setData((d) => ({ ...d, photo }))
              goTo('inspiration')
            }}
            onBack={() => goTo('welcome')}
            onPhotoSelect={(photo) => setData((d) => ({ ...d, photo }))}
          />
        )
      case 'inspiration':
        return (
          <InspirationCapture
            onNext={handleInspirationNext}
            onSkip={handleInspirationSkip}
            onBack={() => goTo('photo')}
            onInspirationSelect={(inspirationPhoto) => setData((d) => ({ ...d, inspirationPhoto }))}
          />
        )
      case 'shape':
        return (
          <ShapeSelector
            onNext={() => goTo('style')}
            onBack={() => goTo('inspiration')}
            selected={data.shape}
            onSelect={(shape) => setData((d) => ({ ...d, shape }))}
          />
        )
      case 'style':
        return (
          <StyleSelector
            onNext={() => goTo('length')}
            onBack={() => goTo('shape')}
            selected={data.style}
            onSelect={(style) => setData((d) => ({ ...d, style, inspirationPhoto: style !== 'nailart' ? null : d.inspirationPhoto }))}
            customNote={data.customNote}
            onCustomNote={(customNote) => setData((d) => ({ ...d, customNote }))}
            inspirationPhoto={data.inspirationPhoto}
            onInspirationPhoto={(inspirationPhoto) => setData((d) => ({ ...d, inspirationPhoto }))}
          />
        )
      case 'length':
        return (
          <LengthSelector
            onNext={handleLengthNext}
            onBack={() => goTo('style')}
            selected={data.length}
            onSelect={(length) => setData((d) => ({ ...d, length }))}
          />
        )
      case 'processing':
        return <Processing />
      case 'result':
        return <BlurredResult result={result} onUnlock={handleUnlock} />
      case 'signup':
        return <FunnelSignup onCheckout={goToCheckout} />
      case 'pricing':
        return <FunnelPricing onGoSignup={goToSignup} />
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
