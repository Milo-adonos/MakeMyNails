import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { createCheckoutSession, openStripeCheckout } from '../lib/stripe'
import {
  subscribePostPaymentGeneration,
  resumePostPaymentGenerationIfNeeded,
  runPostPaymentGeneration,
} from '../lib/postPaymentGeneration'
import { getFunnelGenData } from '../lib/funnelSession'
import { useAuth } from './AuthContext'

const CreditContext = createContext(null)

const FREE_CREDITS = 1

export function CreditProvider({ children }) {
  const { user, profile, refreshProfile } = useAuth()
  const [history, setHistory] = useState([])
  const [purchases, setPurchases] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [localCredits, setLocalCredits] = useState(FREE_CREDITS)
  const [pendingGeneration, setPendingGeneration] = useState({
    status: 'idle',
    result: null,
    error: null,
  })

  const creditsRemaining = profile?.credits_remaining ?? profile?.credits ?? localCredits
  const isSubscribed = subscription?.status === 'active'
    && (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())
  const isUnlimited = isSubscribed && subscription?.plan === 'exclusif_ia'
  const hasEmmaAccess = isUnlimited

  const fetchHistory = useCallback(async () => {
    if (!user) return []
    const { data } = await supabase
      .from('visualizations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setHistory(data)
    return data || []
  }, [user])

  const fetchPurchases = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setPurchases(data)
  }, [user])

  const fetchSubscription = useCallback(async () => {
    if (!user) return null
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
    setSubscription(data || null)
    return data
  }, [user])

  const waitForActiveSubscription = useCallback(async (maxAttempts = 20) => {
    if (!user) return null
    for (let i = 0; i < maxAttempts; i++) {
      const sub = await fetchSubscription()
      if (sub?.status === 'active'
        && (!sub.current_period_end || new Date(sub.current_period_end) > new Date())) {
        return sub
      }
      await new Promise((r) => setTimeout(r, 1500))
    }
    return null
  }, [user, fetchSubscription])

  useEffect(() => {
    fetchHistory()
    fetchPurchases()
    fetchSubscription()
  }, [fetchHistory, fetchPurchases, fetchSubscription])

  useEffect(() => subscribePostPaymentGeneration(setPendingGeneration), [])

  const canGenerate = useCallback(() => {
    if (!isSubscribed) return false
    if (isUnlimited) return true
    return creditsRemaining > 0
  }, [isSubscribed, isUnlimited, creditsRemaining])

  const useCredit = useCallback(async () => canGenerate(), [canGenerate])

  const addCredits = useCallback(async (packId) => {
    if (!user) return

    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token
    if (!accessToken) throw new Error('Not authenticated')

    const url = await createCheckoutSession(packId, accessToken)
    openStripeCheckout(url, { planId: packId, placement: 'dashboard' })
  }, [user])

  const createVisualization = useCallback(async ({ shape, style, length, originalImageUrl }) => {
    if (user) {
      const { data, error } = await supabase.rpc('use_credit', {
        p_shape: shape,
        p_style: style,
        p_length: length,
        p_original_image_url: originalImageUrl || null,
      })
      if (error) throw error
      await refreshProfile()
      return data
    }
    setLocalCredits((c) => Math.max(0, c - 1))
    return { visualization_id: crypto.randomUUID(), credits_remaining: localCredits - 1 }
  }, [user, localCredits, refreshProfile])

  const completeVisualization = useCallback(async (vizId, resultImageUrl) => {
    if (user) {
      await supabase.rpc('complete_visualization', {
        p_viz_id: vizId,
        p_result_image_url: resultImageUrl,
      })
      await refreshProfile()
      await fetchHistory()
    }
  }, [user, refreshProfile, fetchHistory])

  const addToHistory = useCallback((result) => {
    if (!result?.id) return
    setHistory((h) => {
      if (h.some((item) => item.id === result.id)) return h
      return [result, ...h]
    })
  }, [])

  const uploadImage = useCallback(async (file) => {
    if (!user) return URL.createObjectURL(file)

    const fileExt = file.name?.split('.').pop() || 'jpg'
    const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`

    const { error } = await supabase.storage
      .from('nail-images')
      .upload(filePath, file)

    if (error) throw error

    const { data } = supabase.storage
      .from('nail-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  }, [user])

  const compressImage = useCallback((blob, maxPx = 1200, quality = 0.78) => {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(blob)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const ratio = Math.min(1, maxPx / Math.max(img.width, img.height))
        const w = Math.round(img.width * ratio)
        const h = Math.round(img.height * ratio)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        canvas.toBlob((compressed) => resolve(compressed || blob), 'image/jpeg', quality)
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(blob) }
      img.src = url
    })
  }, [])

  const uploadBlobUrl = useCallback(async (blobUrl) => {
    if (!user || !blobUrl) return null

    try {
      const res = await fetch(blobUrl)
      const rawBlob = await res.blob()
      const blob = await compressImage(rawBlob)
      const filePath = `${user.id}/before-${crypto.randomUUID()}.jpg`

      const { error } = await supabase.storage
        .from('nail-images')
        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true })

      if (error) return null

      const { data } = supabase.storage.from('nail-images').getPublicUrl(filePath)
      return data.publicUrl
    } catch {
      return null
    }
  }, [user, compressImage])

  const uploadDataUrl = useCallback(async (dataUrl) => {
    if (!user || !dataUrl?.startsWith('data:')) return null

    try {
      const res = await fetch(dataUrl)
      const rawBlob = await res.blob()
      const blob = await compressImage(rawBlob)
      const filePath = `${user.id}/before-${crypto.randomUUID()}.jpg`

      const { error } = await supabase.storage
        .from('nail-images')
        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true })

      if (error) return null

      const { data } = supabase.storage.from('nail-images').getPublicUrl(filePath)
      return data.publicUrl
    } catch {
      return null
    }
  }, [user, compressImage])

  const startPostPaymentGeneration = useCallback(async (options = {}) => {
    const { onSubscriptionReady } = options

    return runPostPaymentGeneration({
      waitForActiveSubscription,
      createVisualization,
      completeVisualization,
      uploadBlobUrl,
      uploadDataUrl,
      fetchHistory,
      onSubscriptionReady: async (sub) => {
        await fetchHistory()
        await fetchPurchases()
        await fetchSubscription()
        if (onSubscriptionReady) await onSubscriptionReady(sub)
      },
    })
  }, [
    waitForActiveSubscription,
    createVisualization,
    completeVisualization,
    uploadBlobUrl,
    uploadDataUrl,
    fetchHistory,
    fetchPurchases,
    fetchSubscription,
  ])

  useEffect(() => {
    if (!user || !isSubscribed) return undefined

    let cancelled = false

    ;(async () => {
      const stored = await getFunnelGenData()
      if (cancelled) return
      if (!stored && !sessionStorage.getItem('mmn_pending_viz_id')) return

      resumePostPaymentGenerationIfNeeded({
        waitForActiveSubscription,
        createVisualization,
        completeVisualization,
        uploadBlobUrl,
        uploadDataUrl,
        fetchHistory,
      })
    })()

    return () => { cancelled = true }
  }, [
    user?.id,
    isSubscribed,
    waitForActiveSubscription,
    createVisualization,
    completeVisualization,
    uploadBlobUrl,
    uploadDataUrl,
    fetchHistory,
  ])

  useEffect(() => {
    if (!['waiting', 'generating'].includes(pendingGeneration.status)) return
    const interval = setInterval(() => fetchHistory(), 3000)
    return () => clearInterval(interval)
  }, [pendingGeneration.status, fetchHistory])

  return (
    <CreditContext.Provider value={{
      credits: creditsRemaining,
      creditsRemaining,
      isUnlimited,
      canGenerate,
      useCredit,
      addCredits,
      history,
      addToHistory,
      purchases,
      subscription,
      isSubscribed,
      hasEmmaAccess,
      createVisualization,
      completeVisualization,
      uploadImage,
      uploadBlobUrl,
      uploadDataUrl,
      fetchHistory,
      fetchPurchases,
      fetchSubscription,
      waitForActiveSubscription,
      pendingGeneration,
      startPostPaymentGeneration,
    }}>
      {children}
    </CreditContext.Provider>
  )
}

export function useCredits() {
  const ctx = useContext(CreditContext)
  if (!ctx) throw new Error('useCredits must be used within CreditProvider')
  return ctx
}
