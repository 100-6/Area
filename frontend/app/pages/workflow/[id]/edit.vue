<template>
  <div class="workflow-creator">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="flex items-center justify-center min-h-screen">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin" style="color: var(--color-primary);" />
        <span class="ml-3" style="color: var(--text-primary);">Chargement du workflow...</span>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-overlay">
      <div class="flex flex-col items-center justify-center min-h-screen">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 mb-4" style="color: var(--color-error);" />
        <h2 style="color: var(--text-primary); margin-bottom: 0.5rem;">Erreur de chargement</h2>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">{{ error }}</p>
        <UButton @click="loadExistingWorkflow" style="background: var(--color-primary); color: var(--text-white);">
          Réessayer
        </UButton>
      </div>
    </div>

    <!-- Main workflow interface -->
    <template v-else>
      <!-- Header fixe -->
      <div class="workflow-header">
        <div class="flex items-center justify-between px-4 py-4 border-t" style="border-color: var(--border-color);">
          <div class="flex items-center gap-4 flex-1">
            <UButton
              variant="ghost"
              icon="i-heroicons-arrow-left"
              @click="navigateTo('/dashboard')"
              style="color: var(--text-secondary); transition: all 0.2s ease; padding: 0.5rem 1rem; border-radius: 0.5rem;"
              class="hover:bg-gray-100"
            >
              Retour au dashboard
            </UButton>
            <div class="flex-1">
              <h1 class="text-xl font-bold" style="color: var(--text-primary);">
                Éditer : {{ areaData?.name || 'Automatisation' }}
              </h1>
              <p class="text-sm" style="color: var(--text-secondary);">
                Modifiez votre workflow en ajoutant ou supprimant des services
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Zoom controls -->
            <div class="zoom-controls">
              <UButton
                variant="outline"
                size="sm"
                @click="zoomOut"
                style="background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-color); padding: 0.25rem 0.5rem; border-radius: 0.375rem; min-width: 32px; transition: all 0.2s ease;"
                class="hover:shadow-sm hover:bg-gray-50"
              >
                <UIcon name="i-heroicons-minus" class="w-3 h-3" />
              </UButton>
              <span class="zoom-level" style="color: var(--text-primary); font-weight: 500;">{{ Math.round(zoom * 100) }}%</span>
              <UButton
                variant="outline"
                size="sm"
                @click="zoomIn"
                style="background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-color); padding: 0.25rem 0.5rem; border-radius: 0.375rem; min-width: 32px; transition: all 0.2s ease;"
                class="hover:shadow-sm hover:bg-gray-50"
              >
                <UIcon name="i-heroicons-plus" class="w-3 h-3" />
              </UButton>
            </div>

            <UButton
              variant="outline"
              icon="i-heroicons-view-columns"
              @click="resetCanvas"
              style="background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-color); padding: 0.5rem 1rem; border-radius: 0.5rem; transition: all 0.2s ease;"
              class="hover:shadow-sm hover:bg-gray-50"
            >
              Centrer
            </UButton>

            <UButton
              @click="showSaveModal = true"
              :disabled="workflowBlocks.length === 0 || isSaving"
              style="background: var(--color-tertiary); color: var(--text-white); padding: 0.5rem 1rem; border-radius: 0.5rem; transition: all 0.2s ease; min-width: 120px;"
              class="hover:opacity-90"
            >
              <UIcon v-if="isSaving" name="i-heroicons-arrow-path" class="w-4 h-4 mr-2 animate-spin" />
              <UIcon v-else name="i-heroicons-document-check" class="w-4 h-4 mr-2" />
              {{ isSaving ? 'Sauvegarde...' : 'Sauvegarder' }}
            </UButton>
          </div>
        </div>
      </div>

      <!-- Canvas principal (2 niveaux comme dans create.vue) -->
      <div 
        class="canvas-container"
        ref="canvasContainer"
        @mousedown="startPan"
        @mousemove="handlePan"
        @mouseup="endPan"
        @mouseleave="endPan"
        @wheel.prevent="onWheel"
      >
        <!-- Grid background -->
        <div 
          class="canvas-grid" 
          :style="gridStyle"
        ></div>

        <!-- Canvas content (élément transformé) -->
        <div ref="canvas" class="canvas" :style="canvasStyle">
          <!-- Service blocks -->
          <UiWorkflowStepCard
            v-for="(block, index) in workflowBlocks"
            :key="block.id"
            :step="index + 1"
            :block-id="block.id"
            :title="block.service.name"
            :description="block.service.description"
            :icon="block.service.icon"
            :icon-background="block.service.color + '15'"
            :icon-color="block.service.color"
            :position="block.position"
            :zoom="zoom"
            :canvas-mode="true"
            :isEmpty="false"
            :has-input-connection="getBlockConnectionState(block.id).hasInputConnection"
            :has-output-connection="getBlockConnectionState(block.id).hasOutputConnection"
            @update-position="updateBlockPosition"
            @delete="() => deleteBlock(block.id)"
            @configure="() => handleBlockConfigure(block.id)"
          />

          <!-- Connection lines -->
          <svg class="connections-overlay">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="var(--color-primary)"
                />
              </marker>
            </defs>
            <path
              v-for="connection in connections"
              :key="`${connection.from}-${connection.to}`"
              :d="getConnectionPath(connection)"
              stroke="var(--color-primary)"
              stroke-width="2"
              fill="none"
              class="connection-line"
              marker-end="url(#arrowhead)"
            />
          </svg>

          <!-- Add next service button -->
          <UiWorkflowStepCard
            v-if="workflowBlocks.length > 0"
            :step="workflowBlocks.length + 1"
            :isEmpty="true"
            :canvas-mode="true"
            :position="nextCardPosition"
            @add-service="openServiceModal"
          />
        </div>
      </div>

      <!-- Service Selection Modal -->
      <UiServiceSelectionModal
        v-model:open="showServiceModal"
        @service-selected="handleServiceSelected"
      />

      <!-- Service Configuration Modal -->
      <UiServiceConfigurationModal
        v-if="selectedService"
        v-model:open="showConfigModal"
        :service="selectedService"
        :block-type="selectedBlockType"
        :initial-config="currentConfiguration"
        @configuration-confirmed="handleConfigurationConfirmed"
      />

      <!-- Save Workflow Modal -->
      <UModal
        v-model:open="showSaveModal"
        :ui="{
          content: 'fixed bg-white divide-y divide-gray-200 flex flex-col focus:outline-none border-0 ring-0 shadow-xl',
          overlay: 'fixed inset-0 bg-gray-900/50',
          header: 'flex items-center gap-1.5 p-4 sm:px-6 min-h-16 bg-white',
          body: 'flex-1 overflow-y-auto p-4 sm:p-6 bg-white',
          footer: 'flex items-center gap-1.5 p-4 sm:px-6 bg-white'
        }"
      >
        <template #header>
          <div style="padding: 1.5rem;">
            <h3 style="color: var(--text-primary); font-size: 1.25rem; font-weight: 600; margin: 0;">
              Sauvegarder les modifications
            </h3>
            <p style="color: var(--text-secondary); font-size: 0.875rem; margin: 0.25rem 0 0 0;">
              Confirmez les modifications de votre automatisation
            </p>
          </div>
        </template>

        <template #body>
          <div class="space-y-4" style="padding: var(--spacing-lg);">
            <div>
              <label style="color: var(--text-primary); font-weight: 500; display: block; margin-bottom: 0.5rem;">
                Nom de l'automatisation
              </label>
              <UInput
                v-model="workflowName"
                placeholder="Nom de votre automatisation"
                size="lg"
                :class="nameError ? 'border-red-500' : ''"
                style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);"
              />
              <p v-if="nameError" class="text-red-500 text-sm mt-1">{{ nameError }}</p>
            </div>

            <div>
              <label style="color: var(--text-primary); font-weight: 500; display: block; margin-bottom: 0.5rem;">
                Description (optionnelle)
              </label>
              <UTextarea
                v-model="workflowDescription"
                placeholder="Décrivez le but de cette automatisation"
                :rows="3"
                style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);"
              />
            </div>

            <div v-if="saveError" class="error-message">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
              <span>{{ saveError }}</span>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3" style="padding: var(--spacing-lg);">
            <UButton
              variant="outline"
              @click="closeSaveModal"
              :disabled="isSaving"
              style="background: var(--bg-card); color: var(--text-secondary); border-color: var(--border-color);"
            >
              Annuler
            </UButton>
            <UButton
              @click="handleSaveWorkflow"
              :disabled="isSaving || !workflowName.trim()"
              :loading="isSaving"
              style="background: var(--color-tertiary); color: var(--text-white); border: none;"
            >
              {{ isSaving ? 'Sauvegarde...' : 'Sauvegarder' }}
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AreaData, BackendWorkflow, Service, ServiceConfiguration } from '~/types'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const route = useRoute()
const areaId = ref(route.params.id as string)

console.log('Edit page - route.params.id:', route.params.id, typeof route.params.id)
console.log('Edit page - areaId:', areaId.value, typeof areaId.value)

const isLoading = ref(true)
const error = ref<string | null>(null)
const areaData = ref<AreaData | null>(null)

const {
  canvasContainer,
  canvas,
  pan,
  zoom,
  canvasStyle,
  gridStyle,
  startPan,
  handlePan,
  endPan,
  zoomIn,
  zoomOut,
  resetCanvas,
  onWheel
} = useCanvasManagement()

const {
  workflowBlocks,
  connections,
  nextCardPosition,
  isSaving,
  saveError,
  addServiceBlock,
  updateBlockPosition,
  deleteBlock,
  configureBlock,
  updateBlockConfiguration,
  getBlockConnectionState,
  getConnectionPath,
  saveWorkflow,
  loadWorkflow
} = useWorkflowManagement(canvas, zoom)

const {
  showServiceModal,
  showConfigModal: _showConfigModal,
  selectedService,
  selectedBlockType,
  isEditingConfiguration,
  currentConfiguration,
  openServiceModal,
  closeServiceModal,
  selectServiceWithConfiguration,
  onConfigurationConfirmed,
  editServiceConfiguration,
  closeConfigModal
} = useServiceManagement()

const showConfigModal = computed({
  get: () => _showConfigModal.value,
  set: (value) => {
    if (!value) {
      closeConfigModal()
    }
  }
})

const showSaveModal = ref(false)
const workflowName = ref('')
const workflowDescription = ref('')
const nameError = ref('')

const { getAreaById } = useDashboard()

const getAreaByIdFromApi = async (id: string): Promise<AreaData> => {
  const authToken = useCookie('auth-token')
  if (!authToken.value) {
    throw new Error('Token d\'authentification manquant')
  }

  const config = useRuntimeConfig()
  const backendUrl = config.public.backendUrl || 'http://localhost:8080'

  const response = await $fetch<{ success: boolean; area: AreaData }>(`/api/areas/${id}`, {
    baseURL: backendUrl,
    headers: {
      'Authorization': `Bearer ${authToken.value}`
    }
  })

  if (response.success && response.area) {
    return response.area
  } else {
    throw new Error('Area not found')
  }
}

const loadExistingWorkflow = async () => {
  try {
    isLoading.value = true
    error.value = null

    console.log('Loading workflow for areaId:', areaId.value)

    areaData.value = await getAreaByIdFromApi(areaId.value)
    console.log('Area data loaded:', areaData.value)

    await loadWorkflow(areaId.value)

    workflowName.value = areaData.value.name || ''
    workflowDescription.value = areaData.value.description || ''

    nextTick(() => {
      if (workflowBlocks.value.length > 0) {
        console.log('Loaded blocks positions:', workflowBlocks.value.map(b => ({ id: b.id, position: b.position, service: b.service.name })))

        const avgX = workflowBlocks.value.reduce((sum, block) => sum + block.position.x, 0) / workflowBlocks.value.length
        const avgY = workflowBlocks.value.reduce((sum, block) => sum + block.position.y, 0) / workflowBlocks.value.length

        console.log('Calculated center of blocks:', { avgX, avgY })
        console.log('Current pan:', pan.value)
        console.log('Current zoom:', zoom.value)

        if (Math.abs(avgX) > 1000 || Math.abs(avgY) > 1000) {
          console.log('Centering view on loaded blocks...')
          pan.value = {
            x: -avgX + 400,
            y: -avgY + 300
          }
          console.log('New pan:', pan.value)
        }
      } else {
        console.log('No blocks loaded to center on')
      }
    })

  } catch (err: any) {
    console.error('Failed to load workflow:', err)
    error.value = err.message || 'Impossible de charger le workflow'
  } finally {
    isLoading.value = false
  }
}

const getNewBlockPosition = () => {
  if (workflowBlocks.value.length === 0) {
    const targetScreenX = Math.abs(pan.value.x) + 300
    const targetScreenY = Math.abs(pan.value.y) + 200

    const worldX = (targetScreenX - pan.value.x) / zoom.value
    const worldY = (targetScreenY - pan.value.y) / zoom.value

    console.log('Calculating world position for center spawn:', {
      targetScreen: { x: targetScreenX, y: targetScreenY },
      pan: pan.value,
      zoom: zoom.value,
      worldPosition: { x: worldX, y: worldY }
    })

    return { x: worldX, y: worldY }
  } else {
    const lastBlock = workflowBlocks.value[workflowBlocks.value.length - 1]
    return {
      x: lastBlock.position.x + 350,
      y: lastBlock.position.y
    }
  }
}

const handleServiceSelected = (service: Service) => {
  const blockType = workflowBlocks.value.length === 0 ? 'trigger' : 'action'
  const position = getNewBlockPosition()

  selectServiceWithConfiguration(service, blockType, (config) => {
    console.log('Adding service block with configuration at position:', position)
    addServiceBlock(config, position)
  })
}

const handleConfigurationConfirmed = (config: ServiceConfiguration) => {
  onConfigurationConfirmed(config)
}

const handleBlockConfigure = async (blockId: string) => {
  try {
    console.log('handleBlockConfigure called with blockId:', blockId)
    console.log('handleBlockConfigure - areaId:', areaId.value)

    const configInfo = await configureBlock(blockId)
    if (configInfo) {
      editServiceConfiguration(
        configInfo.service,
        configInfo.blockType,
        configInfo.currentConfig,
        (newConfig: ServiceConfiguration) => {
          updateBlockConfiguration(blockId, newConfig)
        }
      )
    }
  } catch (error) {
    console.error('Failed to configure block:', error)
  }
}

const closeSaveModal = () => {
  showSaveModal.value = false
  nameError.value = ''
}

const handleSaveWorkflow = async () => {
  if (!workflowName.value.trim()) {
    nameError.value = 'Le nom est requis'
    return
  }

  nameError.value = ''

  try {
    const updatedAreaData = {
      name: workflowName.value.trim(),
      description: workflowDescription.value.trim() || undefined
    }

    await saveWorkflow(updatedAreaData, areaId.value)

    showSaveModal.value = false

    console.log('Workflow updated successfully!')

    areaData.value = { ...areaData.value, ...updatedAreaData }

  } catch (err: any) {
    console.error('Failed to save workflow:', err)
  }
}

watch(() => route.params.id, (newId) => {
  console.log('Route params changed - newId:', newId, typeof newId)
  if (newId && typeof newId === 'string' && newId !== '[object PointerEvent]') {
    areaId.value = newId
    console.log('Updated areaId to:', areaId.value)
    loadExistingWorkflow()
  }
}, { immediate: true })

onMounted(() => {
  console.log('Edit page mounted - areaId:', areaId.value)
  if (!areaId.value || areaId.value === '[object PointerEvent]') {
    error.value = 'ID de workflow manquant'
    isLoading.value = false
  }
})

useHead({
  title: `Éditer ${areaData.value?.name || 'Automatisation'} - AREA`,
  meta: [
    { name: 'description', content: 'Éditez votre automatisation AREA' }
  ]
})
</script>

<style scoped>
.workflow-creator {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.loading-overlay,
.error-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-primary);
  z-index: 100;
}

.workflow-header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  position: relative;
  z-index: 10;
}

/* Canvas structure (same as create.vue) */
.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: grab;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.canvas-container:active {
  cursor: grabbing;
}

.canvas-grid {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle, rgba(107, 114, 128, 0.4) 1px, transparent 1px),
    radial-gradient(circle, rgba(107, 114, 128, 0.15) 1px, transparent 1px);
  background-size:
    40px 40px,
    10px 10px;
  background-position:
    0 0,
    0 0;
  pointer-events: none;
  opacity: 0.8;
}

.canvas {
  position: absolute;
  width: 5000px;
  height: 5000px;
  top: 50%;
  left: 50%;
  margin-left: -2500px;
  margin-top: -2500px;
}

/* Connections SVG overlay */
.connections-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: visible;
}

.connection-line {
  cursor: pointer;
  pointer-events: stroke;
  transition: all 0.2s ease;
  stroke-width: 2;
}

.connection-line:hover {
  stroke-width: 3;
  filter: drop-shadow(0 0 8px var(--color-primary));
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.zoom-level {
  font-size: 0.875rem;
  color: var(--text-primary);
  min-width: 50px;
  text-align: center;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: var(--color-error);
  font-size: 0.875rem;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .workflow-header .flex {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .workflow-header .flex:first-child {
    flex-direction: row;
    align-items: center;
  }

  .zoom-controls {
    align-self: center;
  }
}
</style>