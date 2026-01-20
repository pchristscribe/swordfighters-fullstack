import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

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

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // In production, you may want to lower this to reduce quota usage
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
      ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
      : (process.env.NODE_ENV === 'production' ? 0.1 : 1.0),

    // Set profilesSampleRate to control profiling
    profilesSampleRate: process.env.SENTRY_PROFILES_SAMPLE_RATE
      ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE)
      : (process.env.NODE_ENV === 'production' ? 0.1 : 1.0),

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

    // Before send hook to add custom context or filter events
    beforeSend(event, hint) {
      // You can modify the event here or return null to drop it
      return event
    },
  })

  fastify.log.info(`Sentry initialized for ${process.env.NODE_ENV} environment`)
}

/**
 * Capture exception and send to Sentry
 * @param {Error} error - Error to capture
 * @param {Object} context - Additional context
 */
export function captureException(error, context = {}) {
  Sentry.withScope((scope) => {
    // Add custom context
    if (context.user) {
      scope.setUser(context.user)
    }
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value)
      })
    }
    if (context.extra) {
      scope.setContext('additional', context.extra)
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
