/**
 * Security utilities for input validation and sanitization
 */

/**
 * Validates that a URL is safe for use in HTML attributes
 * Prevents XSS via javascript:, data:, and other dangerous protocols
 *
 * @param url - The URL to validate
 * @returns true if URL is safe, false otherwise
 */
export function isValidHttpUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  // Trim whitespace
  const trimmed = url.trim()

  if (!trimmed) {
    return false
  }

  try {
    const parsed = new URL(trimmed)

    // Only allow http and https protocols
    // Explicitly block javascript:, data:, file:, etc.
    const allowedProtocols = ['http:', 'https:']

    return allowedProtocols.includes(parsed.protocol.toLowerCase())
  } catch {
    // Invalid URL format
    return false
  }
}

/**
 * Returns a safe URL or a fallback placeholder
 * Use this when rendering user-controlled URLs in img src attributes
 *
 * @param url - The URL to validate
 * @param fallback - Fallback URL if validation fails (default: placeholder image)
 * @returns Safe URL or fallback
 */
export function getSafeImageUrl(url: string | null | undefined, fallback = '/placeholder-image.png'): string {
  return isValidHttpUrl(url) ? url!.trim() : fallback
}

/**
 * Sanitizes text content for safe display
 * Vue already escapes {{ }} interpolations, but this provides extra safety
 *
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  // Remove any HTML tags
  return text.replace(/<[^>]*>/g, '')
}
