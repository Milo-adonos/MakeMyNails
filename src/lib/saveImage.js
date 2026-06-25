import i18n from '../i18n'

/** Save an image to the device (gallery / downloads) — mobile-friendly. */
export async function saveImageToGallery(imageUrl, filename = 'makemynails.jpg') {
  const res = await fetch(imageUrl, { mode: 'cors' })
  if (!res.ok) throw new Error(i18n.t('common.downloadFailed'))
  const blob = await res.blob()
  const type = blob.type || 'image/jpeg'
  const file = new File([blob], filename, { type })

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'MakeMyNails' })
    return
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
