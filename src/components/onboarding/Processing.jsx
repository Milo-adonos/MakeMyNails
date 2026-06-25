import { useEffect, useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const FAKE_DURATION_MS = 8000

export default function Processing({
  messages: messagesProp,
  fake = false,
  durationMs = FAKE_DURATION_MS,
  hint,
  onComplete,
}) {
  const { t } = useTranslation()
  const messages = useMemo(
    () => messagesProp || t('funnel.processing.messagesFull', { returnObjects: true }),
    [messagesProp, t],
  )
  const facts = useMemo(
    () => t('funnel.processing.facts', { returnObjects: true }),
    [t],
  )
  const [messageIndex, setMessageIndex] = useState(0)
  const [factIndex, setFactIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const completedRef = useRef(false)

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 2500)
    return () => clearInterval(messageInterval)
  }, [messages])

  useEffect(() => {
    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % facts.length)
    }, 5000)
    return () => clearInterval(factInterval)
  }, [facts.length])

  useEffect(() => {
    if (!fake) return undefined

    const started = performance.now()
    let frameId = 0

    const tick = (now) => {
      const elapsed = now - started
      const next = Math.min(100, (elapsed / durationMs) * 100)
      setProgress(next)

      if (elapsed >= durationMs) {
        setProgress(100)
        if (!completedRef.current) {
          completedRef.current = true
          onComplete?.()
        }
        return
      }

      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [fake, durationMs, onComplete])

  const defaultHint = fake
    ? t('funnel.processing.hintFake')
    : t('funnel.processing.hintReal')

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-offwhite to-nude-light/30">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.h1
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          className="font-heading text-4xl md:text-5xl font-bold text-brown mb-8 text-center tracking-tight"
        >
          MakeMyNails.app
        </motion.h1>

        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="font-heading text-xl text-brown mb-8 text-center min-h-[2rem]"
          >
            {messages[messageIndex]}
          </motion.p>
        </AnimatePresence>

        <div className="w-full max-w-xs">
          <div className="h-1 bg-nude/40 rounded-full overflow-hidden">
            {fake ? (
              <div
                className="h-full bg-gradient-to-r from-nude-dark to-beige-dark rounded-full transition-[width] duration-75 ease-linear"
                style={{ width: `${progress}%` }}
              />
            ) : (
              <motion.div
                className="h-full w-1/3 bg-gradient-to-r from-nude-dark to-beige-dark rounded-full"
                animate={{ x: ['-100%', '300%'] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </div>
          <p className="text-center text-xs text-brown-light/50 mt-4">
            {hint || defaultHint}
          </p>
        </div>

        <div className="w-full max-w-md mt-10">
          <div className="rounded-2xl bg-nude/45 border border-nude-dark/15 px-5 py-4 shadow-sm backdrop-blur-sm">
            <p className="font-heading text-base font-semibold text-brown text-center mb-3">
              {t('funnel.processing.didYouKnow')}
            </p>
            <div className="min-h-[3.25rem] flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={factIndex}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="text-sm text-brown-light/85 text-center leading-relaxed px-1"
                >
                  {facts[factIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
