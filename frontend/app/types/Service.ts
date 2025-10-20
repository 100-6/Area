export interface Service {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  iconUrl?: string
  color: string
  isActive: boolean
  category: 'communication' | 'productivity' | 'social' | 'storage' | 'development' | 'automation' | 'other'
  authType: 'oauth' | 'api_key' | 'webhook' | 'none'
  /** Indicates if the service needs a user-specific connection (OAuth/API key/etc.) */
  requiresConnection?: boolean
  /** True when the current user has provided the required credentials */
  isConnected?: boolean
  /** Optional reason explaining why the service is disabled */
  disabledReason?: string
  // AREA Concepts:
  // - actions: Things this service can DO (triggers that initiate workflows)
  // - reactions: Things this service can RESPOND TO (actions performed when triggered)
  actions: ServiceAction[]
  reactions: ServiceReaction[]
}

// ServiceAction: A trigger that can initiate an AREA workflow
// Example: Timer triggers (daily_at_time, every_weekday, etc.)
export interface ServiceAction {
  id: string
  name: string
  description: string
  parameters: ActionParameter[]
  triggers: string[] // Events this action can trigger
}

// ServiceReaction: An action that can be performed in response to a trigger
// Example: Console log action, Send email action, etc.
export interface ServiceReaction {
  id: string
  name: string
  description: string
  parameters: ActionParameter[]
  requiredData: string[] // Data fields required from the trigger
}

export interface ActionParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'date' | 'select' | 'discord_channel'
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
