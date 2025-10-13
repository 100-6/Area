<template>
  <div class="config-field">
    <label :for="fieldId" class="config-label">
      {{ props.parameter.name }}
      <span v-if="props.parameter.required" class="required-indicator">*</span>
    </label>

    <USelectMenu
      :id="fieldId"
      v-model="selectedItem"
      :items="items"
      :placeholder="placeholder"
      :disabled="disabled || loading"
      :loading="loading"
      :class="{ 'error': !!error }"
:ui="{
        content: 'bg-white border-0 ring-0 max-h-60 overflow-y-auto',
        item: 'text-black border-0 ring-0 data-highlighted:not-data-disabled:before:bg-green-50',
        itemLabel: 'text-black',
        itemTrailing: 'ms-auto inline-flex gap-1.5 items-center',
        itemTrailingIcon: 'shrink-0 text-green-500',
        input: 'border-0 ring-0 focus:outline-none hover:border-0 hover:ring-0',
        viewport: 'max-h-48 overflow-y-auto border-0'
      }"
      style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);"
    />

    <div v-if="props.parameter.description" class="config-description">
      {{ props.parameter.description }}
    </div>

    <div v-if="loadError" class="config-error">
      <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4" />
      <span>{{ loadError }}</span>
    </div>

    <div v-if="error" class="config-error">
      <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4" />
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ConfigFieldProps, ConfigFieldEmits } from '~/types'
import { ConfigurationValidator } from '~/types/ServiceConfiguration'

interface Props extends ConfigFieldProps {
  items: Array<{ label: string; value: string }>
  loading?: boolean
  loadError?: string
  placeholder?: string
  valueKey?: string
}

interface Emits extends ConfigFieldEmits {}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false,
  valueKey: 'value',
  placeholder: 'Sélectionnez une option'
})

const emit = defineEmits<Emits>()

const fieldId = computed(() => `config-${props.parameter.name}-${Math.random().toString(36).substr(2, 9)}`)

// Variable pour USelectMenu (peut être un objet ou directement la valeur avec value-key)
const selectedItem = ref<{ label: string; value: string } | string | null>(null)

// Synchroniser selectedItem avec props.value
watch(() => props.value, (newValue) => {
  if (newValue && props.items.length > 0) {
    const found = props.items.find(item => item.value === newValue)
    selectedItem.value = found || null
  } else {
    selectedItem.value = null
  }
}, { immediate: true })

const validateField = (currentValue: any) => {
  const validation = ConfigurationValidator.validateParameter(currentValue, props.parameter)
  emit('validate', validation.isValid, validation.error)
}

watch(selectedItem, (newItem) => {
  const newValue = newItem?.value || ''

  emit('update:value', newValue)
  validateField(newValue)
})

watch(() => props.items, (newItems) => {
  if (props.value && newItems.length > 0) {
    const found = newItems.find(item => item.value === props.value)
    if (found && !selectedItem.value) {
      selectedItem.value = found
    }
  }
})


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
  color: var(--color-primary);
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
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 3px rgba(167, 240, 186, 0.1) !important;
}

/* Item sélectionné avec effet vert */
:deep([role="option"][aria-selected="true"]) {
  background: rgba(167, 240, 186, 0.1) !important;
}

/* Icône check verte et visible */
:deep(.text-green-500) {
  color: var(--color-primary) !important;
}

:deep([role="option"] svg) {
  color: var(--color-primary) !important;
  fill: var(--color-primary) !important;
  opacity: 1 !important;
  visibility: visible !important;
  display: inline-block !important;
}

</style>