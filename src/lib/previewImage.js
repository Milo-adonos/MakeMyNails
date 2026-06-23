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
