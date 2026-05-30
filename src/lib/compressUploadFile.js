import imageCompression from 'browser-image-compression'

/** Tuned for Supabase free tier — keep application docs small. */
export const UPLOAD_LIMITS = {
  maxRawBytes: 8 * 1024 * 1024,
  maxPdfBytes: 1.5 * 1024 * 1024,
  imageMaxSizeMB: 0.35,
  imageMaxDimension: 1400,
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isPdf(file) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

function isImage(file) {
  return file.type.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/i.test(file.name)
}

/**
 * Prepare a file for upload — compress images, enforce PDF/size limits.
 * @returns {Promise<File>}
 */
export async function prepareApplicationDoc(file) {
  if (!file) throw new Error('No file selected')
  if (file.size > UPLOAD_LIMITS.maxRawBytes) {
    throw new Error(`File is too large (max ${formatFileSize(UPLOAD_LIMITS.maxRawBytes)} before compression)`)
  }

  if (isPdf(file)) {
    if (file.size > UPLOAD_LIMITS.maxPdfBytes) {
      throw new Error(`PDF is too large (max ${formatFileSize(UPLOAD_LIMITS.maxPdfBytes)}). Take a photo instead.`)
    }
    return file
  }

  if (isImage(file)) {
    const compressed = await imageCompression(file, {
      maxSizeMB: UPLOAD_LIMITS.imageMaxSizeMB,
      maxWidthOrHeight: UPLOAD_LIMITS.imageMaxDimension,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.82,
    })
    const base = file.name.replace(/\.[^.]+$/, '') || 'document'
    return new File([compressed], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  }

  throw new Error('Upload a photo (JPG/PNG) or a small PDF')
}
