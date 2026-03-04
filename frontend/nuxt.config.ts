// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  devServer: {
    port: 3000,
  },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', 'nuxt-headlessui', '@sentry/nuxt/module'],

  // Optionally change the default prefix.
  headlessui: {
    prefix: 'Headless'
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000',
      sentryDsn: process.env.SENTRY_DSN || '',
    },
  },

  app: {
    head: {
      title: 'Swordfighters - Curated Products for Gay Men',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Discover curated products from DHgate, AliExpress, Amazon, and Wish' },
      ],
    },
  },

  vite: {
    server: {
      hmr: {
        port: 24677 // Changed to avoid conflict with admin-frontend
      }
    }
  },

  sentry: {
    org: process.env.SENTRY_ORG || 'swordfighters',
    project: process.env.SENTRY_PROJECT || 'javascript-nuxt',
    authToken: process.env.SENTRY_AUTH_TOKEN,
    autoInjectServerSentry: 'top-level-import'
  },

  sourcemap: {
    client: 'hidden'
  }
})
