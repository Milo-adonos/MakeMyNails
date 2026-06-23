import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { createCheckoutSession } from '../lib/stripe'
import { useAuth } from './AuthContext'

const CreditContext = createContext(null)

const FREE_CREDITS = 1

export function CreditProvider({ children }) {
  const { user, profile, refreshProfile } = useAuth()
  const [history, setHistory] = useState([])
  const [purchases, setPurchases] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [localCredits, setLocalCredits] = useState(FREE_CREDITS)

  const credits = profile?.credits ?? localCredits
  const isSubscribed = subscription?.status === 'active'
    && (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())
  const hasEmmaAccess = isSubscribed && subscription?.plan === 'exclusif_ia'

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

  const canGenerate = useCallback(() => {
    if (isSubscribed) return true
    return credits > 0
  }, [isSubscribed, credits])

  const useCredit = useCallback(async () => {
    if (isSubscribed) return true

    if (user) {
      if (credits <= 0) return false
      await refreshProfile()
      return credits > 0
    }
    if (localCredits <= 0) return false
    setLocalCredits((c) => c - 1)
    return true
  }, [user, credits, localCredits, refreshProfile, isSubscribed])

  const addCredits = useCallback(async (packId) => {
    if (!user) return

    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token
    if (!accessToken) throw new Error('Not authenticated')

    const url = await createCheckoutSession(packId, accessToken)
    window.location.href = url
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
      await fetchHistory()
    }
  }, [user, fetchHistory])

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

  return (
    <CreditContext.Provider value={{
      credits,
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
