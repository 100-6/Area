<template>
  <div class="config-field" :data-parameter-name="props.parameter.name" @focusin="handleFocusIn" @mousedown="handleFocusIn">
    <label :for="fieldId" class="config-label">
      {{ props.parameter.name }}
      <span v-if="props.parameter.required" class="required-indicator">*</span>
    </label>

    <UInput
      :id="fieldId"
      :name="props.parameter.name"
      :key="fieldId"
      :model-value="props.value || ''"
      :placeholder="props.parameter.placeholder || ''"
      :disabled="disabled"
      :class="{ 'error': !!error }"
      @update:model-value="handleInput"
      @blur="handleBlur"
      style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);"
    />


    <div v-if="props.parameter.description" class="config-description">
      {{ props.parameter.description }}
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

const fieldId = computed(() => `config-${props.parameter.name}-${Math.random().toString(36).substr(2, 9)}`)

const handleInput = (newValue: string) => {
  emit('update:value', newValue)
  validateField(newValue)
}

const handleBlur = () => {
  validateField(props.value)
}

const validateField = (currentValue: any) => {
  const validation = ConfigurationValidator.validateParameter(currentValue, props.parameter)
  emit('validate', validation.isValid, validation.error)
}

onMounted(() => {
  validateField(props.value)
})

watch(() => props.value, (newValue, oldValue) => {

}, { immediate: true })
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
