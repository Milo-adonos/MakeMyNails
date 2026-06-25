import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ManicureSelectionSteps from '../funnel/ManicureSelectionSteps'
import { generateNailVisualization } from '../../lib/api'
import { useCredits } from '../../contexts/CreditContext'
import { ROUTES } from '../../lib/routes'
import { trackEvent } from '../../lib/radar'
import {
  buildGenPayload,
  EMPTY_MANICURE_DATA,
  getManicureProgressPercent,
  INSPO_DEFAULTS,
  MANICURE_SELECTION_STEPS,
} from '../../lib/manicureFunnel'

export default function NewVisualizationFlow({ open, onClose }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { canGenerate, createVisualization, completeVisualization, uploadBlobUrl } = useCredits()
  const processingRef = useRef(null)

  const [step, setStep] = useState('photo')
  const [data, setData] = useState(EMPTY_MANICURE_DATA)
  const [skipStyleSteps, setSkipStyleSteps] = useState(false)
  const [generationError, setGenerationError] = useState(null)

  const goTo = useCallback((nextStep) => setStep(nextStep), [])

  const resetFlow = useCallback(() => {
    setStep('photo')
    setData(EMPTY_MANICURE_DATA)
    setSkipStyleSteps(false)
    setGenerationError(null)
    processingRef.current = null
  }, [])

  const handleClose = useCallback(() => {
    resetFlow()
    onClose()
  }, [onClose, resetFlow])

  const startGeneration = useCallback((genData) => {
    if (!genData.photo) {
      goTo('photo')
      return
    }

    if (!canGenerate()) {
      navigate(ROUTES.dashboardPurchase)
      return
    }

    setGenerationError(null)
    goTo('processing')

    processingRef.current = (async () => {
      const originalImageUrl = await uploadBlobUrl(genData.photo)
      const vizResult = await createVisualization({
        shape: genData.shape,
        style: genData.style,
        length: genData.length,
        originalImageUrl,
      })
      const vizId = vizResult?.visualization_id
      const payload = buildGenPayload(genData)
      const result = await generateNailVisualization(payload, vizId)

      if (vizId && result.resultImage) {
        await completeVisualization(vizId, result.resultImage)
      }

      trackEvent('generation_complete', { mode: payload.mode, placement: 'dashboard' })
      return result
    })().catch((err) => {
      setGenerationError(err.message || t('common.generationFailed'))
      processingRef.current = null
      throw err
    })
  }, [canGenerate, createVisualization, completeVisualization, uploadBlobUrl, navigate, goTo])

  const handleInspirationNext = useCallback((inspirationUrl) => {
    if (!inspirationUrl) return
    setSkipStyleSteps(true)
    const genData = buildGenPayload({
      ...data,
      inspirationPhoto: inspirationUrl,
      ...INSPO_DEFAULTS,
    })
    setData((d) => ({ ...d, inspirationPhoto: inspirationUrl, ...INSPO_DEFAULTS }))
    startGeneration(genData)
  }, [data, startGeneration])

  const handleInspirationSkip = useCallback(() => {
    setSkipStyleSteps(false)
    goTo('shape')
  }, [goTo])

  const handleLengthNext = useCallback((length) => {
    const genData = buildGenPayload({ ...data, length: length || data.length })
    if (!genData.shape || !genData.style || !genData.length) return
    startGeneration(genData)
  }, [data, startGeneration])

  useEffect(() => {
    if (step !== 'processing' || !processingRef.current) return

    let cancelled = false

    processingRef.current
      .then((result) => {
        if (cancelled || !result) return
        handleClose()
        navigate(ROUTES.dashboardResult(result.id), { state: { result } })
      })
      .catch(() => {
        if (!cancelled) processingRef.current = null
      })

    return () => { cancelled = true }
  }, [step, navigate, handleClose])

  if (!open) return null

  const showProgress = MANICURE_SELECTION_STEPS.includes(step)
  const progressPercent = getManicureProgressPercent(step, skipStyleSteps)

  if (generationError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-offwhite flex flex-col items-center justify-center px-6"
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-brown mb-3">{t('funnel.error.title')}</h2>
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
            {t('funnel.error.retry')}
          </button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-offwhite overflow-y-auto"
    >
      {showProgress && (
        <div className="fixed top-0 left-0 right-0 z-[71] h-1 bg-nude/30">
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
          <ManicureSelectionSteps
            step={step}
            data={data}
            setData={setData}
            goTo={goTo}
            onPhotoBack={handleClose}
            onInspirationNext={handleInspirationNext}
            onInspirationSkip={handleInspirationSkip}
            onLengthNext={handleLengthNext}
            processingFake={false}
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
