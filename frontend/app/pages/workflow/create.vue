<template>
  <div class="workflow-creator">
    <!-- Header fixe -->
    <div class="workflow-header">
      <div class="flex items-center justify-between px-4 py-4 border-t" style="border-color: var(--border-color);">
        <div class="flex items-center gap-4 flex-1">
          <UButton
            variant="ghost"
            icon="i-heroicons-arrow-left"
            @click="goBack"
            style="color: var(--text-secondary); transition: all 0.2s ease; padding: 0.5rem 1rem; border-radius: 0.5rem;"
            class="hover:bg-gray-100"
          >
            Retour
          </UButton>
          <div class="flex-1">
            <h1 class="text-xl font-bold" style="color: var(--text-primary);">
              Créer une automatisation
            </h1>
            <p class="text-sm" style="color: var(--text-secondary);">
              Glissez et connectez vos services pour créer votre workflow
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
            @click="resetCanvas"
            style="background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-color); padding: 0.5rem 1rem; border-radius: 0.5rem; transition: all 0.2s ease;"
            class="hover:shadow-md"
          >
            <UIcon name="i-heroicons-arrows-pointing-in" class="w-4 h-4 mr-2" />
            Centrer
          </UButton>

          <UButton
            variant="solid"
            icon="i-heroicons-check"
            :disabled="workflowBlocks.length === 0 || isSaving"
            :loading="isSaving"
            @click="openSaveModal"
            style="background: var(--color-tertiary); color: var(--text-white); border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; transition: all 0.2s ease; box-shadow: var(--shadow-md);"
            :class="(workflowBlocks.length === 0 || isSaving) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'"
          >
            {{ isSaving ? 'Sauvegarde...' : 'Sauvegarder' }}
          </UButton>
        </div>
      </div>
    </div>


    <!-- Canvas principal -->
    <div
      ref="canvasContainer"
      class="canvas-container"
      @mousedown="startPan"
      @mousemove="handlePan"
      @mouseup="endPan"
      @wheel.prevent="onWheel"
    >
      <!-- Grid background -->
      <div
        class="canvas-grid"
        :style="gridStyle"
      ></div>

      <!-- Canvas content -->
      <div
        ref="canvas"
        class="canvas"
        :style="canvasStyle"
      >
        <!-- Add Action Button (centre du canvas) -->
        <div
          v-if="workflowBlocks.length === 0"
          class="add-action-button"
          @click="openTriggerServiceModal"
        >
          <div class="add-button-content">
            <UIcon name="i-heroicons-plus" class="w-8 h-8" />
            <span>Ajouter un service</span>
          </div>
        </div>

        <!-- Add next service button -->
        <UiWorkflowStepCard
          v-if="workflowBlocks.length > 0"
          :step="workflowBlocks.length + 1"
          :isEmpty="true"
          :canvas-mode="true"
          :position="nextCardPosition"
          @add-service="openActionServiceModal"
        />

        <!-- Workflow Cards -->
        <UiWorkflowStepCard
          v-for="(block, index) in workflowBlocks"
          :key="block.id"
          :step="index + 1"
          :block-id="block.id"
          :title="block.service.name"
          :description="block.service.description"
          :icon="block.service.icon"
          :icon-url="block.service.iconUrl"
          :icon-background="block.service.color + '15'"
          :icon-color="block.service.color"
          :position="block.position"
          :zoom="zoom"
          :canvas-mode="true"
          :isEmpty="false"
          :has-input-connection="getBlockConnectionState(block.id).hasInputConnection"
          :has-output-connection="getBlockConnectionState(block.id).hasOutputConnection"
          @update-position="updateBlockPosition"
          @delete="deleteBlock"
          @configure="handleBlockConfigure"
          @connection-drag-start="handleConnectionDragStart"
          @connection-drop="handleConnectionDragEnd"
        />

        <!-- Connections between blocks -->
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
            marker-end="url(#arrowhead)"
            class="connection-line"
          />
          <path
            v-if="isDraggingConnection && draggedConnection"
            :d="getPreviewConnectionPath()"
            stroke="#10b981"
            stroke-width="3"
            fill="none"
            class="connection-preview"
            stroke-dasharray="8,4"
          />
        </svg>
      </div>
    </div>

    <!-- Service Selection Modal -->
    <UiServiceSelectionModal
      v-model:open="showServiceModal"
      :block-type="selectedBlockType"
      @service-selected="handleServiceSelected"
    />

    <!-- Service Configuration Modal -->
    <UiServiceConfigurationModal
      v-if="selectedService"
      v-model:open="showConfigModal"
      :service="selectedService"
      :block-type="selectedBlockType"
      :initial-config="currentConfiguration"
      :workflow-blocks="workflowBlocks"
      :current-block-index="modalCurrentBlockIndex"
      :available-previous-nodes="modalPreviousNodeIds"
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
      <!-- Header personnalisé -->
      <template #header>
        <div style="padding: 1.5rem;">
          <h3 style="color: var(--text-primary); font-size: 1.25rem; font-weight: 600; margin: 0;">
            {{ currentAreaId ? 'Mettre à jour l\'automatisation' : 'Sauvegarder l\'automatisation' }}
          </h3>
          <p style="color: var(--text-secondary); font-size: 0.875rem; margin: 0.25rem 0 0 0;">
            {{ currentAreaId ? 'Les modifications seront appliquées à votre automatisation existante' : 'Donnez un nom à votre nouvelle automatisation' }}
          </p>
        </div>
      </template>

      <template #body>
        <div class="space-y-4">
          <!-- Nom de l'automatisation (seulement pour nouveau workflow) -->
          <div v-if="!currentAreaId">
            <label style="color: var(--text-primary); font-size: 0.875rem; font-weight: 500; display: block; margin-bottom: 0.5rem;">
              Nom de l'automatisation *
            </label>
            <UInput
              v-model="workflowName"
              placeholder="Ex: Timer vers Console Log"
              size="lg"
              class="w-full"
              style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);"
              :disabled="isSaving"
            />
            <p v-if="nameError" style="color: var(--color-error); font-size: 0.75rem; margin-top: 0.25rem;">
              {{ nameError }}
            </p>
          </div>

          <!-- Description (seulement pour nouveau workflow) -->
          <div v-if="!currentAreaId">
            <label style="color: var(--text-primary); font-size: 0.875rem; font-weight: 500; display: block; margin-bottom: 0.5rem;">
              Description (optionnelle)
            </label>
            <UTextarea
              v-model="workflowDescription"
              placeholder="Décrivez brièvement ce que fait cette automatisation..."
              :rows="3"
              class="w-full"
              style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);"
              :disabled="isSaving"
            />
          </div>

          <!-- Message pour workflow existant -->
          <div v-else class="text-center" style="padding: var(--spacing-xl);">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-2" style="color: var(--color-tertiary);" />
            <p style="color: var(--text-secondary); font-size: 0.875rem;">
              Vos modifications seront sauvegardées dans l'automatisation existante.
            </p>
          </div>

          <!-- Zone d'erreur -->
          <div v-if="saveError" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--border-radius-lg); padding: var(--spacing-md);">
            <div class="flex items-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 mr-2" style="color: var(--color-error);" />
              <span style="color: var(--color-error); font-size: 0.875rem;">{{ saveError }}</span>
            </div>
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
            :loading="isSaving"
            @click="handleSaveWorkflow"
            :disabled="(!currentAreaId && !workflowName.trim()) || isSaving"
            style="background: var(--color-tertiary); color: var(--text-white); border-color: var(--color-tertiary);"
          >
            {{ isSaving ? 'Sauvegarde...' : (currentAreaId ? 'Mettre à jour' : 'Sauvegarder') }}
          </UButton>
        </div>
      </template>
    </UModal>

  </div>
</template>

<script setup lang="ts">
import type { Service, ServiceConfiguration } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'workflow-auth'
})

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
  onWheel,
  setFirstNodePositionGetter
} = useCanvasManagement()

const {
  workflowBlocks,
  connections,
  currentAreaId,
  isSaving,
  saveError,
  nextCardPosition,
  addServiceBlock,
  updateBlockPosition,
  deleteBlock,
  configureBlock,
  addConnection,
  updateBlockConfiguration,
  getBlockConnectionState,
  getConnectionPath,
  getConnectionPointPosition,
  saveWorkflow: saveWorkflowData,
  loadWorkflow,
  refreshConnections
} = useWorkflowManagement(canvas, zoom)

// Configurer la fonction pour obtenir la position de la première node
setFirstNodePositionGetter(() => {
  if (workflowBlocks.value.length === 0) {
    return null
  }
  return workflowBlocks.value[0].position
})

const {
  showServiceModal,
  showConfigModal: _showConfigModal,
  selectedService,
  selectedBlockType,
  isEditingConfiguration,
  currentConfiguration,
  configContext: configModalContext,
  openServiceModal,
  selectServiceWithConfiguration,
  onConfigurationConfirmed,
  editServiceConfiguration,
  closeConfigModal,
  handlePreSelectedService
} = useServiceManagement()

const openTriggerServiceModal = () => openServiceModal('trigger')
const openActionServiceModal = () => openServiceModal('action')

const showConfigModal = computed({
  get: () => _showConfigModal.value,
  set: (value) => {
    if (!value) {
      closeConfigModal()
    }
  }
})

const route = useRoute()

const showSaveModal = ref(false)
const workflowName = ref('')
const workflowDescription = ref('')
const nameError = ref('')

// Connection drag state
const isDraggingConnection = ref(false)
const draggedConnection = ref<{
  sourceBlockId: string
  sourceType: 'input' | 'output'
  startPosition: { x: number; y: number }
} | null>(null)
const currentMousePosition = ref({ x: 0, y: 0 })
const hoveredConnectionTarget = ref<{ blockId: string; type: 'input' | 'output' } | null>(null)
const connectionDragHasMoved = ref(false)

const handleServiceSelected = (service: Service) => {
  const blockType = selectedBlockType.value || (workflowBlocks.value.length === 0 ? 'trigger' : 'action')
  const blockIndex = workflowBlocks.value.length

  selectServiceWithConfiguration(service, blockType, (config) => {
    addServiceBlock(config, undefined, blockType)
  }, { blockIndex })
}

const handleConfigurationConfirmed = (config: ServiceConfiguration) => {
  onConfigurationConfirmed(config)
}

const handleBlockConfigure = async (blockId: string) => {
  try {
    const configInfo = await configureBlock(blockId)
    if (configInfo) {
      const blockIndex = workflowBlocks.value.findIndex(block => block.id === blockId)
      editServiceConfiguration(
        configInfo.service,
        configInfo.blockType,
        configInfo.currentConfig,
        (newConfig: ServiceConfiguration) => {
          updateBlockConfiguration(blockId, newConfig)
        },
        { blockId, blockIndex }
      )
    }
  } catch (error) {
    console.error('Failed to configure block:', error)
  }
}

const modalCurrentBlockIndex = computed(() => {
  const contextIndex = configModalContext.value?.blockIndex
  if (typeof contextIndex === 'number' && contextIndex >= 0) {
    return contextIndex
  }
  return workflowBlocks.value.length
})

const modalPreviousNodeIds = computed(() => {
  if (selectedBlockType.value !== 'action') {
    return []
  }

  // Si on configure un bloc existant
  if (configModalContext.value?.blockId) {
    const currentBlockId = configModalContext.value.blockId

    // Trouver toutes les connexions qui pointent vers cette node
    const incomingConnections = connections.value.filter(conn => conn.to === currentBlockId)

    // Retourner les IDs des nodes source
    return incomingConnections.map(conn => conn.from)
  }

  // Si on ajoute un nouveau bloc, pas de connexions encore définies
  return []
})

const openSaveModal = () => {
  if (workflowBlocks.value.length === 0) {
    return
  }
  nameError.value = ''
  showSaveModal.value = true
}

const closeSaveModal = () => {
  showSaveModal.value = false
  nameError.value = ''
}

const handleSaveWorkflow = async () => {
  try {
    nameError.value = ''

    if (currentAreaId.value) {
      await saveWorkflowData()
    } else {
      if (!workflowName.value.trim()) {
        nameError.value = 'Le nom est obligatoire'
        return
      }

      const areaData = {
        name: workflowName.value.trim(),
        description: workflowDescription.value.trim() || undefined
      }

      await saveWorkflowData(areaData)
    }

    showSaveModal.value = false
    await navigateTo('/dashboard')

  } catch (error) {
    console.error('Failed to save workflow:', error)
  }
}

const blockCount = computed(() => workflowBlocks.value.length)

watch(blockCount, (count, previous) => {
  if (count === 0 && (previous ?? 0) > 0) {
    resetCanvas()
    selectedBlockType.value = 'trigger'
    refreshConnections()
  }
})

const handleConnectionDragStart = (blockId: string, connectionType: 'input' | 'output', position: { x: number; y: number }) => {
  isDraggingConnection.value = true
  draggedConnection.value = {
    sourceBlockId: blockId,
    sourceType: connectionType,
    startPosition: position
  }

  currentMousePosition.value = { ...position }
  hoveredConnectionTarget.value = null
  connectionDragHasMoved.value = false

  document.addEventListener('mousemove', updateConnectionPreview)
  document.addEventListener('mouseup', cancelConnectionDrag)

  document.body.style.cursor = 'crosshair'
  console.log(`Started dragging ${connectionType} from block ${blockId}`)
}

const handleConnectionDragEnd = (blockId: string, connectionType: 'input' | 'output', event: MouseEvent) => {
  if (!isDraggingConnection.value || !draggedConnection.value) {
    return
  }

  const sourceBlockId = draggedConnection.value.sourceBlockId
  const sourceType = draggedConnection.value.sourceType

  if (sourceBlockId === blockId) {
    resetConnectionDrag()
    return
  }

  if (sourceType === 'output' && connectionType === 'input') {
    createConnection(sourceBlockId, blockId, sourceType)
  } else if (sourceType === 'input' && connectionType === 'output') {
    createConnection(sourceBlockId, blockId, sourceType)
  } else {
    console.log('Invalid connection: cannot connect same types')
  }

  resetConnectionDrag()
}

const createConnection = (sourceBlockId: string, targetBlockId: string, sourceType: 'input' | 'output') => {
  const fromBlockId = sourceType === 'output' ? sourceBlockId : targetBlockId
  const toBlockId = sourceType === 'output' ? targetBlockId : sourceBlockId

  const newConnection = addConnection(fromBlockId, toBlockId)

  if (!newConnection) {
    console.log('Connection already exists or invalid connection')
    return
  }

  console.log(`Created connection from ${fromBlockId} to ${toBlockId}`)
}

const updateConnectionPreview = (event: MouseEvent) => {
  if (!isDraggingConnection.value || !draggedConnection.value) return

  const canvasRect = canvas.value?.getBoundingClientRect()
  if (!canvasRect) return

  const mouseX = event.clientX - canvasRect.left
  const mouseY = event.clientY - canvasRect.top

  const targetElement = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null
  const targetCard = targetElement?.closest('[data-block-id]') as HTMLElement | null

  if (targetCard) {
    const targetBlockId = targetCard.dataset.blockId
    const isSameBlock = targetBlockId === draggedConnection.value.sourceBlockId

    if (!isSameBlock) {
      const connectorSelector = draggedConnection.value.sourceType === 'output'
        ? '.connection-input'
        : '.connection-output'

      const targetConnector = targetCard.querySelector(connectorSelector) as HTMLElement | null

      if (targetConnector) {
        const connectorRect = targetConnector.getBoundingClientRect()
        currentMousePosition.value = {
          x: (connectorRect.left + connectorRect.width / 2 - canvasRect.left) / zoom.value,
          y: (connectorRect.top + connectorRect.height / 2 - canvasRect.top) / zoom.value
        }
        if (targetBlockId) {
          hoveredConnectionTarget.value = {
            blockId: targetBlockId,
            type: connectorSelector.includes('input') ? 'input' : 'output'
          }
        }
        if (draggedConnection.value) {
          const deltaX = currentMousePosition.value.x - draggedConnection.value.startPosition.x
          const deltaY = currentMousePosition.value.y - draggedConnection.value.startPosition.y
          if (!connectionDragHasMoved.value && Math.hypot(deltaX, deltaY) > 4) {
            connectionDragHasMoved.value = true
          }
        }
        return
      }
    }
  }

  currentMousePosition.value = {
    x: mouseX / zoom.value,
    y: mouseY / zoom.value
  }
  hoveredConnectionTarget.value = null

  if (draggedConnection.value) {
    const deltaX = currentMousePosition.value.x - draggedConnection.value.startPosition.x
    const deltaY = currentMousePosition.value.y - draggedConnection.value.startPosition.y
    if (!connectionDragHasMoved.value && Math.hypot(deltaX, deltaY) > 4) {
      connectionDragHasMoved.value = true
    }
  }
}

const cancelConnectionDrag = (event: MouseEvent) => {
  if (!isDraggingConnection.value || !draggedConnection.value) {
    return
  }

  const sourceBlockId = draggedConnection.value.sourceBlockId
  const sourceType = draggedConnection.value.sourceType
  const targetElement = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null

  if (targetElement && targetElement.closest('.connection-point')) {
    return
  }

  let dropHandled = false

  if (targetElement) {
    const cardElement = targetElement.closest('[data-block-id]') as HTMLElement | null
    const targetBlockId = cardElement?.dataset.blockId

    if (targetBlockId && targetBlockId !== sourceBlockId) {
      createConnection(sourceBlockId, targetBlockId, sourceType)
      dropHandled = true
    }
  }

  if (!dropHandled && hoveredConnectionTarget.value) {
    const targetBlockId = hoveredConnectionTarget.value.blockId
    const targetType = hoveredConnectionTarget.value.type

    if (targetBlockId && targetBlockId !== sourceBlockId) {
      if (sourceType === 'output' && targetType === 'input') {
        createConnection(sourceBlockId, targetBlockId, sourceType)
      } else if (sourceType === 'input' && targetType === 'output') {
        createConnection(sourceBlockId, targetBlockId, sourceType)
      }
      dropHandled = true
    }
  }

  resetConnectionDrag()
}

const getPreviewConnectionPath = () => {
  if (!draggedConnection.value) return ''

  const start = draggedConnection.value.startPosition
  const end = currentMousePosition.value

  const dx = end.x - start.x
  const controlOffset = Math.max(50, Math.abs(dx) * 0.3)

  const controlPoint1X = start.x + controlOffset
  const controlPoint2X = end.x - controlOffset

  return `M ${start.x} ${start.y} C ${controlPoint1X} ${start.y}, ${controlPoint2X} ${end.y}, ${end.x} ${end.y}`
}

const resetConnectionDrag = () => {
  isDraggingConnection.value = false
  draggedConnection.value = null
  document.body.style.cursor = ''
  hoveredConnectionTarget.value = null
  connectionDragHasMoved.value = false

  document.removeEventListener('mousemove', updateConnectionPreview)
  document.removeEventListener('mouseup', cancelConnectionDrag)
}

onUnmounted(() => {
  resetConnectionDrag()
})

const goBack = () => {
  navigateTo('/dashboard')
}

useKeyboardShortcuts({
  onEscape: () => {
    if (showSaveModal.value) {
      closeSaveModal()
    } else if (showServiceModal.value) {
      showServiceModal.value = false
    }
  },
  onSpace: () => {
    if (!showServiceModal.value && !showSaveModal.value) {
      const blockType = workflowBlocks.value.length === 0 ? 'trigger' : 'action'
      openServiceModal(blockType)
    }
  },
  onSave: openSaveModal
})

onMounted(async () => {
  const areaId = route.query.areaId as string

  if (areaId) {
    try {
      await loadWorkflow(areaId)
      await nextTick()
      refreshConnections()
    } catch (error) {
      console.error('Failed to load workflow:', error)
      await navigateTo('/workflow/create')
    }
  } else {
    handlePreSelectedService(route, (service) => {
      const blockType = workflowBlocks.value.length === 0 ? 'trigger' : 'action'
      selectServiceWithConfiguration(service, blockType, (config) => {
        addServiceBlock(config, undefined, blockType)
      })
    })
  }
})

useHead({
  title: 'Créer une automatisation - Auto',
  meta: [
    { name: 'description', content: 'Créez votre automatisation en connectant vos services préférés.' }
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

.workflow-header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  position: relative;
  z-index: 10;
}


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
  margin-left: -100px;
  margin-top: -100px;
}

.test-card-simple {
  position: absolute;
  top: 200px;
  left: 200px;
  width: 300px;
  height: 100px;
  background: red;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 5px solid yellow;
  font-weight: bold;
  font-size: 20px;
  z-index: 999;
}

.add-action-button {
  position: absolute;
  top: 100px;
  left: 100px;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 120px;
  background: var(--bg-card);
  border: 2px dashed var(--color-primary);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-action-button:hover {
  background: rgba(167, 240, 186, 0.05);
  transform: translate(-50%, -50%) scale(1.05);
}

.add-button-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-primary);
  font-weight: 600;
}

.floating-add-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 20;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.debug-info {
  position: fixed;
  top: 100px;
  left: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 8px;
  font-size: 12px;
  z-index: 1000;
}

.center-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  color: red;
  font-weight: bold;
  text-align: center;
  pointer-events: none;
}

.marker-cross {
  width: 20px;
  height: 20px;
  position: relative;
  margin: 0 auto 5px;
}

.marker-cross::before,
.marker-cross::after {
  content: '';
  position: absolute;
  background: red;
}

.marker-cross::before {
  width: 20px;
  height: 2px;
  top: 9px;
  left: 0;
}

.marker-cross::after {
  width: 2px;
  height: 20px;
  top: 0;
  left: 9px;
}

.test-fixed-card {
  position: absolute;
  top: 100px;
  left: 100px;
  width: 300px;
  height: 100px;
  background: blue;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  border: 3px solid white;
  font-weight: bold;
}

.test-cards-outside {
  position: fixed;
  top: 200px;
  left: 20px;
  z-index: 2000;
}

.test-card-outside {
  background: green;
  color: white;
  padding: 10px;
  margin: 5px 0;
  border: 2px solid yellow;
  font-weight: bold;
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

.connections-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.connection-line {
  transition: stroke-width 0.2s ease;
}

.connection-line:hover {
  stroke-width: 3;
}

.connection-preview {
  animation: pulse-connection 1.5s ease-in-out infinite;
  filter: drop-shadow(0 0 6px #10b981);
  pointer-events: none;
}

@keyframes pulse-connection {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .workflow-header .flex {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .zoom-controls {
    align-self: center;
  }

  .floating-add-button {
    bottom: 1rem;
    right: 1rem;
  }
}
</style>
