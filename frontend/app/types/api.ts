export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
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

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
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
}

// Import User type
import type { User } from './User'