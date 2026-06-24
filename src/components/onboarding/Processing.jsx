import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DEFAULT_MESSAGES = [
  'Analyse de ta main...',
  'Création de ton design...',
  'Finalisation avec l\'IA...',
]

const FACTS = [
  'Les femmes changent de design d\'ongles en moyenne toutes les 3 semaines 💅',
  'Le nail art existe depuis plus de 5000 ans — les Égyptiennes utilisaient du henné 🌿',
  'La couleur de tes ongles peut révéler ta personnalité ✨',
  'Le nude est la couleur d\'ongles la plus demandée en salon 🤍',
  'Les ongles poussent plus vite en été qu\'en hiver ☀️',
  'Emma a déjà aidé des milliers de filles à trouver leurs ongles parfaits 🤖',
  'Envoyer ton design à ta nail artist réduit les erreurs de 90% 📲',
]

export default function Processing({ messages = DEFAULT_MESSAGES, fake = false, hint }) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [factIndex, setFactIndex] = useState(0)

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 2500)
    return () => clearInterval(messageInterval)
  }, [messages])

  useEffect(() => {
    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FACTS.length)
    }, 5000)
    return () => clearInterval(factInterval)
  }, [])

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
            <motion.div
              className="h-full w-1/3 bg-gradient-to-r from-nude-dark to-beige-dark rounded-full"
              animate={{ x: ['-100%', '300%'] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <p className="text-center text-xs text-brown-light/50 mt-4">
            {hint || (fake
              ? 'Préparation de ton aperçu — 8 secondes'
              : 'Génération en cours — environ 15 à 30 secondes')}
          </p>
        </div>

        <div className="w-full max-w-md mt-10">
          <div className="rounded-2xl bg-nude/45 border border-nude-dark/15 px-5 py-4 shadow-sm backdrop-blur-sm">
            <p className="font-heading text-base font-semibold text-brown text-center mb-3">
              Le savais-tu ? 💅
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
                  {FACTS[factIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
