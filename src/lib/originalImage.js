import { optimizeImageUrl } from './supabase'

/** Display URL for the "before" image — survives blob expiry after funnel checkout. */
export function getOriginalDisplayUrl(result, width = 600) {
  if (!result) return null

  const stored = result.original_image_url || result.originalImage
  if (stored && !stored.startsWith('blob:')) {
    return optimizeImageUrl(stored, width)
  }

  if (result.originalImageData?.startsWith('data:')) {
    return result.originalImageData
  }

  return null
}

/** Resolve a storable original URL for DB (upload blob/data URL when user is logged in). */
export async function resolveOriginalImageUrl(result, { uploadBlobUrl, uploadDataUrl }) {
  const stored = result?.original_image_url || result?.originalImage
  if (stored && !stored.startsWith('blob:')) return stored

  if (stored?.startsWith('blob:') && uploadBlobUrl) {
    const uploaded = await uploadBlobUrl(stored)
    if (uploaded) return uploaded
  }

  if (result?.originalImageData && uploadDataUrl) {
    const uploaded = await uploadDataUrl(result.originalImageData)
    if (uploaded) return uploaded
  }

  return null
}
