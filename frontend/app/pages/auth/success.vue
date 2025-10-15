<template>
  <div class="min-h-screen flex items-center justify-center" style="font-family: var(--font-family-sans); background: var(--bg-primary);">

    <!-- Arrière-plan décoratif -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10" style="background: var(--color-primary);"></div>
      <div class="absolute top-1/2 -left-32 w-64 h-64 rounded-full opacity-5" style="background: var(--color-secondary);"></div>
    </div>

    <UContainer class="relative z-10 py-20">
      <div class="max-w-md mx-auto text-center">

        <!-- Loading state -->
        <div v-if="isProcessing" class="fade-in">
          <div class="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style="background: var(--color-primary);">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin" style="color: var(--color-tertiary);" />
          </div>
          <h1 class="text-2xl font-bold mb-4" style="color: var(--text-primary);">
            Connexion en cours...
          </h1>
          <p class="text-lg" style="color: var(--text-secondary);">
            Finalisation de votre authentification
          </p>
        </div>

        <!-- Success state -->
        <div v-else-if="success" class="scale-in">
          <div class="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style="background: var(--color-secondary);">
            <UIcon name="i-heroicons-check" class="w-8 h-8 text-white" />
          </div>
          <h1 class="text-3xl font-bold mb-4" style="color: var(--text-primary);">
            Connexion réussie !
          </h1>
          <p class="text-lg mb-6" style="color: var(--text-secondary);">
            Redirection vers votre dashboard...
          </p>
        </div>

        <!-- Error state -->
        <div v-else class="scale-in">
          <div class="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <UIcon name="i-heroicons-x-mark" class="w-8 h-8 text-red-600" />
          </div>
          <h1 class="text-3xl font-bold mb-4 text-red-800">
            Erreur de connexion
          </h1>
          <p class="text-lg mb-6 text-red-600">
            {{ errorMessage }}
          </p>
          <NuxtLink to="/login">
            <UButton
              style="background: var(--color-tertiary); color: var(--text-white);"
              size="lg"
            >
              Retour à la connexion
            </UButton>
          </NuxtLink>
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
const { user, authToken, refreshTokens } = useAuth()

const isProcessing = ref(true)
const success = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  const token = route.query.token as string
  const refreshToken = route.query.refresh as string
  const provider = route.query.provider as string

  if (!token) {
    errorMessage.value = 'Token d\'authentification manquant'
    isProcessing.value = false
    return
  }

  try {
    // Utiliser les cookies de useAuth directement
    const { authToken, refreshTokens } = useAuth()

    // Accéder aux cookies useAuth
    const authCookie = useCookie('auth-token', {
      default: () => '',
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24
    })

    const refreshCookie = useCookie('refresh-token', {
      default: () => '',
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })

    // Stocker les tokens OAuth dans les mêmes cookies que useAuth
    authCookie.value = token
    if (refreshToken) {
      refreshCookie.value = refreshToken
    }

    // Récupérer les données utilisateur en utilisant les nouveaux tokens
    await nextTick()

    // Déclencher la vérification du token et récupération des données utilisateur
    try {
      const { verifyToken } = useAuth()
      await verifyToken()
    } catch (userError) {
    }

    // Petite pause pour l'UX
    await new Promise(resolve => setTimeout(resolve, 1000))

    success.value = true
    isProcessing.value = false

    // Redirection après 1.5 secondes
    setTimeout(() => {
      navigateTo('/dashboard')
    }, 1500)

  } catch (error) {
    console.error('OAuth success handler error:', error)
    errorMessage.value = 'Erreur lors de la finalisation de l\'authentification'
    isProcessing.value = false
  }
})

useHead({
  title: 'Connexion réussie - Auto',
  meta: [
    { name: 'description', content: 'Authentification OAuth réussie' }
  ]
})
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

.scale-in {
  animation: scaleIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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