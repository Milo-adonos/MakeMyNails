import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Share2, RotateCcw, ArrowLeft, Lock, Eye, Mail, User, KeyRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCredits } from '../contexts/CreditContext'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/common/Button'
import { optimizeImageUrl } from '../lib/supabase'
import { getOriginalDisplayUrl } from '../lib/originalImage'
import { saveImageToGallery } from '../lib/saveImage'
import { ROUTES } from '../lib/routes'

export default function Result() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { history, addToHistory } = useCredits()
  const { isAuthenticated, signup, login } = useAuth()

  const result = location.state?.result || history.find((h) => h.id === id)
  const isLocked = location.state?.locked && !isAuthenticated

  const [locked, setLocked] = useState(isLocked)
  const [showSignup, setShowSignup] = useState(false)
  const [isLogin, setIsLogin] = useState(false)
  const [revealing, setRevealing] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [beforeLoaded, setBeforeLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (isAuthenticated && locked) {
      setRevealing(true)
      setShowSignup(false)
      const timer = setTimeout(() => {
        setLocked(false)
        setRevealing(false)
        if (result) addToHistory(result)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated])

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center py-20">
          <p className="text-brown-light/60">{t('result.notFound')}</p>
          <Button onClick={() => navigate(ROUTES.landing)} className="mt-4">
            {t('result.backHome')}
          </Button>
        </div>
      </div>
    )
  }

  const originalImg = getOriginalDisplayUrl(result)
  const resultImg = result.result_image_url || result.resultImage

  const handleSave = async () => {
    if (!resultImg) return
    setSaving(true)
    setSaveError('')
    try {
      await saveImageToGallery(resultImg, `makemynails-${result.id}.jpg`)
    } catch {
      setSaveError(t('result.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MakeMyNails',
          text: t('result.ready'),
          url: window.location.href,
        })
      } catch {}
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (isLogin) {
        await login(formData.email, formData.password)
      } else {
        await signup(formData.email, formData.password, formData.name)
      }
    } catch (err) {
      setError(err.message || t('result.error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (locked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-offwhite to-nude-light/20">
        <div className="max-w-lg mx-auto px-4 py-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 pt-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mx-auto mb-3"
            >
              <img src="/logo.webp" alt="MakeMyNails" className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-nude-dark/20 mx-auto" />
            </motion.div>
            <h1 className="font-heading text-2xl font-bold text-brown mb-1">{t('result.ready')}</h1>
            <p className="text-brown-light/60 text-xs">{t('result.preview')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-2.5 mb-6"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-md aspect-[3/4] bg-nude/20">
              {originalImg ? (
                <>
                  {!beforeLoaded && <div className="absolute inset-0 animate-pulse bg-nude/40" />}
                  <img
                    src={originalImg}
                    onLoad={() => setBeforeLoaded(true)}
                    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', opacity: beforeLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
                  />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center font-heading text-xl text-brown-light/30">{t('result.before')}</div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">{t('result.before')}</div>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-md aspect-[3/4]">
              {resultImg ? (
                <img
                  src={resultImg}
                  style={{
                    display: 'block', width: '100%', height: '100%', objectFit: 'cover',
                    filter: revealing ? 'blur(0px)' : 'blur(20px)',
                    transform: 'scale(1.1)',
                    transition: 'filter 1s ease-out',
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-beige/20 font-heading text-xl text-brown-light/30">{t('result.after')}</div>
              )}
              {!revealing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-brown/10 backdrop-blur-[2px]">
                  <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center mb-2 shadow-lg">
                    <Lock className="w-5 h-5 text-brown" />
                  </div>
                  <span className="text-xs font-semibold text-brown bg-white/70 px-3 py-1 rounded-full">{t('result.locked')}</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">{t('result.after')}</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl p-5 shadow-sm shadow-brown/5 mb-6"
          >
            <h3 className="font-heading text-base font-semibold text-brown mb-3">{t('result.yourLook')}</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-nude/20 rounded-2xl p-3">
                <p className="text-[10px] text-brown-light/50 mb-0.5">{t('result.shape')}</p>
                <p className="text-sm font-medium text-brown capitalize">{result.shape}</p>
              </div>
              <div className="bg-nude/20 rounded-2xl p-3">
                <p className="text-[10px] text-brown-light/50 mb-0.5">{t('result.style')}</p>
                <p className="text-sm font-medium text-brown capitalize">{result.style}</p>
              </div>
              <div className="bg-nude/20 rounded-2xl p-3">
                <p className="text-[10px] text-brown-light/50 mb-0.5">{t('result.length')}</p>
                <p className="text-sm font-medium text-brown capitalize">{result.length}</p>
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {!showSignup ? (
              <motion.div key="cta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: 0.5 }}>
                <button
                  onClick={() => setShowSignup(true)}
                  className="w-full bg-brown text-offwhite py-4 rounded-2xl font-semibold text-base hover:bg-brown-light transition-colors flex items-center justify-center gap-2.5 shadow-lg shadow-brown/20"
                >
                  <Eye className="w-5 h-5" />
                  {t('result.seeResult')}
                </button>
                <p className="text-center text-xs text-brown-light/40 mt-3">{t('result.free')}</p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-3xl p-6 shadow-sm shadow-brown/5">
                <div className="text-center mb-5">
                  <h3 className="font-heading text-xl font-bold text-brown mb-1">
                    {isLogin ? t('result.welcome_back') : t('result.createAccount')}
                  </h3>
                  <p className="text-xs text-brown-light/50">
                    {isLogin ? t('result.loginSubtitle') : t('result.signupSubtitle')}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {!isLogin && (
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-light/40" />
                      <input
                        type="text"
                        placeholder={t('result.firstName')}
                        value={formData.name}
                        onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                        className="w-full pl-11 pr-4 py-3.5 bg-nude/20 rounded-2xl text-sm text-brown placeholder:text-brown-light/40 outline-none focus:ring-2 focus:ring-nude-dark/30 transition-shadow"
                      />
                    </div>
                  )}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-light/40" />
                    <input
                      type="email"
                      placeholder={t('result.email')}
                      required
                      value={formData.email}
                      onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                      className="w-full pl-11 pr-4 py-3.5 bg-nude/20 rounded-2xl text-sm text-brown placeholder:text-brown-light/40 outline-none focus:ring-2 focus:ring-nude-dark/30 transition-shadow"
                    />
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-light/40" />
                    <input
                      type="password"
                      placeholder={t('result.password')}
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData((d) => ({ ...d, password: e.target.value }))}
                      className="w-full pl-11 pr-4 py-3.5 bg-nude/20 rounded-2xl text-sm text-brown placeholder:text-brown-light/40 outline-none focus:ring-2 focus:ring-nude-dark/30 transition-shadow"
                    />
                  </div>
                  {error && <p className="text-xs text-red-500 text-center bg-red-50 rounded-xl py-2">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-brown text-offwhite py-3.5 rounded-2xl font-semibold text-sm hover:bg-brown-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-offwhite/30 border-t-offwhite rounded-full" />
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        {isLogin ? t('result.login') : t('result.signup')}
                      </>
                    )}
                  </button>
                </form>

                <button onClick={() => { setIsLogin(!isLogin); setError('') }} className="w-full text-center text-xs text-brown-light/50 mt-4 hover:text-brown transition-colors">
                  {isLogin ? t('result.noAccount') : t('result.alreadyAccount')}
                </button>
                <button onClick={() => setShowSignup(false)} className="w-full text-center text-xs text-brown-light/30 mt-2 hover:text-brown-light/50 transition-colors">
                  {t('result.cancel')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell bg-gradient-to-b from-offwhite to-nude-light/20 px-4">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate(ROUTES.dashboard)} className="flex items-center gap-2 text-brown-light/60 hover:text-brown transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t('result.back')}</span>
        </button>

        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-3xl font-bold text-brown mb-6">
          {t('result.yourResult')}
        </motion.h1>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-2 gap-2.5 mb-6">
          <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-nude/20">
            {originalImg ? (
              <>
                {!beforeLoaded && <div className="absolute inset-0 animate-pulse bg-nude/40" />}
                <img
                  src={originalImg}
                  onLoad={() => setBeforeLoaded(true)}
                  style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', opacity: beforeLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center font-heading text-xl text-brown-light/30">{t('result.before')}</div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">{t('result.before')}</div>
          </div>
          <div className="relative rounded-2xl overflow-hidden aspect-[3/4]">
            {resultImg ? (
              <motion.img
                src={resultImg}
                style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                initial={revealing ? { filter: 'blur(20px)', scale: 1.1 } : {}}
                animate={{ filter: 'blur(0px)', scale: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-beige/20 font-heading text-xl text-brown-light/30">{t('result.after')}</div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">{t('result.after')}</div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-6 shadow-sm shadow-brown/5 mb-6">
          <h3 className="font-heading text-lg font-semibold text-brown mb-3">{t('result.lookDetails')}</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-nude/20 rounded-2xl p-3">
              <p className="text-xs text-brown-light/50 mb-1">{t('result.shape')}</p>
              <p className="text-sm font-medium text-brown capitalize">{result.shape}</p>
            </div>
            <div className="bg-nude/20 rounded-2xl p-3">
              <p className="text-xs text-brown-light/50 mb-1">{t('result.style')}</p>
              <p className="text-sm font-medium text-brown capitalize">{result.style}</p>
            </div>
            <div className="bg-nude/20 rounded-2xl p-3">
              <p className="text-xs text-brown-light/50 mb-1">{t('result.length')}</p>
              <p className="text-sm font-medium text-brown capitalize">{result.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-white rounded-2xl p-4 shadow-sm shadow-brown/5 hover:shadow-md transition-shadow disabled:opacity-50"
            >
              <Download className="w-5 h-5 text-brown-light" />
              <span className="text-sm font-medium text-brown">
                {saving ? '...' : t('result.save')}
              </span>
            </button>
            <button onClick={handleShare} className="flex items-center justify-center gap-2 bg-white rounded-2xl p-4 shadow-sm shadow-brown/5 hover:shadow-md transition-shadow">
              <Share2 className="w-5 h-5 text-brown-light" />
              <span className="text-sm font-medium text-brown">{t('result.share')}</span>
            </button>
          </div>
          {saveError && <p className="text-xs text-red-500 text-center">{saveError}</p>}

          <Button onClick={() => navigate(isAuthenticated ? ROUTES.dashboard : ROUTES.welcome)} className="w-full flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" />
            {t('result.tryAnother')}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
