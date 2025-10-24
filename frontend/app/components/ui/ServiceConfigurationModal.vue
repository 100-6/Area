<template>
  <UModal
    v-model:open="isOpen"
    :prevent-close="false"
    @close="closeModal"
    :ui="{
      content: 'fixed bg-white divide-y divide-gray-200 flex flex-col focus:outline-none border-0 ring-0 shadow-xl',
      overlay: 'fixed inset-0 bg-gray-900/50',
      header: 'flex items-center gap-1.5 p-4 sm:px-6 min-h-16 bg-white',
      body: 'flex-1 overflow-y-auto p-4 sm:p-6 bg-white max-h-96',
      footer: 'flex items-center gap-1.5 p-4 sm:px-6 bg-white'
    }"
  >
    <template #header>
      <div style="padding: 1.5rem;">
        <div class="flex items-center gap-3 mb-2">
          <div class="service-icon" :style="`background-color: ${service.color}15`">
            <img
              v-if="service.iconUrl && !iconLoadFailed"
              :src="service.iconUrl"
              :alt="service.name"
              class="w-6 h-6 object-contain"
              @error="iconLoadFailed = true"
            />
            <UIcon v-else :name="service.icon" class="w-6 h-6" :style="`color: ${service.color}`" />
          </div>
          <h3 style="color: var(--text-primary); font-size: 1.25rem; font-weight: 600; margin: 0;">
            Configurer {{ service.name }}
          </h3>
        </div>
        <p style="color: var(--text-secondary); font-size: 0.875rem; margin: 0;">
          {{ service.description }}
        </p>
      </div>
    </template>

    <template #body>
      <div class="configuration-content">
        <div v-if="availableActionReactions.length > 1" class="action-selection">
          <label class="config-label">
            {{ blockType === 'trigger' ? 'Action' : 'Réaction' }} à utiliser
            <span class="required-indicator">*</span>
          </label>

          <div class="action-options">
            <div
              v-for="actionReaction in availableActionReactions"
              :key="actionReaction.id"
              class="action-option"
              :class="{ 'selected': selectedActionReaction?.id === actionReaction.id }"
              @click="selectActionReaction(actionReaction)"
            >
              <div class="action-option-content">
                <h4>{{ actionReaction.name }}</h4>
                <p>{{ actionReaction.description }}</p>
              </div>
              <UIcon
                :name="selectedActionReaction?.id === actionReaction.id ? 'i-heroicons-check-circle' : 'i-heroicons-circle'"
                class="w-5 h-5"
                :style="`color: ${selectedActionReaction?.id === actionReaction.id ? 'var(--color-primary)' : 'var(--text-secondary)'}`"
              />
            </div>
          </div>
        </div>

        <div v-if="selectedActionReaction" class="parameters-configuration">
          <!-- Variables de sortie disponibles -->
          <div v-if="props.blockType === 'action' && availableVariables.length > 0" class="available-variables">
            <h4 class="variables-title">Variables disponibles</h4>
            <p class="variables-description">
              Variables provenant des actions et triggers précédents que vous pouvez utiliser dans la configuration
            </p>

            <div v-if="isLoadingVariables" class="variables-loading">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              <span>Chargement des variables...</span>
            </div>

            <div v-else class="variables-content">
              <div v-for="source in availableVariables" :key="source.nodeId" class="variable-source">
                <h5 class="source-title">{{ source.nodeName }}</h5>
                <div class="variable-badges">
                  <UBadge
                    v-for="variable in source.variables"
                    :key="variable.path"
                    variant="solid"
                    color="green"
                    size="sm"
                    class="variable-badge"
                    :title="`${variable.description}\nType: ${variable.type}\nCliquez pour ajouter au champ actif`"
                    @click="insertVariableInActiveField(variable)"
                  >
                    {{ getVariableBadgeText(variable) }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>

          <h4 class="parameters-title">Paramètres de configuration</h4>


          <div v-if="selectedActionReaction.parameters.length === 0" class="no-parameters">
            <UIcon name="i-heroicons-information-circle" class="w-5 h-5" style="color: var(--text-secondary);" />
            <span>Aucun paramètre requis pour cette {{ blockType === 'trigger' ? 'action' : 'réaction' }}</span>
          </div>

          <div v-else class="parameters-list">
            <component
              v-for="parameter in selectedActionReaction.parameters"
              :key="`${selectedActionReaction.id}-${parameter.name}`"
              :is="getFieldComponent(parameter.type, parameter.name)"
              :parameter="parameter"
              :value="parameters[parameter.name]"
              :error="validation.parameters[parameter.name]?.error"
              :disabled="isLoading"
              @update:value="(value) => updateParameter(parameter.name, value)"
              @validate="(isValid, error) => updateValidation(parameter.name, isValid, error)"
              @focus-field="onFieldFocus(parameter.name, $event)"
            />
          </div>
        </div>

        <div v-if="!validation.isValid && validation.errors.length > 0" class="global-errors">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
          <div class="error-list">
            <p v-for="error in validation.errors" :key="error" class="error-item">{{ error }}</p>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          variant="outline"
          @click.stop="closeModal"
          :disabled="isLoading"
          style="background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border-color);"
        >
          Annuler
        </UButton>
        <UButton
          @click.stop="confirmConfiguration"
          :disabled="!canConfirm || isLoading"
          :loading="isLoading"
          style="background: var(--color-tertiary); color: var(--text-white);"
        >
          {{ isLoading ? 'Configuration...' : 'Confirmer' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Service, ServiceAction, ServiceReaction, ServiceConfiguration, ConfigurationValidation } from '~/types'
import { ConfigurationValidator, FIELD_TYPE_MAPPING } from '../../types/ServiceConfiguration'
import type { OutputVariable } from '~/composables/useOutputVariables'

import ConfigInput from '~/components/ui/config/ConfigInput.vue'
import ConfigNumber from '~/components/ui/config/ConfigNumber.vue'
import ConfigSelect from '~/components/ui/config/ConfigSelect.vue'
import ConfigSelectMenu from '~/components/ui/config/ConfigSelectMenu.vue'
import ConfigDate from '~/components/ui/config/ConfigDate.vue'
import ConfigCheckbox from '~/components/ui/config/ConfigCheckbox.vue'

interface Props {
  open?: boolean
  service: Service
  blockType: 'trigger' | 'action'
  initialConfig?: ServiceConfiguration
  availablePreviousNodes?: string[] // IDs of previous nodes (triggers + actions) that provide output variables
  workflowBlocks?: any[] // For create mode - pass workflow blocks instead of saved node IDs
  currentBlockIndex?: number // Index of the current block being configured (to only show previous blocks)
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'configuration-confirmed', config: ServiceConfiguration): void
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  availablePreviousNodes: () => [],
  workflowBlocks: () => [],
  currentBlockIndex: -1
})

const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const isLoading = ref(false)
const selectedActionReaction = ref<ServiceAction | ServiceReaction | null>(null)
const parameters = ref<Record<string, any>>({})
const validation = ref<ConfigurationValidation>({
  isValid: true,
  parameters: {},
  errors: []
})
const iconLoadFailed = ref(false)
type VariableSource = { nodeId: string; nodeName: string; nodeType: string; variables: OutputVariable[] }

const availableVariables = ref<VariableSource[]>([])
const isLoadingVariables = ref(false)
interface FocusedFieldInfo {
  parameterName: string
  element: HTMLInputElement | HTMLTextAreaElement | null
  elementId?: string
  selectionStart?: number
  selectionEnd?: number
}

const lastFocusedField = ref<FocusedFieldInfo | null>(null)

const { getAvailableOutputVariables, getAvailableOutputVariablesFromBlocks, getVariableBadgeText } = useOutputVariables()

const availableActionReactions = computed((): (ServiceAction | ServiceReaction)[] => {
  if (props.blockType === 'trigger') {
    return props.service.actions || []
  } else {
    return props.service.reactions || []
  }
})

const canConfirm = computed(() => {
  return selectedActionReaction.value && validation.value.isValid
})

const loadAvailableVariables = async () => {
  if (props.blockType !== 'action') {
    availableVariables.value = []
    return
  }

  try {
    isLoadingVariables.value = true

    // Use blocks mode if we have workflow blocks (create mode)
    let sources: VariableSource[] = []

    if (props.workflowBlocks?.length > 0) {
      // Only get blocks that come before the current block being configured
      let previousBlocks = props.workflowBlocks
      if (props.currentBlockIndex >= 0) {
        previousBlocks = props.workflowBlocks.slice(0, props.currentBlockIndex)
      }

      const lastBlock = previousBlocks.length ? [previousBlocks[previousBlocks.length - 1]] : []

      console.log(`[Variables] Loading variables from ${lastBlock.length} previous block(s) (latest only)`)
      sources = lastBlock.length ? await getAvailableOutputVariablesFromBlocks(lastBlock) : []
    }
    // Use node IDs mode if we have saved nodes (edit mode)
    else if (props.availablePreviousNodes?.length > 0) {
      const lastNodeId = props.availablePreviousNodes[props.availablePreviousNodes.length - 1]
      console.log(`[Variables] Loading variables from last previous node: ${lastNodeId}`)
      sources = lastNodeId ? await getAvailableOutputVariables([lastNodeId]) : []
    }

    availableVariables.value = sources.filter((source) => source.variables && source.variables.length > 0)

    console.log(`[Variables] Loaded ${availableVariables.value.length} variable sources (after filtering empty ones)`)
  } catch (error) {
    console.error('Error loading available variables:', error)
    availableVariables.value = []
  } finally {
    isLoadingVariables.value = false
  }
}

const getFieldComponent = (type: string, parameterName?: string) => {
  // Cas particulier : forcer ConfigSelectMenu pour les champs channelId Discord
  if (parameterName && parameterName.toLowerCase().includes('channelid')) {
    return ConfigSelectMenu
  }

  const fieldConfig = FIELD_TYPE_MAPPING[type]
  if (!fieldConfig) {
    return ConfigInput
  }

  switch (fieldConfig.component) {
    case 'ConfigNumber': return ConfigNumber
    case 'ConfigSelect': return ConfigSelect
    case 'ConfigSelectMenu': return ConfigSelectMenu
    case 'ConfigDate': return ConfigDate
    case 'ConfigCheckbox': return ConfigCheckbox
    default: return ConfigInput
  }
}

const findInputElementForParameter = (parameterName: string, elementId?: string) => {
  if (!parameterName) {
    return null
  }

  if (elementId) {
    const byId = document.getElementById(elementId)
    if (byId instanceof HTMLInputElement || byId instanceof HTMLTextAreaElement) {
      return byId
    }
  }

  const container = Array.from(document.querySelectorAll('[data-parameter-name]'))
    .find((el) => (el as HTMLElement).dataset.parameterName === parameterName) as HTMLElement | undefined

  if (container) {
    const directInput = container.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null
    if (directInput) {
      return directInput
    }
  }

  const candidates = document.querySelectorAll('.parameters-list input, .parameters-list textarea') as NodeListOf<HTMLInputElement | HTMLTextAreaElement>

  for (const input of candidates) {
    const candidateParam = input.dataset.parameterName || input.closest('[data-parameter-name]')?.getAttribute('data-parameter-name')
    if (candidateParam === parameterName) {
      return input
    }
  }

  for (const input of candidates) {
    if (input.id && input.id.includes(parameterName)) {
      return input
    }
  }

  return null
}

const recordLastFocusedField = (inputElement: HTMLInputElement | HTMLTextAreaElement) => {
  if (!selectedActionReaction.value) {
    return
  }

  let parameterName = inputElement.dataset.parameterName

  if (!parameterName) {
    const container = inputElement.closest('[data-parameter-name]') as HTMLElement | null
    parameterName = container?.dataset.parameterName
  }

  if (!parameterName) {
    const matchingParam = selectedActionReaction.value.parameters.find(param => inputElement.id.includes(param.name))
    parameterName = matchingParam?.name
  }

  if (!parameterName) {
    return
  }

  const supportsSelection = 'selectionStart' in inputElement && 'selectionEnd' in inputElement
  const selectionStart = supportsSelection ? (inputElement as HTMLInputElement | HTMLTextAreaElement).selectionStart ?? undefined : undefined
  const selectionEnd = supportsSelection ? (inputElement as HTMLInputElement | HTMLTextAreaElement).selectionEnd ?? undefined : undefined

  lastFocusedField.value = {
    parameterName,
    element: inputElement,
    elementId: inputElement.id || undefined,
    selectionStart,
    selectionEnd
  }
}

const onFieldFocus = (parameterName: string, payload?: { element?: HTMLElement | null }) => {
  if (!parameterName) {
    return
  }

  const targetElement = payload?.element

  if (targetElement instanceof HTMLInputElement || targetElement instanceof HTMLTextAreaElement) {
    recordLastFocusedField(targetElement)
    return
  }

  const fallbackElement = findInputElementForParameter(parameterName)

  if (fallbackElement) {
    recordLastFocusedField(fallbackElement)
  } else {
    lastFocusedField.value = {
      parameterName,
      element: null,
      elementId: undefined
    }
  }
}

const selectActionReaction = (actionReaction: ServiceAction | ServiceReaction) => {
  selectedActionReaction.value = actionReaction

  parameters.value = ConfigurationValidator.initializeParameters(actionReaction)

  validateConfiguration()
  lastFocusedField.value = null
}

const insertVariableInActiveField = (variable: OutputVariable) => {
  const variableText = `{{${variable.path}}}`

  console.log(`[Insert] Attempting to insert ${variableText}`)
  console.log(`[Insert] lastFocusedField:`, lastFocusedField.value)

  // Try to use lastFocusedField first
  if (lastFocusedField.value) {
    const { parameterName, element, elementId, selectionStart, selectionEnd } = lastFocusedField.value
    let targetElement = element

    if (!targetElement || !document.body.contains(targetElement)) {
      targetElement = findInputElementForParameter(parameterName, elementId)
    }

    console.log(`[Insert] Using lastFocusedField: ${parameterName}`)

    if (targetElement) {
      // If the field lost focus, restore it before reading selection positions
      if (document.activeElement !== targetElement) {
        targetElement.focus()
      }

      const start = targetElement.selectionStart ?? selectionStart ?? targetElement.value.length
      const end = targetElement.selectionEnd ?? selectionEnd ?? targetElement.value.length
      const currentValue = parameters.value[parameterName] || ''

      console.log(`[Insert] Current value in ${parameterName}: "${currentValue}"`)
      console.log(`[Insert] Inserting at position ${start}-${end}`)

      // Insert the variable at cursor position
      const newValue = currentValue.slice(0, start) + variableText + currentValue.slice(end)

      // Update the parameter value
      updateParameter(parameterName, newValue)

      // Set focus back to the field and position cursor after inserted text
      nextTick(() => {
        const refreshedElement = findInputElementForParameter(parameterName, elementId)
        const focusTarget = refreshedElement ?? targetElement
        focusTarget.focus()
        const newCursorPosition = start + variableText.length
        if (typeof focusTarget.setSelectionRange === 'function' && Number.isFinite(newCursorPosition)) {
          focusTarget.setSelectionRange(newCursorPosition, newCursorPosition)
        }
        recordLastFocusedField(focusTarget)
      })

      // Show feedback
      const toast = useToast()
      toast.add({
        title: 'Variable ajoutée',
        description: `${variableText} a été ajouté au champ "${parameterName}"`,
        color: 'green',
        timeout: 2000
      })
      return
    } else {
      console.log(`[Insert] lastFocusedField element not valid or not in DOM`)
    }
  }

  console.log(`[Insert] Trying fallback methods`)

  // Fallback: try to find currently focused element
  let activeInput: HTMLInputElement | HTMLTextAreaElement | null = null
  let parameterName: string | null = null

  let activeElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement

  console.log(`[Insert] document.activeElement:`, activeElement, activeElement?.tagName)

  // If activeElement is not an input, try to find input within it
  if (activeElement && activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
    const inputInside = activeElement.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement
    if (inputInside) {
      activeInput = inputInside
      console.log(`[Insert] Found input inside element:`, inputInside.id)
    }
  } else if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
    activeInput = activeElement
    console.log(`[Insert] Using direct input element:`, activeInput.id)
  }

  // Try to determine which parameter this belongs to
  if (activeInput && selectedActionReaction.value) {
    const directDataset = activeInput.dataset.parameterName || activeInput.closest('[data-parameter-name]')?.getAttribute('data-parameter-name')
    if (directDataset) {
      parameterName = directDataset
    } else {
      const inputId = activeInput.id

      console.log(`[Insert] Looking for parameter matching input ID: ${inputId}`)

      for (const param of selectedActionReaction.value.parameters) {
        console.log(`[Insert] Checking parameter: ${param.name}`)
        if (inputId && inputId.includes(param.name)) {
          parameterName = param.name
          console.log(`[Insert] Found matching parameter: ${parameterName}`)
          break
        }
      }
    }

    if (parameterName) {
      const start = activeInput.selectionStart || 0
      const end = activeInput.selectionEnd || 0
      const currentValue = parameters.value[parameterName] || ''

      console.log(`[Insert] Inserting in fallback method to ${parameterName}`)

      const newValue = currentValue.slice(0, start) + variableText + currentValue.slice(end)
      updateParameter(parameterName, newValue)

      nextTick(() => {
        if (activeInput) {
          const refreshedElement = findInputElementForParameter(parameterName as string, activeInput.id)
          const focusTarget = refreshedElement ?? activeInput
          focusTarget.focus()
          const newCursorPosition = start + variableText.length
          if (typeof focusTarget.setSelectionRange === 'function' && Number.isFinite(newCursorPosition)) {
            focusTarget.setSelectionRange(newCursorPosition, newCursorPosition)
          }
          recordLastFocusedField(focusTarget)
        }
      })

      const toast = useToast()
      toast.add({
        title: 'Variable ajoutée',
        description: `${variableText} a été ajouté au champ "${parameterName}"`,
        color: 'green',
        timeout: 2000
      })
      return
    }
  }

  // Last fallback: use first available input
  console.log(`[Insert] Using last fallback - first available input`)

  if (selectedActionReaction.value) {
    const allInputs = document.querySelectorAll('.parameters-list input, .parameters-list textarea') as NodeListOf<HTMLInputElement | HTMLTextAreaElement>

    console.log(`[Insert] Found ${allInputs.length} total inputs`)

    if (allInputs.length > 0) {
      const firstInput = allInputs[0]
      parameterName = firstInput.dataset.parameterName || firstInput.closest('[data-parameter-name]')?.getAttribute('data-parameter-name') || null

      if (!parameterName) {
        const inputId = firstInput.id

        console.log(`[Insert] Using first input with ID: ${inputId}`)

        for (const param of selectedActionReaction.value.parameters) {
          if (inputId && inputId.includes(param.name)) {
            parameterName = param.name
            console.log(`[Insert] Matched first input to parameter: ${parameterName}`)
            break
          }
        }
      }

      if (parameterName) {
        const currentValue = parameters.value[parameterName] || ''
        const newValue = currentValue + variableText

        console.log(`[Insert] Adding to end of first field: ${parameterName}`)

        updateParameter(parameterName, newValue)

        nextTick(() => {
          const refreshedElement = findInputElementForParameter(parameterName as string, firstInput.id)
          const focusTarget = refreshedElement ?? firstInput
          focusTarget.focus()
          if (typeof focusTarget.setSelectionRange === 'function') {
            focusTarget.setSelectionRange(newValue.length, newValue.length)
          }
          recordLastFocusedField(focusTarget)
        })

        const toast = useToast()
        toast.add({
          title: 'Variable ajoutée',
          description: `${variableText} a été ajouté au premier champ "${parameterName}"`,
          color: 'green',
          timeout: 2000
        })
        return
      }
    }
  }

  console.log(`[Insert] All methods failed, falling back to clipboard`)

  // Final fallback to clipboard
  navigator.clipboard.writeText(variableText).then(() => {
    const toast = useToast()
    toast.add({
      title: 'Variable copiée',
      description: `${variableText} copié dans le presse-papiers`,
      color: 'orange',
      timeout: 3000
    })
  }).catch((error) => {
    console.error('Failed to copy variable to clipboard:', error)
  })
}


const updateParameter = (paramName: string, value: any) => {
  parameters.value[paramName] = value
  validateConfiguration()
}

const updateValidation = (paramName: string, isValid: boolean, error?: string) => {
  if (!validation.value.parameters[paramName]) {
    validation.value.parameters[paramName] = {
      value: parameters.value[paramName],
      isValid: true
    }
  }

  validation.value.parameters[paramName].isValid = isValid
  validation.value.parameters[paramName].error = error

  validateConfiguration()
}

const validateConfiguration = () => {
  if (!selectedActionReaction.value) {
    validation.value = {
      isValid: false,
      parameters: {},
      errors: ['Aucune action/réaction sélectionnée']
    }
    return
  }

  validation.value = ConfigurationValidator.validateConfiguration(
    parameters.value,
    selectedActionReaction.value
  )
}

const confirmConfiguration = async () => {
  if (!selectedActionReaction.value || !validation.value.isValid) return

  try {
    isLoading.value = true

    const configuration: ServiceConfiguration = {
      service: props.service,
      parameters: { ...parameters.value }
    }

    if (props.blockType === 'trigger') {
      configuration.selectedAction = selectedActionReaction.value as ServiceAction
    } else {
      configuration.selectedReaction = selectedActionReaction.value as ServiceReaction
    }

    emit('configuration-confirmed', configuration)
    closeModal()
  } catch (error) {
    console.error('Error confirming configuration:', error)
  } finally {
    isLoading.value = false
  }
}

const closeModal = () => {
  isOpen.value = false
  selectedActionReaction.value = null
  parameters.value = {}
  validation.value = {
    isValid: true,
    parameters: {},
    errors: []
  }
  iconLoadFailed.value = false
}

const initializeFromConfig = () => {
  if (props.initialConfig) {
    let actionReactionToSelect: ServiceAction | ServiceReaction | null = null

    if (props.initialConfig.selectedAction) {
      actionReactionToSelect = props.initialConfig.selectedAction
    } else if (props.initialConfig.selectedReaction) {
      actionReactionToSelect = props.initialConfig.selectedReaction
    }

    if (actionReactionToSelect) {
      selectedActionReaction.value = actionReactionToSelect

      const defaultParams = ConfigurationValidator.initializeParameters(actionReactionToSelect)
      parameters.value = defaultParams

      if (props.initialConfig.parameters && Object.keys(props.initialConfig.parameters).length > 0) {
        parameters.value = {
          ...parameters.value,
          ...props.initialConfig.parameters
        }
      }

      nextTick(() => {
        validateConfiguration()
      })
    }
  } else if (availableActionReactions.value.length === 1 && availableActionReactions.value[0]) {
    selectActionReaction(availableActionReactions.value[0])
  }
}

watch(() => props.open, (isOpen, wasOpen) => {
  if (isOpen && !wasOpen) {
    iconLoadFailed.value = false
    nextTick(() => {
      initializeFromConfig()
      loadAvailableVariables()
    })
  }
})

watch(
  () => [
    props.blockType,
    props.currentBlockIndex,
    props.availablePreviousNodes?.join(','),
    Array.isArray(props.workflowBlocks) ? props.workflowBlocks.map((block: any) => block?.id).join(',') : ''
  ],
  () => {
    if (isOpen.value) {
      loadAvailableVariables()
    }
  }
)

// Setup focus tracking when modal opens
const setupFocusTracking = () => {
  const resolveInputElement = (element: HTMLElement | null) => {
    if (!element) {
      return null
    }

    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      return element as HTMLInputElement | HTMLTextAreaElement
    }

    const directChild = element.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null
    if (directChild) {
      return directChild
    }

    let parent = element.parentElement
    while (parent) {
      const candidate = parent.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null
      if (candidate) {
        return candidate
      }
      parent = parent.parentElement
    }

    return null
  }

  const handleFocusIn = (event: FocusEvent) => {
    const inputElement = resolveInputElement(event.target as HTMLElement)
    if (inputElement) {
      recordLastFocusedField(inputElement)
    }
  }

  const handleClick = (event: MouseEvent) => {
    const inputElement = resolveInputElement(event.target as HTMLElement)
    if (inputElement) {
      // Delay the recording slightly to ensure caret position is updated
      requestAnimationFrame(() => {
        recordLastFocusedField(inputElement)
      })
    }
  }

  const handleSelectionChange = () => {
    const activeElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      recordLastFocusedField(activeElement)
    }
  }

  const handleInputEvent = (event: Event) => {
    const inputElement = event.target as HTMLInputElement | HTMLTextAreaElement | null
    if (inputElement && (inputElement.tagName === 'INPUT' || inputElement.tagName === 'TEXTAREA')) {
      recordLastFocusedField(inputElement)
    }
  }

  // Add listeners to keep track of the last focused field and caret position
  document.addEventListener('focusin', handleFocusIn)
  document.addEventListener('click', handleClick)
  document.addEventListener('selectionchange', handleSelectionChange)
  document.addEventListener('input', handleInputEvent, true)

  // Cleanup function
  return () => {
    document.removeEventListener('focusin', handleFocusIn)
    document.removeEventListener('click', handleClick)
    document.removeEventListener('selectionchange', handleSelectionChange)
    document.removeEventListener('input', handleInputEvent, true)
  }
}

onMounted(() => {
  if (props.open) {
    iconLoadFailed.value = false
    nextTick(() => {
      initializeFromConfig()
      loadAvailableVariables()
    })
  }
})

// Setup and cleanup focus tracking
let cleanupFocusTracking: (() => void) | null = null

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      cleanupFocusTracking = setupFocusTracking()
    })
  } else {
    if (cleanupFocusTracking) {
      cleanupFocusTracking()
      cleanupFocusTracking = null
    }
    lastFocusedField.value = null
  }
})

onUnmounted(() => {
  if (cleanupFocusTracking) {
    cleanupFocusTracking()
  }
})

watch(() => props.service?.id, () => {
  iconLoadFailed.value = false
})
</script>

<style scoped>
.configuration-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.service-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-selection {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.config-label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.required-indicator {
  color: var(--color-error);
  font-weight: 600;
}

.action-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-card);
}

.action-option:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-option.selected {
  border-color: var(--color-primary);
  background: rgba(167, 240, 186, 0.1);
}

.action-option-content {
  flex: 1;
}

.action-option-content h4 {
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
}

.action-option-content p {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.4;
}

.parameters-configuration {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.parameters-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.no-parameters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.parameters-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.global-errors {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: var(--color-error);
}

.error-list {
  flex: 1;
}

.error-item {
  margin: 0;
  font-size: 0.75rem;
}

.error-item:not(:last-child) {
  margin-bottom: 0.25rem;
}

/* Styles pour les variables de sortie */
.available-variables {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.variables-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
  margin: 0;
}

.variables-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
}

.variables-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.variables-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.variable-source {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.source-title {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
  margin: 0;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--border-color);
}

.variable-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.variable-badge {
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
}

.variable-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(72, 199, 116, 0.3);
}
</style>
