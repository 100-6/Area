<template>
  <div class="config-field" :data-parameter-name="props.parameter.name" @focusin="handleFocusIn" @mousedown="handleFocusIn">
    <label :for="fieldId" class="config-label">
      {{ props.parameter.name }}
      <span v-if="props.parameter.required" class="required-indicator">*</span>
    </label>

    <UInput
      :id="fieldId"
      :type="inputType"
      :name="props.parameter.name"
      :model-value="displayValue"
      :placeholder="props.parameter.placeholder || formatPlaceholder"
      :disabled="disabled"
      :class="{ 'error': !!error }"
      @update:model-value="handleInput"
      @blur="handleBlur"
      style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);"
    />

    <div v-if="props.parameter.description" class="config-description">
      {{ props.parameter.description }}
      <span class="format-info">
        (Format: {{ formatExample }})
      </span>
    </div>

    <div v-if="error" class="config-error">
      <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4" />
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ConfigFieldProps, ConfigFieldEmits } from '../../../types/ServiceConfiguration'
import { ConfigurationValidator } from '../../../types/ServiceConfiguration'

const props = withDefaults(defineProps<ConfigFieldProps>(), {
  disabled: false
})
const emit = defineEmits<ConfigFieldEmits>()

const handleFocusIn = (event: FocusEvent | MouseEvent) => {
  emit('focus-field', { element: event.target as HTMLElement | null })
}

// Générer un ID unique pour le champ
const fieldId = computed(() => `config-${props.parameter.name}-${Math.random().toString(36).substr(2, 9)}`)

// Déterminer le type d'input basé sur le format attendu
const inputType = computed(() => {
  if (props.parameter.placeholder?.includes('T') || props.parameter.description?.toLowerCase().includes('heure')) {
    return 'datetime-local'
  }
  return 'date'
})

// Format d'exemple pour l'aide
const formatExample = computed(() => {
  if (inputType.value === 'datetime-local') {
    return 'YYYY-MM-DDTHH:mm'
  }
  return 'YYYY-MM-DD'
})

// Placeholder formaté
const formatPlaceholder = computed(() => {
  if (inputType.value === 'datetime-local') {
    return '2025-12-31T23:59'
  }
  return '2025-12-31'
})

// Valeur formatée pour l'affichage dans l'input
const displayValue = computed(() => {
  if (!props.value) return ''

  try {
    const date = new Date(props.value)
    if (isNaN(date.getTime())) return props.value

    if (inputType.value === 'datetime-local') {
      // Format pour datetime-local: YYYY-MM-DDTHH:mm
      return date.toISOString().slice(0, 16)
    } else {
      // Format pour date: YYYY-MM-DD
      return date.toISOString().slice(0, 10)
    }
  } catch {
    return props.value
  }
})

// Gérer les changements de valeur
const handleInput = (newValue: string) => {
  if (!newValue) {
    emit('update:value', '')
    validateField('')
    return
  }

  try {
    // Convertir en ISO string pour cohérence
    const date = new Date(newValue)
    if (!isNaN(date.getTime())) {
      emit('update:value', date.toISOString())
    } else {
      emit('update:value', newValue)
    }
  } catch {
    emit('update:value', newValue)
  }

  validateField(newValue)
}

// Valider lors de la perte de focus
const handleBlur = () => {
  validateField(props.value)
}

// Valider le champ
const validateField = (currentValue: any) => {
  const validation = ConfigurationValidator.validateParameter(currentValue, props.parameter)
  emit('validate', validation.isValid, validation.error)
}

// Valider à l'initialisation
onMounted(() => {
  validateField(props.value)
})
</script>

<style scoped>
.config-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
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

.config-description {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.format-info {
  font-style: italic;
  opacity: 0.8;
}

.config-error {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.1);
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* Style pour les champs en erreur */
.error {
  border-color: var(--color-error) !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}
</style>
