import { motion } from 'framer-motion'
import { Camera, Palette, Wand2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LANDING_VIEWPORT } from '../../lib/motion'

const icons = [Camera, Palette, Wand2]
const colors = ['bg-nude/30', 'bg-beige/30', 'bg-nude-light/50']
const iconColors = ['text-nude-dark', 'text-beige-dark', 'text-brown-medium']

export default function Steps() {
  const { t } = useTranslation()
  const steps = t('steps.items', { returnObjects: true })

  return (
    <section id="steps" className="py-24 px-4 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={LANDING_VIEWPORT}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-brown mb-4">
            {t('steps.title')}
          </h2>
          <p className="text-brown-light/70 text-lg max-w-md mx-auto">
            {t('steps.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => {
            const Icon = icons[i]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={LANDING_VIEWPORT}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="bg-white rounded-3xl p-8 shadow-sm shadow-brown/5 h-full">
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-14 h-14 ${colors[i]} rounded-2xl flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${iconColors[i]}`} />
                    </div>
                    <span className="font-heading text-5xl font-bold text-nude/60">{i + 1}</span>
                  </div>
                  <h3 className="font-heading text-2xl font-semibold text-brown mb-3">{step.title}</h3>
                  <p className="text-brown-light/70 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
