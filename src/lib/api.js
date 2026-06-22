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
      const quality = mime === 'image/png' ? undefined : 0.98
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
}) {
  if (!photo) throw new Error('Aucune photo fournie. Veuillez reprendre depuis le début.')

  if (import.meta.env.VITE_MOCK_GENERATION === 'true') {
    await new Promise((r) => setTimeout(r, 2500))
    return {
      id: crypto.randomUUID(),
      originalImage: photo,
      resultImage: '/after-1.webp',
      shape: shape || 'oval',
      style: style || 'french',
      length: length || 'medium',
      mode,
      createdAt: new Date().toISOString(),
    }
  }

  const { base64: photoBase64, aspectRatio } = await imageToBase64(photo, 2048)

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
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Generation failed')

  return {
    id: crypto.randomUUID(),
    originalImage: photo,
    resultImage: data.resultImageUrl,
    shape,
    style,
    length,
    mode,
    createdAt: new Date().toISOString(),
  }
}
