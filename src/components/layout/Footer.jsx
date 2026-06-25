import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-brown text-offwhite/80">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.webp" alt="MakeMyNails" className="w-8 h-8 rounded-xl object-cover opacity-90" />
              <span className="font-heading text-2xl font-semibold text-offwhite">MakeMyNails</span>
            </div>
            <p className="text-offwhite/60 leading-relaxed max-w-sm">
              {t('footer.tagline')}
            </p>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold text-offwhite mb-4">{t('footer.product')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#pricing" className="hover:text-beige transition-colors">{t('footer.pricing')}</a></li>
              <li><a href="#steps" className="hover:text-beige transition-colors">{t('footer.howItWorks')}</a></li>
              <li><a href="#testimonials" className="hover:text-beige transition-colors">{t('footer.testimonials')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold text-offwhite mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-beige transition-colors">{t('footer.legalNotice')}</a></li>
              <li><a href="#" className="hover:text-beige transition-colors">{t('footer.terms')}</a></li>
              <li><a href="#" className="hover:text-beige transition-colors">{t('footer.privacy')}</a></li>
              <li><a href="#" className="hover:text-beige transition-colors">{t('footer.cookies')}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-offwhite/10 text-center text-sm text-offwhite/40">
          {t('footer.rights')}
        </div>
      </div>
    </footer>
  )
}
