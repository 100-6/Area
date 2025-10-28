export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: {
    port: parseInt(process.env.NUXT_PORT || '3000'),
    host: '0.0.0.0'
  },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css', '~/assets/css/transitions.css'],
  app: {
    pageTransition: {
      name: 'page',
      mode: 'out-in'
    }
  },
  runtimeConfig: {
    backendUrl: process.env.NUXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:8080',
    public: {
      backendUrl: process.env.BACKEND_URL || 'http://localhost:8080'
    },
    backendUrl: process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'http://area_backend_prod:8080' : 'http://area_backend_dev:8080')
  }
})
