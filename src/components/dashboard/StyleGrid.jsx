import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../../lib/routes'

const inspirations = [
  {
    id: 1,
    name: 'French Rose',
    style: 'french',
    gradient: 'from-rose-200 via-pink-100 to-white',
    accent: 'bg-rose-300',
  },
  {
    id: 2,
    name: 'Nude Chic',
    style: 'minimalist',
    gradient: 'from-amber-100 via-orange-50 to-yellow-50',
    accent: 'bg-amber-200',
  },
  {
    id: 3,
    name: 'Bordeaux Glam',
    style: 'color',
    gradient: 'from-red-300 via-rose-200 to-red-100',
    accent: 'bg-red-400',
  },
  {
    id: 4,
    name: 'Ocean Blue',
    style: 'gradient',
    gradient: 'from-sky-200 via-blue-100 to-indigo-50',
    accent: 'bg-sky-300',
  },
  {
    id: 5,
    name: 'Forest Green',
    style: 'color',
    gradient: 'from-emerald-200 via-green-100 to-teal-50',
    accent: 'bg-emerald-300',
  },
  {
    id: 6,
    name: 'Lavender Dream',
    style: 'gradient',
    gradient: 'from-violet-200 via-purple-100 to-fuchsia-50',
    accent: 'bg-violet-300',
  },
]

export default function StyleGrid() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleClick = (item) => {
    navigate(ROUTES.welcome, { state: { preselectedStyle: item.style } })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="font-heading text-xl font-semibold text-brown mb-3">{t('styleGrid.title')}</h3>
      <div className="grid grid-cols-3 gap-3">
        {inspirations.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleClick(item)}
            className={`bg-gradient-to-br ${item.gradient} rounded-2xl p-4 text-center relative overflow-hidden group`}
          >
            <div className="flex justify-center gap-1 mb-2.5">
              <div className={`w-3 h-8 rounded-full ${item.accent} opacity-70 -rotate-6`} />
              <div className={`w-3 h-10 rounded-full ${item.accent} opacity-85`} />
              <div className={`w-3 h-9 rounded-full ${item.accent} opacity-70 rotate-6`} />
            </div>
            <span className="text-[11px] font-semibold text-brown-light/80 leading-tight block">
              {item.name}
            </span>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-2xl" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
