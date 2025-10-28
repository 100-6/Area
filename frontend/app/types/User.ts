export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt?: string
  updatedAt?: string
  isActive?: boolean
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  acceptTerms: boolean
}

export interface UpdateProfileData {
  firstName: string
  lastName: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface AuthProviderInfo {
  provider: string
  displayName: string
  icon: string
  color?: string
  description?: string
  isConfigured: boolean
  isConnected: boolean
  isPrimary: boolean
  connectedAt?: string | null
  // Plus besoin d'oauthEndpoint - tous les services utilisent /api/auth/{service}
}
