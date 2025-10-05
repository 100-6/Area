import type { Service } from '~/types'

/**
 * Service selection and authentication management
 */
export const useServiceManagement = () => {
  const showServiceModal = ref(false)

  const openServiceModal = () => {
    showServiceModal.value = true
  }

  const closeServiceModal = () => {
    showServiceModal.value = false
  }

  const onServiceSelected = (service: Service, callback?: (service: Service) => void) => {
    if (callback) {
      callback(service)
    }
    closeServiceModal()
  }

  const handlePreSelectedService = (
    route: any,
    addServiceCallback: (service: Service) => void
  ) => {
    const preSelectedService = route.query.service as string
    if (preSelectedService) {
      const availableServices = getAvailableServices()

      const foundService = availableServices.find(s => s.slug === preSelectedService)
      if (foundService) {
        nextTick(() => {
          addServiceCallback(foundService)
        })
      }
    }
  }

  const getAvailableServices = (): Service[] => {
    return [
      {
        id: 'gmail',
        name: 'Gmail',
        slug: 'gmail',
        description: 'Gérez vos emails automatiquement',
        icon: 'i-logos-google-gmail',
        color: '#EA4335',
        isActive: true,
        category: 'communication',
        authType: 'oauth',
        actions: [],
        reactions: []
      },
      {
        id: 'slack',
        name: 'Slack',
        slug: 'slack',
        description: 'Notifications et messages d\'équipe',
        icon: 'i-logos-slack-icon',
        color: '#4A154B',
        isActive: true,
        category: 'communication',
        authType: 'oauth',
        actions: [],
        reactions: []
      },
      {
        id: 'github',
        name: 'GitHub',
        slug: 'github',
        description: 'Automatisez vos workflows Git',
        icon: 'i-logos-github-icon',
        color: '#181717',
        isActive: true,
        category: 'development',
        authType: 'oauth',
        actions: [],
        reactions: []
      },
      {
        id: 'trello',
        name: 'Trello',
        slug: 'trello',
        description: 'Gestion de projets et tâches',
        icon: 'i-logos-trello',
        color: '#0079BF',
        isActive: true,
        category: 'productivity',
        authType: 'oauth',
        actions: [],
        reactions: []
      },
      {
        id: 'discord',
        name: 'Discord',
        slug: 'discord',
        description: 'Communication et notifications communautaires',
        icon: 'i-logos-discord-icon',
        color: '#5865F2',
        isActive: true,
        category: 'communication',
        authType: 'oauth',
        actions: [],
        reactions: []
      }
    ]
  }

  const fetchServicesWithCategories = async () => {
    const services = getAvailableServices()
    const categories = [
      { id: 'communication', name: 'Communication', icon: 'i-heroicons-chat-bubble-left-right' },
      { id: 'development', name: 'Développement', icon: 'i-heroicons-code-bracket' },
      { id: 'productivity', name: 'Productivité', icon: 'i-heroicons-chart-bar' },
      { id: 'storage', name: 'Stockage', icon: 'i-heroicons-cloud' }
    ]

    return { services, categories }
  }

  /**
   * OAuth service authentication - ready for backend integration
   */
  const authenticateService = async (serviceId: string) => {
    console.log('Authenticating service:', serviceId)
    // TODO: Replace with actual OAuth flow
    return Promise.resolve({ success: true, authUrl: null })
  }

  /**
   * Check if service is properly connected - ready for backend integration
   */
  const checkServiceConnection = async (serviceId: string) => {
    console.log('Checking service connection:', serviceId)
    // TODO: Replace with actual API call
    return Promise.resolve(true)
  }

  return {
    showServiceModal: readonly(showServiceModal),
    openServiceModal,
    closeServiceModal,
    onServiceSelected,
    handlePreSelectedService,
    getAvailableServices,
    fetchServicesWithCategories,
    authenticateService,
    checkServiceConnection
  }
}