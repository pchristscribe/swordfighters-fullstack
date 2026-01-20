import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

// Sensitive field patterns to redact
const SENSITIVE_KEYS = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'apikey',
  'api_key',
  'api-key',
  'auth',
  'authorization',
  'cookie',
  'session',
  'sessionid',
  'csrf',
  'xsrf',
  'private',
  'credential',
  'card',
  'ccn',
  'cvv',
  'cvc',
  'ssn',
  'pin',
  'salt',
]

/**
 * Sanitize sensitive data from objects before sending to Sentry
 * @param {any} data - Data to sanitize
 * @param {number} depth - Current recursion depth
 * @returns {any} - Sanitized data
 */
export function sanitizeSensitiveData(data, depth = 0) {
  // Prevent infinite recursion
  if (depth > 5) return '[Max Depth Reached]'

  // Handle null/undefined
  if (data === null || data === undefined) return data

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeSensitiveData(item, depth + 1))
  }

  // Handle objects
  if (typeof data === 'object') {
    const sanitized = {}
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()

      // Check if key contains sensitive pattern
      const isSensitive = SENSITIVE_KEYS.some(pattern => lowerKey.includes(pattern))

      // If the key is sensitive and the value is a primitive, redact it
      // If the key is sensitive but the value is an object/array, still recurse into it
      // to handle nested fields properly (e.g., credentials: { password: 'x' })
      if (isSensitive && (typeof value !== 'object' || value === null)) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeSensitiveData(value, depth + 1)
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }

  // Return primitives as-is
  return data
}

/**
 * Validate sample rate is between 0 and 1
 * @param {string} envVar - Environment variable value
 * @param {number} defaultValue - Default value if invalid
 * @returns {number} - Validated sample rate
 */
function validateSampleRate(envVar, defaultValue) {
  if (!envVar) return defaultValue

  const rate = parseFloat(envVar)

  if (isNaN(rate) || rate < 0 || rate > 1) {
    console.warn(`Invalid sample rate "${envVar}". Must be between 0 and 1. Using default: ${defaultValue}`)
    return defaultValue
  }

  return rate
}

/**
 * Initialize Sentry for error tracking and performance monitoring
 * @param {Object} fastify - Fastify instance
 */
export function initSentry(fastify) {
  // Only initialize if DSN is provided
  if (!process.env.SENTRY_DSN) {
    fastify.log.warn('SENTRY_DSN not configured - Sentry monitoring disabled')
    return
  }

  // Validate sample rates
  const tracesSampleRate = validateSampleRate(
    process.env.SENTRY_TRACES_SAMPLE_RATE,
    process.env.NODE_ENV === 'production' ? 0.1 : 1.0
  )

  const profilesSampleRate = validateSampleRate(
    process.env.SENTRY_PROFILES_SAMPLE_RATE,
    process.env.NODE_ENV === 'production' ? 0.1 : 1.0
  )

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // In production, you may want to lower this to reduce quota usage
    tracesSampleRate,

    // Set profilesSampleRate to control profiling
    profilesSampleRate,

    // Integrations
    integrations: [
      // Add Node profiling integration
      nodeProfilingIntegration(),
    ],

    // Additional context
    release: process.env.SENTRY_RELEASE || undefined,

    // Configure which errors to ignore
    ignoreErrors: [
      // Browser/client errors that may leak through
      'Non-Error promise rejection captured',
      // Network errors
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
    ],

    // Before send hook to sanitize sensitive data
    beforeSend(event, hint) {
      // Sanitize request data if present
      if (event.request) {
        // Sanitize headers
        if (event.request.headers) {
          event.request.headers = sanitizeSensitiveData(event.request.headers)
        }

        // Sanitize cookies
        if (event.request.cookies) {
          event.request.cookies = sanitizeSensitiveData(event.request.cookies)
        }

        // Sanitize query string
        if (event.request.query_string) {
          event.request.query_string = sanitizeSensitiveData(event.request.query_string)
        }

        // Sanitize POST data
        if (event.request.data) {
          event.request.data = sanitizeSensitiveData(event.request.data)
        }
      }

      // Sanitize extra context
      if (event.extra) {
        event.extra = sanitizeSensitiveData(event.extra)
      }

      // Sanitize contexts
      if (event.contexts) {
        event.contexts = sanitizeSensitiveData(event.contexts)
      }

      return event
    },
  })

  fastify.log.info(`Sentry initialized for ${process.env.NODE_ENV} environment (traces: ${tracesSampleRate}, profiles: ${profilesSampleRate})`)
}

/**
 * Capture exception and send to Sentry
 * @param {Error} error - Error to capture
 * @param {Object} context - Additional context (will be sanitized)
 */
export function captureException(error, context = {}) {
  Sentry.withScope((scope) => {
    // Add custom context (sanitized)
    if (context.user) {
      scope.setUser(sanitizeSensitiveData(context.user))
    }
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value)
      })
    }
    if (context.extra) {
      // Sanitize extra context before sending
      scope.setContext('additional', sanitizeSensitiveData(context.extra))
    }

    Sentry.captureException(error)
  })
}

/**
 * Capture a message and send to Sentry
 * @param {string} message - Message to capture
 * @param {string} level - Severity level (fatal, error, warning, info, debug)
 */
export function captureMessage(message, level = 'info') {
  Sentry.captureMessage(message, level)
}

/**
 * Flush Sentry events (useful for graceful shutdown)
 * @param {number} timeout - Timeout in milliseconds
 */
export async function flushSentry(timeout = 2000) {
  if (process.env.SENTRY_DSN) {
    await Sentry.close(timeout)
  }
}

export default Sentry
