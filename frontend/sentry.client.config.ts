import * as Sentry from '@sentry/nuxt'

Sentry.init({
  dsn: useRuntimeConfig().public.sentryDsn,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  enableLogs: true,

  sendDefaultPii: false,

  debug: false,
})
