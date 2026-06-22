import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import Button from '../common/Button'

const lengthIds = ['short', 'medium', 'long']

export default function LengthSelector({ onNext, onBack, selected, onSelect }) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 bg-gradient-to-b from-offwhite to-nude-light/30">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="font-heading text-3xl font-bold text-brown mb-3">
            {t('onboarding.length.title')}
          </h2>
          <p className="text-brown-light/70">
            {t('onboarding.length.subtitle')}
          </p>
        </motion.div>

        <div className="flex flex-col gap-3 w-full mb-8">
          {lengthIds.map((id, i) => (
            <motion.button
              key={id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelect(id)}
              className={`p-6 rounded-2xl flex items-center gap-4 transition-all duration-200 ${selected === id ? 'bg-brown text-offwhite shadow-lg shadow-brown/20' : 'bg-white shadow-sm shadow-brown/5 hover:shadow-md'}`}
            >
              <div className="text-left">
                <span className={`font-medium block ${selected === id ? 'text-offwhite' : 'text-brown'}`}>
                  {t(`onboarding.length.items.${id}.name`)}
                </span>
                <span className={`text-sm ${selected === id ? 'text-offwhite/60' : 'text-brown-light/50'}`}>
                  {t(`onboarding.length.items.${id}.desc`)}
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="flex gap-3 w-full">
          <Button variant="ghost" onClick={onBack} className="flex-1">{t('onboarding.back')}</Button>
          <Button onClick={() => onNext(selected)} disabled={!selected} className="flex-1">{t('onboarding.continue')}</Button>
        </div>
      </div>
    </div>
  )
}
