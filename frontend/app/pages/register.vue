<template>
  <div class="min-h-screen flex items-center justify-center" style="font-family: var(--font-family-sans); background: var(--bg-primary);">

    <!-- Arrière-plan avec formes décoratives -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10" style="background: var(--color-primary);"></div>
      <div class="absolute top-1/2 -left-32 w-64 h-64 rounded-full opacity-5" style="background: var(--color-secondary);"></div>
      <div class="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-5" style="background: var(--color-tertiary);"></div>
    </div>

    <UContainer class="relative z-10 py-20">
      <div class="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">

        <!-- Section formulaire -->
        <div class="order-2 lg:order-1 fade-in">
          <div class="max-w-md mx-auto">
            <div class="text-center mb-8 slide-up">
              <h1 class="text-4xl lg:text-5xl font-bold mb-4" style="color: var(--text-primary);">
                Rejoignez
                <span class="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">Auto</span>
              </h1>
              <p class="text-lg" style="color: var(--text-secondary);">
                Créez votre compte et automatisez votre quotidien en quelques clics
              </p>
            </div>

            <!-- Message d'erreur -->
            <div v-if="errorMessage" class="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 scale-in">
              <div class="flex items-center">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500 mr-2" />
                <p class="text-sm text-red-600">{{ errorMessage }}</p>
              </div>
            </div>

            <!-- Exigences mot de passe -->
            <div v-if="password" class="mb-4 p-4 rounded-lg border scale-in" :class="passwordStrength.isValid ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'">
              <h4 class="font-medium text-sm mb-2" :class="passwordStrength.isValid ? 'text-green-700' : 'text-yellow-700'">
                Exigences du mot de passe :
              </h4>
              <div class="space-y-1">
                <div class="flex items-center text-xs">
                  <UIcon :name="passwordStrength.checks.length ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                         class="w-4 h-4 mr-2"
                         :class="passwordStrength.checks.length ? 'text-green-500' : 'text-red-500'" />
                  <span :class="passwordStrength.checks.length ? 'text-green-600' : 'text-red-600'">
                    Au moins 8 caractères
                  </span>
                </div>
                <div class="flex items-center text-xs">
                  <UIcon :name="passwordStrength.checks.uppercase ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                         class="w-4 h-4 mr-2"
                         :class="passwordStrength.checks.uppercase ? 'text-green-500' : 'text-red-500'" />
                  <span :class="passwordStrength.checks.uppercase ? 'text-green-600' : 'text-red-600'">
                    Au moins une majuscule
                  </span>
                </div>
                <div class="flex items-center text-xs">
                  <UIcon :name="passwordStrength.checks.number ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                         class="w-4 h-4 mr-2"
                         :class="passwordStrength.checks.number ? 'text-green-500' : 'text-red-500'" />
                  <span :class="passwordStrength.checks.number ? 'text-green-600' : 'text-red-600'">
                    Au moins un chiffre
                  </span>
                </div>
                <div class="flex items-center text-xs">
                  <UIcon :name="passwordStrength.checks.special ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                         class="w-4 h-4 mr-2"
                         :class="passwordStrength.checks.special ? 'text-green-500' : 'text-red-500'" />
                  <span :class="passwordStrength.checks.special ? 'text-green-600' : 'text-red-600'">
                    Au moins un caractère spécial
                  </span>
                </div>
              </div>
            </div>

            <!-- AuthForm de Nuxt UI -->
            <div class="scale-in">
              <UAuthForm
              :fields="formFields"
              :providers="authProviders"
              title=""
              :submit-button="{
                label: isLoading ? 'Création du compte...' : 'Créer mon compte',
                size: 'lg',
                color: 'primary',
                class: 'w-full justify-center',
                loading: isLoading
              }"
              @submit="handleSubmit"
              />
            </div>

            <div class="mt-6 text-center fade-in">
              <p class="text-sm" style="color: var(--text-secondary);">
                Déjà un compte ?
                <NuxtLink to="/login" class="font-medium smooth-hover transition-colors duration-200 hover:underline" style="color: var(--color-tertiary);">
                  Se connecter
                </NuxtLink>
              </p>
            </div>

            <!-- Avantages -->
            <div class="mt-8 space-y-3 fade-in">
              <div class="flex items-center gap-3" style="color: var(--text-secondary);">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5" style="color: var(--color-secondary);" />
                <span class="text-sm">Gratuit pour commencer</span>
              </div>
              <div class="flex items-center gap-3" style="color: var(--text-secondary);">
                <UIcon name="i-heroicons-lightning-bolt" class="w-5 h-5" style="color: var(--color-secondary);" />
                <span class="text-sm">Configuration en 30 secondes</span>
              </div>
              <div class="flex items-center gap-3" style="color: var(--text-secondary);">
                <UIcon name="i-heroicons-shield-check" class="w-5 h-5" style="color: var(--color-secondary);" />
                <span class="text-sm">Données sécurisées et chiffrées</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section robot -->
        <div class="order-1 lg:order-2 fade-in">
          <div class="relative flex flex-col items-center">
            <!-- Bulle de dialogue -->
            <div class="relative mb-6 p-4 lg:p-6 rounded-3xl max-w-xs lg:max-w-md smooth-hover"
                 style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(167, 240, 186, 0.1)); border: 2px solid var(--color-primary); box-shadow: var(--shadow-xl);">

              <div class="text-base lg:text-lg font-medium text-center" style="color: var(--color-tertiary);">
                <UiTextType
                  :text="['Bienvenue dans Auto !', 'Prêt à automatiser ?', 'Rejoignez 50K+ équipes !', 'Créons votre compte !']"
                  :typingSpeed="75"
                  :pauseDuration="2000"
                  :showCursor="true"
                  cursorCharacter="●"
                  cursorClass="ml-2 text-green-400 animate-pulse"
                />
              </div>

              <div class="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                <div class="w-6 h-6 rotate-45 border-r-2 border-b-2"
                     style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(167, 240, 186, 0.1)); border-color: var(--color-primary);"></div>
              </div>
            </div>

            <!-- Robot d'inscription -->
            <UiAnimatedRobot
              robotType="register"
              size="lg"
              :show-floating-elements="true"
              alignment="center"
              alt="Robot d'inscription Auto"
            />
          </div>
        </div>

      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'guest'
})

const { register, loginWithProvider } = useAuth()
const isLoading = ref(false)
const errorMessage = ref('')

// Validation du mot de passe
const password = ref('')
const passwordStrength = computed(() => {
  const pwd = password.value
  const checks = {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
  }

  const score = Object.values(checks).filter(Boolean).length
  return { checks, score, isValid: score === 4 }
})
const formFields = [
  {
    name: 'firstName',
    type: 'text',
    label: 'Prénom',
    placeholder: 'Votre prénom',
    required: true
  },
  {
    name: 'lastName',
    type: 'text',
    label: 'Nom',
    placeholder: 'Votre nom',
    required: true
  },
  {
    name: 'email',
    type: 'email',
    label: 'Adresse email',
    placeholder: 'votre@email.com',
    required: true
  },
  {
    name: 'password',
    type: 'password',
    label: 'Mot de passe',
    placeholder: 'Créer un mot de passe',
    required: true
  },
  {
    name: 'confirmPassword',
    type: 'password',
    label: 'Confirmer le mot de passe',
    placeholder: 'Confirmer votre mot de passe',
    required: true
  },
  {
    name: 'terms',
    type: 'checkbox',
    label: "J'accepte les conditions d'utilisation et la politique de confidentialité",
    required: true
  }
]

const authProviders = [
  {
    label: 'Continuer avec Google',
    icon: 'i-logos-google-icon',
    style: 'background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);',
    click: () => loginWithProvider('google')
  },
  {
    label: 'Continuer avec GitHub',
    icon: 'i-logos-github-icon',
    style: 'background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);',
    click: () => loginWithProvider('github')
  },
  {
    label: 'Continuer avec Discord',
    icon: 'i-logos-discord-icon',
    style: 'background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);',
    click: () => loginWithProvider('discord')
  }
]

const handleSubmit = async (event: any) => {
  if (isLoading.value) return

  const data = event.data || event
  password.value = data.password || ''

  if (data.password !== data.confirmPassword) {
    errorMessage.value = 'Les mots de passe ne correspondent pas'
    return
  }

  if (!data.terms) {
    errorMessage.value = 'Vous devez accepter les conditions d\'utilisation'
    return
  }

  if (!passwordStrength.value.isValid) {
    errorMessage.value = 'Le mot de passe ne respecte pas toutes les exigences'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await register({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    errorMessage.value = error.message || 'Une erreur est survenue lors de l\'inscription'
  } finally {
    isLoading.value = false
  }
}

useHead({
  title: 'Inscription - Auto',
  meta: [
    { name: 'description', content: 'Rejoignez Auto et automatisez vos workflows en quelques clics. Gratuit pour commencer.' }
  ]
})
</script>

<style scoped>
/* Styles de base pour les formulaires */
:deep(.form-input) {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
}

:deep(.form-input:focus) {
  border-color: var(--color-primary) !important;
}

:deep(.form-input::placeholder) {
  color: var(--text-secondary) !important;
  opacity: 0.7;
}

/* Style pour tous les inputs */
:deep(input[type="text"]),
:deep(input[type="email"]),
:deep(input[type="password"]) {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
}

:deep(input[type="text"]:focus),
:deep(input[type="email"]:focus),
:deep(input[type="password"]:focus) {
  border-color: var(--color-primary) !important;
}

/* Style pour les labels */
:deep(label) {
  color: var(--text-primary);
  font-weight: 500;
}

/* Style pour les messages d'erreur */
:deep(.text-red-500) {
  color: #ef4444;
}

</style>