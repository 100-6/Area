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
    <!-- Header personnalisé -->
    <template #header>
      <div style="padding: 1.5rem;">
        <div class="flex items-center gap-3 mb-2">
          <div class="service-icon" :style="`background-color: ${service.color}15`">
            <UIcon :name="service.icon" class="w-6 h-6" :style="`color: ${service.color}`" />
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
        <!-- Sélection de l'action/reaction -->
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

        <!-- Configuration des paramètres -->
        <div v-if="selectedActionReaction" class="parameters-configuration">
          <h4 class="parameters-title">Paramètres de configuration</h4>


          <div v-if="selectedActionReaction.parameters.length === 0" class="no-parameters">
            <UIcon name="i-heroicons-information-circle" class="w-5 h-5" style="color: var(--text-secondary);" />
            <span>Aucun paramètre requis pour cette {{ blockType === 'trigger' ? 'action' : 'réaction' }}</span>
          </div>

          <div v-else class="parameters-list">
            <component
              v-for="parameter in selectedActionReaction.parameters"
              :key="`${selectedActionReaction.id}-${parameter.name}`"
              :is="getFieldComponent(parameter.type)"
              :parameter="parameter"
              :value="parameters[parameter.name]"
              :error="validation.parameters[parameter.name]?.error"
              :disabled="isLoading"
              @update:value="(value) => updateParameter(parameter.name, value)"
              @validate="(isValid, error) => updateValidation(parameter.name, isValid, error)"
            />
          </div>
        </div>

        <!-- Message d'erreur global -->
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
import type { Service, ServiceAction, ServiceReaction } from '~/types'
import type { ServiceConfiguration, ConfigurationValidation } from '~/types'
import { ConfigurationValidator, FIELD_TYPE_MAPPING } from '~/types/ServiceConfiguration'

import ConfigInput from '~/components/ui/config/ConfigInput.vue'
import ConfigNumber from '~/components/ui/config/ConfigNumber.vue'
import ConfigSelect from '~/components/ui/config/ConfigSelect.vue'
import ConfigDate from '~/components/ui/config/ConfigDate.vue'
import ConfigCheckbox from '~/components/ui/config/ConfigCheckbox.vue'
import ConfigSelectMenu from '~/components/ui/config/ConfigSelectMenu.vue'
import ConfigDiscordChannel from '~/components/ui/config/ConfigDiscordChannel.vue'

interface Props {
  open?: boolean
  service: Service
  blockType: 'trigger' | 'action'
  initialConfig?: ServiceConfiguration
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'configuration-confirmed', config: ServiceConfiguration): void
}

const props = withDefaults(defineProps<Props>(), {
  open: false
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

const getFieldComponent = (type: string) => {
  const fieldConfig = FIELD_TYPE_MAPPING[type]
  if (!fieldConfig) {
    console.warn(`Unknown field type: ${type}, using ConfigInput as fallback`)
    return ConfigInput
  }

  switch (fieldConfig.component) {
    case 'ConfigNumber': return ConfigNumber
    case 'ConfigSelect': return ConfigSelect
    case 'ConfigDate': return ConfigDate
    case 'ConfigCheckbox': return ConfigCheckbox
    case 'ConfigSelectMenu': return ConfigSelectMenu
    case 'ConfigDiscordChannel': return ConfigDiscordChannel
    default: return ConfigInput
  }
}

const selectActionReaction = (actionReaction: ServiceAction | ServiceReaction) => {
  selectedActionReaction.value = actionReaction

  parameters.value = ConfigurationValidator.initializeParameters(actionReaction)

  validateConfiguration()
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
    nextTick(() => {
      initializeFromConfig()
    })
  }
})

onMounted(() => {
  if (props.open) {
    nextTick(() => {
      initializeFromConfig()
    })
  }
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
</style>