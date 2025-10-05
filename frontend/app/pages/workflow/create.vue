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
            :disabled="workflowBlocks.length === 0"
            @click="saveWorkflow"
            style="background: var(--color-tertiary); color: var(--text-white); border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; transition: all 0.2s ease; box-shadow: var(--shadow-md);"
            :class="workflowBlocks.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'"
          >
            Sauvegarder
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
          @click="openServiceModal"
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
          @add-service="openServiceModal"
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
          @configure="configureBlock"
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
        </svg>

        <!-- Mini add button when blocks exist -->
        <UButton
          v-if="workflowBlocks.length > 0"
          class="floating-add-button"
          variant="solid"
          color="primary"
          icon="i-heroicons-plus"
          size="lg"
          @click="openServiceModal"
        >
          Ajouter
        </UButton>
      </div>
    </div>

    <!-- Service Selection Modal -->
    <UiServiceSelectionModal
      v-model:open="showServiceModal"
      @service-selected="onServiceSelected"
    />
  </div>
</template>

<script setup lang="ts">
import type { Service } from '~/types'

definePageMeta({
  layout: 'default'
})

// Composables
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
  addServiceBlock,
  updateBlockPosition,
  deleteBlock,
  configureBlock,
  getBlockConnectionState,
  getConnectionPath,
  saveWorkflow: saveWorkflowData
} = useWorkflowManagement(canvas, zoom)

const {
  showServiceModal,
  openServiceModal,
  onServiceSelected: handleServiceSelection
} = useServiceManagement()

const route = useRoute()

// Service selection handler
const onServiceSelected = (service: Service) => {
  handleServiceSelection(service, addServiceBlock)
}


// Actions
const goBack = () => {
  navigateTo('/dashboard')
}

const saveWorkflow = async () => {
  try {
    await saveWorkflowData()
    // TODO: Show success notification
  } catch (error) {
    console.error('Failed to save workflow:', error)
    // TODO: Show error notification
  }
}

// Keyboard shortcuts
const { handlePreSelectedService } = useServiceManagement()

useKeyboardShortcuts({
  onEscape: () => {
    if (showServiceModal.value) {
      showServiceModal.value = false
    }
  },
  onSpace: () => {
    if (!showServiceModal.value) {
      openServiceModal()
    }
  },
  onSave: saveWorkflow
})

// Lifecycle
onMounted(() => {
  // Handle pre-selected service from URL
  handlePreSelectedService(route, addServiceBlock)
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
  margin-left: -2500px;
  margin-top: -2500px;
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
  top: 2500px;
  left: 2500px;
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