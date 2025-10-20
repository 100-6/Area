              import type { Service, ServiceConfiguration } from '~/types'

/**
 * Service selection and authentication management
 */
export const useServiceManagement = () => {
  const showServiceModal = ref(false)
  const showConfigModal = ref(false)
  const selectedService = ref<Service | null>(null)
  const selectedBlockType = ref<'trigger' | 'action'>('trigger')
  const pendingServiceCallback = ref<((config: ServiceConfiguration) => void) | null>(null)
  const isEditingConfiguration = ref(false)
  const currentConfiguration = ref<ServiceConfiguration | null>(null)

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

  const getAvailableServices = async (): Promise<Service[]> => {
    try {
      const { public: config } = useRuntimeConfig()
      const backendUrl = config.backendUrl

      // Récupérer le token d'authentification
      const authToken = useCookie('auth-token')
      if (!authToken.value) {
        return getFallbackServices()
      }

      const headers = {
        'Authorization': `Bearer ${authToken.value}`,
        'Content-Type': 'application/json'
      }

      const modulesListResponse = await $fetch(`${backendUrl}/api/modules?_t=${Date.now()}`, { headers })

      if (!modulesListResponse.success || !modulesListResponse.modules) {
        return getFallbackServices()
      }

      const connectionStatusResponse = await $fetch(`${backendUrl}/api/services/connected`, { headers }).catch(() => null)
      const connectionStatusMap = new Map<string, boolean>()

      if (connectionStatusResponse?.services?.length) {
        connectionStatusResponse.services.forEach((service: any) => {
          if (service?.name) {
            connectionStatusMap.set(String(service.name).toLowerCase(), !!service.connected)
          }
        })
      }

      const modulesWithDetails = await Promise.all(
        modulesListResponse.modules.map(async (moduleInfo: any) => {
          try {
            const moduleDetails = await $fetch(`${backendUrl}/api/modules/${moduleInfo.name}`, { headers })
            return moduleDetails
          } catch (error) {
            return null
          }
        })
      )

      const validModules = modulesWithDetails.filter(module => module?.success && module)

      return transformBackendModulesToServices(validModules.map(m => m), connectionStatusMap)
    } catch (error) {
      return getFallbackServices()
    }
  }

  const transformBackendModulesToServices = (modules: any[], connectionStatusMap?: Map<string, boolean>): Service[] => {

    const categoryMapping: Record<string, Service['category']> = {
      'timer': 'automation',
      'console': 'development',
      'discord': 'communication',
      'openai': 'productivity',
      'email': 'communication'
    }

    const iconMapping: Record<string, string> = {
      'timer': 'i-heroicons-clock',
      'console': 'i-heroicons-computer-desktop',
      'discord': 'i-logos-discord-icon',
      'openai': 'i-logos-openai-icon',
      'email': 'i-heroicons-envelope'
    }

    return modules.map(moduleResponse => {
      const module = moduleResponse.success ? moduleResponse : moduleResponse


      const moduleName = module.moduleName || module.name
      const normalizedModuleName = String(moduleName || '').toLowerCase()
      const authType = mapAuthType(module.authType)
      const requiresConnection = authType === 'oauth'
      const isConnected = requiresConnection
        ? !!connectionStatusMap?.get(normalizedModuleName)
        : true
      const disabledReason = module.isActive === false
        ? 'Service désactivé'
        : (requiresConnection && !isConnected ? 'Connexion requise' : undefined)
      const service: Service = {
        id: moduleName,
        name: module.displayName || moduleName,
        slug: moduleName,
        description: module.description || '',
        icon: iconMapping[moduleName] || 'i-heroicons-cog',
        iconUrl: (moduleName === 'timer' || moduleName === 'console') ? undefined : module.iconUrl,
        color: module.color || '#6B7280',
        isActive: module.isActive !== false,
        category: categoryMapping[moduleName] || 'other',
        authType,
        requiresConnection,
        isConnected,
        disabledReason,
        actions: transformBackendTriggers(module.triggers || []),
        reactions: transformBackendActions(module.actions || [])
      }



      return service
    })
  }

  const mapAuthType = (backendAuthType: string): Service['authType'] => {
    switch (backendAuthType) {
      case 'oauth2': return 'oauth'
      case 'api_key': return 'api_key'
      case 'webhook': return 'webhook'
      case 'none':
      default: return 'none'
    }
  }

  const transformBackendTriggers = (triggers: any[]): ServiceAction[] => {
    return triggers.map(trigger => {
      const identifier = trigger.id || trigger.uuid || trigger.name
      const transformed = {
        id: identifier,
        name: trigger.description || trigger.displayName || trigger.name,
        description: trigger.description || '',
        parameters: transformConfigSchemaToParameters(trigger.configSchema),
        triggers: [trigger.type || 'webhook']
      }
      return transformed
    })
  }

  const transformBackendActions = (actions: any[]): ServiceReaction[] => {
    return actions.map(action => {
      const identifier = action.id || action.uuid || action.name
      const transformed = {
        id: identifier,
        name: action.description || action.displayName || action.name,
        description: action.description || '',
        parameters: transformConfigSchemaToParameters(action.configSchema),
        requiredData: action.requiredScopes || []
      }
      return transformed
    })
  }

  const transformConfigSchemaToParameters = (configSchema: any): ActionParameter[] => {
    if (!configSchema || !configSchema.properties) {
      return []
    }

    const required = configSchema.required || []

    return Object.entries(configSchema.properties).map(([name, prop]: [string, any]) => {
      const parameter: ActionParameter = {
        name,
        type: mapSchemaTypeToParameterType(prop, name),
        required: required.includes(name),
        description: prop.description || prop.title || '',
        placeholder: prop.example || prop.placeholder
      }

      if (prop.enum) {
        parameter.options = prop.enum
      }

      if (prop.pattern || prop.minimum !== undefined || prop.maximum !== undefined) {
        parameter.validation = {}
        if (prop.pattern) parameter.validation.pattern = prop.pattern
        if (prop.minimum !== undefined) parameter.validation.min = prop.minimum
        if (prop.maximum !== undefined) parameter.validation.max = prop.maximum
      }

      return parameter
    })
  }

  const mapSchemaTypeToParameterType = (prop: any, fieldName: string): ActionParameter['type'] => {
    if (fieldName.toLowerCase().includes('channel')) {
      return 'discord_channel'
    }
    if (fieldName.toLowerCase().includes('email')) {
      return 'email'
    }
    if (fieldName.toLowerCase().includes('url')) {
      return 'url'
    }

    if (fieldName.toLowerCase().includes('model') && prop.enum) {
      const description = prop.description?.toLowerCase() || ''
      if (description.includes('gpt') || description.includes('openai')) {
        return 'select'
      }
    }

    switch (prop.type) {
      case 'boolean':
        return 'boolean'
      case 'number':
      case 'integer':
        return 'number'
      case 'string':
        if (prop.format === 'date-time' || prop.format === 'date' || prop.format === 'time') {
          return 'date'
        }
        if (prop.format === 'email') {
          return 'email'
        }
        if (prop.format === 'uri' || prop.format === 'url') {
          return 'url'
        }
        if (prop.enum) {
          return 'select'
        }
        return 'string'
      default:
        return 'string'
    }
  }

  const getFallbackServices = (): Service[] => {
    return [
      {
        id: 'timer',
        name: 'Timer / Scheduler',
        slug: 'timer',
        description: 'Déclenche des actions selon un horaire (TRIGGER)',
        icon: 'i-heroicons-clock',
        color: '#FF6B6B',
        isActive: true,
        category: 'automation',
        authType: 'none',
        requiresConnection: false,
        isConnected: true,
        actions: [
          {
            id: 'daily_at_time',
            name: 'Tous les jours à X heures',
            description: 'Se déclenche tous les jours à une heure précise',
            parameters: [
              {
                name: 'time',
                type: 'string',
                required: true,
                description: 'Heure de déclenchement (format HH:mm)',
                placeholder: '09:00'
              }
            ],
            triggers: ['schedule']
          }
        ],
        reactions: []
      }
    ]
  }

  const fetchServicesWithCategories = async () => {
    const services = await getAvailableServices()
    const categories = [
      { id: 'communication', name: 'Communication', icon: 'i-heroicons-chat-bubble-left-right' },
      { id: 'development', name: 'Développement', icon: 'i-heroicons-code-bracket' },
      { id: 'productivity', name: 'Productivité', icon: 'i-heroicons-chart-bar' },
      { id: 'automation', name: 'Automation', icon: 'i-heroicons-clock' },
      { id: 'storage', name: 'Stockage', icon: 'i-heroicons-cloud' },
      { id: 'other', name: 'Autres', icon: 'i-heroicons-ellipsis-horizontal' }
    ]

    return { services, categories }
  }

  /**
   * OAuth service authentication - ready for backend integration
   */
  const authenticateService = async (serviceId: string) => {
    // TODO: Replace with actual OAuth flow
    return Promise.resolve({ success: true, authUrl: null })
  }

  /**
   * Check if service is properly connected - ready for backend integration
   */
  const checkServiceConnection = async (serviceId: string) => {
    // TODO: Replace with actual API call
    return Promise.resolve(true)
  }

  /**
   * Open service configuration modal
   */
  const openConfigModal = (service: Service, blockType: 'trigger' | 'action', callback: (config: ServiceConfiguration) => void) => {
    selectedService.value = service
    selectedBlockType.value = blockType
    pendingServiceCallback.value = callback
    showConfigModal.value = true
  }

  /**
   * Close service configuration modal
   */
  const closeConfigModal = () => {
    showConfigModal.value = false
    selectedService.value = null
    pendingServiceCallback.value = null
    isEditingConfiguration.value = false
    currentConfiguration.value = null
  }

  /**
   * Handle service configuration confirmation
   */
  const onConfigurationConfirmed = (config: ServiceConfiguration) => {
    if (pendingServiceCallback.value) {
      pendingServiceCallback.value(config)
      pendingServiceCallback.value = null
    }
    closeConfigModal()
  }

  /**
   * Complete service selection workflow with configuration
   */
  const selectServiceWithConfiguration = (service: Service, blockType: 'trigger' | 'action', callback: (config: ServiceConfiguration) => void) => {
    // Close service selection modal first
    closeServiceModal()

    // Open configuration modal
    openConfigModal(service, blockType, callback)
  }

  /**
   * Open configuration modal for editing existing block
   */
  const editServiceConfiguration = (service: Service, blockType: 'trigger' | 'action', initialConfig: ServiceConfiguration, callback: (config: ServiceConfiguration) => void) => {
    selectedService.value = service
    selectedBlockType.value = blockType

    // Create a new configuration object to ensure reactivity
    currentConfiguration.value = {
      service: initialConfig.service,
      selectedAction: initialConfig.selectedAction,
      selectedReaction: initialConfig.selectedReaction,
      parameters: { ...initialConfig.parameters }
    }

    isEditingConfiguration.value = true
    pendingServiceCallback.value = callback
    showConfigModal.value = true
  }

  return {
    // Service selection
    showServiceModal,
    openServiceModal,
    closeServiceModal,
    onServiceSelected,
    handlePreSelectedService,
    getAvailableServices,
    fetchServicesWithCategories,
    authenticateService,
    checkServiceConnection,

    // Service configuration
    showConfigModal: readonly(showConfigModal),
    selectedService: readonly(selectedService),
    selectedBlockType: readonly(selectedBlockType),
    isEditingConfiguration: readonly(isEditingConfiguration),
    currentConfiguration: readonly(currentConfiguration),
    openConfigModal,
    closeConfigModal,
    onConfigurationConfirmed,
    selectServiceWithConfiguration,
    editServiceConfiguration
  }
}
