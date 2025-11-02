<template>
  <div class="config-field" :data-parameter-name="props.parameter.name" @focusin="handleFocusIn" @mousedown="handleFocusIn">
    <label :for="fieldId" class="config-label">
      {{ props.parameter.name }}
      <span v-if="props.parameter.required" class="required-indicator">*</span>
    </label>

    <UInput
      :id="fieldId"
      type="number"
      :name="props.parameter.name"
      :model-value="value?.toString() || ''"
      :placeholder="props.parameter.placeholder?.toString() || '0'"
      :disabled="disabled"
      :min="props.parameter.validation?.min"
      :max="props.parameter.validation?.max"
      :class="{ 'error': !!error }"
      @update:model-value="handleInput"
      @blur="handleBlur"
      style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);"
    />

    <div v-if="props.parameter.description" class="config-description">
      {{ props.parameter.description }}
      <span v-if="props.parameter.validation?.min !== undefined || props.parameter.validation?.max !== undefined" class="validation-info">
        (
        <template v-if="props.parameter.validation?.min !== undefined">
          Min: {{ props.parameter.validation.min }}
        </template>
        <template v-if="props.parameter.validation?.min !== undefined && props.parameter.validation?.max !== undefined">
          ,
        </template>
        <template v-if="props.parameter.validation?.max !== undefined">
          Max: {{ props.parameter.validation.max }}
        </template>
        )
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

// Gérer les changements de valeur
const handleInput = (newValue: string) => {
  const numValue = newValue === '' ? null : Number(newValue)
  emit('update:value', numValue)
  validateField(numValue)
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

.validation-info {
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
