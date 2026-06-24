/** Low-res preview for paywalled blurred result (full URL not shown in DOM). */
export async function createBlurredPreview(imageUrl, size = 64) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const ratio = img.width / img.height
      const w = ratio >= 1 ? size : Math.round(size * ratio)
      const h = ratio >= 1 ? Math.round(size / ratio) : size
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.55))
    }
    img.onerror = () => resolve(null)
    img.src = imageUrl
  })
}

/**
 * Aperçu funnel pré-paiement : photo originale (Image 1) rendue illisible.
 * Downscale agressif en plusieurs passes — aucun détail d'ongle ne doit transparaître.
 */
export async function createFunnelPaywallPreview(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      let source = img
      let canvas = document.createElement('canvas')
      let ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }

      let w = img.width
      let h = img.height

      // Plusieurs passes de downscale = flou extrême, couleurs mélangées
      for (let i = 0; i < 5; i++) {
        w = Math.max(6, Math.round(w / 3))
        h = Math.max(6, Math.round(h / 3))
        canvas.width = w
        canvas.height = h
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(source, 0, 0, w, h)
        source = canvas
      }

      resolve(canvas.toDataURL('image/jpeg', 0.28))
    }
    img.onerror = () => resolve(null)
    img.src = imageUrl
  })
}
