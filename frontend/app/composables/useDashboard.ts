import type { AreaData, AreaStats } from '~/types'

/**
 * Dashboard data management with real-time stats and area management
 */
export const useDashboard = () => {
  const areas = ref<AreaData[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const config = useRuntimeConfig()
  const backendUrl = process.server
    ? (config.backendUrl || 'http://area_backend_dev:8080')
    : (config.public.backendUrl || 'http://localhost:8080')

  /**
   * Fetch user areas from backend
   */
  const fetchAreas = async () => {
    try {
      isLoading.value = true
      error.value = null

      // Real backend call
      const authToken = useCookie('auth-token')

      if (!authToken.value) {
        throw new Error('Token d\'authentification manquant')
      }

      const response = await $fetch('/api/areas', {
        baseURL: backendUrl,
        headers: {
          'Authorization': `Bearer ${authToken.value}`
        }
      })

      if (response.success) {
        areas.value = response.areas || []
      } else {
        throw new Error(response.message || 'Failed to fetch areas')
      }
    } catch (err: any) {
      // Handle authentication errors
      if (err.status === 401 || err.statusCode === 401) {
        error.value = 'Session expirée, veuillez vous reconnecter'
        // Redirect to login
        await navigateTo('/login')
        return
      }

      error.value = err.message || 'Erreur lors du chargement des automatisations'
      console.error('Failed to fetch areas:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Toggle area active status
   */
  const toggleArea = async (areaId: string, isActive: boolean) => {
    try {

      // Real backend call
      const authToken = useCookie('auth-token')

      const response = await $fetch(`/api/areas/${areaId}/toggle`, {
        method: 'PATCH',
        baseURL: backendUrl,
        headers: {
          'Authorization': `Bearer ${authToken.value}`,
          'Content-Type': 'application/json'
        },
        body: { is_active: isActive }
      })

      if (response.success) {
        // Update local state
        const area = areas.value.find(a => a.id === areaId)
        if (area) {
          area.is_active = isActive
          area.updated_at = new Date()
        }
      } else {
        throw new Error(response.message || 'Failed to toggle area')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la modification'
      throw err
    }
  }

  /**
   * Delete an area
   */
  const deleteArea = async (areaId: string) => {
    try {
      const authToken = useCookie('auth-token')

      const response = await $fetch(`/api/areas/${areaId}`, {
        method: 'DELETE',
        baseURL: backendUrl,
        headers: {
          'Authorization': `Bearer ${authToken.value}`
        }
      })

      if (response.success) {
        // Remove from local state
        areas.value = areas.value.filter(a => a.id !== areaId)
      } else {
        throw new Error(response.message || 'Failed to delete area')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la suppression'
      throw err
    }
  }

  /**
   * Rename an area
   */
  const renameArea = async (areaId: string, newName: string) => {
    try {
      const authToken = useCookie('auth-token')

      const response = await $fetch(`/api/areas/${areaId}`, {
        method: 'PATCH',
        baseURL: backendUrl,
        headers: {
          'Authorization': `Bearer ${authToken.value}`,
          'Content-Type': 'application/json'
        },
        body: { name: newName }
      })

      if (response.success) {
        const area = areas.value.find(a => a.id === areaId)
        if (area) {
          area.name = newName
          area.updated_at = new Date()
        }
      } else {
        throw new Error(response.message || 'Failed to rename area')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors du renommage'
      throw err
    }
  }

  /**
   * Create a new area
   */
  const createArea = async (data: { name: string; description?: string }) => {
    try {
      const authToken = useCookie('auth-token')

      const response = await $fetch('/api/areas', {
        method: 'POST',
        baseURL: backendUrl,
        headers: {
          'Authorization': `Bearer ${authToken.value}`,
          'Content-Type': 'application/json'
        },
        body: data
      })

      if (response.success) {
        areas.value.unshift(response.area)
        return response.area
      } else {
        throw new Error(response.message || 'Failed to create area')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la création'
      throw err
    }
  }

  /**
   * Calculate dashboard statistics
   */
  const stats = computed<AreaStats>(() => {
    const areasArray = areas.value || []

    const totalAreas = areasArray.length
    const activeAreas = areasArray.filter(a => a.is_active).length
    const totalExecutions = areasArray.reduce((sum, a) => sum + (a.execution_count || 0), 0)

    // Calculate success rate based on last execution status
    // Count areas with executions and their status
    const areasWithExecutions = areasArray.filter(a => (a.execution_count || 0) > 0)

    // Count successful executions (status = 'success')
    const successfulAreas = areasWithExecutions.filter(a => a.last_execution_status === 'success')

    // Count failed executions (status = 'failed')
    const failedAreas = areasWithExecutions.filter(a => a.last_execution_status === 'failed')

    // Count pending executions (status = 'pending' or no status)
    const pendingAreas = areasWithExecutions.filter(a =>
      a.last_execution_status === 'pending' || !a.last_execution_status
    )

    // Calculate success rate: successful / (successful + failed)
    // We exclude pending from the calculation
    const totalCompleted = successfulAreas.length + failedAreas.length
    const successRate = totalCompleted > 0
      ? Math.round((successfulAreas.length / totalCompleted) * 100)
      : 100 // 100% si aucune exécution complétée (pour éviter 0%)

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentActivity = areasArray.filter(a =>
      a.last_triggered_at && new Date(a.last_triggered_at) > sevenDaysAgo
    ).sort((a, b) =>
      new Date(b.last_triggered_at!).getTime() - new Date(a.last_triggered_at!).getTime()
    ).slice(0, 5)

    return {
      totalAreas,
      activeAreas,
      totalExecutions,
      successRate,
      recentActivity
    }
  })

  /**
   * Formatted stats for display cards
   */
  const statsCards = computed(() => [
    {
      title: 'Automatisations',
      value: stats.value.totalAreas,
      icon: 'i-heroicons-cog-6-tooth',
      description: `${stats.value.activeAreas} actives`
    },
    {
      title: 'Exécutions',
      value: stats.value.totalExecutions,
      icon: 'i-heroicons-play',
      description: 'Total des déclenchements'
    },
    {
      title: 'Taux de succès',
      value: `${stats.value.successRate}%`,
      icon: 'i-heroicons-check-circle',
      description: 'Exécutions réussies',
      variant: stats.value.successRate >= 80 ? 'success' : stats.value.successRate >= 60 ? 'warning' : 'danger'
    },
    {
      title: 'Activité récente',
      value: stats.value.recentActivity.length,
      icon: 'i-heroicons-clock',
      description: '7 derniers jours'
    }
  ])

  /**
   * Auto refresh functionality
   */
  let refreshInterval: NodeJS.Timeout | null = null

  const pauseRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  const resumeRefresh = () => {
    if (process.client) {
      pauseRefresh() // Clear any existing interval
      refreshInterval = setInterval(fetchAreas, 30000) // 30 seconds
    }
  }

  /**
   * Refresh data manually
   */
  const refresh = async () => {
    await fetchAreas()
  }

  /**
   * Initialize dashboard
   */
  const initialize = async () => {
    await fetchAreas()
    resumeRefresh()
  }

  /**
   * Cleanup on unmount
   */
  onUnmounted(() => {
    pauseRefresh()
  })

  /**
   * Get area by ID
   */
  const getAreaById = (areaId: string) => {
    return areas.value.find(a => a.id === areaId)
  }

  /**
   * Filter areas by status
   */
  const getAreasByStatus = (isActive: boolean) => {
    return areas.value.filter(a => a.is_active === isActive)
  }

  /**
   * Get areas sorted by last triggered
   */
  const getRecentlyTriggeredAreas = (limit = 5) => {
    return areas.value
      .filter(a => a.last_triggered_at)
      .sort((a, b) => new Date(b.last_triggered_at!).getTime() - new Date(a.last_triggered_at!).getTime())
      .slice(0, limit)
  }

  return {
    // State
    areas: readonly(areas),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    stats,
    statsCards,

    // Methods
    fetchAreas,
    toggleArea,
    deleteArea,
    renameArea,
    createArea,
    refresh,
    initialize,
    getAreaById,
    getAreasByStatus,
    getRecentlyTriggeredAreas,

    // Auto refresh control
    pauseRefresh,
    resumeRefresh
  }
}