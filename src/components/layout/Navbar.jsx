import { Link, useLocation } from 'react-router-dom'
import { User, Home, History, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCredits } from '../../contexts/CreditContext'
import { ROUTES } from '../../lib/routes'

export default function Navbar() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { creditsRemaining, isSubscribed, isUnlimited } = useCredits()
  const location = useLocation()

  const isApp = location.pathname.startsWith(ROUTES.dashboard)

  if (!isApp) return null

  const links = [
    { to: ROUTES.dashboard, icon: Home, label: t('appNav.home') },
    { to: ROUTES.dashboardHistory, icon: History, label: t('appNav.history') },
    { to: ROUTES.dashboardProfile, icon: User, label: t('appNav.profile') },
  ]

  const creditsDisplay = isUnlimited ? '∞' : (isSubscribed ? String(creditsRemaining) : '0')
  const creditsLink = isSubscribed ? ROUTES.dashboardProfile : ROUTES.dashboardPurchase

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={ROUTES.dashboard} className="flex items-center gap-2">
            <img src="/logo.webp" alt="MakeMyNails" className="w-8 h-8 rounded-xl object-cover" />
            <span className="font-heading text-xl font-semibold text-brown">MakeMyNails</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to={creditsLink} className="flex items-center gap-1.5 bg-nude/60 px-3 py-1.5 rounded-full">
              <img src="/logo.webp" alt="" className="w-4 h-4 rounded-md object-cover" />
              <span className="text-sm font-semibold text-brown">{creditsDisplay}</span>
            </Link>

            <button onClick={() => setOpen(!open)} className="p-2 rounded-xl hover:bg-nude/30 transition-colors">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-nude/30 px-4 pb-4">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  location.pathname === link.to ? 'bg-nude/40 text-brown' : 'text-brown-light hover:bg-nude/20'
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-nude/20 md:hidden pb-[env(safe-area-inset-bottom,0px)]">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors ${
                location.pathname === link.to ? 'text-brown' : 'text-brown-light/60'
              }`}
            >
              <link.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
