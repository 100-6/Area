// Import User type
import type { User } from './User'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

export interface AuthResponse {
  message: string
  user: User
  token: string
  refreshToken: string
}

export interface TokenVerifyResponse {
  valid: boolean
  user?: User
}

export interface RefreshTokenResponse {
  token: string
  refreshToken: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
  meta?: PaginationMeta
}

export interface ErrorResponse {
  success: false
  error: string
  details?: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  value?: any
  code?: string
}

// Workflow API types
export interface CreateWorkflowRequest {
  name: string
  description?: string
  blocks: WorkflowBlockRequest[]
  connections: WorkflowConnectionRequest[]
}

export interface WorkflowBlockRequest {
  id: string
  serviceId: string
  type: 'trigger' | 'action'
  position: { x: number; y: number }
  config: Record<string, any>
}

export interface WorkflowConnectionRequest {
  from: string
  to: string
}

export interface UpdateWorkflowRequest extends Partial<CreateWorkflowRequest> {
  isActive?: boolean
}

// Service API types
export interface ServiceConnectionRequest {
  serviceId: string
  authData?: Record<string, any>
}

export interface ServiceConnectionResponse {
  id: string
  serviceId: string
  isConnected: boolean
  authUrl?: string
  expiresAt?: string
  metadata?: Record<string, any>
}

// Authentication API types
export interface OAuthInitiateRequest {
  serviceId: string
  redirectUrl?: string
}

export interface OAuthInitiateResponse {
  authUrl: string
  state: string
}

export interface OAuthCallbackRequest {
  code: string
  state: string
  serviceId: string
}

// Webhook API types
export interface WebhookPayload {
  workflowId: string
  triggerId: string
  data: Record<string, any>
  timestamp: string
}

// Analytics API types
export interface WorkflowAnalytics {
  workflowId: string
  executions: {
    total: number
    successful: number
    failed: number
    lastExecution?: string
  }
  performance: {
    averageExecutionTime: number
    successRate: number
  }
  period: {
    from: string
    to: string
  }
}

// Error types
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_FAILED'
  | 'AUTHORIZATION_FAILED'
  | 'RESOURCE_NOT_FOUND'
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'WORKFLOW_EXECUTION_FAILED'
  | 'SERVICE_CONNECTION_FAILED'
  | 'INVALID_CONFIGURATION'
  | 'INTERNAL_SERVER_ERROR'