/** Resize Supabase Storage public images to cut egress on cards and thumbnails. */
export function getStorageImageUrl(url, { width = 480, height, quality = 75, resize = 'cover' } = {}) {
  if (!url || typeof url !== 'string') return url
  if (import.meta.env.VITE_DISABLE_STORAGE_TRANSFORMS === 'true') return url
  if (!url.includes('/storage/v1/object/public/')) return url

  const transformed = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
  const params = new URLSearchParams({
    width: String(width),
    quality: String(quality),
    resize,
  })
  if (height) params.set('height', String(height))
  return `${transformed}?${params}`
}

/** Display URL + original fallback when transforms are unavailable (e.g. free tier). */
export function getStorageImageVariants(url, opts) {
  if (!url || typeof url !== 'string') {
    return { src: url, fallback: url }
  }
  const fallback = url.includes('/storage/v1/render/image/public/')
    ? url.replace('/storage/v1/render/image/public/', '/storage/v1/object/public/').split('?')[0]
    : url
  const src = getStorageImageUrl(url, opts)
  return { src, fallback: src === url ? url : fallback }
}

export const CARD_IMAGE_OPTS = { width: 480, height: 360, quality: 72 }
export const DETAIL_IMAGE_OPTS = { width: 1200, quality: 80 }
