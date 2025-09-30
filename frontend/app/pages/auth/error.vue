<template>
  <div class="min-h-screen flex items-center justify-center" style="font-family: var(--font-family-sans); background: var(--bg-primary);">

    <!-- Arrière-plan décoratif -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 bg-red-500"></div>
      <div class="absolute top-1/2 -left-32 w-64 h-64 rounded-full opacity-5 bg-red-400"></div>
    </div>

    <UContainer class="relative z-10 py-20">
      <div class="max-w-md mx-auto text-center">

        <div class="scale-in">
          <!-- Icône d'erreur -->
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-10 h-10 text-red-600" />
          </div>

          <!-- Message d'erreur -->
          <h1 class="text-3xl font-bold mb-4 text-red-800">
            Erreur d'authentification
          </h1>

          <div class="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <p class="text-red-700 mb-2 font-medium">
              {{ errorTitle }}
            </p>
            <p class="text-sm text-red-600">
              {{ errorDescription }}
            </p>
          </div>

          <!-- Provider info -->
          <div v-if="provider" class="mb-6 text-sm" style="color: var(--text-secondary);">
            Erreur avec {{ getProviderName(provider) }}
          </div>

          <!-- Actions -->
          <div class="space-y-3">
            <NuxtLink to="/login" class="block">
              <UButton
                style="background: var(--color-tertiary); color: var(--text-white);"
                size="lg"
                class="w-full"
              >
                <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-2" />
                Retour à la connexion
              </UButton>
            </NuxtLink>

            <button
              @click="retryAuth"
              class="w-full px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              style="color: var(--text-primary);"
            >
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2 inline" />
              Réessayer l'authentification
            </button>
          </div>

          <!-- Help -->
          <div class="mt-8 p-4 rounded-lg" style="background: var(--bg-card); border: 1px solid var(--border-color);">
            <h3 class="font-medium mb-2" style="color: var(--text-primary);">
              Besoin d'aide ?
            </h3>
            <p class="text-sm" style="color: var(--text-secondary);">
              Si le problème persiste, vérifiez que vous autorisez les cookies et que votre navigateur
              accepte les redirections depuis {{ getProviderName(provider) }}.
            </p>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
  layout: false
})

const route = useRoute()

const provider = computed(() => route.query.provider as string || '')
const error = computed(() => route.query.error as string || '')
const message = computed(() => route.query.message as string || '')

const errorTitle = computed(() => {
  if (message.value) {
    return 'Erreur de connexion'
  }

  switch (error.value) {
    case 'access_denied':
      return 'Accès refusé'
    case 'invalid_request':
      return 'Requête invalide'
    case 'invalid_client':
      return 'Configuration invalide'
    case 'invalid_grant':
      return 'Autorisation invalide'
    case 'unauthorized_client':
      return 'Client non autorisé'
    case 'unsupported_response_type':
      return 'Type de réponse non supporté'
    case 'invalid_scope':
      return 'Portée invalide'
    case 'server_error':
      return 'Erreur serveur'
    case 'temporarily_unavailable':
      return 'Service temporairement indisponible'
    default:
      return 'Erreur d\'authentification'
  }
})

const errorDescription = computed(() => {
  if (message.value) {
    return decodeURIComponent(message.value)
  }

  switch (error.value) {
    case 'access_denied':
      return 'Vous avez annulé l\'autorisation ou refusé l\'accès à votre compte.'
    case 'invalid_request':
      return 'La demande d\'authentification contient des paramètres invalides.'
    case 'invalid_client':
      return 'La configuration OAuth de l\'application est incorrecte.'
    case 'invalid_grant':
      return 'Le code d\'autorisation est expiré ou invalide.'
    case 'unauthorized_client':
      return 'Cette application n\'est pas autorisée à utiliser ce type d\'authentification.'
    case 'unsupported_response_type':
      return 'Le fournisseur ne supporte pas ce type de réponse.'
    case 'invalid_scope':
      return 'Les permissions demandées ne sont pas valides.'
    case 'server_error':
      return 'Une erreur s\'est produite sur le serveur d\'authentification.'
    case 'temporarily_unavailable':
      return 'Le service d\'authentification est temporairement indisponible.'
    default:
      return 'Une erreur inattendue s\'est produite lors de l\'authentification.'
  }
})

const getProviderName = (provider: string): string => {
  switch (provider) {
    case 'google':
      return 'Google'
    case 'discord':
      return 'Discord'
    case 'github':
      return 'GitHub'
    default:
      return 'le fournisseur'
  }
}

const retryAuth = () => {
  if (provider.value) {
    const { loginWithProvider } = useAuth()
    loginWithProvider(provider.value as 'google' | 'discord' | 'github')
  } else {
    navigateTo('/login')
  }
}

useHead({
  title: 'Erreur d\'authentification - Auto',
  meta: [
    { name: 'description', content: 'Erreur lors de l\'authentification OAuth' }
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