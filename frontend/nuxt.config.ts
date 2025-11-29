// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  devServer: {
    port: 3000,
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
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
})
