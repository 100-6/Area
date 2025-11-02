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
  icon: {
    serverBundle: {
      collections: ['heroicons', 'lucide', 'logos']
    },
    clientBundle: {
      scan: true,
      sizeLimitKb: 512
    }
  },
  css: ['~/assets/css/main.css', '~/assets/css/transitions.css'],
  app: {
    head: {
      title: 'Auto',
      titleTemplate: (titleChunk?: string) => {
        if (!titleChunk || titleChunk === 'Auto') {
          return 'Auto';
        }
        return `${titleChunk} · Auto`;
      },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    },
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
