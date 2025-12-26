/**
 * Backend Security Utilities
 *
 * Server-side validation and sanitization to complement frontend security.
 * IMPORTANT: Never trust client-side validation alone - always validate on backend!
 *
 * This module mirrors the frontend security utilities in admin-frontend/app/utils/security.ts
 * ensuring consistent security validation across both layers.
 */

/**
 * Validates that a URL is safe for storage and use
 * Prevents XSS via javascript:, data:, and other dangerous protocols
 *
 * @param {string|null|undefined} url - The URL to validate
 * @returns {boolean} true if URL is safe, false otherwise
 */
function isValidHttpUrl(url) {
  if (!url || typeof url !== 'string') {
    return false
  }

  // Trim whitespace
  const trimmed = url.trim()

  if (!trimmed) {
    return false
  }

  // Length validation (prevent DoS)
  if (trimmed.length > 2048) {
    return false
  }

  try {
    const parsed = new URL(trimmed)

    // Only allow http and https protocols
    // Explicitly block javascript:, data:, file:, vbscript:, etc.
    const allowedProtocols = ['http:', 'https:']

    if (!allowedProtocols.includes(parsed.protocol.toLowerCase())) {
      return false
    }

    // Additional production security: Block localhost/internal IPs
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsed.hostname.toLowerCase()

      // Block localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return false
      }

      // Block private IP ranges (RFC 1918)
      if (hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
        return false
      }

      // Block link-local addresses
      if (hostname.startsWith('169.254.')) {
        return false
      }
    }

    // Optional: Domain allowlist
    if (process.env.ALLOWED_IMAGE_DOMAINS) {
      const allowedDomains = process.env.ALLOWED_IMAGE_DOMAINS.split(',').map(d => d.trim())
      const isAllowed = allowedDomains.some(domain =>
        parsed.hostname.toLowerCase().endsWith(domain.toLowerCase())
      )
      if (!isAllowed) {
        return false
      }
    }

    return true
  } catch {
    // Invalid URL format
    return false
  }
}

/**
 * Sanitizes text content for safe storage and display
 * Removes dangerous HTML tags with their content, strips all other tags
 *
 * @param {string|null|undefined} text - Text to sanitize
 * @returns {string} Sanitized text with HTML removed
 */
function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return ''
  }

  let sanitized = text

  // First, remove dangerous tags AND their content (case-insensitive)
  // These tags should be completely removed, not just stripped
  const dangerousTags = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input']
  dangerousTags.forEach(tag => {
    // Match opening and closing tags with content
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis')
    sanitized = sanitized.replace(regex, '')

    // Also match self-closing tags
    const selfClosingRegex = new RegExp(`<${tag}[^>]*/>`, 'gi')
    sanitized = sanitized.replace(selfClosingRegex, '')
  })

  // Remove HTML comments
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '')

  // Remove CDATA sections
  sanitized = sanitized.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')

  // Then remove all remaining HTML tags (but preserve their text content)
  sanitized = sanitized.replace(/<[^>]*>/g, '')

  // Decode common HTML entities to prevent double-encoding
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')  // Must be last to avoid double-decoding

  return sanitized.trim()
}

/**
 * Validates email format using RFC 5322 compliant regex
 *
 * @param {string|null|undefined} email - Email to validate
 * @returns {Object} { valid: boolean, email?: string, error?: string }
 */
function validateEmail(email) {
  // Type check
  if (typeof email !== 'string') {
    return { valid: false, error: 'Email must be a string' }
  }

  // Trim whitespace
  const trimmed = email.trim()

  // Empty check
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email is required' }
  }

  // Length limits (RFC 5321: local part max 64, domain max 255, total max 320)
  if (trimmed.length > 320) {
    return { valid: false, error: 'Email is too long' }
  }

  // RFC 5322 compliant email regex (simplified but robust)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' }
  }

  // Normalize to lowercase
  return { valid: true, email: trimmed.toLowerCase() }
}

/**
 * Validates that a number is a positive price with max 2 decimal places
 *
 * @param {number|string|null|undefined} price - Price to validate
 * @returns {Object} { valid: boolean, price?: number, error?: string }
 */
function validatePrice(price) {
  // Type coercion
  const numPrice = Number(price)

  // NaN check
  if (isNaN(numPrice)) {
    return { valid: false, error: 'Price must be a valid number' }
  }

  // Positive check
  if (numPrice <= 0) {
    return { valid: false, error: 'Price must be positive' }
  }

  // Max value check (prevent overflow)
  if (numPrice > 999999.99) {
    return { valid: false, error: 'Price exceeds maximum value' }
  }

  // Decimal precision check (max 2 decimal places)
  const decimalPart = numPrice.toString().split('.')[1]
  if (decimalPart && decimalPart.length > 2) {
    return { valid: false, error: 'Price must have at most 2 decimal places' }
  }

  // Round to 2 decimal places to prevent floating point issues
  const roundedPrice = Math.round(numPrice * 100) / 100

  return { valid: true, price: roundedPrice }
}

/**
 * Validates rating is an integer between 1 and 5
 *
 * @param {number|string|null|undefined} rating - Rating to validate
 * @returns {Object} { valid: boolean, rating?: number, error?: string }
 */
function validateRating(rating) {
  const numRating = Number(rating)

  if (isNaN(numRating)) {
    return { valid: false, error: 'Rating must be a number' }
  }

  if (!Number.isInteger(numRating)) {
    return { valid: false, error: 'Rating must be an integer' }
  }

  if (numRating < 1 || numRating > 5) {
    return { valid: false, error: 'Rating must be between 1 and 5' }
  }

  return { valid: true, rating: numRating }
}

/**
 * Validates that an array has a maximum length
 *
 * @param {Array} arr - Array to validate
 * @param {number} maxLength - Maximum allowed length
 * @param {string} fieldName - Name of field for error message
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateArrayLength(arr, maxLength, fieldName = 'Array') {
  if (!Array.isArray(arr)) {
    return { valid: false, error: `${fieldName} must be an array` }
  }

  if (arr.length > maxLength) {
    return { valid: false, error: `${fieldName} cannot exceed ${maxLength} items` }
  }

  return { valid: true }
}

/**
 * Sanitizes an array of strings
 *
 * @param {Array} arr - Array of strings to sanitize
 * @returns {Array} Sanitized array with empty items removed
 */
function sanitizeStringArray(arr) {
  if (!Array.isArray(arr)) {
    return []
  }

  return arr
    .filter(item => typeof item === 'string' && item.trim().length > 0)
    .map(item => sanitizeText(item))
}

/**
 * Creates a validation error response
 *
 * @param {string} message - Error message
 * @param {Object} details - Additional error details (only in development)
 * @returns {Object} Formatted error response
 */
function createValidationError(message, details = null) {
  const error = { error: message }

  if (process.env.NODE_ENV === 'development' && details) {
    error.details = details
  }

  return error
}

module.exports = {
  isValidHttpUrl,
  sanitizeText,
  validateEmail,
  validatePrice,
  validateRating,
  validateArrayLength,
  sanitizeStringArray,
  createValidationError
}
