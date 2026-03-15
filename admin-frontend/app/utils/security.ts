/**
 * Security utilities for input validation, sanitization, and CSRF protection
 */

const CSRF_TOKEN_KEY = 'csrf-token'
const CSRF_TOKEN_BYTE_LENGTH = 32

/**
 * Generates a cryptographically random CSRF token
 *
 * @returns A hex-encoded random token string
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_BYTE_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Retrieves the CSRF token from sessionStorage, creating one if it doesn't exist.
 * Returns an empty string in SSR contexts where sessionStorage is unavailable.
 *
 * @returns The CSRF token string, or empty string on the server
 */
export function getOrCreateCsrfToken(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  let token = sessionStorage.getItem(CSRF_TOKEN_KEY)
  if (!token) {
    token = generateCsrfToken()
    sessionStorage.setItem(CSRF_TOKEN_KEY, token)
  }
  return token
}

/**
 * Rotates the CSRF token by generating a new one and storing it.
 * Call this after a successful login or on session expiry.
 *
 * @returns The new CSRF token
 */
export function rotateCsrfToken(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const token = generateCsrfToken()
  sessionStorage.setItem(CSRF_TOKEN_KEY, token)
  return token
}

/**
 * Clears the stored CSRF token. Call this on logout.
 */
export function clearCsrfToken(): void {
  if (typeof window === 'undefined') {
    return
  }
  sessionStorage.removeItem(CSRF_TOKEN_KEY)
}

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
 * Removes dangerous tags with their content, and strips all other HTML tags
 * Vue already escapes {{ }} interpolations, but this provides extra safety
 *
 * @param text - Text to sanitize
 * @returns Sanitized text with HTML removed
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  // Remove any HTML tags
  let sanitized = text

  // First, remove dangerous tags AND their content (case-insensitive)
  // These tags should be completely removed, not just stripped
  const dangerousTags = ['script', 'style', 'iframe', 'object', 'embed']
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis')
    sanitized = sanitized.replace(regex, '')
  })

  // Then remove all remaining HTML tags (but preserve their text content)
  sanitized = sanitized.replace(/<[^>]*>/g, '')

  return sanitized
}
