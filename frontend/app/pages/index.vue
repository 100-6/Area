<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <UContainer class="py-16 lg:py-24">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div class="space-y-8">
            <div>
              <UBadge style="background-color: var(--color-primary); color: var(--color-accent);" class="mb-4" variant="soft" size="lg">
                Bienvenue sur AREA
              </UBadge>
              <h1 class="text-4xl lg:text-6xl font-bold leading-tight">
                Connectez vos
                <span class="text-brand-primary">services</span>
                en un clic
              </h1>
              <p class="text-lg text-gray-600 mt-6 leading-relaxed">
                Automatisez vos tâches quotidiennes en connectant vos applications préférées.
                Créez des workflows personnalisés sans écrire une ligne de code.
              </p>
            </div>

            <div class="flex flex-col sm:flex-row gap-4">
              <UButton
                size="xl"
                style="background-color: var(--color-primary);"
                to="/login"
              >
                <UIcon name="i-heroicons-rocket-launch" class="w-5 h-5" />
                Commencer gratuitement
              </UButton>

              <UButton
                size="xl"
                variant="outline"
                color="gray"
              >
                <UIcon name="i-heroicons-play" class="w-5 h-5" />
                Voir la démo
              </UButton>
            </div>

            <div class="flex items-center gap-8 pt-8">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-brand-secondary" />
                <span class="text-sm text-gray-600">Gratuit pour commencer</span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-brand-secondary" />
                <span class="text-sm text-gray-600">Configuration en 2 minutes</span>
              </div>
            </div>
          </div>

          <div class="relative">
            <UCard class="p-8 shadow-xl">
              <div class="space-y-6">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center">
                    <UIcon name="i-heroicons-envelope" class="w-6 h-6 text-brand-accent" />
                  </div>
                  <div>
                    <h3 class="font-semibold">Gmail connecté</h3>
                    <p class="text-sm text-gray-500">Nouveau email reçu</p>
                  </div>
                </div>

                <div class="flex justify-center">
                  <UIcon name="i-heroicons-arrow-right" class="w-8 h-8 text-brand-secondary animate-pulse" />
                </div>

                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full bg-brand-secondary flex items-center justify-center">
                    <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 class="font-semibold">Slack notifié</h3>
                    <p class="text-sm text-gray-500">Message envoyé automatiquement</p>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Features Section -->
    <section class="py-16 lg:py-24 bg-gray-50">
      <UContainer>
        <div class="text-center max-w-3xl mx-auto mb-16">
          <h2 class="text-3xl lg:text-4xl font-bold mb-6">
            Pourquoi choisir <span class="text-brand-primary">AREA</span> ?
          </h2>
          <p class="text-lg text-gray-600">
            Une plateforme simple et puissante pour automatiser votre quotidien
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <UCard class="p-6 hover:shadow-lg transition-all duration-300">
            <div class="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center mb-4">
              <UIcon name="i-heroicons-puzzle-piece" class="w-6 h-6 text-brand-accent" />
            </div>
            <h3 class="text-xl font-semibold mb-3">Intégrations multiples</h3>
            <p class="text-gray-600">
              Connectez facilement Gmail, Slack, Discord, GitHub et bien d'autres services populaires.
            </p>
          </UCard>

          <UCard class="p-6 hover:shadow-lg transition-all duration-300">
            <div class="w-12 h-12 rounded-full bg-brand-secondary flex items-center justify-center mb-4">
              <UIcon name="i-heroicons-bolt" class="w-6 h-6 text-white" />
            </div>
            <h3 class="text-xl font-semibold mb-3">Automatisation rapide</h3>
            <p class="text-gray-600">
              Configurez vos automatisations en quelques clics grâce à notre interface intuitive.
            </p>
          </UCard>

          <UCard class="p-6 hover:shadow-lg transition-all duration-300">
            <div class="w-12 h-12 rounded-full bg-brand-tertiary flex items-center justify-center mb-4">
              <UIcon name="i-heroicons-shield-check" class="w-6 h-6 text-white" />
            </div>
            <h3 class="text-xl font-semibold mb-3">Sécurisé & Fiable</h3>
            <p class="text-gray-600">
              Vos données sont protégées avec un chiffrement de niveau entreprise.
            </p>
          </UCard>
        </div>
      </UContainer>
    </section>

    <!-- Services Section -->
    <section class="py-16 lg:py-24">
      <UContainer>
        <div class="text-center max-w-3xl mx-auto mb-16">
          <h2 class="text-3xl lg:text-4xl font-bold mb-6">
            Services <span class="text-brand-primary">supportés</span>
          </h2>
          <p class="text-lg text-gray-600">
            Connectez vos outils favoris en quelques clics
          </p>
        </div>

        <UMarquee
          :repeat="2"
          :speed="40"
          pause-on-hover
          class="py-8"
          :ui="{ root: '[--gap:theme(spacing.8)]', content: 'w-auto py-1' }"
        >
          <div class="flex space-x-8">
            <div v-for="service in services" :key="service.name" class="flex-shrink-0">
              <div class="flex items-center space-x-3 px-6 py-3 rounded-full border border-gray-200 bg-white hover:bg-brand-primary/5 transition-colors duration-200">
                <UIcon :name="service.icon" class="w-6 h-6 text-brand-tertiary" />
                <span class="font-medium text-gray-800">{{ service.name }}</span>
              </div>
            </div>
          </div>
        </UMarquee>
      </UContainer>
    </section>

    <!-- CTA Section -->
    <section class="py-16 lg:py-24 bg-gradient-to-r from-brand-tertiary to-brand-accent">
      <UContainer>
        <div class="text-center text-white">
          <h2 class="text-3xl lg:text-4xl font-bold mb-6">
            Prêt à automatiser votre quotidien ?
          </h2>
          <p class="text-xl mb-8 opacity-90">
            Rejoignez des milliers d'utilisateurs qui font confiance à AREA
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton
              size="xl"
              color="white"
              to="/login"
            >
              <UIcon name="i-heroicons-arrow-right" class="w-5 h-5" />
              Créer mon compte
            </UButton>

            <UButton
              size="xl"
              variant="outline"
              color="white"
            >
              Contactez-nous
            </UButton>
          </div>
        </div>
      </UContainer>
    </section>
  </div>
</template>

<script setup lang="ts">
// Utilise le layout par défaut automatiquement

const services = [
  { name: 'Gmail', icon: 'i-heroicons-envelope' },
  { name: 'Slack', icon: 'i-heroicons-chat-bubble-left-ellipsis' },
  { name: 'Discord', icon: 'i-heroicons-speaker-wave' },
  { name: 'GitHub', icon: 'i-heroicons-code-bracket' },
  { name: 'Twitter', icon: 'i-heroicons-hashtag' },
  { name: 'LinkedIn', icon: 'i-heroicons-briefcase' },
  { name: 'Spotify', icon: 'i-heroicons-musical-note' },
  { name: 'Google Drive', icon: 'i-heroicons-cloud' },
  { name: 'Dropbox', icon: 'i-heroicons-folder' },
  { name: 'Trello', icon: 'i-heroicons-clipboard-document-list' },
  { name: 'Notion', icon: 'i-heroicons-document-text' },
  { name: 'Calendly', icon: 'i-heroicons-calendar-days' }
]
</script>