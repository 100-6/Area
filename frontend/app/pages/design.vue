<template>
  <div class="design-page" style="background: var(--bg-primary); min-height: 100vh; color: var(--text-primary);">
    <UContainer class="py-16 space-y-24">
      <!-- Hero / Overview -->
      <section class="space-y-8 text-center max-w-4xl mx-auto">
        <h1 class="text-5xl font-bold" style="color: var(--text-primary);">Design Pattern</h1>
        <p class="text-xl text-gray-600 leading-relaxed">
          Guide de référence pour les couleurs, polices et composants réutilisables (boutons, cartes, modales...).
        </p>

        <div class="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
          <div class="design-chip">
            <span class="chip-dot" style="background: var(--color-primary);"></span>
            Couleur primaire (#16a34a)
          </div>
          <div class="design-chip">
            <span class="chip-dot" style="background: var(--color-secondary);"></span>
            Couleur secondaire (#4ade80)
          </div>
          <div class="design-chip">
            <span class="chip-dot" style="background: var(--color-tertiary);"></span>
            Couleur tertiaire (#065f46)
          </div>
        </div>
      </section>

      <!-- Typography -->
      <section class="design-card">
        <div class="design-card-header">
          <div>
            <h2 class="design-title">Typos &amp; échelle</h2>
            <p class="design-subtitle">Stack par défaut : Inter, fallback sans-serif. Utiliser les classes Tailwind utilitaires (text-2xl, text-gray-500...).</p>
          </div>
        </div>

        <div class="space-y-6">
          <div>
            <h1 class="text-4xl font-bold">Titre H1 – 40px / bold</h1>
            <p class="text-gray-500">Pour les titres principaux de page.</p>
          </div>
          <div>
            <h2 class="text-3xl font-bold">Titre H2 – 32px / bold</h2>
            <p class="text-gray-500">Sous-sections ou hero secondary.</p>
          </div>
          <div>
            <h3 class="text-2xl font-semibold">Titre H3 – 24px / semibold</h3>
            <p class="text-gray-500">Cartes, blocs de contenu.</p>
          </div>
          <div>
            <p class="text-base leading-relaxed text-gray-600">
              Texte standard – 16px. Utiliser <code style="background: rgba(0,0,0,0.04); padding: 4px 6px; border-radius: 6px;">text-gray-600</code> pour le corps de texte, <code>text-gray-500</code> pour les sous-éléments.
            </p>
          </div>
          <div>
            <p class="text-sm uppercase tracking-wide text-gray-500">Label / Meta – 14px uppercase</p>
          </div>
        </div>
      </section>

      <!-- Colors -->
      <section class="design-card">
        <div class="design-card-header">
          <div>
            <h2 class="design-title">Palette</h2>
            <p class="design-subtitle">Couleurs issues de <code>assets/css/variables.css</code>.</p>
          </div>
        </div>
        <div class="grid md:grid-cols-3 gap-6">
          <div v-for="color in colors" :key="color.name" class="color-swatch">
            <div class="swatch" :style="{ background: color.value }"></div>
            <p class="font-semibold">{{ color.name }}</p>
            <p class="text-sm text-gray-500">{{ color.value }}</p>
            <p class="text-xs text-gray-400">Utilisation : {{ color.usage }}</p>
          </div>
        </div>
      </section>

      <!-- Buttons -->
      <section class="design-card">
        <div class="design-card-header">
          <div>
            <h2 class="design-title">Boutons</h2>
            <p class="design-subtitle">Construits sur <code>&lt;UButton&gt;</code>. Utiliser les variantes NuxtUI ou les wrappers existants.</p>
          </div>
        </div>

        <div class="space-y-16">
          <!-- Bouton Primaire -->
          <div class="button-section">
            <div class="button-section-header">
              <h3 class="text-lg font-semibold text-gray-900">Bouton Primaire</h3>
              <p class="text-sm text-gray-500">Utilisé pour les CTAs majeurs (ex: "Commencer gratuitement").</p>
            </div>
            <div class="button-showcase">
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
                <button class="demo-primary-btn" type="button">
                  <UIcon name="i-heroicons-arrow-up-right" class="w-5 h-5" />
                  Bouton principal
                </button>
              </UiGlareHover>
              <UButton size="lg" style="background: var(--color-secondary); color: white; border: none;">
                <UIcon name="i-heroicons-check" class="w-5 h-5 mr-2" />
                Action Secondaire
              </UButton>
            </div>
          </div>

          <!-- Boutons Outline -->
          <div class="button-section">
            <div class="button-section-header">
              <h3 class="text-lg font-semibold text-gray-900">Bouton Outline</h3>
              <p class="text-sm text-gray-500">Pour les actions secondaires avec bordure visible.</p>
            </div>
            <div class="button-showcase">
              <UButton size="lg" variant="outline" style="border-color: var(--color-primary); color: var(--color-primary);">
                <UIcon name="i-heroicons-plus" class="w-5 h-5 mr-2" />
                Outline Primary
              </UButton>
              <UButton size="lg" variant="outline" style="border-color: #6b7280; color: #6b7280;">
                <UIcon name="i-heroicons-document" class="w-5 h-5 mr-2" />
                Outline Gray
              </UButton>
              <UButton size="lg" variant="outline" style="border-color: #dc2626; color: #dc2626;">
                <UIcon name="i-heroicons-trash" class="w-5 h-5 mr-2" />
                Outline Danger
              </UButton>
            </div>
          </div>

          <!-- Tailles de boutons -->
          <div class="button-section">
            <div class="button-section-header">
              <h3 class="text-lg font-semibold text-gray-900">Tailles disponibles</h3>
              <p class="text-sm text-gray-500">Différentes tailles pour différents contextes.</p>
            </div>
            <div class="button-showcase items-center">
              <UButton size="sm" style="background: var(--color-secondary); color: white; border: none;">
                Small
              </UButton>
              <UButton size="md" style="background: var(--color-secondary); color: white; border: none;">
                Medium
              </UButton>
              <UButton size="lg" style="background: var(--color-secondary); color: white; border: none;">
                Large
              </UButton>
              <UButton size="xl" style="background: var(--color-secondary); color: white; border: none;">
                Extra Large
              </UButton>
            </div>
          </div>

          <!-- États des boutons -->
          <div class="button-section">
            <div class="button-section-header">
              <h3 class="text-lg font-semibold text-gray-900">États des boutons</h3>
              <p class="text-sm text-gray-500">Loading et disabled states.</p>
            </div>
            <div class="button-showcase">
              <UButton size="lg" :loading="true" style="background: var(--color-secondary); color: white; border: none;">
                Loading...
              </UButton>
              <UButton size="lg" :disabled="true" style="background: var(--color-secondary); color: white; border: none;">
                Disabled
              </UButton>
              <UButton size="lg" variant="outline" :disabled="true" style="border-color: #6b7280; color: #6b7280;">
                Outline Disabled
              </UButton>
            </div>
          </div>
        </div>
      </section>

      <!-- Cards -->
      <section class="design-card">
        <div class="design-card-header">
          <div>
            <h2 class="design-title">Cartes</h2>
            <p class="design-subtitle">Composant clé : <code>components/ui/InfoCard.vue</code>. Utilisé dans le dashboard, la home, etc.</p>
          </div>
        </div>
        <div class="grid md:grid-cols-3 gap-6">
          <UiInfoCard
            layout="stat"
            title="Workflows actifs"
            :value="12"
            icon="i-heroicons-bolt"
            icon-size="lg"
            hoverable
          />
          <UiInfoCard
            title="Connectez vos services"
            subtitle="Gmail, Slack, Trello"
            description="Ajoutez des blocs d'action en drag & drop."
            icon="i-heroicons-puzzle-piece"
            hoverable
          />
          <UiInfoCard
            variant="danger"
            title="Incident"
            description="Certaines intégrations nécessitent une reconnexion."
            icon="i-heroicons-exclamation-triangle"
            hoverable
          />
        </div>
      </section>

      <!-- Modals -->
      <section class="design-card">
        <div class="design-card-header">
          <div>
            <h2 class="design-title">Modales</h2>
            <p class="design-subtitle">Les modales utilisent <code>UDialog</code> (Nuxt UI) ou des composants dédiés comme <code>ServiceSelectionModal.vue</code>.</p>
          </div>
        </div>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="modal-preview">
            <h3 class="text-lg font-semibold mb-2">ServiceSelectionModal.vue</h3>
            <p class="text-sm text-gray-500 mb-4">Modal multi-tabs pour choisir un trigger/action. Utilise <code>UCard</code> + filtres latéraux.</p>
            <UButton size="lg" @click="showServiceModal = true">
              Voir un exemple
            </UButton>
          </div>
          <div class="modal-preview">
            <h3 class="text-lg font-semibold mb-2">ServiceConfigurationModal.vue</h3>
            <p class="text-sm text-gray-500 mb-4">Composants de formulaires dynamiques (config input/select/date...) pour paramétrer les blocs.</p>
            <UButton size="lg" @click="showConfigModal = true">
              Voir un exemple
            </UButton>
          </div>
        </div>
      </section>

      <!-- Workflow specifics -->
      <section class="design-card">
        <div class="design-card-header">
          <div>
            <h2 class="design-title">Workflow canvas</h2>
            <p class="design-subtitle">Éléments principaux du builder (voir `useWorkflowManagement` + `useCanvasManagement`).</p>
          </div>
        </div>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <h3 class="text-lg font-semibold">Blocs (nodes)</h3>
            <p class="text-gray-500">Chaque bloc est rendu à partir des métadonnées du composable (service, type trigger/action, position).</p>
            <p class="text-sm text-gray-500">
              Les positions initiales sont centrées à (100,100). Le reset canvas recentre sur le premier bloc.
            </p>
          </div>
          <div class="space-y-3">
            <h3 class="text-lg font-semibold">Liaisons (connections)</h3>
            <p class="text-gray-500">SVG path contrôlé par `WorkflowConnector.vue`. Respecter les transitions 200px/contrôles arrondis pour garder la cohérence.</p>
            <p class="text-sm text-gray-500">
              La création d'une connexion déclenche `useWorkflowManagement.addConnection` puis `useWorkflowApi.mapConnectionToDto` pour l'API.
            </p>
          </div>
        </div>
      </section>

      <!-- Resource links -->
      <section class="design-card">
        <div class="design-card-header">
          <div>
            <h2 class="design-title">Ressources</h2>
            <p class="design-subtitle">Références utiles pour contribuer.</p>
          </div>
        </div>
        <ul class="list-disc list-inside text-gray-600 space-y-2">
          <li><a href="https://ui.nuxt.com" target="_blank" class="link">Documentation Nuxt UI</a></li>
          <li><a href="https://nuxt.com" target="_blank" class="link">Documentation Nuxt 4</a></li>
          <li><a href="https://iconify.design" target="_blank" class="link">Iconify (recherche d'icônes pour UIcon)</a></li>
        </ul>
      </section>
    </UContainer>

    <!-- Service modal example (demo only) -->
    <ServiceSelectionModal
      v-model:visible="showServiceModal"
      :is-loading="false"
      :services="demoServices"
      @select="showServiceModal = false"
    />

    <ServiceConfigurationModal
      v-model:visible="showConfigModal"
      :service="demoServices[0]"
      :configuration="{ parameters: {} }"
      :config-context="{ blockId: 'demo' }"
      @confirm="showConfigModal = false"
      @close="showConfigModal = false"
    />
  </div>
</template>

<script setup lang="ts">
const showServiceModal = ref(false)
const showConfigModal = ref(false)

const colors = [
  { name: 'Primary', value: '#16a34a', usage: 'CTA, accents, highlights' },
  { name: 'Secondary', value: '#4ade80', usage: 'Badges, gradients' },
  { name: 'Tertiary', value: '#065f46', usage: 'Dark CTA, backgrounds' },
  { name: 'Accent', value: '#a7f0ba', usage: 'Glows, cards background' },
  { name: 'Neutral 900', value: '#0f172a', usage: 'Texte principal' },
  { name: 'Neutral 100', value: '#f8fafc', usage: 'Background clair' }
]

const demoServices = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Envoyer des emails',
    logo: 'i-logos-google-gmail',
    category: 'Communication'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Notifier un canal',
    logo: 'i-logos-slack-icon',
    category: 'Collaboration'
  }
]

useHead({
  title: 'Design System - Auto',
  meta: [
    { name: 'description', content: 'Documentation design pour Auto (couleurs, typographies, composants).' }
  ]
})
</script>

<style scoped>
.design-page {
  font-family: var(--font-family-sans);
}

.design-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.design-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.design-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2.5rem;
  gap: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid rgba(22, 163, 74, 0.1);
}

.design-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.design-subtitle {
  color: var(--text-secondary);
  max-width: 56ch;
  margin-top: 0.5rem;
  line-height: 1.6;
}

.design-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: rgba(22, 163, 74, 0.1);
  color: var(--color-tertiary);
  font-weight: 600;
  border: 1px solid rgba(22, 163, 74, 0.2);
  transition: all 0.2s ease;
}

.design-chip:hover {
  background: rgba(22, 163, 74, 0.15);
  transform: scale(1.05);
}

.chip-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.color-swatch {
  padding: 1.5rem;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.02);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.3s ease;
}

.color-swatch:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary);
}

.swatch {
  height: 140px;
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2);
  transition: all 0.3s ease;
}

.color-swatch:hover .swatch {
  transform: scale(1.02);
}

.demo-primary-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2.5rem;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.demo-primary-btn:hover {
  transform: scale(1.02);
}

/* Nouvelles sections pour boutons */
.button-section {
  padding: 1.5rem;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(22, 163, 74, 0.02) 0%, rgba(22, 163, 74, 0.05) 100%);
  border: 1px solid rgba(22, 163, 74, 0.1);
}

.button-section-header {
  margin-bottom: 1.5rem;
}

.button-section-header h3 {
  margin-bottom: 0.5rem;
}

.button-showcase {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.modal-preview {
  padding: 2rem;
  border: 2px dashed var(--border-color);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.02);
  transition: all 0.3s ease;
}

.modal-preview:hover {
  border-color: var(--color-primary);
  background: rgba(22, 163, 74, 0.05);
  transform: translateY(-2px);
}

.link {
  color: var(--color-tertiary);
  font-weight: 600;
  transition: all 0.2s ease;
  text-decoration: underline;
  text-decoration-color: transparent;
}

.link:hover {
  color: var(--color-primary);
  text-decoration-color: var(--color-primary);
}
</style>
