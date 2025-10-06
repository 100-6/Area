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