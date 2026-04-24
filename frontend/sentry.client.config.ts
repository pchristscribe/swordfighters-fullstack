import * as Sentry from '@sentry/nuxt'

const isProduction = process.env.NODE_ENV === 'production'

Sentry.init({
  dsn: process.env.NUXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.SENTRY_RELEASE || undefined,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: isProduction ? 0.1 : 1.0,
  replaysSessionSampleRate: isProduction ? 0.1 : 0,
  replaysOnErrorSampleRate: isProduction ? 1.0 : 0,
  attachStacktrace: true,
  denyUrls: [/extensions\//i, /^chrome:\/\//i],
})
