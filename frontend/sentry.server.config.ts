import * as Sentry from '@sentry/nuxt'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [],
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
  // In production, you may want to lower this to reduce quota usage
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  // Capture 100% of errors
  attachStacktrace: true,
  denyUrls: [/extensions\//i, /^chrome:\/\//i],
})
