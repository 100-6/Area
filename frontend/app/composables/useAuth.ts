import type { User, LoginData, RegisterData, UpdateProfileData, AuthResponse, ApiResponse } from '~/types'

export const useAuth = () => {
  const user = useState<User | null>('auth.user', () => null)
  const isLoggedIn = computed(() => !!user.value)

  const config = useRuntimeConfig()
  // Utilise l'URL serveur côté serveur, et l'URL publique côté client
  const backendUrl = process.server
    ? (config.backendUrl || 'http://area_backend_dev:8080')
    : (config.public.backendUrl || 'http://localhost:8080')


  const authToken = useCookie('auth-token', {
    default: () => '',
    secure: false, // false en développement pour HTTP
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7  // 7 jours au lieu de 1
  })

  const refreshToken = useCookie('refresh-token', {
    default: () => '',
    secure: false, // false en développement pour HTTP
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30  // 30 jours
  })

  const login = async (credentials: LoginData): Promise<void> => {
    try {
      const response = await $fetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: credentials,
        baseURL: backendUrl
      })

      authToken.value = response.token
      refreshToken.value = response.refreshToken
      user.value = response.user

      await navigateTo('/dashboard')
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(getErrorMessage(error))
    }
  }

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      const response = await $fetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: userData,
        baseURL: backendUrl
      })

      authToken.value = response.token
      refreshToken.value = response.refreshToken
      user.value = response.user

      await navigateTo('/dashboard')
    } catch (error: any) {
      console.error('Register error:', error)
      throw new Error(getErrorMessage(error))
    }
  }

  const logout = async (): Promise<void> => {
    try {
      if (refreshToken.value) {
        await $fetch('/api/auth/logout', {
          method: 'POST',
          body: { refreshToken: refreshToken.value },
          baseURL: backendUrl,
          headers: authToken.value ? {
            'Authorization': `Bearer ${authToken.value}`
          } : {}
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
      await navigateTo('/login')
    }
  }

  const verifyToken = async (): Promise<boolean> => {
    if (!authToken.value) return false

    try {
      const response = await $fetch<{ valid: boolean }>('/api/auth/verify', {
        method: 'GET',
        baseURL: backendUrl,
        headers: {
          'Authorization': `Bearer ${authToken.value}`
        }
      })

      if (response.valid) {
        await fetchUserData()
        return true
      } else {
        clearAuth()
        return false
      }
    } catch (error) {
      console.error('Token verification error:', error)
      clearAuth()
      return false
    }
  }

  const refreshTokens = async (): Promise<boolean> => {
    if (!refreshToken.value) return false

    try {
      const response = await $fetch<{ token: string, refreshToken: string }>('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: refreshToken.value },
        baseURL: backendUrl
      })

      authToken.value = response.token
      refreshToken.value = response.refreshToken
      await fetchUserData()
      return true
    } catch (error) {
      console.error('Token refresh error:', error)
      clearAuth()
      return false
    }
  }

  const loginWithProvider = (provider: string): void => {
    window.location.href = `${backendUrl}/api/auth/${provider}`
  }

  const getProviderAuthEndpoint = (provider: string): string => {
    // Special routes for certain providers
    const specialRoutes: Record<string, string> = {
      spotify: '/api/spotify/connect',
      gmail: '/api/gmail/connect',
      outlook: '/api/outlook/connect',
      trello: '/api/trello/connect',
      slack: '/api/slack/connect',
      twitch: '/api/twitch/connect',
      notion: '/api/notion/connect'
    }

    return specialRoutes[provider] || `/api/auth/${provider}`
  }

  const linkProvider = (provider: string): void => {
    if (!authToken.value) {
      throw new Error('Non authentifié')
    }

    const endpoint = getProviderAuthEndpoint(provider)
    const token = encodeURIComponent(authToken.value)
    window.location.href = `${backendUrl}${endpoint}?token=${token}`
  }

  const fetchUserData = async (): Promise<void> => {
    if (!authToken.value) return

    try {
      const response = await $fetch<{ success: boolean, user: User }>('/api/users/me', {
        method: 'GET',
        baseURL: backendUrl,
        headers: {
          'Authorization': `Bearer ${authToken.value}`
        }
      })

      if (response.success && response.user) {
        user.value = response.user
      }
    } catch (error) {
      console.error('Fetch user data error:', error)
      clearAuth()
    }
  }

  const clearAuth = (): void => {
    authToken.value = ''
    refreshToken.value = ''
    user.value = null
  }

  const initAuth = async (): Promise<void> => {
    if (authToken.value) {
      const isValid = await verifyToken()
      if (!isValid) {
        const refreshed = await refreshTokens()
        if (!refreshed) {
          // Clear invalid tokens if refresh fails
          clearAuth()
        }
      }
    }
  }

  const getErrorMessage = (error: any): string => {
    if (error?.data?.message) return error.data.message
    if (error?.data?.error) {
      // Gestion des erreurs de validation avec détails
      if (error.data.error === 'Validation failed' && error.data.details) {
        const validationErrors = error.data.details.map((err: any) => err.message).join(', ')
        return `Erreurs de validation: ${validationErrors}`
      }
      return error.data.error
    }
    if (error?.message) return error.message
    if (typeof error === 'string') return error
    return 'Une erreur est survenue'
  }

  const updateProfile = async (profileData: UpdateProfileData): Promise<void> => {
    if (!authToken.value) {
      throw new Error('Non authentifié')
    }

    try {
      const response = await $fetch<{ success: boolean, user: User }>('/api/users/me', {
        method: 'PATCH',
        body: profileData,
        baseURL: backendUrl,
        headers: {
          'Authorization': `Bearer ${authToken.value}`
        }
      })

      if (response.success && response.user) {
        user.value = response.user
      }
    } catch (error: any) {
      console.error('Profile update error:', error)
      throw new Error(getErrorMessage(error))
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!authToken.value) {
      throw new Error('Non authentifié')
    }

    try {
      const response = await $fetch<{ success: boolean, message: string }>('/api/users/changePassword', {
        method: 'POST',
        body: {
          currentPassword,
          newPassword
        },
        baseURL: backendUrl,
        headers: {
          'Authorization': `Bearer ${authToken.value}`
        }
      })

      if (!response.success) {
        throw new Error(response.message || 'Échec du changement de mot de passe')
      }
    } catch (error: any) {
      console.error('Change password error:', error)
      throw new Error(getErrorMessage(error))
    }
  }

  const deleteAccount = async (): Promise<void> => {
    if (!authToken.value) {
      throw new Error('Non authentifié')
    }

    try {
      const response = await $fetch<{ success: boolean, message: string }>('/api/users/me', {
        method: 'DELETE',
        baseURL: backendUrl,
        headers: {
          'Authorization': `Bearer ${authToken.value}`
        }
      })

      if (response.success) {
        // Clear auth and redirect to login
        clearAuth()
        await navigateTo('/login')
      } else {
        throw new Error(response.message || 'Échec de la suppression du compte')
      }
    } catch (error: any) {
      console.error('Delete account error:', error)
      throw new Error(getErrorMessage(error))
    }
  }

  return {
    user: readonly(user),
    isLoggedIn,
    authToken: readonly(authToken),
    login,
    register,
    logout,
    verifyToken,
    refreshTokens,
    loginWithProvider,
    linkProvider,
    initAuth,
    clearAuth,
    updateProfile,
    changePassword,
    deleteAccount
  }
}
