import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import UploadZone from '../components/dashboard/UploadZone'
import RecommendationCard from '../components/dashboard/RecommendationCard'
import RecommendationChat from '../components/dashboard/RecommendationChat'
import NewVisualizationFlow from '../components/dashboard/NewVisualizationFlow'
import { useCredits } from '../contexts/CreditContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getOriginalDisplayUrl, resolveOriginalImageUrl } from '../lib/originalImage'
import {
  getFunnelResult,
  clearFunnelResult,
  mapVisualizationToResult,
} from '../lib/funnelSession'

function UnlockedDesignCard({ result, onView }) {
  const { t } = useTranslation()
  const resultImg = result?.result_image_url || result?.resultImage
  const originalImg = getOriginalDisplayUrl(result, 400)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-brown/10 border border-nude/30"
    >
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-semibold text-beige-dark uppercase tracking-wide mb-1">
          {t('dashboard.unlockedBadge')}
        </p>
        <h2 className="font-heading text-2xl font-bold text-brown">{t('dashboard.unlockedTitle')}</h2>
      </div>

      <button type="button" onClick={onView} className="block w-full px-5 pb-3">
        <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
          <div className="relative aspect-[3/4] bg-nude/20">
            {originalImg ? (
              <img src={originalImg} alt={t('result.before')} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brown-light/30 text-sm">
                {t('result.before')}
              </div>
            )}
            <span className="absolute bottom-1.5 left-1.5 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full">
              {t('result.before')}
            </span>
          </div>
          <div className="relative aspect-[3/4] bg-nude/20">
            {resultImg && (
              <img src={resultImg} alt={t('result.after')} className="w-full h-full object-cover" />
            )}
            <span className="absolute bottom-1.5 left-1.5 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full">
              {t('result.after')}
            </span>
          </div>
        </div>
      </button>

      <div className="p-5 pt-2">
        <button
          type="button"
          onClick={onView}
          className="w-full bg-brown text-offwhite py-3.5 rounded-2xl font-semibold text-sm hover:bg-brown-light transition-colors"
        >
          {t('dashboard.unlockedCta')}
        </button>
      </div>
    </motion.div>
  )
}

async function persistResultToDb(userId, result, uploadBlobUrl, uploadDataUrl) {
  const resultUrl = result?.result_image_url || result?.resultImage
  if (!userId || !resultUrl) return result

  const originalUrl = await resolveOriginalImageUrl(result, { uploadBlobUrl, uploadDataUrl })

  const withFallback = (row) => {
    const mapped = row?.id ? mapVisualizationToResult(row) : row
    if (!getOriginalDisplayUrl(mapped) && result.originalImageData) {
      return { ...mapped, originalImageData: result.originalImageData }
    }
    return mapped
  }

  const { data: existing } = await supabase
    .from('visualizations')
    .select('id, original_image_url, result_image_url, shape, style, length, created_at')
    .eq('user_id', userId)
    .eq('result_image_url', resultUrl)
    .maybeSingle()

  if (existing) {
    if (!existing.original_image_url && originalUrl) {
      await supabase
        .from('visualizations')
        .update({ original_image_url: originalUrl })
        .eq('id', existing.id)
      return withFallback({ ...existing, original_image_url: originalUrl })
    }
    return withFallback(existing)
  }

  const { data } = await supabase
    .from('visualizations')
    .insert({
      user_id: userId,
      original_image_url: originalUrl,
      result_image_url: resultUrl,
      shape: result.shape || 'oval',
      style: result.style || 'french',
      length: result.length || 'medium',
      status: 'completed',
    })
    .select()
    .single()

  if (data) return withFallback(data)
  return withFallback({
    ...result,
    original_image_url: originalUrl,
    originalImage: originalUrl || result.originalImage,
  })
}

export default function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [chatOpen, setChatOpen] = useState(false)
  const [flowOpen, setFlowOpen] = useState(false)
  const { addToHistory, isSubscribed, fetchHistory, uploadBlobUrl, uploadDataUrl } = useCredits()
  const [unlockedResult, setUnlockedResult] = useState(null)

  useEffect(() => {
    if (!isSubscribed || !user) return

    const unlock = async () => {
      let result = null

      if (location.state?.unlocked && location.state?.result) {
        result = await persistResultToDb(user.id, location.state.result, uploadBlobUrl, uploadDataUrl)
      } else {
        const pending = getFunnelResult()
        if (pending) {
          result = await persistResultToDb(user.id, pending, uploadBlobUrl, uploadDataUrl)
          clearFunnelResult()
        }
      }

      if (!result) {
        const items = await fetchHistory()
        const latest = items.find((v) => v.result_image_url)
        if (latest) {
          result = mapVisualizationToResult(latest)
          if (!latest.original_image_url) {
            const pending = getFunnelResult()
            if (pending) {
              const backfilled = await persistResultToDb(user.id, {
                ...pending,
                id: latest.id,
                resultImage: latest.result_image_url,
              }, uploadBlobUrl, uploadDataUrl)
              if (backfilled?.original_image_url || backfilled?.originalImage) {
                result = backfilled
              }
            }
          }
        }
      }

      if (result) {
        addToHistory(result)
        setUnlockedResult(result)
      }
    }

    unlock()
  }, [isSubscribed, user?.id, location.state?.unlocked, location.state?.result, uploadBlobUrl, uploadDataUrl])

  const handleViewDesign = () => {
    if (!unlockedResult) return
    navigate(`/app/result/${unlockedResult.id}`, { state: { result: unlockedResult } })
  }

  return (
    <>
      <div className="app-shell px-4">
        <div className="max-w-lg mx-auto space-y-6">
          <UploadZone onStart={() => setFlowOpen(true)} />
          {isSubscribed && unlockedResult && (
            <UnlockedDesignCard result={unlockedResult} onView={handleViewDesign} />
          )}
          <RecommendationCard onClick={() => setChatOpen(true)} />
        </div>
      </div>

      <AnimatePresence>
        {chatOpen && <RecommendationChat open={chatOpen} onClose={() => setChatOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {flowOpen && <NewVisualizationFlow open={flowOpen} onClose={() => setFlowOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
