<template>
  <div
    ref="cardElement"
    class="relative group workflow-step-card"
    :class="{
      'workflow-step-dragging': isDragging,
      'workflow-step-canvas-mode': canvasMode
    }"
    :style="canvasMode ? cardStyle : {}"
    :data-block-id="blockId"
    @mousedown="canvasMode ? startDrag($event) : undefined"
  >
    <!-- Carte normale -->
    <div v-if="!isEmpty" class="p-8 rounded-2xl border backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:scale-105"
         :class="{ 'cursor-grab': canvasMode, 'cursor-pointer': canvasMode }"
         style="background: var(--bg-card); border-color: var(--border-color); box-shadow: var(--shadow-lg);"
         @click="canvasMode ? handleCardClick($event) : undefined">

      <!-- Badge numéroté -->
      <div class="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
           :style="{ background: 'var(--color-tertiary)' }">
        {{ step }}
      </div>

      <!-- Icône centrale -->
      <div class="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
           :style="{ background: iconBackground }">
        <UIcon :name="icon" class="w-8 h-8" :style="{ color: iconColor }" />
      </div>

      <!-- Contenu -->
      <h3 class="text-xl font-bold mb-3" style="color: var(--text-primary);">
        {{ title }}
      </h3>
      <p style="color: var(--text-secondary);">
        {{ description }}
      </p>

      <!-- Exemple de service (optionnel) -->
      <div v-if="example" class="mt-6 p-3 rounded-lg border flex items-center gap-3"
           :style="{
             background: exampleBackground,
             borderColor: exampleBorderColor
           }">
        <UIcon :name="exampleIcon" class="w-6 h-6" style="color: var(--color-tertiary);" />
        <span class="font-medium" style="color: var(--text-primary);">{{ example }}</span>
      </div>

      <!-- Actions pour le mode canvas -->
      <div v-if="canvasMode" class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <UButton
          variant="ghost"
          size="sm"
          icon="i-heroicons-x-mark"
          @click.stop="() => emit('delete', blockId)"
          class="delete-button"
          :ui="{
            color: {
              red: {
                ghost: 'text-red-500 hover:text-red-600 hover:bg-red-50'
              }
            }
          }"
          color="red"
        />
      </div>
    </div>

    <!-- Carte vide -->
    <div v-else class="p-8 rounded-2xl border-2 border-dashed transition-all duration-500 hover:scale-105 cursor-pointer bg-transparent"
         style="border-color: var(--border-color); opacity: 0.6;"
         @click="canvasMode ? $emit('add-service') : undefined">

      <!-- Badge numéroté pour état vide -->
      <div class="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 border-dashed"
           style="background: transparent; border-color: var(--border-color); color: var(--text-secondary);">
        {{ step }}
      </div>

      <!-- Zone centrale vide avec icône + -->
      <div class="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center border-2 border-dashed"
           style="border-color: var(--border-color); background: transparent;">
        <UIcon name="i-heroicons-plus" class="w-8 h-8" style="color: var(--text-secondary);" />
      </div>

      <!-- Texte d'invite -->
      <h3 class="text-xl font-bold mb-3 text-center" style="color: var(--text-secondary);">
        {{ canvasMode ? 'Ajouter un service' : 'Ajouter une réaction' }}
      </h3>
      <p class="text-center" style="color: var(--text-secondary); opacity: 0.7;">
        {{ canvasMode ? 'Cliquez pour sélectionner un service' : 'Cliquez pour configurer une action' }}
      </p>
    </div>

    <!-- Connection points pour le mode canvas -->
    <div v-if="canvasMode && !isEmpty" class="connection-points">
      <div
        v-if="step > 1"
        class="connection-point connection-input"
        @mousedown="startConnectionDrag($event, 'input')"
        @mouseup="handleConnectionDrop($event, 'input')"
      >
        <div class="connection-dot" :class="{ 'connection-dot-connected': hasInputConnection }"></div>
      </div>
      <div
        class="connection-point connection-output"
        @mousedown="startConnectionDrag($event, 'output')"
        @mouseup="handleConnectionDrop($event, 'output')"
      >
        <div class="connection-dot" :class="{ 'connection-dot-connected': hasOutputConnection }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  // Numéro de l'étape
  step: number
  // État vide de la carte
  isEmpty?: boolean
  // Icône principale
  icon?: string
  // Titre de l'étape
  title?: string
  // Description
  description?: string
  // Couleur de fond de l'icône
  iconBackground?: string
  // Couleur de l'icône
  iconColor?: string
  // Exemple de service (optionnel)
  example?: string
  // Icône pour l'exemple
  exampleIcon?: string
  // Couleur de fond pour l'exemple
  exampleBackground?: string
  // Couleur de bordure pour l'exemple
  exampleBorderColor?: string
  // Mode canvas pour drag & drop
  canvasMode?: boolean
  // Position pour le mode canvas
  position?: { x: number; y: number }
  // Zoom pour le mode canvas
  zoom?: number
  // ID unique pour le drag
  blockId?: string
  // État des connexions
  hasInputConnection?: boolean
  hasOutputConnection?: boolean
}

interface Emits {
  (e: 'update-position', blockId: string, position: { x: number; y: number }): void
  (e: 'delete', blockId: string): void
  (e: 'configure', blockId: string): void
  (e: 'add-service'): void
  (e: 'connection-drag-start', blockId: string, connectionType: 'input' | 'output', position: { x: number; y: number }): void
  (e: 'connection-drop', blockId: string, connectionType: 'input' | 'output', event: MouseEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  isEmpty: false,
  icon: 'i-heroicons-cog-6-tooth',
  title: '',
  description: '',
  iconBackground: 'var(--color-primary)',
  iconColor: 'var(--color-tertiary)',
  exampleIcon: 'i-heroicons-envelope',
  exampleBackground: 'rgba(167, 240, 186, 0.1)',
  exampleBorderColor: 'var(--color-primary)',
  canvasMode: false,
  position: () => ({ x: 0, y: 0 }),
  zoom: 1,
  blockId: '',
  hasInputConnection: false,
  hasOutputConnection: false
})

const emit = defineEmits<Emits>()

// Drag state pour le mode canvas
const cardElement = ref<HTMLElement>()
const isDragging = ref(false)
const hasDragged = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const dragOffset = ref({ x: 0, y: 0 })

// Computed styles pour le mode canvas
const cardStyle = computed(() => {
  if (!props.canvasMode) return {}

  return {
    position: 'absolute',
    transform: `translate(${props.position.x}px, ${props.position.y}px)`,
    zIndex: isDragging.value ? 1000 : 2,
    width: '300px'
  }
})

// Drag methods pour le mode canvas
const handleCardClick = (event: MouseEvent) => {
  if (!props.canvasMode || props.isEmpty) return

  // Don't emit configure if clicking on interactive elements (buttons)
  const target = event.target as HTMLElement
  if (target.closest('button, [role="button"]')) {
    return
  }

  // Don't emit configure if this was a drag operation
  if (hasDragged.value) {
    hasDragged.value = false
    return
  }

  emit('configure', props.blockId)
}

const startDrag = (event: MouseEvent) => {
  if (!props.canvasMode || props.isEmpty) return

  // Don't start drag if clicking on interactive elements
  const target = event.target as HTMLElement
  if (target.closest('button, [role="button"]')) {
    return
  }

  isDragging.value = true
  hasDragged.value = false

  const rect = cardElement.value!.getBoundingClientRect()
  const canvasRect = cardElement.value!.closest('.canvas')!.getBoundingClientRect()

  dragStart.value = {
    x: event.clientX,
    y: event.clientY
  }

  dragOffset.value = {
    x: (rect.left - canvasRect.left) / props.zoom,
    y: (rect.top - canvasRect.top) / props.zoom
  }

  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', endDrag)

  // Prevent text selection while dragging
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'grabbing'
}

const handleDrag = (event: MouseEvent) => {
  if (!isDragging.value) return

  const deltaX = (event.clientX - dragStart.value.x) / props.zoom
  const deltaY = (event.clientY - dragStart.value.y) / props.zoom

  // Mark that we have actually dragged (movement threshold)
  if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
    hasDragged.value = true
  }

  const newPosition = {
    x: dragOffset.value.x + deltaX,
    y: dragOffset.value.y + deltaY
  }

  emit('update-position', props.blockId, newPosition)
}

const endDrag = () => {
  isDragging.value = false

  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', endDrag)

  document.body.style.userSelect = ''
  document.body.style.cursor = ''
}

const duplicateStep = () => {
}

// Connection drag handlers
const startConnectionDrag = (event: MouseEvent, connectionType: 'input' | 'output') => {
  event.stopPropagation() // Empêcher le drag de la carte

  // Calculer la position du point de connexion dans les coordonnées du canvas
  const cardRect = cardElement.value!.getBoundingClientRect()
  const canvasRect = cardElement.value!.closest('.canvas')!.getBoundingClientRect()

  const connectionPointX = connectionType === 'input'
    ? (cardRect.left - canvasRect.left) / props.zoom
    : (cardRect.right - canvasRect.left) / props.zoom

  const connectionPointY = (cardRect.top + cardRect.height / 2 - canvasRect.top) / props.zoom

  emit('connection-drag-start', props.blockId, connectionType, {
    x: connectionPointX,
    y: connectionPointY
  })
}

const handleConnectionDrop = (event: MouseEvent, connectionType: 'input' | 'output') => {
  event.stopPropagation()
  emit('connection-drop', props.blockId, connectionType, event)
}

// Cleanup
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', endDrag)
})
</script>

<style scoped>
.workflow-step-card.workflow-step-canvas-mode {
  cursor: grab;
  user-select: none;
}

.workflow-step-card.workflow-step-dragging {
  cursor: grabbing;
  z-index: 1000;
}

.workflow-step-card.workflow-step-dragging .hover\\:scale-105 {
  transform: scale(1.1) !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25) !important;
}

.connection-points {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.connection-point {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--bg-card);
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  z-index: 10;
  pointer-events: auto;
  cursor: crosshair;
  transition: all 0.2s ease;
}

.connection-point:hover {
  transform: scale(1.2);
  border-width: 3px;
  box-shadow: 0 0 8px rgba(167, 240, 186, 0.6);
}

.connection-input {
  top: 50%;
  left: -6px;
  transform: translateY(-50%);
}

.connection-output {
  top: 50%;
  right: -6px;
  transform: translateY(-50%);
}

.connection-dot {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--color-primary);
  transform: scale(0);
  transition: transform 0.2s ease;
}

.connection-dot-connected {
  transform: scale(1) !important;
}

/* Style pour le bouton de suppression */
.delete-button {
  transition: all 0.2s ease;
  border-radius: 50%;
  width: 28px !important;
  height: 28px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.delete-button:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}
</style>