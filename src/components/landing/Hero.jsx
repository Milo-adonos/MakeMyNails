import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from '../common/Button'
import { ROUTES } from '../../lib/routes'

export default function Hero() {
  const { t } = useTranslation()
  const [current, setCurrent] = useState(0)

  const afterImages = [
    '/after-1.webp',
    '/after-2.webp',
    '/after-3.webp',
    '/after-4.webp',
    '/after-5.webp',
    '/after-6.webp',
    '/after-7.webp',
    '/after-8.webp',
    '/after-9.webp',
    '/after-10.webp',
    '/after-11.webp',
    '/after-12.webp',
    '/after-13.webp',
    '/after-14.webp',
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % afterImages.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [afterImages.length])

  return (
    <section className="relative min-h-svh pt-20 pb-16 flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-nude/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-beige/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-nude-light/50 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-nude/50 px-4 py-2 rounded-full mb-6">
              <span className="text-sm font-medium text-brown-light">{t('hero.badge')}</span>
            </div>

            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-brown leading-[1.1] mb-6">
              {t('hero.title')}{' '}
              <span className="italic text-brown-medium">{t('hero.titleItalic')}</span>{' '}
              {t('hero.titleSuffix')}
            </h1>

            <p className="text-lg text-brown-light/80 leading-relaxed mb-8 max-w-md mx-auto md:mx-0">
              {t('hero.subtitle')}
            </p>

            <div className="flex justify-center md:justify-start">
              <Link to={ROUTES.welcome}>
                <Button size="lg" className="flex items-center gap-2">
                  {t('hero.cta')}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 rounded-[2rem] overflow-hidden">
                <div className="grid grid-cols-2 h-full gap-1">
                  <div className="relative">
                    <img
                      src="/before.webp"
                      alt={t('hero.before')}
                      className="w-full h-full object-cover"
                      fetchPriority="high"
                      decoding="async"
                    />
                    <span className="absolute bottom-3 left-0 right-0 text-center text-xs font-medium text-white/80 uppercase tracking-wider drop-shadow">
                      {t('hero.before')}
                    </span>
                  </div>
                  <div className="relative overflow-hidden bg-nude/20">
                    {afterImages.map((src, i) => (
                      <img
                        key={src}
                        src={src}
                        alt={t('hero.after')}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                          i === current ? 'opacity-100' : 'opacity-0'
                        }`}
                        fetchPriority={i === 0 ? 'high' : 'low'}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    ))}
                    <span className="absolute bottom-3 left-0 right-0 text-center text-xs font-medium text-white/80 uppercase tracking-wider drop-shadow z-10">
                      {t('hero.after')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
