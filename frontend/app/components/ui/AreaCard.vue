<template>
  <div
    class="glass-bar workflow-bar group cursor-pointer"
    :class="{ 'opacity-60': !area.is_active }"
    @click="handleCardClick"
  >
    <!-- Gradient overlay au hover -->
    <div class="workflow-hover-gradient"></div>

    <div class="workflow-bar-content">
      <!-- Gauche: Info principale -->
      <div class="workflow-bar-left">
        <div class="workflow-services">
          <div class="service-placeholder">
            <UIcon name="i-heroicons-cog-6-tooth" class="w-6 h-6" style="color: var(--color-primary);" />
          </div>
        </div>

        <div class="workflow-info">
          <h3 class="workflow-bar-title">{{ area.name }}</h3>
          <p class="workflow-bar-description">{{ area.description || 'Aucune description' }}</p>
        </div>
      </div>

      <!-- Centre: Métriques -->
      <div class="workflow-bar-center">
        <div class="stats-group">
          <div class="stat-item">
            <span class="stat-value">{{ area.execution_count || 0 }}</span>
            <span class="stat-label">exécutions</span>
          </div>
          <div v-if="area.last_triggered_at" class="stat-item">
            <span class="stat-value">{{ formatLastRun(area.last_triggered_at) }}</span>
            <span class="stat-label">dernière fois</span>
          </div>
        </div>
      </div>

      <!-- Droite: Status et actions -->
      <div class="workflow-bar-right">
        <UiStatusIndicator
          :status="getAreaStatus(area)"
          :label="getStatusLabel(area)"
        />

        <UDropdownMenu
          :items="getAreaActions(area)"
          :ui="{
            content: 'bg-white shadow-xl border border-gray-200 rounded-lg',
            item: 'text-gray-700 hover:bg-gray-50',
            itemLeadingIcon: 'text-gray-500'
          }"
        >
          <UButton
            variant="ghost"
            size="sm"
            icon="i-heroicons-ellipsis-horizontal"
            class="bar-action-menu"
            @click.stop
          />
        </UDropdownMenu>
      </div>
    </div>

    <!-- Hover glow effect -->
    <div class="workflow-bar-glow"></div>
  </div>

  <!-- Rename Modal -->
  <UModal
    v-model:open="showRenameModal"
    :prevent-close="false"
    :ui="{
      content: 'fixed bg-white divide-y divide-gray-200 flex flex-col focus:outline-none border-0 ring-0 shadow-xl',
      overlay: 'fixed inset-0 bg-gray-900/50',
      header: 'flex items-center gap-1.5 p-4 sm:px-6 min-h-16 bg-white',
      body: 'flex-1 overflow-y-auto p-4 sm:p-6 bg-white',
      footer: 'flex items-center gap-1.5 p-4 sm:px-6 bg-white'
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="rename-icon">
          <UIcon name="i-heroicons-pencil" class="w-5 h-5" style="color: var(--color-primary);" />
        </div>
        <h3 style="color: var(--text-primary); font-size: 1.25rem; font-weight: 600; margin: 0;">
          Renommer l'automatisation
        </h3>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
            Nouveau nom
          </label>
          <UInput
            v-model="newAreaName"
            placeholder="Entrez le nouveau nom..."
            size="lg"
            maxlength="100"
            style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);"
            @keyup.enter="confirmRename"
            @keyup.escape="cancelRename"
          />
        </div>
        <p class="text-sm" style="color: var(--text-secondary);">
          Le nom de l'automatisation sera mis à jour immédiatement.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          variant="outline"
          @click="cancelRename"
          style="background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border-color);"
        >
          Annuler
        </UButton>
        <UButton
          @click="confirmRename"
          :disabled="!newAreaName.trim() || newAreaName.trim() === area.name"
          style="background: var(--color-tertiary); color: var(--text-white);"
        >
          Renommer
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { AreaData } from '~/types'

interface Props {
  area: AreaData
}

interface Emits {
  toggle: [areaId: string, isActive: boolean]
  delete: [areaId: string]
  configure: [areaId: string]
  rename: [areaId: string, newName: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * Handle card click to navigate to edit page
 */
const handleCardClick = (event: Event) => {
  // Ignore the event object, just use the area ID
  console.log('AreaCard click - area.id:', props.area.id, typeof props.area.id)
  emit('configure', props.area.id)
}

/**
 * Format last run time to human readable
 */
const formatLastRun = (lastRun: Date | string) => {
  const date = new Date(lastRun)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) return `${diffMins}min`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}j`
  return `${Math.floor(diffDays / 7)}sem`
}

/**
 * Get area status for display
 */
const getAreaStatus = (area: AreaData) => {
  if (!area.is_active) return 'paused'
  if (area.last_execution_status === 'failed') return 'error'
  if (area.last_execution_status === 'pending') return 'pending'
  return 'active'
}

/**
 * Get status label
 */
const getStatusLabel = (area: AreaData) => {
  const status = getAreaStatus(area)
  switch (status) {
    case 'active': return 'Actif'
    case 'paused': return 'En pause'
    case 'error': return 'Erreur'
    case 'pending': return 'En cours'
    default: return 'Inconnu'
  }
}

// State for rename modal
const showRenameModal = ref(false)
const newAreaName = ref('')

/**
 * Handle rename action
 */
const handleRename = () => {
  newAreaName.value = props.area.name
  showRenameModal.value = true
}

/**
 * Confirm rename action
 */
const confirmRename = () => {
  if (newAreaName.value.trim() && newAreaName.value.trim() !== props.area.name) {
    emit('rename', props.area.id, newAreaName.value.trim())
  }
  showRenameModal.value = false
  newAreaName.value = ''
}

/**
 * Cancel rename action
 */
const cancelRename = () => {
  showRenameModal.value = false
  newAreaName.value = ''
}

/**
 * Get dropdown actions for area
 */
const getAreaActions = (area: AreaData) => [
  [
    {
      label: area.is_active ? 'Mettre en pause' : 'Activer',
      icon: area.is_active ? 'i-heroicons-pause' : 'i-heroicons-play',
      onSelect: () => emit('toggle', area.id, !area.is_active)
    }
  ],
  [
    {
      label: 'Configurer',
      icon: 'i-heroicons-cog-6-tooth',
      onSelect: () => emit('configure', area.id)
    },
    {
      label: 'Renommer',
      icon: 'i-heroicons-pencil',
      onSelect: () => handleRename()
    }
  ],
  [
    {
      label: 'Supprimer',
      icon: 'i-heroicons-trash',
      color: 'error',
      onSelect: () => emit('delete', area.id)
    }
  ]
]
</script>

<style scoped>
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

.glass-bar:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 8px 16px rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(167, 240, 186, 0.4);
}

.workflow-hover-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(167, 240, 186, 0.1), rgba(255, 255, 255, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.glass-bar:hover .workflow-hover-gradient {
  opacity: 1;
}

.workflow-bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 2;
  gap: 2rem;
}

.workflow-bar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.workflow-services {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.service-placeholder {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: rgba(167, 240, 186, 0.1);
  border: 1px solid rgba(167, 240, 186, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.workflow-info {
  min-width: 0;
  flex: 1;
}

.workflow-bar-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.workflow-bar-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.workflow-bar-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stats-group {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 0;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.2;
}

.workflow-bar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.bar-action-menu {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.glass-bar:hover .bar-action-menu {
  opacity: 1;
}

.workflow-bar-glow {
  position: absolute;
  inset: -2px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(167, 240, 186, 0.3), rgba(72, 199, 116, 0.1));
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: -1;
}

.glass-bar:hover .workflow-bar-glow {
  opacity: 1;
}

.rename-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: rgba(167, 240, 186, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .workflow-bar-content {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .workflow-bar-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .stats-group {
    justify-content: space-around;
    width: 100%;
  }

  .workflow-bar-right {
    justify-content: space-between;
    width: 100%;
  }
}
</style>