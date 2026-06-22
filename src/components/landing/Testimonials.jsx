import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LANDING_VIEWPORT } from '../../lib/motion'

const ratings = [5, 5, 5, 4]
const avatars = ['/profile-1.webp', '/profile-2.webp', '/profile-3.webp', '/profile-4.webp']

export default function Testimonials() {
  const { t } = useTranslation()
  const items = t('testimonials.items', { returnObjects: true })

  return (
    <section id="testimonials" className="py-24 px-4 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={LANDING_VIEWPORT}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-brown mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-brown-light/70 text-lg max-w-md mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={LANDING_VIEWPORT}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-3xl p-6 shadow-sm shadow-brown/5"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={`w-4 h-4 ${j < ratings[i] ? 'fill-beige text-beige' : 'text-nude/40'}`} />
                ))}
              </div>
              <p className="text-brown-light/80 text-sm leading-relaxed mb-4">"{item.text}"</p>
              <div className="flex items-center gap-3">
                <img
                  src={avatars[i]}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <span className="font-medium text-sm text-brown">{item.name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
