import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LANDING_VIEWPORT } from '../../lib/motion'

const CONTACT_EMAIL = 'makemynailsapp@gmail.com'

export default function ContactSection() {
  const { t } = useTranslation()

  return (
    <section id="contact" className="py-16 px-4 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={LANDING_VIEWPORT}
          className="max-w-md mx-auto bg-white rounded-3xl p-8 md:p-10 shadow-sm shadow-brown/5 text-center"
        >
          <div className="w-14 h-14 bg-nude/40 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Mail className="w-6 h-6 text-brown-medium" />
          </div>
          <p className="text-xs font-semibold tracking-widest text-brown-light/60 uppercase mb-3">
            {t('contact.heading')}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-heading text-lg md:text-xl font-bold text-brown hover:text-brown-medium transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
        </motion.div>
      </div>
    </section>
  )
}
