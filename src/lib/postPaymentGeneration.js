import { supabase } from './supabase'
import { generateFromFunnelPayload } from './api'
import {
  getFunnelGenData,
  clearFunnelSession,
  clearFunnelCheckoutState,
  persistFunnelResult,
  mapVisualizationToResult,
} from './funnelSession'
import { trackEvent } from './radar'

const PENDING_VIZ_KEY = 'mmn_pending_viz_id'

let activeJob = null
let currentState = { status: 'idle', result: null, error: null }
const listeners = new Set()

export function subscribePostPaymentGeneration(callback) {
  listeners.add(callback)
  callback(currentState)
  return () => listeners.delete(callback)
}

export function getPostPaymentGenerationState() {
  return currentState
}

function notify(state) {
  currentState = state
  listeners.forEach((cb) => cb(state))
}

async function uploadOriginalPhoto(photoUrl, uploadBlobUrl, uploadDataUrl) {
  if (!photoUrl) return null
  if (photoUrl.startsWith('data:')) return uploadDataUrl(photoUrl)
  if (photoUrl.startsWith('blob:')) return uploadBlobUrl(photoUrl)
  return photoUrl
}

async function fetchVisualization(vizId) {
  const { data } = await supabase
    .from('visualizations')
    .select('id, original_image_url, result_image_url, shape, style, length, status, created_at')
    .eq('id', vizId)
    .maybeSingle()
  return data
}

async function patchOriginalImageUrl(vizId, originalImageUrl) {
  if (!vizId || !originalImageUrl) return
  await supabase
    .from('visualizations')
    .update({ original_image_url: originalImageUrl })
    .eq('id', vizId)
}

function buildResultFromViz(viz, stored) {
  const mapped = mapVisualizationToResult(viz)
  if (!mapped) return null
  return {
    ...mapped,
    original_image_url: viz.original_image_url,
    originalImage: viz.original_image_url,
    originalImageData: stored?.photoDataUrl?.startsWith('data:') ? stored.photoDataUrl : undefined,
    resultImage: viz.result_image_url,
    result_image_url: viz.result_image_url,
  }
}

/**
 * Lance ou reprend la génération post-paiement. Survit à la navigation et au démontage React.
 */
export async function runPostPaymentGeneration(deps) {
  if (activeJob) return activeJob

  const stored = await getFunnelGenData()

  if (!stored) {
    return null
  }

  activeJob = (async () => {
    try {
      notify({ status: 'waiting', result: null, error: null })

      const sub = deps.subscription || await deps.waitForActiveSubscription(25)
      if (!sub) {
        notify({ status: 'pending_subscription', result: null, error: null })
        return null
      }

      if (deps.onSubscriptionReady) {
        await deps.onSubscriptionReady(sub)
      }

      let vizId = sessionStorage.getItem(PENDING_VIZ_KEY)
      if (vizId) {
        const existing = await fetchVisualization(vizId)
        if (existing?.status === 'completed' && existing.result_image_url) {
          const result = buildResultFromViz(existing, stored)
          persistFunnelResult(result)
          clearFunnelSession()
          clearFunnelCheckoutState()
          sessionStorage.removeItem(PENDING_VIZ_KEY)
          await deps.fetchHistory?.()
          notify({ status: 'success', result, error: null })
          return result
        }
      }

      notify({ status: 'generating', result: null, error: null })

      const originalImageUrl = await uploadOriginalPhoto(
        stored.photoDataUrl,
        deps.uploadBlobUrl,
        deps.uploadDataUrl,
      )

      if (!vizId) {
        const vizResult = await deps.createVisualization({
          shape: stored.shape,
          style: stored.style,
          length: stored.length,
          originalImageUrl,
        })
        vizId = vizResult?.visualization_id
        if (vizId) sessionStorage.setItem(PENDING_VIZ_KEY, vizId)
      } else if (originalImageUrl) {
        await patchOriginalImageUrl(vizId, originalImageUrl)
      }

      const result = await generateFromFunnelPayload(stored, vizId)

      const enrichedResult = {
        ...result,
        id: vizId || result.id,
        original_image_url: originalImageUrl,
        originalImage: originalImageUrl || result.originalImage,
        originalImageData: stored.photoDataUrl?.startsWith('data:')
          ? stored.photoDataUrl
          : result.originalImageData,
        result_image_url: result.resultImage,
      }

      if (vizId && result.resultImage) {
        await deps.completeVisualization(vizId, result.resultImage)
        if (originalImageUrl) {
          await patchOriginalImageUrl(vizId, originalImageUrl)
        }
      }

      persistFunnelResult(enrichedResult)
      trackEvent('generation_complete', {
        mode: result.mode || stored.mode || 'onboarding',
        placement: 'post_payment',
      })

      clearFunnelSession()
      sessionStorage.removeItem(PENDING_VIZ_KEY)
      clearFunnelCheckoutState()
      await deps.fetchHistory?.()

      notify({ status: 'success', result: enrichedResult, error: null })
      return enrichedResult
    } catch (err) {
      console.error(err)
      sessionStorage.removeItem(PENDING_VIZ_KEY)
      notify({ status: 'failed', result: null, error: err.message || 'Generation failed' })
      throw err
    } finally {
      activeJob = null
    }
  })()

  return activeJob
}

export async function resumePostPaymentGenerationIfNeeded(deps) {
  const stored = await getFunnelGenData()
  const pendingViz = sessionStorage.getItem(PENDING_VIZ_KEY)

  if (!stored && !pendingViz) {
    return null
  }

  if (activeJob) return activeJob
  return runPostPaymentGeneration(deps)
}
