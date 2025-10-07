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

  const getAvailableServices = (): Service[] => {
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
                placeholder: '09:00',
                validation: { pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' }
              },
              {
                name: 'timezone',
                type: 'select',
                required: false,
                description: 'Fuseau horaire',
                options: ['Europe/Paris', 'America/New_York', 'Asia/Tokyo', 'UTC']
              }
            ],
            triggers: ['schedule']
          },
          {
            id: 'every_weekday',
            name: 'Tous les jours de la semaine',
            description: 'Lundi à vendredi à une heure donnée',
            parameters: [
              {
                name: 'time',
                type: 'string',
                required: true,
                description: 'Heure de déclenchement (format HH:mm)',
                placeholder: '09:00',
                validation: { pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' }
              }
            ],
            triggers: ['schedule']
          },
          {
            id: 'every_x_minutes',
            name: 'Toutes les X minutes',
            description: 'Se répète à interval régulier',
            parameters: [
              {
                name: 'interval',
                type: 'number',
                required: true,
                description: 'Intervalle en minutes',
                placeholder: '30',
                validation: { min: 1, max: 1440 }
              }
            ],
            triggers: ['schedule']
          },
          {
            id: 'specific_date',
            name: 'À une date précise',
            description: 'Se déclenche une seule fois à une date et heure précises',
            parameters: [
              {
                name: 'datetime',
                type: 'date',
                required: true,
                description: 'Date et heure de déclenchement',
                placeholder: '2025-12-31T23:59:00'
              }
            ],
            triggers: ['schedule']
          },
          {
            id: 'custom_cron',
            name: 'Expression cron personnalisée',
            description: 'Pour les utilisateurs avancés : définir une expression cron',
            parameters: [
              {
                name: 'cronExpression',
                type: 'string',
                required: true,
                description: 'Expression cron (format: minute hour day month weekday)',
                placeholder: '0 9 * * 1-5',
                validation: { pattern: '^(\\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\\*/[0-9]+)\\s+(\\*|([0-9]|1[0-9]|2[0-3])|\\*/[0-9]+)\\s+(\\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\\*/[0-9]+)\\s+(\\*|([1-9]|1[0-2])|\\*/[0-9]+)\\s+(\\*|([0-6])|\\*/[0-9]+)$' }
              }
            ],
            triggers: ['schedule']
          }
        ],
        reactions: []
      },
      {
        id: 'console',
        name: 'Console Logger',
        slug: 'console',
        description: 'Service pour logger des messages (ACTION)',
        icon: 'i-heroicons-computer-desktop',
        color: '#6C757D',
        isActive: true,
        category: 'development',
        authType: 'none',
        actions: [],
        reactions: [
          {
            id: 'log',
            name: 'Log dans la console',
            description: 'Affiche un message dans la console du serveur',
            parameters: [
              {
                name: 'message',
                type: 'string',
                required: true,
                description: 'Le message à afficher',
                placeholder: 'Hello from AREA!'
              },
              {
                name: 'level',
                type: 'select',
                required: false,
                description: 'Niveau de log',
                options: ['info', 'warn', 'error', 'success']
              }
            ],
            requiredData: []
          }
        ]
      },
      {
        id: 'discord',
        name: 'Discord',
        slug: 'discord',
        description: 'Bot Discord pour gérer serveurs et messages',
        icon: 'i-logos-discord-icon',
        color: '#5865F2',
        isActive: true,
        category: 'communication',
        authType: 'oauth',
        actions: [
          {
            id: 'on_message_created',
            name: 'Nouveau message',
            description: 'Se déclenche quand un nouveau message est créé dans un channel',
            parameters: [
              {
                name: 'channelId',
                type: 'string',
                required: true,
                description: 'ID du channel Discord à surveiller',
                placeholder: '123456789012345678'
              }
            ],
            triggers: ['message_created']
          },
          {
            id: 'on_member_join',
            name: 'Nouveau membre',
            description: 'Se déclenche quand un nouveau membre rejoint le serveur',
            parameters: [],
            triggers: ['member_join']
          },
          {
            id: 'on_reaction_added',
            name: 'Réaction ajoutée',
            description: 'Se déclenche quand une réaction est ajoutée à un message',
            parameters: [
              {
                name: 'channelId',
                type: 'string',
                required: true,
                description: 'ID du channel Discord à surveiller',
                placeholder: '123456789012345678'
              },
              {
                name: 'emoji',
                type: 'string',
                required: false,
                description: 'Emoji spécifique à surveiller (optionnel)',
                placeholder: '👍'
              }
            ],
            triggers: ['reaction_added']
          }
        ],
        reactions: [
          {
            id: 'send_message',
            name: 'Envoyer un message',
            description: 'Envoie un message dans un channel Discord',
            parameters: [
              {
                name: 'channelId',
                type: 'string',
                required: true,
                description: 'ID du channel Discord où envoyer le message',
                placeholder: '123456789012345678'
              },
              {
                name: 'content',
                type: 'string',
                required: true,
                description: 'Le message à envoyer',
                placeholder: 'Hello from AREA!'
              }
            ],
            requiredData: []
          },
          {
            id: 'add_role',
            name: 'Ajouter un rôle',
            description: 'Ajoute un rôle à un utilisateur',
            parameters: [
              {
                name: 'guildId',
                type: 'string',
                required: true,
                description: 'ID du serveur Discord',
                placeholder: '123456789012345678'
              },
              {
                name: 'userId',
                type: 'string',
                required: true,
                description: 'ID de l\'utilisateur Discord',
                placeholder: '123456789012345678'
              },
              {
                name: 'roleId',
                type: 'string',
                required: true,
                description: 'ID du rôle à ajouter',
                placeholder: '123456789012345678'
              }
            ],
            requiredData: []
          },
          {
            id: 'kick_member',
            name: 'Expulser un membre',
            description: 'Expulse un membre du serveur Discord',
            parameters: [
              {
                name: 'guildId',
                type: 'string',
                required: true,
                description: 'ID du serveur Discord',
                placeholder: '123456789012345678'
              },
              {
                name: 'userId',
                type: 'string',
                required: true,
                description: 'ID de l\'utilisateur à expulser',
                placeholder: '123456789012345678'
              },
              {
                name: 'reason',
                type: 'string',
                required: false,
                description: 'Raison de l\'expulsion (optionnel)',
                placeholder: 'Violation des règles'
              }
            ],
            requiredData: []
          },
          {
            id: 'send_webhook_message',
            name: 'Envoyer un message via webhook',
            description: 'Envoie un message dans un channel Discord via webhook (sans bot)',
            parameters: [
              {
                name: 'webhookUrl',
                type: 'string',
                required: true,
                description: 'URL du webhook Discord',
                placeholder: 'https://discord.com/api/webhooks/...'
              },
              {
                name: 'content',
                type: 'string',
                required: true,
                description: 'Le message à envoyer',
                placeholder: 'Hello from AREA!'
              },
              {
                name: 'username',
                type: 'string',
                required: false,
                description: 'Nom d\'utilisateur personnalisé (optionnel)',
                placeholder: 'AREA Bot'
              },
              {
                name: 'avatarUrl',
                type: 'string',
                required: false,
                description: 'URL de l\'avatar personnalisé (optionnel)',
                placeholder: 'https://...'
              }
            ],
            requiredData: []
          }
        ]
      }
    ]
  }

  const fetchServicesWithCategories = async () => {
    const services = getAvailableServices()
    const categories = [
      { id: 'communication', name: 'Communication', icon: 'i-heroicons-chat-bubble-left-right' },
      { id: 'development', name: 'Développement', icon: 'i-heroicons-code-bracket' },
      { id: 'productivity', name: 'Productivité', icon: 'i-heroicons-chart-bar' },
      { id: 'automation', name: 'Automation', icon: 'i-heroicons-clock' },
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

    console.log('editServiceConfiguration - setting currentConfiguration:', currentConfiguration.value)
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