import { createBrowserSupabaseClient, isSupabaseConfigured } from './supabase'
import { isGuestMode } from './guest'

const BUCKET = 'journal-media'

/**
 * Check if a URL is a base64 data URL
 */
function isBase64(url: string): boolean {
  return url.startsWith('data:')
}

/**
 * Check if a URL is a blob URL
 */
function isBlobUrl(url: string): boolean {
  return url.startsWith('blob:')
}

/**
 * Check if a URL is an external URL (picsum, pollinations, etc.)
 */
function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

/**
 * Convert a base64 data URL to a File object
 */
function base64ToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',')
  const mimeMatch = arr[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

/**
 * Upload an image to Supabase Storage.
 * - If it's a base64 data URL, convert and upload to storage
 * - If it's a blob URL, fetch and upload
 * - If it's an external URL (picsum, etc.), keep it as-is
 * - Returns the public URL or original URL if upload not needed/fails
 */
export async function uploadImage(
  imageUrl: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Don't upload in guest mode or if Supabase not configured
  if (!isSupabaseConfigured() || isGuestMode()) {
    return imageUrl
  }

  // External URLs (picsum, pollinations, unsplash) - keep as-is
  if (isExternalUrl(imageUrl) && !isBase64(imageUrl)) {
    return imageUrl
  }

  try {
    const supabase = createBrowserSupabaseClient()
    const timestamp = Date.now()
    const random = Math.random().toString(36).slice(2, 8)
    let file: File

    if (isBase64(imageUrl)) {
      const ext = imageUrl.match(/data:image\/(\w+)/) ? imageUrl.match(/data:image\/(\w+)/)![1] : 'jpg'
      file = base64ToFile(imageUrl, `${timestamp}-${random}.${ext}`)
    } else if (isBlobUrl(imageUrl)) {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const ext = blob.type.split('/')[1] || 'jpg'
      file = new File([blob], `${timestamp}-${random}.${ext}`, { type: blob.type })
    } else {
      return imageUrl
    }

    onProgress?.(10)

    const filePath = `${timestamp}-${random}-${file.name}`
    onProgress?.(30)

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    onProgress?.(80)

    if (error) {
      console.warn('Image upload failed:', error.message)
      // Fall back to original URL
      return imageUrl
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath)

    onProgress?.(100)

    return publicUrlData.publicUrl
  } catch (err) {
    console.warn('Image upload error:', err)
    // Fall back to original URL (base64)
    return imageUrl
  }
}

/**
 * Upload multiple images, returning their URLs (uploaded or original as fallback)
 */
export async function uploadImages(
  imageUrls: string[],
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const results: string[] = []
  for (let i = 0; i < imageUrls.length; i++) {
    const url = await uploadImage(imageUrls[i])
    results.push(url)
    onProgress?.(i + 1, imageUrls.length)
  }
  return results
}
