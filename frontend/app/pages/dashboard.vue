<template>
  <div class="min-h-screen" style="font-family: var(--font-family-sans); background: var(--bg-primary);">

    <!-- Dashboard Header -->
    <section style="background: var(--bg-card);">
      <UContainer class="py-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="space-y-2">
            <h1 class="text-3xl font-bold" style="color: var(--text-primary);">
              Mes Automatisations
            </h1>
            <p class="text-lg" style="color: var(--text-secondary);">
              Gérez et surveillez vos workflows automatisés
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <UButton
              size="lg"
              variant="outline"
              class="px-6 py-3 smooth-hover"
              style="border-color: var(--border-color); color: var(--text-primary);"
              @click="refresh"
              :loading="isLoading"
            >
              <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 mr-2" />
              Actualiser
            </UButton>

            <UButton
              size="lg"
              class="px-6 py-3 smooth-hover"
              style="background: var(--color-tertiary); color: var(--text-white);"
              @click="navigateTo('/workflow/create')"
            >
              <UIcon name="i-heroicons-plus" class="w-5 h-5 mr-2" />
              Nouvelle automatisation
            </UButton>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Stats Overview -->
    <section class="py-8 stats-overview" style="background: var(--bg-primary);">
      <UContainer>
        <!-- Loading State -->
        <div v-if="isLoading && areas.length === 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div v-for="i in 4" :key="i" class="animate-pulse">
            <div class="h-24 rounded-lg" style="background: var(--bg-card);"></div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div class="flex items-center">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500 mr-2" />
            <span class="text-red-700">{{ error }}</span>
            <UButton variant="ghost" size="sm" @click="refresh" class="ml-auto">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
              Réessayer
            </UButton>
          </div>
        </div>

        <!-- Stats Cards -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <UiInfoCard
            v-for="card in statsCards"
            :key="card.title"
            :title="card.title"
            :value="card.value"
            :icon="card.icon"
            :description="card.description"
            :variant="card.variant"
            layout="stat"
            :hoverable="false"
          />
        </div>

        <!-- Workflows Section -->
        <div class="space-y-6">
          <!-- Empty State -->
          <div v-if="areas.length === 0 && !isLoading" class="text-center py-12">
            <UIcon name="i-heroicons-cog-6-tooth" class="w-16 h-16 mx-auto mb-4" style="color: var(--text-secondary);" />
            <h3 class="text-xl font-semibold mb-2" style="color: var(--text-primary);">Aucune automatisation</h3>
            <p class="mb-6" style="color: var(--text-secondary);">Créez votre première automatisation pour commencer</p>
            <UButton
              size="lg"
              style="background: var(--color-tertiary); color: var(--text-white);"
              @click="navigateTo('/workflow/create')"
            >
              <UIcon name="i-heroicons-plus" class="w-5 h-5 mr-2" />
              Créer une automatisation
            </UButton>
          </div>

          <!-- Areas List -->
          <template v-else>
            <UiAreaCard
              v-for="area in areas"
              :key="area.id"
              :area="area"
              @toggle="handleToggleArea"
              @delete="handleDeleteArea"
              @configure="handleConfigureArea"
            />

            <!-- Bouton d'ajout en bas -->
            <div
              class="glass-bar add-workflow-bar group cursor-pointer"
              @click="navigateTo('/workflow/create')"
            >
              <div class="add-bar-content">
                <div class="add-icon-circle">
                  <UIcon name="i-heroicons-plus" class="w-6 h-6" />
                </div>
                <div class="add-text">
                  <h3 class="add-bar-title">Créer une nouvelle automatisation</h3>
                  <p class="add-bar-subtitle">Connectez vos applications en quelques clics</p>
                </div>
              </div>
            </div>
          </template>
        </div>
      </UContainer>
    </section>

  </div>
</template>

<script setup lang="ts">
import type { AreaData } from '~/types'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Dashboard composable with real backend integration
const {
  areas,
  stats,
  statsCards,
  isLoading,
  error,
  initialize,
  toggleArea,
  deleteArea,
  refresh
} = useDashboard()

// Area management actions
const handleToggleArea = async (areaId: string, isActive: boolean) => {
  try {
    await toggleArea(areaId, isActive)
  } catch (err) {
    console.error('Failed to toggle area:', err)
  }
}

const handleDeleteArea = async (areaId: string) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette automatisation ?')) {
    try {
      await deleteArea(areaId)
    } catch (err) {
      console.error('Failed to delete area:', err)
    }
  }
}

const handleConfigureArea = (areaId: string) => {
  console.log('Configure area called with:', areaId, typeof areaId)
  navigateTo(`/workflow/${areaId}/edit`)
}

// Initialize dashboard on client side
onMounted(async () => {
  await initialize()
})

useHead({
  title: 'Dashboard - Mes Automatisations',
  meta: [
    { name: 'description', content: 'Gérez et surveillez vos automatisations AREA' }
  ]
})
</script>

<style scoped>
.stats-overview {
  position: relative;
}

.glass-bar {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.1);
}

.add-workflow-bar {
  border: 2px dashed rgba(167, 240, 186, 0.4);
  background: rgba(167, 240, 186, 0.05);
  transition: all 0.3s ease;
}

.add-workflow-bar:hover {
  background: rgba(167, 240, 186, 0.1);
  border-color: rgba(167, 240, 186, 0.6);
  transform: translateY(-1px);
}

.add-bar-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.add-icon-circle {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: rgba(167, 240, 186, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-tertiary);
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.add-workflow-bar:hover .add-icon-circle {
  background: rgba(167, 240, 186, 0.3);
  transform: scale(1.1);
}

.add-text {
  flex: 1;
}

.add-bar-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.add-bar-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.smooth-hover {
  transition: all 0.2s ease;
}

.smooth-hover:hover {
  transform: translateY(-1px);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .add-bar-content {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .add-text {
    text-align: center;
  }
}
</style>