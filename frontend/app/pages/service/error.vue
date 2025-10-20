<template>
  <div class="min-h-screen flex items-center justify-center" style="font-family: var(--font-family-sans); background: var(--bg-primary);">

    <!-- Arrière-plan décoratif -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10" style="background: var(--color-primary);"></div>
      <div class="absolute top-1/2 -left-32 w-64 h-64 rounded-full opacity-5" style="background: var(--color-secondary);"></div>
    </div>

    <UContainer class="relative z-10 py-20">
      <div class="max-w-md mx-auto text-center">
        <div class="scale-in">
          <div class="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <UIcon name="i-heroicons-x-mark" class="w-8 h-8 text-red-600" />
          </div>
          <h1 class="text-3xl font-bold mb-4 text-red-800">
            Erreur de connexion
          </h1>
          <p class="text-lg mb-2" style="color: var(--text-primary);">
            Impossible de connecter <strong>{{ serviceName }}</strong>
          </p>
          <p class="text-sm mb-6 text-red-600">
            {{ errorMessage }}
          </p>

          <div class="space-y-3">
            <NuxtLink to="/dashboard">
              <UButton
                style="background: var(--color-tertiary); color: var(--text-white);"
                size="lg"
                class="w-full"
              >
                Retour au dashboard
              </UButton>
            </NuxtLink>

            <UButton
              variant="outline"
              size="lg"
              class="w-full"
              style="border-color: var(--border-color); color: var(--text-secondary);"
              @click="retry"
            >
              Réessayer la connexion
            </UButton>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: false
})

const route = useRoute()
const { linkProvider } = useAuth()

const serviceName = ref('')
const errorMessage = ref('')

onMounted(() => {
  const service = route.query.service as string
  const error = route.query.error as string

  serviceName.value = service ? service.charAt(0).toUpperCase() + service.slice(1) : 'Service'

  // Messages d'erreur en français
  const errorMessages: Record<string, string> = {
    'access_denied': 'Vous avez refusé l\'autorisation',
    'invalid_request': 'Demande invalide',
    'unauthorized_client': 'Client non autorisé',
    'unsupported_response_type': 'Type de réponse non supporté',
    'invalid_scope': 'Portée invalide',
    'server_error': 'Erreur du serveur',
    'temporarily_unavailable': 'Service temporairement indisponible',
    'missing_code': 'Code d\'autorisation manquant',
    'authentication_required': 'Authentification requise',
    'invalid_token': 'Token invalide',
    'gmail_auth_failed': 'Échec de l\'authentification Gmail'
  }

  errorMessage.value = errorMessages[error as string] || error || 'Erreur inconnue'
})

const retry = () => {
  const service = route.query.service as string
  if (service) {
    try {
      linkProvider(service as any)
    } catch (error) {
      console.error('Retry connection error:', error)
      navigateTo('/dashboard')
    }
  } else {
    navigateTo('/dashboard')
  }
}

useHead({
  title: `Erreur connexion ${serviceName.value} - Auto`,
  meta: [
    { name: 'description', content: `Erreur lors de la connexion au service ${serviceName.value}` }
  ]
})
</script>

<style scoped>
.scale-in {
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>