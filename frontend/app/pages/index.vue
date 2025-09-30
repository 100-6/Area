<template>
  <div class="min-h-screen" style="font-family: var(--font-family-sans); background: var(--bg-primary);">

    <!-- Hero Section -->
    <section class="relative overflow-hidden" style="background: linear-gradient(135deg, var(--bg-primary) 0%, rgba(167, 240, 186, 0.05) 100%);">
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10" style="background: var(--color-primary);"></div>
        <div class="absolute top-1/2 -left-32 w-64 h-64 rounded-full opacity-5" style="background: var(--color-secondary);"></div>
      </div>

      <UContainer class="relative z-10 py-20 lg:py-32">
        <div class="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          <div class="text-center lg:text-left space-y-12 fade-in">
            <div class="space-y-6">
              <h1 class="text-5xl lg:text-7xl font-bold leading-tight tracking-tight" style="color: var(--text-primary);">
                Automatisez votre
                <div class="relative inline-block">
                  <span class="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">workflow</span>
                  <div class="absolute -bottom-2 left-0 right-0 h-1 rounded-full" style="background: linear-gradient(90deg, var(--color-secondary), var(--color-primary));"></div>
                </div>
                sans limites
              </h1>

              <p class="text-xl lg:text-2xl leading-relaxed" style="color: var(--text-secondary); font-weight: var(--font-weight-normal);">
                Plus de 1000+ applications disponibles. Créez des automatisations puissantes
                en quelques clics. Sans code, sans complexité.
              </p>
            </div>

            <div class="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
              <UiGlareHover
                width="auto"
                height="auto"
                :background="`var(--color-tertiary)`"
                :border-color="`var(--color-accent)`"
                border-radius="12px"
                glare-color="#ffffff"
                :glare-opacity="0.6"
                :glare-size="200"
                :transition-duration="5000"
                :play-once="false"
              >
                <NuxtLink to="/login" class="block">
                  <div class="px-8 py-4 text-lg font-semibold flex items-center justify-center gap-2 text-white">
                    <UIcon name="i-heroicons-play-circle" class="w-6 h-6" />
                    Commencer gratuitement
                  </div>
                </NuxtLink>
              </UiGlareHover>

              <UButton
                size="xl"
                variant="ghost"
                class="px-8 py-4 text-lg font-medium smooth-hover"
                style="color: var(--text-primary);"
              >
                <UIcon name="i-heroicons-eye" class="w-6 h-6 mr-2" />
                Voir une démo
              </UButton>
            </div>

            <div class="flex flex-wrap justify-center lg:justify-start gap-8 text-sm">
              <div class="flex items-center gap-2" style="color: var(--text-secondary);">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5" style="color: var(--color-secondary);" />
                <span>100% gratuit pour commencer</span>
              </div>
              <div class="flex items-center gap-2" style="color: var(--text-secondary);">
                <UIcon name="i-heroicons-bolt" class="w-5 h-5" style="color: var(--color-secondary);" />
                <span>Setup en 30 secondes</span>
              </div>
              <div class="flex items-center gap-2" style="color: var(--text-secondary);">
                <UIcon name="i-heroicons-users" class="w-5 h-5" style="color: var(--color-secondary);" />
                <span>Utilisé par 50K+ équipes</span>
              </div>
            </div>
          </div>

          <div class="lg:flex lg:justify-end fade-in">
            <div class="relative flex flex-col items-center">
              <div class="relative mb-6 p-4 lg:p-6 rounded-3xl max-w-xs lg:max-w-md"
                   style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(167, 240, 186, 0.1)); border: 2px solid var(--color-primary); box-shadow: var(--shadow-xl);">

                <div class="text-base lg:text-lg font-medium text-center" style="color: var(--color-tertiary);">
                  <UiTextType
                    :text="['Connectez Gmail à Slack !', 'Synchronisez Notion et Trello !', 'Automatisez vos réseaux sociaux !', 'Gérez vos tâches intelligemment !']"
                    :typingSpeed="80"
                    :pauseDuration="2500"
                    :showCursor="true"
                    cursorCharacter="|"
                    cursorClass="ml-2 text-green-400"
                  />
                </div>

                <div class="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                  <div class="w-6 h-6 rotate-45 border-r-2 border-b-2"
                       style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(167, 240, 186, 0.1)); border-color: var(--color-primary);"></div>
                </div>
              </div>

              <UiAnimatedRobot
                size="lg"
                :show-floating-elements="true"
                alignment="center"
              />
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Workflow Demo Section -->
    <section class="py-20 lg:py-32 overflow-hidden" style="background: var(--bg-secondary);">
      <UContainer>
        <div class="text-center mb-16 slide-up">
          <h2 class="text-4xl lg:text-5xl font-bold mb-6" style="color: var(--text-primary);">
            Créez des workflows en
            <span class="text-green-600">3 étapes simples</span>
          </h2>
          <p class="text-xl max-w-2xl mx-auto" style="color: var(--text-secondary);">
            Notre interface intuitive vous permet de connecter n'importe quelles applications
          </p>
        </div>

        <div class="max-w-6xl mx-auto">
          <div class="grid lg:grid-cols-3 gap-8 items-center fade-in">
            <UiWorkflowStepCard
              :step="1"
              icon="i-heroicons-plus-circle"
              title="Choisir un déclencheur"
              description="Sélectionnez l'événement qui lancera votre automatisation"
              icon-background="var(--color-primary)"
              icon-color="var(--color-tertiary)"
              example="Gmail - Nouvel email"
              example-icon="i-logos-google-gmail"
            />

            <UiWorkflowConnector :linked="true" />

            <UiWorkflowStepCard
              :step="2"
              icon="i-heroicons-cog-6-tooth"
              title="Configurer l'action"
              description="Définissez ce qui doit se passer automatiquement"
              icon-background="var(--color-secondary)"
              icon-color="white"
              example="Slack - Envoyer message"
              example-icon="i-logos-slack-icon"
              example-background="rgba(72, 199, 116, 0.1)"
              example-border-color="var(--color-secondary)"
            />

            <div class="lg:col-span-3 mt-12">
              <div class="relative text-center p-8 rounded-2xl border overflow-hidden"
                   style="background: linear-gradient(135deg, var(--color-tertiary), var(--color-accent)); color: var(--text-white); box-shadow: var(--shadow-xl);">

                <div class="relative z-10">
                  <div class="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                       style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px);">
                    <UIcon name="i-heroicons-check-circle" class="w-10 h-10 text-green-300" />
                  </div>

                  <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border-2 border-green-300 opacity-30 animate-ping" style="animation-duration: 3s;"></div>
                  <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-white opacity-20 animate-ping" style="animation-duration: 4s;"></div>

                  <h3 class="text-2xl font-bold mb-2">
                    Mission accomplie !
                  </h3>
                  <p class="opacity-90 text-lg">
                    Votre workflow tourne parfaitement
                    <span class="inline-block animate-bounce">✓</span>
                  </p>

                  <p class="text-sm mt-6 opacity-75">
                    100% automatisé • 24/7 actif • 0 intervention requise
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Features Section -->
    <section class="py-20 lg:py-32" style="background: var(--bg-primary);">
      <UContainer>
        <div class="text-center max-w-3xl mx-auto mb-20 slide-up">
          <h2 class="text-4xl lg:text-5xl font-bold mb-6" style="color: var(--text-primary);">
            Pourquoi 50K+ équipes nous font
            <span class="text-green-600">confiance</span>
          </h2>
          <p class="text-xl" style="color: var(--text-secondary);">
            Des fonctionnalités pensées pour les équipes modernes qui veulent gagner du temps
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 fade-in">
          <div class="group p-8 rounded-2xl border card-hover"
               style="background: var(--bg-card); border-color: var(--border-color);">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 smooth-hover group-hover:scale-110"
                 style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));">
              <UIcon name="i-heroicons-puzzle-piece" class="w-7 h-7" style="color: var(--color-tertiary);" />
            </div>
            <h3 class="text-xl font-bold mb-4" style="color: var(--text-primary);">1000+ Intégrations</h3>
            <p style="color: var(--text-secondary);">
              Connectez tous vos outils favoris : CRM, messageries, stockage cloud, réseaux sociaux et bien plus.
            </p>
            <div class="mt-6 flex flex-wrap gap-2">
              <span class="px-3 py-1 text-xs rounded-full" style="background: rgba(167, 240, 186, 0.2); color: var(--color-tertiary);">Gmail</span>
              <span class="px-3 py-1 text-xs rounded-full" style="background: rgba(167, 240, 186, 0.2); color: var(--color-tertiary);">Slack</span>
              <span class="px-3 py-1 text-xs rounded-full" style="background: rgba(167, 240, 186, 0.2); color: var(--color-tertiary);">+998</span>
            </div>
          </div>

          <div class="group p-8 rounded-2xl border card-hover"
               style="background: var(--bg-card); border-color: var(--border-color);">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 smooth-hover group-hover:scale-110"
                 style="background: linear-gradient(135deg, var(--color-secondary), var(--color-tertiary));">
              <UIcon name="i-heroicons-bolt" class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-xl font-bold mb-4" style="color: var(--text-primary);">Interface No-Code</h3>
            <p style="color: var(--text-secondary);">
              Créez des workflows complexes en glisser-déposer. Aucune compétence technique requise.
            </p>
            <div class="mt-6">
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 rounded-full" style="background: var(--bg-secondary);"></div>
                <span class="text-sm font-medium" style="color: var(--color-secondary);">100% visuel</span>
              </div>
            </div>
          </div>

          <div class="group p-8 rounded-2xl border card-hover"
               style="background: var(--bg-card); border-color: var(--border-color);">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 smooth-hover group-hover:scale-110"
                 style="background: linear-gradient(135deg, var(--color-tertiary), var(--color-accent));">
              <UIcon name="i-heroicons-shield-check" class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-xl font-bold mb-4" style="color: var(--text-primary);">Sécurité Enterprise</h3>
            <p style="color: var(--text-secondary);">
              Chiffrement de bout en bout, conformité RGPD, et authentification à deux facteurs incluse.
            </p>
            <div class="mt-6 flex items-center gap-2">
              <UIcon name="i-heroicons-lock-closed" class="w-4 h-4" style="color: var(--color-secondary);" />
              <span class="text-sm font-medium" style="color: var(--color-secondary);">Certifié SOC 2</span>
            </div>
          </div>

          <div class="group p-8 rounded-2xl border card-hover"
               style="background: var(--bg-card); border-color: var(--border-color);">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 smooth-hover group-hover:scale-110"
                 style="background: linear-gradient(135deg, var(--color-primary), var(--color-tertiary));">
              <UIcon name="i-heroicons-chart-bar-square" class="w-7 h-7" style="color: var(--text-white);" />
            </div>
            <h3 class="text-xl font-bold mb-4" style="color: var(--text-primary);">Analytics Avancés</h3>
            <p style="color: var(--text-secondary);">
              Suivez les performances de vos workflows avec des tableaux de bord détaillés.
            </p>
          </div>

          <div class="group p-8 rounded-2xl border card-hover"
               style="background: var(--bg-card); border-color: var(--border-color);">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 smooth-hover group-hover:scale-110"
                 style="background: linear-gradient(135deg, var(--color-secondary), var(--color-accent));">
              <UIcon name="i-heroicons-users" class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-xl font-bold mb-4" style="color: var(--text-primary);">Collaboration d'équipe</h3>
            <p style="color: var(--text-secondary);">
              Partagez et gérez vos automatisations en équipe avec des permissions granulaires.
            </p>
          </div>

          <div class="group p-8 rounded-2xl border card-hover"
               style="background: var(--bg-card); border-color: var(--border-color);">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 smooth-hover group-hover:scale-110"
                 style="background: linear-gradient(135deg, var(--color-tertiary), var(--color-primary));">
              <UIcon name="i-heroicons-cpu-chip" class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-xl font-bold mb-4" style="color: var(--text-primary);">IA Intégrée</h3>
            <p style="color: var(--text-secondary);">
              Laissez l'IA suggérer et optimiser vos workflows pour des performances maximales.
            </p>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Services Section -->
    <section class="py-20 lg:py-32" style="background: var(--bg-secondary);">
      <UContainer>
        <div class="text-center max-w-3xl mx-auto mb-16 slide-up">
          <h2 class="text-4xl lg:text-5xl font-bold mb-6" style="color: var(--text-primary);">
            Plus de <span class="text-green-600">1000 intégrations</span>
          </h2>
          <p class="text-xl" style="color: var(--text-secondary);">
            Connectez tous vos outils préférés en quelques clics
          </p>
        </div>

        <UMarquee
          :repeat="3"
          :speed="50"
          pause-on-hover
          class="py-8"
          :overlay="false"
        >
          <div class="flex space-x-6">
            <div v-for="service in services" :key="service.name" class="flex-shrink-0">
              <div class="flex items-center space-x-4 px-6 py-4 rounded-2xl border smooth-hover"
                   style="background: var(--bg-card); border-color: var(--border-color);">
                <div class="w-10 h-10 flex items-center justify-center">
                  <UIcon :name="service.icon" class="w-8 h-8" />
                </div>
                <span class="font-semibold" style="color: var(--text-primary);">{{ service.name }}</span>
              </div>
            </div>
          </div>
        </UMarquee>
      </UContainer>
    </section>

    <!-- CTA Section -->
    <section class="py-20 lg:py-32 relative overflow-hidden" style="background: linear-gradient(135deg, var(--color-tertiary) 0%, var(--color-accent) 100%);">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 left-1/4 w-72 h-72 rounded-full" style="background: var(--color-primary);"></div>
        <div class="absolute bottom-0 right-1/4 w-96 h-96 rounded-full" style="background: var(--color-secondary);"></div>
      </div>

      <UContainer class="relative z-10">
        <div class="text-center max-w-4xl mx-auto fade-in">
          <h2 class="text-4xl lg:text-6xl font-bold mb-8" style="color: var(--text-white);">
            Prêt à automatiser votre
            <br />
            <span class="text-green-200">quotidien ?</span>
          </h2>
          <p class="text-xl lg:text-2xl mb-12 opacity-90" style="color: var(--text-white);">
            Rejoignez plus de 50 000 équipes qui économisent des heures chaque semaine
            grâce à nos automatisations intelligentes.
          </p>

          <div class="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <UiGlareHover
              width="auto"
              height="auto"
              background="var(--text-white)"
              border-color="rgba(255, 255, 255, 0.3)"
              border-radius="16px"
              glare-color="#ffffff"
              :glare-opacity="0.8"
              :glare-size="120"
              :transition-duration="9000"
              :play-once="false"
            >
              <NuxtLink to="/login" class="block">
                <div class="px-10 py-5 text-lg font-bold flex items-center justify-center gap-2" style="color: var(--color-tertiary);">
                  <UIcon name="i-heroicons-rocket-launch" class="w-6 h-6" />
                  Démarrer gratuitement
                </div>
              </NuxtLink>
            </UiGlareHover>

            <UButton
              size="xl"
              variant="outline"
              class="px-10 py-5 text-lg font-semibold rounded-2xl border-2 button-hover"
              style="border-color: var(--text-white); color: var(--text-white);"
            >
              <UIcon name="i-heroicons-calendar-days" class="w-6 h-6 mr-2" />
              Planifier une démo
            </UButton>
          </div>

          <div class="flex flex-wrap justify-center gap-8 pt-16 text-sm opacity-80">
            <div class="flex items-center gap-2" style="color: var(--text-white);">
              <UIcon name="i-heroicons-credit-card" class="w-5 h-5" />
              <span>Aucune carte de crédit requise</span>
            </div>
            <div class="flex items-center gap-2" style="color: var(--text-white);">
              <UIcon name="i-heroicons-clock" class="w-5 h-5" />
              <span>Setup en 30 secondes</span>
            </div>
            <div class="flex items-center gap-2" style="color: var(--text-white);">
              <UIcon name="i-heroicons-star" class="w-5 h-5" />
              <span>4.9/5 sur 10K+ avis</span>
            </div>
          </div>
        </div>
      </UContainer>
    </section>
  </div>
</template>

<script setup lang="ts">
// Utilise le layout par défaut automatiquement

const services = [
  { name: 'Gmail', icon: 'i-logos-google-gmail' },
  { name: 'Slack', icon: 'i-logos-slack-icon' },
  { name: 'Discord', icon: 'i-logos-discord-icon' },
  { name: 'GitHub', icon: 'i-logos-github-icon' },
  { name: 'Twitter', icon: 'i-logos-twitter' },
  { name: 'LinkedIn', icon: 'i-logos-linkedin-icon' },
  { name: 'Spotify', icon: 'i-logos-spotify-icon' },
  { name: 'Google Drive', icon: 'i-logos-google-drive' },
  { name: 'Dropbox', icon: 'i-logos-dropbox' },
  { name: 'Trello', icon: 'i-logos-trello' },
  { name: 'Notion', icon: 'i-logos-notion-icon' },
  { name: 'Calendly', icon: 'i-simple-icons-calendly' }
]
</script>

<style scoped>
@keyframes shine {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}

@keyframes fillBar {
  0% { width: 0%; }
  100% { width: 100%; }
}
</style>