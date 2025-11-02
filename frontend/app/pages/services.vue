<template>
  <div class="services-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">
            <span class="highlight-gradient">Nos Services</span>
          </h1>
          <p class="hero-description">
            Découvrez tous les services disponibles pour créer vos automatisations.
            Connectez vos applications préférées et automatisez vos tâches quotidiennes.
          </p>
          <div class="hero-stats">
            <div class="stat">
              <span class="stat-number">{{ services.length }}</span>
              <span class="stat-label">Services disponibles</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ oauthServices }}</span>
              <span class="stat-label">OAuth connectés</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ apiServices }}</span>
              <span class="stat-label">Services API</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Services Grid Section -->
    <section class="services-section">
      <div class="container">
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Chargement des services...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <UIcon name="i-heroicons-exclamation-circle" class="error-icon" />
          <p>{{ error }}</p>
          <UButton @click="fetchServices" variant="outline">
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
            Réessayer
          </UButton>
        </div>

        <div v-else class="services-grid">
          <div
            v-for="service in services"
            :key="service.id"
            class="service-card"
            :style="{ '--service-color': service.color || '#10b981' }"
          >
            <div class="service-header">
              <div class="service-icon-wrapper">
                <img
                  v-if="service.iconUrl && service.iconUrl.startsWith('http')"
                  :src="service.iconUrl"
                  :alt="service.displayName"
                  class="service-icon"
                  @error="handleImageError"
                />
                <UIcon
                  v-else
                  :name="service.iconUrl || 'i-heroicons-cube'"
                  class="service-icon-fallback"
                />
              </div>
              <div class="service-badge" :class="getAuthTypeClass(service.authType)">
                {{ getAuthTypeLabel(service.authType) }}
              </div>
            </div>

            <div class="service-content">
              <h3 class="service-name">{{ service.displayName }}</h3>
              <p class="service-description">{{ service.description || 'Aucune description disponible' }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
interface Service {
  id: string
  name: string
  displayName: string
  description: string
  iconUrl: string
  color: string
  authType: string
  isActive: boolean
}

definePageMeta({
  layout: 'default'
})

const config = useRuntimeConfig()
const backendUrl = config.public.backendUrl || 'http://localhost:8080'

const services = ref<Service[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

const oauthServices = computed(() => services.value.filter(s => s.authType === 'oauth2').length)
const apiServices = computed(() => services.value.filter(s => s.authType === 'api').length)

const fetchServices = async () => {
  isLoading.value = true
  error.value = null

  try {
    const response = await $fetch<{ success: boolean, data: Service[] }>(`${backendUrl}/api/services`)

    if (response.success && response.data) {
      // Filtrer les services internes et convertir 'none' et 'bot_token' en 'api'
      services.value = response.data
        .filter(service => !['console', 'timer', 'logger', 'example', 'applemusic', 'books', 'currency'].includes(service.name))
        .map(service => ({
          ...service,
          authType: (service.authType === 'none' || service.authType === 'bot_token') ? 'api' : service.authType
        }))
    } else {
      throw new Error('Format de réponse invalide')
    }
  } catch (err: any) {
    console.error('Error fetching services:', err)
    error.value = err.message || 'Impossible de charger les services'
  } finally {
    isLoading.value = false
  }
}

const getAuthTypeLabel = (authType: string): string => {
  const labels: Record<string, string> = {
    'oauth2': 'OAuth 2.0',
    'api': 'API Key',
    'basic': 'Basic Auth'
  }
  return labels[authType] || authType
}

const getAuthTypeClass = (authType: string): string => {
  const classes: Record<string, string> = {
    'oauth2': 'badge-oauth',
    'api': 'badge-api',
    'basic': 'badge-basic'
  }
  return classes[authType] || 'badge-default'
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

onMounted(() => {
  fetchServices()
})

useHead({
  title: 'Services - Auto',
  meta: [
    { name: 'description', content: 'Découvrez tous les services disponibles pour créer vos automatisations.' }
  ]
})
</script>

<style scoped>
.services-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Hero Section */
.hero-section {
  padding: 4rem 0 3rem;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-card) 100%);
}

.hero-content {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.highlight-gradient {
  background: linear-gradient(90deg, #16a34a 0%, #4ade80 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  display: inline-block;
}

.hero-description {
  font-size: 1.25rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  flex-wrap: wrap;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2.5rem;
  font-weight: 700;
  color: #059669;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Services Section */
.services-section {
  padding: 3rem 0 5rem;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  color: var(--text-secondary);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  width: 3rem;
  height: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.service-card {
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 1.75rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.service-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--service-color);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.service-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--service-color);
}

.service-card:hover::before {
  opacity: 1;
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.service-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  padding: 0.5rem;
}

.service-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.service-icon-fallback {
  width: 2rem;
  height: 2rem;
  color: var(--service-color);
}

.service-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-oauth {
  background: rgba(22, 163, 74, 0.1);
  color: #16a34a;
  border: 1px solid rgba(22, 163, 74, 0.2);
}

.badge-api {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.badge-basic {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.badge-default {
  background: rgba(148, 163, 184, 0.1);
  color: #64748b;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.service-content {
  margin-bottom: 0;
}

.service-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.service-description {
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 0.95rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-description {
    font-size: 1rem;
  }

  .hero-stats {
    gap: 2rem;
  }

  .stat-number {
    font-size: 2rem;
  }

  .services-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 1.75rem;
  }

  .hero-stats {
    flex-direction: column;
    gap: 1.5rem;
  }
}
</style>
