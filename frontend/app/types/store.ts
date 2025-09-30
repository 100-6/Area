import type { User } from './User'
import type { Workflow } from './Workflow'
import type { Service, ServiceConnection } from './Service'
import type { NotificationProps } from './components'

export interface AuthState {
  user: User | null
  isLoggedIn: boolean
  token: string | null
  refreshToken: string | null
  isLoading: boolean
}

export interface WorkflowState {
  workflows: Workflow[]
  currentWorkflow: Workflow | null
  isLoading: boolean
  filters: {
    status: string[]
    services: string[]
    search: string
  }
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export interface ServiceState {
  services: Service[]
  connections: ServiceConnection[]
  isLoading: boolean
  availableServices: Service[]
}

export interface AppState {
  theme: 'light' | 'dark' | 'auto'
  sidebarOpen: boolean
  notifications: NotificationProps[]
  isOnline: boolean
  lastSync?: string
  settings: AppSettings
}

export interface AppSettings {
  language: 'fr' | 'en'
  timezone: string
  emailNotifications: boolean
  pushNotifications: boolean
  webhookTimeout: number
  maxWorkflowRuns: number
  autoSave: boolean
  compactMode: boolean
}

export interface DashboardState {
  stats: DashboardStats
  recentExecutions: any[]
  quickActions: QuickAction[]
  isLoading: boolean
}

export interface DashboardStats {
  totalWorkflows: number
  activeWorkflows: number
  totalExecutions: number
  successRate: number
  executionsToday: number
  executionsThisWeek: number
  executionsThisMonth: number
  averageExecutionTime: number
}

export interface QuickAction {
  id: string
  label: string
  description: string
  icon: string
  action: () => void
  disabled?: boolean
}

// Actions pour les stores
export interface StoreAction<T = any> {
  type: string
  payload?: T
}

// État global de l'application
export interface RootState {
  auth: AuthState
  workflows: WorkflowState
  services: ServiceState
  app: AppState
  dashboard: DashboardState
}