import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DEFAULT_MESSAGES = [
  'Analyse de ta main...',
  'Création de ton design...',
  'Finalisation...',
]

export default function Processing({ duration = 7000, messages = DEFAULT_MESSAGES }) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 2000)

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - start
      setProgress(Math.min(100, (elapsed / duration) * 100))
    }, 50)

    return () => {
      clearInterval(messageInterval)
      clearInterval(progressInterval)
    }
  }, [duration, messages])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-offwhite to-nude-light/30">
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
          <motion.div
            className="h-full bg-gradient-to-r from-nude-dark to-beige-dark rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
