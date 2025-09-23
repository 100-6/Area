export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: {
    port: parseInt(process.env.NUXT_PORT || '3000'),
    host: '0.0.0.0'
  },
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  css: [
    '~/style/main.css',
    '~/style/variables.css'
  ]
})
