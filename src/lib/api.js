import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const ASPECT_TARGETS = [
  { label: '1:1', value: 1 },
  { label: '2:3', value: 2 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '3:4', value: 3 / 4 },
  { label: '4:3', value: 4 / 3 },
  { label: '9:16', value: 9 / 16 },
  { label: '16:9', value: 16 / 9 },
]

function getAspectRatio(width, height) {
  if (!width || !height) return 'auto'
  const ratio = width / height
  let best = 'auto'
  let minDiff = Infinity
  for (const target of ASPECT_TARGETS) {
    const diff = Math.abs(ratio - target.value)
    if (diff < minDiff) {
      minDiff = diff
      best = target.label
    }
  }
  return best
}

/** Preserve quality — only downscale if larger than maxPx, minimal compression. */
async function imageToBase64(source, maxPx = 2048) {
  const blob = source.startsWith('data:')
    ? await fetch(source).then((r) => r.blob())
    : await fetch(source).then((r) => r.blob())

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const ratio = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)

      if (ratio >= 1 && blob.type === 'image/png') {
        const reader = new FileReader()
        reader.onloadend = () => resolve({
          base64: reader.result,
          aspectRatio: getAspectRatio(img.width, img.height),
        })
        reader.onerror = reject
        reader.readAsDataURL(blob)
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)

      const mime = blob.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const quality = maxPx <= 512 ? 0.72 : mime === 'image/png' ? undefined : 0.98
      canvas.toBlob(
        (output) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve({
            base64: reader.result,
            aspectRatio: getAspectRatio(w, h),
          })
          reader.onerror = reject
          reader.readAsDataURL(output || blob)
        },
        mime,
        quality,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      const reader = new FileReader()
      reader.onloadend = () => resolve({
        base64: reader.result,
        aspectRatio: 'auto',
      })
      reader.onerror = reject
      reader.readAsDataURL(blob)
    }
    img.src = url
  })
}

export async function generateNailVisualization({
  photo,
  mode = 'onboarding',
  shape,
  style,
  length,
  customNote,
  inspirationPhoto,
  outfitPhoto,
  occasion,
  occasionLabel,
  aspectRatio: aspectRatioOverride,
  source: sourceOverride,
}, visualizationId = null) {
  if (!photo) throw new Error('Aucune photo fournie. Veuillez reprendre depuis le début.')

  if (import.meta.env.VITE_MOCK_GENERATION === 'true') {
    await new Promise((r) => setTimeout(r, 2500))
    const { base64: originalImageData } = await imageToBase64(photo, 720)
    return {
      id: visualizationId || crypto.randomUUID(),
      originalImage: photo,
      originalImageData,
      resultImage: '/after-1.webp',
      shape: shape || 'oval',
      style: style || 'french',
      length: length || 'medium',
      mode,
      createdAt: new Date().toISOString(),
    }
  }

  const { base64: photoBase64, aspectRatio: detectedAspectRatio } = await imageToBase64(photo, 2048)
  const aspectRatio = aspectRatioOverride || detectedAspectRatio
  const source = sourceOverride || mode
  const { base64: originalImageData } = await imageToBase64(photo, 720)

  let inspirationBase64 = null
  if (inspirationPhoto) {
    const inspo = await imageToBase64(inspirationPhoto, 2048)
    inspirationBase64 = inspo.base64
  }

  let outfitBase64 = null
  if (outfitPhoto) {
    const outfit = await imageToBase64(outfitPhoto, 2048)
    outfitBase64 = outfit.base64
  }

  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  const userEmail = session?.user?.email

  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-nails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      photoBase64,
      mode,
      shape,
      style,
      length,
      customNote,
      inspirationBase64,
      outfitBase64,
      occasion,
      occasionLabel,
      aspectRatio,
      userId,
      userEmail,
      visualizationId,
      source,
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Generation failed')

  return {
    id: visualizationId || crypto.randomUUID(),
    originalImage: photo,
    originalImageData,
    resultImage: data.resultImageUrl,
    shape,
    style,
    length,
    mode,
    createdAt: new Date().toISOString(),
  }
}

/** Sérialise le funnel pour génération réelle après paiement (base64, survit à Stripe). */
export async function serializeFunnelGenPayload(genData) {
  const { base64: photoDataUrl, aspectRatio } = await imageToBase64(genData.photo, 2048)

  let inspirationDataUrl = null
  if (genData.inspirationPhoto) {
    inspirationDataUrl = (await imageToBase64(genData.inspirationPhoto, 2048)).base64
  }

  let outfitDataUrl = null
  if (genData.outfitPhoto) {
    outfitDataUrl = (await imageToBase64(genData.outfitPhoto, 2048)).base64
  }

  const mode = genData.mode || (genData.inspirationPhoto ? 'inspiration' : 'onboarding')

  return {
    photoDataUrl,
    aspectRatio,
    inspirationDataUrl,
    outfitDataUrl,
    mode,
    shape: genData.shape,
    style: genData.style,
    length: genData.length,
    customNote: genData.customNote,
    occasion: genData.occasion,
    occasionLabel: genData.occasionLabel,
  }
}

/** Génération finale post-paiement (Kie.ai GPT Image 2) à partir des données funnel persistées. */
export async function generateFromFunnelPayload(stored, visualizationId = null) {
  if (!stored?.photoDataUrl) throw new Error('Données du funnel introuvables. Recommence depuis le début.')

  return generateNailVisualization({
    photo: stored.photoDataUrl,
    mode: stored.mode || 'onboarding',
    shape: stored.shape,
    style: stored.style,
    length: stored.length,
    customNote: stored.customNote,
    inspirationPhoto: stored.inspirationDataUrl,
    outfitPhoto: stored.outfitDataUrl,
    occasion: stored.occasion,
    occasionLabel: stored.occasionLabel,
    aspectRatio: 'auto',
    source: 'post_payment',
  }, visualizationId)
}
