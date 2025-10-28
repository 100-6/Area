import type { AuthProviderInfo } from '~/types'

const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

const getDefaultIcon = (serviceName: string): string => {
  const name = normalizeKey(serviceName)
  const iconMap: Record<string, string> = {
    google: 'i-logos-google-icon',
    gmail: 'i-logos-google-gmail',
    discord: 'i-logos-discord-icon',
    github: 'i-logos-github-icon',
    gitlab: 'i-logos-gitlab',
    dropbox: 'i-logos-dropbox-icon',
    microsoft: 'i-logos-microsoft-icon',
    outlook: 'i-logos-microsoft-outlook',
    telegram: 'i-logos-telegram',
    slack: 'i-logos-slack-icon'
  }
  return iconMap[name] || 'i-heroicons-link'
}

const getDefaultColor = (serviceName: string): string | undefined => {
  const name = normalizeKey(serviceName)
  const colorMap: Record<string, string> = {
    google: '#4285F4',
    gmail: '#DB4437',
    discord: '#5865F2',
    github: '#24292F',
    gitlab: '#FC6D26',
    dropbox: '#0061FF',
    microsoft: '#00BCF2',
    outlook: '#0078D4',
    telegram: '#26A5E4',
    slack: '#4A154B'
  }
  return colorMap[name]
}

export const useAuthProviders = () => {
  const providers = useState<AuthProviderInfo[]>('auth.providers', () => [])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const config = useRuntimeConfig()
  const backendUrl = process.server
    ? (config.backendUrl || 'http://area_backend_dev:8080')
    : (config.public.backendUrl || 'http://localhost:8080')

  const { authToken } = useAuth()

  const mapServiceToProvider = (service: any): AuthProviderInfo => {
    const rawKey = String(service.name || service.id || '')
    const normalizedKey = normalizeKey(rawKey)
    const isOauth = String(service.authType || '').toLowerCase().includes('oauth')

    return {
      provider: normalizedKey,
      displayName: service.displayName || service.name || rawKey,
      icon: service.icon || getDefaultIcon(rawKey),
      color: service.color || getDefaultColor(rawKey),
      description: service.description || '',
      isConfigured: isOauth,
      isConnected: !!service.connected,
      isPrimary: false,
      connectedAt: service.connectedAt || null
      // Plus besoin d'oauthEndpoint - tous les services utilisent /api/auth/{service}
    }
  }

  const fetchProviders = async () => {
    if (!authToken.value) {
      providers.value = []
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data: any[] }>('/api/services/connected', {
        method: 'GET',
        baseURL: backendUrl,
        headers: {
          Authorization: `Bearer ${authToken.value}`
        }
      })

      const filtered = (response.data || []).filter((service) => {
        const authType = String(service.authType || '').toLowerCase()
        return authType.includes('oauth')
      })

      providers.value = filtered.map(mapServiceToProvider)
    } catch (err: any) {
      console.error('Failed to load connected services:', err)
      error.value = err?.data?.error || err?.message || 'Erreur lors du chargement des services connectés'
    } finally {
      isLoading.value = false
    }
  }

  return {
    providers,
    isLoading,
    error,
    fetchProviders
  }
}
