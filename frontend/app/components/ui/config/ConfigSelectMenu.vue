<template>
  <div class="config-field" :data-parameter-name="props.parameter.name" @focusin="handleFocusIn" @mousedown="handleFocusIn">
    <label :for="fieldId" class="config-label">
      {{ props.parameter.name }}
      <span v-if="props.parameter.required" class="required-indicator">*</span>
    </label>

    <USelectMenu
      :id="fieldId"
      v-model="selectedItem"
      :items="finalItems"
      :placeholder="placeholder"
      :disabled="disabled || isLoading"
      :loading="isLoading"
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

    <div v-if="errorMessage" class="config-error">
      <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4" />
      <span>{{ errorMessage }}</span>
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

const props = withDefaults(defineProps<ConfigFieldProps & {
  items?: Array<{ label: string; value: string }>
  loading?: boolean
  loadError?: string
  placeholder?: string
  valueKey?: string
}>(), {
  disabled: false,
  loading: false,
  valueKey: 'value',
  placeholder: 'Sélectionnez une option',
  items: () => []
})

const emit = defineEmits<ConfigFieldEmits>()

const handleFocusIn = (event: FocusEvent | MouseEvent) => {
  emit('focus-field', { element: event.target as HTMLElement | null })
}

const fieldId = computed(() => `config-${props.parameter.name}-${Math.random().toString(36).substr(2, 9)}`)

const isLoadingOptions = ref(false)
const loadErrorMessage = ref('')
const apiOptions = ref<Array<{ label: string; value: string }>>([])

const mapParameterOptions = (options: any[]): Array<{ label: string; value: string }> => {
  return options.map((option) => {
    if (typeof option === 'string') {
      return { label: option, value: option }
    }
    if (typeof option === 'object' && option) {
      return {
        label: option.label ?? option.name ?? option.value ?? '',
        value: option.value ?? option.id ?? option.key ?? option.label ?? ''
      }
    }
    return { label: String(option), value: String(option) }
  })
}

const selectedItem = ref<{ label: string; value: string } | string | null>(null)

const shouldFetchFromApi = computed(() => {
  if (props.items && props.items.length > 0) {
    return false
  }

  if (props.parameter.options && props.parameter.options.length > 0) {
    return false
  }

  const endpoint = getApiEndpoint()
  return Boolean(endpoint)
})

const finalItems = computed(() => {
  if (props.items && props.items.length > 0) {
    return props.items
  }
  return apiOptions.value
})

const isLoading = computed(() => {
  return props.loading || isLoadingOptions.value
})

const errorMessage = computed(() => {
  return props.loadError || loadErrorMessage.value
})

watch(() => props.value, (newValue) => {
  if (newValue && finalItems.value.length > 0) {
    const found = finalItems.value.find(item => item.value === newValue)
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

watch(() => finalItems.value, (newItems) => {
  if (props.value && newItems.length > 0) {
    const found = newItems.find(item => item.value === props.value)
    if (found && !selectedItem.value) {
      selectedItem.value = found
    }
  }
})

watch(() => props.parameter.options, (newOptions) => {
  if (newOptions && newOptions.length > 0) {
    apiOptions.value = mapParameterOptions(newOptions)
  }
}, { immediate: true })

const getApiEndpoint = (): string | null => {
  const paramName = props.parameter.name.toLowerCase()
  const description = props.parameter.description?.toLowerCase() || ''

  if (paramName.includes('model') && (description.includes('gpt') || description.includes('openai'))) {
    return '/api/openai/models'
  }

  if (paramName.includes('channel') || description.includes('channel')) {
    return '/api/discord/guilds'
  }

  return null
}

const fetchApiOptions = async () => {
  if (!shouldFetchFromApi.value) {
    if (props.parameter.options && props.parameter.options.length > 0) {
      apiOptions.value = mapParameterOptions(props.parameter.options)
    }
    return
  }

  const endpoint = getApiEndpoint()
  if (!endpoint) {
    if (props.parameter.options && props.parameter.options.length > 0) {
      apiOptions.value = props.parameter.options.map(option => ({
        label: option,
        value: option
      }))
    } else {
      apiOptions.value = []
      loadErrorMessage.value = 'Aucunes options disponibles'
    }
    isLoadingOptions.value = false
    return
  }

  try {
    isLoadingOptions.value = true
    loadErrorMessage.value = ''

    const { public: config } = useRuntimeConfig()
    const backendUrl = config.backendUrl

    const authToken = useCookie('auth-token')
    if (!authToken.value) {
      loadErrorMessage.value = 'Token d\'authentification manquant'
      return
    }

    const headers = {
      'Authorization': `Bearer ${authToken.value}`,
      'Content-Type': 'application/json'
    }

    const response = await $fetch(`${backendUrl}${endpoint}`, { headers })

    if (endpoint === '/api/openai/models' && response.models) {
      apiOptions.value = response.models.map((model: any) => ({
        label: model.name,
        value: model.id
      }))
    } else if (endpoint === '/api/github/organizations' && response.organizations) {
      apiOptions.value = response.organizations.map((org: any) => ({
        label: org.login,
        value: org.login
      }))
    } else if (endpoint === '/api/github/repositories' && response.repositories) {
      apiOptions.value = response.repositories.map((repo: any) => ({
        label: `${repo.full_name} ${repo.private ? '(privé)' : '(public)'}`,
        value: repo.full_name
      }))
    } else if (endpoint === '/api/discord/guilds') {
      const guilds = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.guilds)
          ? (response as any).guilds
          : []

      if (!guilds.length) {
        apiOptions.value = []
        loadErrorMessage.value = 'Aucun serveur Discord accessible'
        return
      }

      const allChannels: Array<{ label: string; value: string }> = []

      for (const guild of guilds) {
        try {
          const guildChannels = await $fetch(`${backendUrl}/api/discord/guilds/${guild.id}/channels`, { headers })

          if (guildChannels.channels) {
            guildChannels.channels.forEach((channel: any) => {
              allChannels.push({
                label: `${guild.name} - #${channel.name}`,
                value: channel.id
              })
            })
          } else {
            if (!loadErrorMessage.value) {
              loadErrorMessage.value = 'Réponse inattendue lors du chargement des salons Discord'
            }
          }
        } catch (err) {
          if (!loadErrorMessage.value) {
            loadErrorMessage.value = 'Erreur lors du chargement des salons Discord'
          }
        }
      }

      apiOptions.value = allChannels
      if (!allChannels.length) {
        loadErrorMessage.value = 'Aucun salon disponible sur vos serveurs Discord'
      }
    } else if (endpoint === '/api/timer/timezones' && response.timezones) {
      apiOptions.value = response.timezones.map((timezone: any) => ({
        label: timezone.name,
        value: timezone.id
      }))
    } else {
      if (props.parameter.options && props.parameter.options.length > 0) {
        apiOptions.value = props.parameter.options.map(option => ({
          label: option,
          value: option
        }))
      } else {
        apiOptions.value = []
      }
    }

  } catch (error) {
    if (props.parameter.options && props.parameter.options.length > 0) {
      apiOptions.value = props.parameter.options.map(option => ({
        label: option,
        value: option
      }))
      loadErrorMessage.value = ''
    } else {
      loadErrorMessage.value = error instanceof Error ? error.message : 'Erreur lors du chargement'
      apiOptions.value = []
    }
  } finally {
    isLoadingOptions.value = false
  }
}

onMounted(() => {
  validateField(props.value)

  if (shouldFetchFromApi.value) {
    fetchApiOptions()
  }
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
