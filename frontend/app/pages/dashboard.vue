<template>
  <div class="min-h-screen" style="font-family: var(--font-family-sans); background: var(--bg-primary);">

    <!-- Dashboard Header -->
    <section style="background: var(--bg-card);">
      <UContainer class="py-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="space-y-2">
            <h1 class="text-3xl font-bold" style="color: var(--text-primary);">
              Mes Automatisations
            </h1>
            <p class="text-lg" style="color: var(--text-secondary);">
              Gérez et surveillez vos workflows automatisés
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <UButton
              size="lg"
              variant="outline"
              class="px-6 py-3 smooth-hover"
              style="border-color: var(--border-color); color: var(--text-primary);"
            >
              <UIcon name="i-heroicons-funnel" class="w-5 h-5 mr-2" />
              Filtrer
            </UButton>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Stats Overview -->
    <section class="py-8 stats-overview" style="background: var(--bg-primary);">
      <UContainer>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <UiInfoCard
            title="Total automatisations"
            :value="stats.totalWorkflows"
            icon="i-heroicons-cog-6-tooth"
            layout="stat"
            :hoverable="false"
          />

          <UiInfoCard
            title="Actives"
            :value="stats.activeWorkflows"
            icon="i-heroicons-play-circle"
            layout="stat"
            :hoverable="false"
          />

          <UiInfoCard
            title="Exécutions ce mois"
            :value="stats.monthlyExecutions"
            icon="i-heroicons-chart-bar"
            layout="stat"
            :hoverable="false"
          />

          <UiInfoCard
            title="Temps économisé"
            :value="`${stats.timeSaved}h`"
            icon="i-heroicons-clock"
            layout="stat"
            :hoverable="false"
          />
        </div>
      </UContainer>
    </section>

    <!-- Workflows List -->
    <section class="pb-12" style="background: var(--bg-primary);">
      <UContainer>
        <div class="space-y-4">
          <!-- Barres des workflows -->
          <div
            v-for="workflow in workflows"
            :key="workflow.id"
            class="glass-bar workflow-bar group cursor-pointer"
            @click="editWorkflow(workflow.id)"
          >
            <!-- Gradient overlay complet au hover -->
            <div class="workflow-hover-gradient" :style="`background: linear-gradient(135deg, ${workflow.trigger.color}15, rgba(255, 255, 255, 0.05));`"></div>

            <div class="workflow-bar-content">
              <!-- Gauche: Services et infos -->
              <div class="workflow-bar-left">
                <div class="workflow-services">
                  <UiServiceBubble
                    :icon="workflow.trigger.icon"
                    :color="workflow.trigger.color"
                  />
                  <div class="flow-connector">
                    <UIcon name="i-heroicons-arrow-right" class="w-3 h-3 connector-arrow" />
                  </div>
                  <UiServiceBubble
                    :icon="workflow.actions[0].icon"
                    :color="workflow.actions[0].color"
                  />
                  <div v-if="workflow.actions.length > 1" class="extra-services">
                    +{{ workflow.actions.length - 1 }}
                  </div>
                </div>

                <div class="workflow-info">
                  <h3 class="workflow-bar-title">{{ workflow.name }}</h3>
                  <p class="workflow-bar-description">{{ workflow.description }}</p>
                </div>
              </div>

              <!-- Centre: Métriques simplifiées -->
              <div class="workflow-bar-center">
                <div class="frequency-badge">
                  {{ getFrequencyText(workflow.lastRun) }}
                </div>
              </div>

              <!-- Droite: Status et actions -->
              <div class="workflow-bar-right">
                <UiStatusIndicator
                  :status="workflow.status"
                  :label="getStatusLabel(workflow.status)"
                />

                <UDropdown :items="getWorkflowActions(workflow)">
                  <UButton
                    variant="ghost"
                    size="sm"
                    icon="i-heroicons-ellipsis-horizontal"
                    class="bar-action-menu"
                    @click.stop
                  />
                </UDropdown>
              </div>
            </div>

            <!-- Hover glow effect -->
            <div class="workflow-bar-glow"></div>
          </div>

          <!-- Bouton d'ajout en bas -->
          <div
            class="glass-bar add-workflow-bar group cursor-pointer"
            @click="openServiceSelectionModal"
          >
            <div class="add-bar-content">
              <div class="add-icon-circle">
                <UIcon name="i-heroicons-plus" class="w-6 h-6" />
              </div>
              <div class="add-text">
                <h3 class="add-bar-title">Créer une nouvelle automatisation</h3>
                <p class="add-bar-subtitle">Connectez vos applications en quelques clics</p>
              </div>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

  </div>
</template>

<script setup lang="ts">
import type { Service } from '~/types'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})


// Fake data pour les statistiques
const stats = {
  totalWorkflows: 12,
  activeWorkflows: 8,
  monthlyExecutions: 2486,
  timeSaved: 47
}

// Fake data pour les workflows
const workflows = [
  {
    id: 1,
    name: "Gmail vers Slack",
    description: "Notifications email importantes avec filtrage",
    status: "active",
    executions: 1247,
    successRate: 98,
    lastRun: "2h",
    trigger: {
      name: "Nouvel email Gmail",
      icon: "i-logos-google-gmail",
      color: "#EA4335"
    },
    actions: [
      {
        id: 1,
        name: "Envoyer message Slack",
        icon: "i-logos-slack-icon",
        color: "#4A154B"
      }
    ]
  },
  {
    id: 2,
    name: "GitHub vers Discord",
    description: "Notifications de commits et pull requests",
    status: "active",
    executions: 892,
    successRate: 95,
    lastRun: "35min",
    trigger: {
      name: "Nouveau commit GitHub",
      icon: "i-logos-github-icon",
      color: "#181717"
    },
    actions: [
      {
        id: 1,
        name: "Message Discord",
        icon: "i-logos-discord-icon",
        color: "#5865F2"
      }
    ]
  },
  {
    id: 3,
    name: "Trello vers Notion",
    description: "Synchronisation des tâches et projets",
    status: "paused",
    executions: 2341,
    successRate: 89,
    lastRun: "3j",
    trigger: {
      name: "Nouvelle carte Trello",
      icon: "i-logos-trello",
      color: "#0079BF"
    },
    actions: [
      {
        id: 1,
        name: "Créer page Notion",
        icon: "i-logos-notion-icon",
        color: "#000000"
      },
      {
        id: 2,
        name: "Envoyer email",
        icon: "i-heroicons-envelope",
        color: "#059669"
      }
    ]
  },
  {
    id: 4,
    name: "Spotify vers Twitter",
    description: "Partage automatique de musique aimée",
    status: "active",
    executions: 673,
    successRate: 92,
    lastRun: "1h",
    trigger: {
      name: "Musique aimée Spotify",
      icon: "i-logos-spotify-icon",
      color: "#1DB954"
    },
    actions: [
      {
        id: 1,
        name: "Tweet automatique",
        icon: "i-logos-twitter",
        color: "#1DA1F2"
      }
    ]
  },
  {
    id: 5,
    name: "Dropbox vers Google Drive",
    description: "Sauvegarde automatique de fichiers",
    status: "error",
    executions: 127,
    successRate: 45,
    lastRun: "1sem",
    trigger: {
      name: "Nouveau fichier Dropbox",
      icon: "i-logos-dropbox",
      color: "#0061FF"
    },
    actions: [
      {
        id: 1,
        name: "Copier vers Drive",
        icon: "i-logos-google-drive",
        color: "#4285F4"
      }
    ]
  },
  {
    id: 6,
    name: "Calendly vers Notion",
    description: "Création automatique de notes de réunion",
    status: "active",
    executions: 56,
    successRate: 100,
    lastRun: "6h",
    trigger: {
      name: "Nouveau rendez-vous Calendly",
      icon: "i-simple-icons-calendly",
      color: "#006BFF"
    },
    actions: [
      {
        id: 1,
        name: "Créer note Notion",
        icon: "i-logos-notion-icon",
        color: "#000000"
      },
      {
        id: 2,
        name: "Email de confirmation",
        icon: "i-heroicons-envelope",
        color: "#059669"
      }
    ]
  },
  {
    id: 7,
    name: "LinkedIn vers CRM",
    description: "Import des nouveaux contacts qualifiés",
    status: "active",
    executions: 324,
    successRate: 87,
    lastRun: "12h",
    trigger: {
      name: "Nouveau contact LinkedIn",
      icon: "i-logos-linkedin-icon",
      color: "#0077B5"
    },
    actions: [
      {
        id: 1,
        name: "Ajouter au CRM",
        icon: "i-heroicons-user-plus",
        color: "#059669"
      }
    ]
  },
  {
    id: 8,
    name: "Instagram vers Google Sheets",
    description: "Tracking des mentions et hashtags",
    status: "paused",
    executions: 1523,
    successRate: 94,
    lastRun: "5j",
    trigger: {
      name: "Mention Instagram",
      icon: "i-logos-instagram-icon",
      color: "#E4405F"
    },
    actions: [
      {
        id: 1,
        name: "Ajouter à Sheets",
        icon: "i-logos-google-sheets",
        color: "#34A853"
      }
    ]
  }
]

const editWorkflow = (workflowId: number) => {
  navigateTo(`/workflow/${workflowId}/edit`)
}

const createNewWorkflow = () => {
  navigateTo('/workflow/create')
}

const openServiceSelectionModal = () => {
  navigateTo('/workflow/create')
}

const onServiceSelected = (service: Service) => {
  console.log('Service sélectionné:', service)
  // Ici vous pouvez naviguer vers la page de création d'automatisation
  // avec le service pré-sélectionné ou déclencher la création
  navigateTo(`/workflow/create?service=${service.slug}`)
}

const getWorkflowActions = (workflow: any) => [
  [
    {
      label: 'Modifier',
      icon: 'i-heroicons-pencil-square',
      click: () => editWorkflow(workflow.id)
    },
    {
      label: workflow.status === 'active' ? 'Mettre en pause' : 'Activer',
      icon: workflow.status === 'active' ? 'i-heroicons-pause' : 'i-heroicons-play',
      click: () => toggleWorkflow(workflow.id)
    }
  ],
  [
    {
      label: 'Dupliquer',
      icon: 'i-heroicons-document-duplicate',
      click: () => duplicateWorkflow(workflow.id)
    },
    {
      label: 'Historique',
      icon: 'i-heroicons-clock',
      click: () => viewHistory(workflow.id)
    }
  ],
  [
    {
      label: 'Supprimer',
      icon: 'i-heroicons-trash',
      click: () => deleteWorkflow(workflow.id)
    }
  ]
]

const toggleWorkflow = (workflowId: number) => {
  console.log('Toggle workflow:', workflowId)
}

const duplicateWorkflow = (workflowId: number) => {
  console.log('Duplicate workflow:', workflowId)
}

const viewHistory = (workflowId: number) => {
  navigateTo(`/workflow/${workflowId}/history`)
}

const deleteWorkflow = (workflowId: number) => {
  console.log('Delete workflow:', workflowId)
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Actif'
    case 'paused': return 'En pause'
    case 'error': return 'Erreur'
    default: return status
  }
}

const formatNumber = (num: number) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

const getFrequencyText = (lastRun: string) => {
  const timeMap: { [key: string]: string } = {
    '2h': 'Très actif',
    '35min': 'Très actif',
    '1h': 'Actif',
    '6h': 'Régulier',
    '12h': 'Régulier',
    '3j': 'Peu actif',
    '5j': 'Peu actif',
    '1sem': 'Inactif'
  }
  return timeMap[lastRun] || 'Actif'
}

useHead({
  title: 'Dashboard - Auto',
  meta: [
    { name: 'description', content: 'Gérez vos automatisations et workflows depuis votre tableau de bord Auto.' }
  ]
})
</script>

<style scoped>
/* Glass Bar Base */
.glass-bar {
  position: relative;
  background: rgba(255, 255, 255, 0.06);
  -webkit-backdrop-filter: blur(24px);
  border: 0px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.15) inset;
}

.glass-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.glass-bar:hover::before {
  opacity: 1;
}

.glass-bar:hover {
  transform: translateY(-2px);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.25) inset;
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.09);
}

/* Add Workflow Bar */
.add-workflow-bar {
  background: white;
  border: 2px dashed rgba(72, 199, 116, 0.5);
  min-height: 80px;
  position: relative;
  overflow: hidden;
}

.add-workflow-bar::before {
  content: '+';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 120px;
  font-weight: 300;
  background: linear-gradient(135deg, rgba(167, 240, 186, 0.15), rgba(72, 199, 116, 0.1));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4px 20px rgba(167, 240, 186, 0.2);
  z-index: 0;
  pointer-events: none;
}

.add-workflow-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.02) 50%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.add-workflow-bar:hover::after {
  opacity: 1;
}

.add-workflow-bar:hover {
  border-color: rgba(72, 199, 116, 0.8);
  background: rgba(249, 250, 251, 0.8);
}

.add-bar-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 1.75rem;
  position: relative;
  z-index: 2;
  gap: 1rem;
  text-align: center;
}

.add-bar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.add-icon-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: white;
  border: 2px dashed rgba(72, 199, 116, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(72, 199, 116, 0.8);
  transition: all 0.3s ease;
}

.add-workflow-bar:hover .add-icon-circle {
  transform: scale(1.05);
  border-color: rgba(72, 199, 116, 1);
  color: rgba(72, 199, 116, 1);
}

.add-text {
  flex: 1;
}

.add-bar-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  letter-spacing: -0.025em;
}

.add-bar-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  opacity: 0.8;
}

.add-bar-right {
  display: flex;
  align-items: center;
}

.add-chevron {
  color: var(--color-secondary);
  opacity: 0.6;
  transition: all 0.3s ease;
}

.add-workflow-bar:hover .add-chevron {
  opacity: 1;
  transform: translateX(4px);
}

/* Workflow Bars */
.workflow-bar {
  min-height: 84px;
  position: relative;
}

.workflow-hover-gradient {
  position: absolute;
  inset: -1px;
  border-radius: 24px;
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
  z-index: 1;
}

.workflow-bar:hover .workflow-hover-gradient {
  opacity: 1;
}

.workflow-bar-content {
  display: flex;
  align-items: center;
  padding: 1.25rem 1.75rem;
  gap: 1.5rem;
  position: relative;
  z-index: 2;
}

.workflow-bar-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
  min-width: 0;
}

.workflow-services {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}


.flow-connector {
  position: relative;
  width: 24px;
  height: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.connector-arrow {
  background: #1f2937;
  border-radius: 50%;
  padding: 4px;
  color: white;
  z-index: 1;
  transition: all 0.3s ease;
  border: none;
}

.workflow-bar:hover .connector-arrow {
  background: #374151;
  transform: scale(1.05);
}

.extra-services {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  font-weight: 600;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.workflow-info {
  flex: 1;
  min-width: 0;
}

.workflow-bar-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.025em;
}

.workflow-bar-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.workflow-bar-center {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.frequency-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  backdrop-filter: blur(8px);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.1) inset;
}

.workflow-bar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}


.bar-action-menu {
  opacity: 0;
  transition: all 0.3s ease;
  color: var(--text-secondary);
  border-radius: 12px;
}

.workflow-bar:hover .bar-action-menu {
  opacity: 1;
}

.workflow-bar-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  border-radius: 24px;
}

.workflow-bar:hover .workflow-bar-glow {
  opacity: 1;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .glass-bar {
    border-radius: 20px;
  }

  .workflow-bar-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem 1.25rem;
  }

  .workflow-bar-left {
    width: 100%;
  }

  .workflow-bar-center {
    width: 100%;
    justify-content: flex-start;
  }

  .workflow-bar-right {
    width: 100%;
    justify-content: space-between;
  }

  .workflow-services {
    gap: 0.5rem;
  }

  .service-bubble {
    width: 36px;
    height: 36px;
  }

  .add-bar-content {
    padding: 1rem 1.25rem;
  }

  .add-icon-circle {
    width: 40px;
    height: 40px;
  }
}


</style>