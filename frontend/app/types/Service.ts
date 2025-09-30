export interface Service {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  isActive: boolean
  category: 'communication' | 'productivity' | 'social' | 'storage' | 'development' | 'other'
  authType: 'oauth' | 'api_key' | 'webhook'
  actions: ServiceAction[]
  reactions: ServiceReaction[]
}

export interface ServiceAction {
  id: string
  name: string
  description: string
  parameters: ActionParameter[]
  triggers: string[]
}

export interface ServiceReaction {
  id: string
  name: string
  description: string
  parameters: ActionParameter[]
  requiredData: string[]
}

export interface ActionParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'date' | 'select'
  required: boolean
  description: string
  placeholder?: string
  options?: string[] // Pour les select
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface ServiceConnection {
  id: string
  serviceId: string
  userId: string
  accessToken?: string
  refreshToken?: string
  apiKey?: string
  webhookUrl?: string
  isActive: boolean
  connectedAt: string
  lastUsed?: string
}

// Services pré-définis
export type ServiceType =
  | 'gmail'
  | 'slack'
  | 'discord'
  | 'github'
  | 'google-drive'
  | 'dropbox'
  | 'spotify'
  | 'twitter'
  | 'instagram'
  | 'webhook'