export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: {
    port: parseInt(process.env.NUXT_PORT),
    host: '0.0.0.0'
  },
  css: [
    '~/style/main.css', 
    '~/style/variables.css'
  ]
})
