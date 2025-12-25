export default defineNuxtConfig({
  compatibilityDate: '2025-11-29',
  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  devServer: {
    port: 3002, // Admin frontend port
  },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss'
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3001'
    }
  },

  app: {
    head: {
      title: 'Swordfighters Admin',
      meta: [
        { name: 'description', content: 'Admin panel for Swordfighters affiliate platform' },
        // Content Security Policy - Defense against XSS attacks
        {
          'http-equiv': 'Content-Security-Policy',
          content: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Nuxt requires unsafe-inline/eval for HMR in dev
            "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
            "img-src 'self' https: data:", // Allow HTTPS images and data URIs
            "font-src 'self' data:",
            "connect-src 'self' http://localhost:* https:", // Allow API connections
            "frame-ancestors 'none'", // Prevent clickjacking
            "base-uri 'self'",
            "form-action 'self'"
          ].join('; ')
        }
      ]
    }
  },

  vite: {
    server: {
      hmr: {
        port: 24678,
        clientPort: 24678
      }
    }
  }
})
