const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function compressToBase64(source, maxPx = 1280, quality = 0.82) {
  const blob = source.startsWith('data:')
    ? await fetch(source).then((r) => r.blob())
    : await fetch(source).then((r) => r.blob())

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
      canvas.toBlob(
        (compressed) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(compressed || blob)
        },
        'image/jpeg',
        quality,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    }
    img.src = url
  })
}

export async function generateNailVisualization({ photo, shape, style, length, customNote, inspirationPhoto, outfitPhoto }) {
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
      createdAt: new Date().toISOString(),
    }
  }

  const photoBase64 = await compressToBase64(photo, 1280, 0.82)

  let inspirationBase64 = null
  if (inspirationPhoto) {
    inspirationBase64 = await compressToBase64(inspirationPhoto, 1024, 0.80)
  }

  let outfitBase64 = null
  if (outfitPhoto) {
    outfitBase64 = await compressToBase64(outfitPhoto, 1024, 0.80)
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-nails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ photoBase64, shape, style, length, customNote, inspirationBase64, outfitBase64 }),
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
    createdAt: new Date().toISOString(),
  }
}
