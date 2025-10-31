export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: {
    port: parseInt(process.env.NUXT_PORT || '3000'),
    host: '0.0.0.0'
  },
  modules: ['@nuxt/ui'],
  ui: {
    icons: ['heroicons', 'lucide', 'logos']
  },
  css: ['~/assets/css/main.css', '~/assets/css/transitions.css'],
  app: {
    pageTransition: {
      name: 'page',
      mode: 'out-in'
    }
  },
  runtimeConfig: {
    backendUrl: process.env.BACKEND_URL || 'http://localhost:8080',
    public: {
      backendUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:8080'
    }
  }
})
