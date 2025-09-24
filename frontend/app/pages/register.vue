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
        <div class="order-2 lg:order-1">
          <div class="max-w-md mx-auto">
            <div class="text-center mb-8">
              <h1 class="text-4xl lg:text-5xl font-bold mb-4" style="color: var(--text-primary);">
                Rejoignez
                <span class="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">Auto</span>
              </h1>
              <p class="text-lg" style="color: var(--text-secondary);">
                Créez votre compte et automatisez votre quotidien en quelques clics
              </p>
            </div>

            <!-- AuthForm de Nuxt UI -->
            <UAuthForm
              :fields="formFields"
              :providers="authProviders"
              title=""
              :submit-button="{
                label: 'Créer mon compte',
                size: 'lg',
                color: 'primary',
                class: 'w-full justify-center'
              }"
              @submit="handleSubmit"
            />

            <div class="mt-6 text-center">
              <p class="text-sm" style="color: var(--text-secondary);">
                Déjà un compte ?
                <NuxtLink to="/login" class="font-medium hover:underline" style="color: var(--color-tertiary);">
                  Se connecter
                </NuxtLink>
              </p>
            </div>

            <!-- Avantages -->
            <div class="mt-8 space-y-3">
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
        <div class="order-1 lg:order-2">
          <div class="relative flex flex-col items-center">
            <!-- Bulle de dialogue -->
            <div class="relative mb-6 p-4 lg:p-6 rounded-3xl max-w-xs lg:max-w-md"
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
// Configuration des champs du formulaire
const formFields = [
  {
    name: 'name',
    type: 'text',
    label: 'Nom complet',
    placeholder: 'Votre nom complet',
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

// Fournisseurs d'authentification
const authProviders = [
  {
    label: 'Continuer avec Google',
    icon: 'i-logos-google-icon',
    style: 'background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);',
    click: () => {
      // Logique de connexion Google
      console.log('Login with Google')
    }
  },
  {
    label: 'Continuer avec GitHub',
    icon: 'i-logos-github-icon',
    style: 'background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);',
    click: () => {
      // Logique de connexion GitHub
      console.log('Login with GitHub')
    }
  },
  {
    label: 'Continuer avec Discord',
    icon: 'i-logos-discord-icon',
    style: 'background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);',
    click: () => {
      // Logique de connexion Discord
      console.log('Login with Discord')
    }
  }
]

// Gestion de la soumission du formulaire
const handleSubmit = async (data: any) => {
  console.log('Registration data:', data)

  // Validation des mots de passe
  if (data.password !== data.confirmPassword) {
    // Afficher une erreur
    return
  }

  // Logique d'inscription
  try {
    // Appel API d'inscription
    console.log('Creating account for:', data.email)

    // Redirection après inscription réussie
    await navigateTo('/dashboard')
  } catch (error) {
    console.error('Registration error:', error)
  }
}

// Configuration SEO
useHead({
  title: 'Inscription - Auto',
  meta: [
    { name: 'description', content: 'Rejoignez Auto et automatisez vos workflows en quelques clics. Gratuit pour commencer.' }
  ]
})
</script>

<style scoped>
/* Styles personnalisés pour améliorer l'apparence du formulaire */
:deep(.form-input) {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
}

:deep(.form-input:focus) {
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 3px rgba(167, 240, 186, 0.1) !important;
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