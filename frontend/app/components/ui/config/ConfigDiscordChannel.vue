<template>
  <ConfigSelectMenu
    :parameter="parameter"
    :value="value"
    :error="error"
    :disabled="disabled"
    :items="channelOptions"
    :loading="isLoading"
    :load-error="isError ? 'Erreur lors du chargement des channels Discord' : undefined"
    :placeholder="isLoading ? 'Chargement des channels...' : 'Sélectionnez un channel Discord'"
    @update:value="emit('update:value', $event)"
    @validate="(isValid, error) => emit('validate', isValid, error)"
  />
</template>

<script setup lang="ts">
import type { ConfigFieldProps, ConfigFieldEmits } from '~/types'
import ConfigSelectMenu from './ConfigSelectMenu.vue'

interface Props extends ConfigFieldProps {}
interface Emits extends ConfigFieldEmits {}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<Emits>()

const isLoading = ref(false)
const isError = ref(false)
const channels = ref<Array<{ id: string, name: string }>>([])

const channelOptions = computed(() => {
  if (channels.value.length === 0) {
    return []
  }

  return channels.value.map(channel => ({
    label: `# ${channel.name}`,
    value: channel.id
  }))
})

const loadDiscordChannels = async () => {
  try {
    isLoading.value = true
    isError.value = false

    const { public: config } = useRuntimeConfig()
    const backendUrl = config.backendUrl

    const authToken = useCookie('auth-token')
    if (!authToken.value) {
      isError.value = true
      channels.value = []
      return
    }

    const headers = {
      'Authorization': `Bearer ${authToken.value}`,
      'Content-Type': 'application/json'
    }

    const guildsResponse = await $fetch(`${backendUrl}/api/discord/guilds`, { headers })

    if (!guildsResponse.guilds || guildsResponse.guilds.length === 0) {
      channels.value = []
      return
    }

    // TODO: Permettre à l'utilisateur de sélectionner la guilde
    const firstGuild = guildsResponse.guilds[0]

    const channelsResponse = await $fetch(`${backendUrl}/api/discord/guilds/${firstGuild.id}/channels`, { headers })

    if (channelsResponse.channels) {
      channels.value = channelsResponse.channels.map((channel: any) => ({
        id: channel.id,
        name: channel.name
      }))
    } else {
      channels.value = []
    }
  } catch (error) {
    console.error('Failed to load Discord channels:', error)
    isError.value = true
    channels.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDiscordChannels()
})
</script>