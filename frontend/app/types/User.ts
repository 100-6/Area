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