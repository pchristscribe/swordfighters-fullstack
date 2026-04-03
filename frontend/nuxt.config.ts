// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  devServer: {
    port: 3000,
  },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', 'nuxt-headlessui', '@nuxtjs/supabase'],

  // Optionally change the default prefix.
  headlessui: {
    prefix: 'Headless'
  },

  supabase: {
    url: process.env.NUXT_PUBLIC_SUPABASE_URL,
    key: process.env.NUXT_PUBLIC_SUPABASE_KEY,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/*'],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000',
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY || '',
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
      link: [
        // Dosis variable font (weights 200–800) via Google Fonts
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Dosis:wght@200..800&display=swap',
        },
      ],
    },
  },

  vite: {
    server: {
      hmr: {
        port: 24677 // Changed to avoid conflict with admin-frontend
      }
    }
  }
})
