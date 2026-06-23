import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sparkles, CalendarHeart, Shirt, Crown, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LANDING_VIEWPORT } from '../../lib/motion'
import { ROUTES } from '../../lib/routes'
import { trackEvent } from '../../lib/radar'

const featureIcons = [CalendarHeart, Shirt, Sparkles]
const featureColors = ['bg-nude/30', 'bg-beige/30', 'bg-nude-light/50']
const featureIconColors = ['text-nude-dark', 'text-beige-dark', 'text-brown-medium']

const exampleOccasions = [
  { icon: '💍' },
  { icon: '🥂' },
  { icon: '💼' },
  { icon: '🌴' },
  { icon: '🌹' },
  { icon: '☀️' },
]

export default function EmmaSection() {
  const { t } = useTranslation()
  const features = t('emma.features', { returnObjects: true })
  const occasionKeys = ['wedding', 'party', 'work', 'vacation', 'date', 'everyday']

  return (
    <section id="emma" className="py-24 px-4 bg-gradient-to-b from-nude-light/20 to-offwhite overflow-hidden scroll-mt-20">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={LANDING_VIEWPORT}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-nude/60 to-beige/60 border border-nude-dark/20 px-4 py-2 rounded-full mb-6">
            <Crown className="w-3.5 h-3.5 text-brown-light" />
            <span className="text-xs font-semibold text-brown-light uppercase tracking-wider">{t('emma.badge')}</span>
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-brown mb-4">
            {t('emma.title')}<br />
            <span className="italic text-brown-medium">{t('emma.titleItalic')}</span>
          </h2>
          <p className="text-brown-light/70 text-lg max-w-lg mx-auto leading-relaxed">
            {t('emma.subtitle')}
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {features.map((f, i) => {
            const Icon = featureIcons[i]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={LANDING_VIEWPORT}
                transition={{ delay: i * 0.12 }}
                className="bg-white rounded-3xl p-7 shadow-sm shadow-brown/5"
              >
                <div className={`w-12 h-12 ${featureColors[i]} rounded-2xl flex items-center justify-center mb-5`}>
                  <Icon className={`w-5 h-5 ${featureIconColors[i]}`} />
                </div>
                <h3 className="font-heading text-xl font-semibold text-brown mb-3">{f.title}</h3>
                <p className="text-brown-light/70 text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Chat mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={LANDING_VIEWPORT}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-sm shadow-brown/5 overflow-hidden max-w-md mx-auto mb-16"
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-nude/20 bg-offwhite/60">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-nude to-beige flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brown" />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-brown">Emma</p>
              <p className="text-[10px] text-green-500 font-medium">Online</p>
            </div>
          </div>

          <div className="px-4 py-5 space-y-3 bg-offwhite/30">
            <div className="flex gap-2.5 items-end">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-nude to-beige flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-brown" />
              </div>
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm max-w-[80%]">
                <p className="text-sm text-brown leading-relaxed">{t('emma.chatBotHi')}</p>
              </div>
            </div>

            <div className="pl-9 flex flex-wrap gap-1.5">
              {exampleOccasions.map((occ, i) => (
                <span key={i} className="flex items-center gap-1 bg-white border border-nude/40 text-brown px-3 py-1.5 rounded-full text-xs font-medium">
                  {occ.icon} {t(`emma.occasions.${occasionKeys[i]}`)}
                </span>
              ))}
            </div>

            <div className="flex justify-end">
              <div className="bg-brown text-offwhite rounded-2xl rounded-br-md px-4 py-2.5">
                <p className="text-sm">{t('emma.chatUserPicks')}</p>
              </div>
            </div>

            <div className="flex gap-2.5 items-end">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-nude to-beige flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-brown" />
              </div>
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm max-w-[80%]">
                <p className="text-sm text-brown leading-relaxed">{t('emma.chatBotResponse')}</p>
              </div>
            </div>

            <div className="pl-9 space-y-2">
              {[
                { name: 'Chrome Party', tags: ['Coffin', 'Chrome', 'Long'] },
                { name: 'Nail Art Festif', tags: ['Stiletto', 'Nail Art', 'Long'] },
              ].map((r, i) => (
                <div key={i} className="bg-white rounded-2xl p-3 border border-nude/30 shadow-sm">
                  <p className="font-heading text-sm font-semibold text-brown mb-1.5">{r.name}</p>
                  <div className="flex gap-1.5">
                    {r.tags.map((tag) => (
                      <span key={tag} className="text-[10px] bg-nude/30 text-brown-light px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={LANDING_VIEWPORT}
          className="text-center"
        >
          <Link
            to={`${ROUTES.login}?mode=signup`}
            onClick={() => trackEvent('cta_click', { placement: 'emma', label: 'signup' })}
            className="inline-flex items-center gap-2 bg-brown text-offwhite px-8 py-4 rounded-2xl font-semibold text-base hover:bg-brown-light transition-colors shadow-lg shadow-brown/20"
          >
            <Crown className="w-4 h-4" />
            {t('emma.cta')}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-brown-light/50 mt-3">{t('emma.ctaNote')}</p>
        </motion.div>

      </div>
    </section>
  )
}
