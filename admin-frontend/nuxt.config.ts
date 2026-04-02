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
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
  ],

  supabase: {
    url: process.env.NUXT_PUBLIC_SUPABASE_URL,
    key: process.env.NUXT_PUBLIC_SUPABASE_KEY,
    serviceKey: process.env.SUPABASE_SECRET_KEY,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/*'],
    },
  },

  runtimeConfig: {
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY || '',
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3001',
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY || '',
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
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Tailwind + Google Fonts stylesheet
            "img-src 'self' https: data:", // Allow HTTPS images and data URIs
            "font-src 'self' data: https://fonts.gstatic.com", // Google Fonts binary files
            "connect-src 'self' http://localhost:* https: wss://oqkfirmzkdfkfcvzqipo.supabase.co", // Allow API and Supabase connections
            "frame-ancestors 'none'", // Prevent clickjacking
            "base-uri 'self'",
            "form-action 'self'"
          ].join('; ')
        }
      ],
      link: [
        // Dosis variable font (weights 200–800) via Google Fonts
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Dosis:wght@200..800&display=swap',
        },
      ],
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
