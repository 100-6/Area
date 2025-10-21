import type { AuthProviderInfo } from '~/types'

const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

const providerMeta: Record<string, { keys: string[]; displayName: string; icon: string; color?: string; description?: string }> = {
  google: {
    keys: ['google', 'googleoauth', 'googleoauth2'],
    displayName: 'Google',
    icon: 'i-logos-google-icon',
    color: '#4285F4',
    description: 'Connexion via compte Google'
  },
  gmail: {
    keys: ['gmail', 'googlemail'],
    displayName: 'Gmail',
    icon: 'i-logos-google-gmail',
    color: '#DB4437',
    description: 'Autoriser l\'envoi et la lecture via Gmail'
  },
  discord: {
    keys: ['discord'],
    displayName: 'Discord',
    icon: 'i-logos-discord-icon',
    color: '#5865F2',
    description: 'Notifications et interactions Discord'
  },
  github: {
    keys: ['github'],
    displayName: 'GitHub',
    icon: 'i-logos-github-icon',
    description: 'Intégrations développeur GitHub'
  },
  gitlab: {
    keys: ['gitlab'],
    displayName: 'GitLab',
    icon: 'i-logos-gitlab',
    description: 'Intégrations GitLab'
  },
  dropbox: {
    keys: ['dropbox'],
    displayName: 'Dropbox',
    icon: 'i-logos-dropbox-icon',
    color: '#0061FF',
    description: 'Stockage et synchronisation Dropbox'
  }
}

const resolveMeta = (rawKey: string) => {
  const key = normalizeKey(rawKey)
  for (const metaKey in providerMeta) {
    const meta = providerMeta[metaKey]
    if (meta.keys.some(candidate => normalizeKey(candidate) === key)) {
      return { metaKey, meta }
    }
  }
  return null
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
    const resolved = resolveMeta(rawKey)
    const meta = resolved?.meta || {
      keys: [rawKey],
      displayName: service.displayName || service.name || rawKey,
      icon: 'i-heroicons-link'
    }

    const metaKey = resolved?.metaKey || normalizeKey(rawKey)
    const isOauth = String(service.authType || '').toLowerCase().includes('oauth')

    return {
      provider: metaKey,
      displayName: meta.displayName,
      icon: meta.icon,
      color: meta.color,
      description: meta.description || service.description || '',
      isConfigured: isOauth,
      isConnected: !!service.connected,
      isPrimary: false,
      connectedAt: service.connectedAt || null
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
      const response = await $fetch<{ services: any[] }>('/api/services/connected', {
        method: 'GET',
        baseURL: backendUrl,
        headers: {
          Authorization: `Bearer ${authToken.value}`
        }
      })

      const filtered = (response.services || []).filter((service) => {
        const authType = String(service.authType || '').toLowerCase()
        const rawKey = String(service.name || service.id || '')
        return authType.includes('oauth') || !!resolveMeta(rawKey)
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
