<template>
  <div style="font-family: var(--font-family-sans); background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); min-height: 100vh;">
    <!-- Hero Section avec cover photo -->
    <div class="relative h-64 overflow-hidden" style="background: linear-gradient(135deg, var(--color-secondary), var(--color-tertiary));">
      <div class="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>

      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-10" style="background: var(--color-primary);"></div>
        <div class="absolute -top-8 -left-8 w-24 h-24 rounded-full opacity-15" style="background: white;"></div>
        <div class="absolute top-12 -right-6 w-16 h-16 rounded-full opacity-10" style="background: var(--color-primary);"></div>
        <div class="absolute -bottom-12 left-1/4 w-32 h-32 rounded-full opacity-8" style="background: white;"></div>
        <div class="absolute top-6 left-1/3 w-12 h-12 rounded-full opacity-12" style="background: var(--color-primary);"></div>
        <div class="absolute -bottom-8 right-1/3 w-20 h-20 rounded-full opacity-10" style="background: white;"></div>
      </div>

      <div class="absolute bottom-8 left-8 right-8">
        <UContainer>
          <div class="flex items-end space-x-6">
            <div class="relative">
              <div class="w-32 h-32 rounded-full border-4 border-white shadow-xl flex items-center justify-center" style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));">
                <span class="text-4xl font-bold" style="color: var(--color-tertiary);">
                  {{ getInitials(user?.firstName, user?.lastName) }}
                </span>
              </div>
            </div>
            <div class="flex-1 text-white pb-4">
              <h1 class="text-4xl font-bold mb-2">
                {{ user?.firstName }} {{ user?.lastName }}
              </h1>
              <p class="text-xl opacity-90">{{ user?.email }}</p>
            </div>
            <UButton
              variant="solid"
              size="lg"
              @click="isEditing = !isEditing"
              class="mb-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20"
            >
              <UIcon :name="isEditing ? 'i-heroicons-x-mark' : 'i-heroicons-pencil'" class="w-4 h-4 mr-2" />
              {{ isEditing ? 'Annuler' : 'Modifier' }}
            </UButton>
          </div>
        </UContainer>
      </div>
    </div>

    <UContainer class="py-8">
      <!-- Section Informations personnelles -->
      <div v-if="isEditing" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 class="text-2xl font-bold mb-6" style="color: var(--text-primary);">Modifier mes informations</h2>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-sm font-semibold text-gray-700">Prénom</label>
            <UInput
              v-model="editForm.firstName"
              placeholder="Votre prénom"
              size="lg"
              class="w-full"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-semibold text-gray-700">Nom</label>
            <UInput
              v-model="editForm.lastName"
              placeholder="Votre nom"
              size="lg"
              class="w-full"
            />
          </div>
        </div>
        <div class="mt-6 space-y-2">
          <label class="text-sm font-semibold text-gray-700">Email</label>
          <UInput
            v-model="editForm.email"
            type="email"
            placeholder="votre@email.com"
            size="lg"
            disabled
            class="w-full"
          />
          <p class="text-xs text-gray-500">L'email ne peut pas être modifié pour le moment</p>
        </div>
        <div class="flex gap-4 mt-8">
          <UButton
            @click="saveProfile"
            :loading="isSaving"
            size="lg"
            style="background: var(--color-secondary); border-color: var(--color-secondary);"
          >
            <UIcon name="i-heroicons-check" class="w-4 h-4 mr-2" />
            Sauvegarder
          </UButton>
          <UButton variant="outline" @click="cancelEdit" size="lg">
            Annuler
          </UButton>
        </div>
      </div>

      <!-- Onglets de navigation -->
      <div v-else>
        <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-6 py-3 text-sm font-medium rounded-md transition-all duration-200',
              activeTab === tab.id
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            ]"
          >
            <UIcon :name="tab.icon" class="w-4 h-4 mr-2 inline" />
            {{ tab.name }}
          </button>
        </div>

        <!-- Contenu des onglets -->
        <div class="space-y-6">
          <div v-if="activeTab === 'overview'">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <UiInfoCard
                title="Workflows actifs"
                :value="0"
                icon="i-heroicons-bolt"
                layout="stat"
                :hoverable="false"
              />

              <UiInfoCard
                title="Exécutions ce mois"
                :value="0"
                icon="i-heroicons-chart-bar"
                layout="stat"
                :hoverable="false"
              />

              <UiInfoCard
                title="Services connectés"
                :value="connectedProvidersCount"
                icon="i-heroicons-puzzle-piece"
                layout="stat"
                :hoverable="false"
              />
            </div>

            <!-- Actions rapides -->
            <div class="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
              <h3 class="text-xl font-bold mb-6 text-gray-900 flex items-center">
                <UIcon name="i-heroicons-bolt" class="w-5 h-5 mr-2" style="color: var(--color-secondary);" />
                Actions rapides
              </h3>
              <div class="space-y-4">
                <InfoCard
                  title="Paramètres du compte"
                  subtitle="Gérer vos préférences"
                  icon="i-heroicons-cog-6-tooth"
                  icon-size="lg"
                  class="bg-gradient-to-r from-gray-50 to-gray-100"
                >
                  <template #header-actions>
                    <span class="text-xs bg-gray-200 px-2 py-1 rounded-full">Bientôt</span>
                  </template>
                </InfoCard>

                <div
                  @click="handleLogout"
                  class="group relative overflow-hidden rounded-xl border border-red-200 p-6 transition-all duration-300 hover:border-red-300 hover:shadow-lg cursor-pointer transform hover:scale-[1.02]"
                  style="background: linear-gradient(135deg, #fef2f2, #fee2e2);"
                >
                  <div class="absolute inset-0 bg-gradient-to-r from-red-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div class="relative flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 group-hover:bg-red-200 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3">
                        <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-6 h-6 text-red-600 group-hover:text-red-700 transition-colors" />
                      </div>

                      <div>
                        <h4 class="font-semibold text-red-800 group-hover:text-red-900 transition-colors">Se déconnecter</h4>
                        <p class="text-sm text-red-600 group-hover:text-red-700 transition-colors">Fermer votre session en toute sécurité</p>
                      </div>
                    </div>

                    <div class="flex items-center space-x-2">
                      <div class="w-8 h-8 rounded-full bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-all duration-200 group-hover:translate-x-1">
                        <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 text-red-600 group-hover:text-red-700 transition-colors" />
                      </div>
                    </div>
                  </div>

                  <div class="mt-3 pt-3 border-t border-red-100 group-hover:border-red-200 transition-colors">
                    <div class="flex items-center text-xs text-red-500 group-hover:text-red-600 transition-colors">
                      <UIcon name="i-heroicons-shield-check" class="w-3 h-3 mr-1" />
                      <span>Action sécurisée</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'connections'" class="space-y-6">
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 2rem; box-shadow: var(--shadow-sm);">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 class="text-xl font-bold flex items-center gap-2" style="color: var(--text-primary);">
                    <UIcon name="i-heroicons-link" class="w-5 h-5" style="color: var(--color-secondary);" />
                    Services connectés
                  </h3>
                  <p class="text-sm" style="color: var(--text-secondary);">Connectez plusieurs comptes OAuth pour débloquer davantage d'automatisations.</p>
                </div>
                <UButton
                  variant="ghost"
                  size="sm"
                  @click="fetchProviders"
                  :loading="isLoadingProviders"
                  style="border: 1px solid var(--border-color); background: var(--bg-primary);"
                >
                  <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
                  Actualiser
                </UButton>
              </div>

              <div v-if="providersError" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {{ providersError }}
              </div>

              <div v-if="isLoadingProviders" class="flex items-center justify-center py-12" style="color: var(--text-secondary);">
                <div class="flex items-center gap-3">
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2" style="border-color: var(--color-primary);"></div>
                  Chargement des services...
                </div>
              </div>

              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="provider in providers"
                  :key="provider.provider"
                  class="relative rounded-xl p-5 transition-all duration-200 hover:transform hover:scale-105"
                  style="background: var(--bg-primary); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);"
                >
                  <div class="absolute inset-0 rounded-xl border border-transparent pointer-events-none transition-colors duration-200" />
                  <div class="relative flex items-start justify-between gap-4">
                    <div class="flex items-start gap-3">
                      <div
                        class="flex items-center justify-center h-12 w-12 rounded-full border"
                        :style="{
                          borderColor: provider.color || 'rgba(148, 163, 184, 0.4)',
                          background: provider.color ? provider.color + '15' : 'rgba(148, 163, 184, 0.08)'
                        }"
                      >
                        <UIcon :name="provider.icon" class="w-6 h-6" :style="provider.color ? { color: provider.color } : { color: '#1f2937' }" />
                      </div>
                      <div class="space-y-1">
                        <div class="flex items-center gap-2">
                          <h4 class="text-lg font-semibold" style="color: var(--text-primary);">{{ provider.displayName }}</h4>
                          <span
                            class="text-xs px-2 py-1 rounded-full font-medium"
                            :style="provider.isConnected ?
                              'background: rgba(72, 199, 116, 0.1); color: var(--color-secondary); border: 1px solid rgba(72, 199, 116, 0.2);' :
                              provider.isConfigured ?
                                'background: rgba(249, 115, 22, 0.12); color: #f97316; border: 1px solid rgba(249, 115, 22, 0.35);' :
                                'background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border-color);'"
                          >
                            {{ provider.isConnected ? 'Connecté' : provider.isConfigured ? 'Non connecté' : 'Indisponible' }}
                          </span>
                        </div>
                        <p v-if="provider.description" class="text-sm" style="color: var(--text-secondary);">{{ provider.description }}</p>
                        <p v-if="provider.isConnected && provider.connectedAt" class="text-xs" style="color: var(--text-secondary); opacity: 0.7;">
                          Connecté le {{ formatDate(provider.connectedAt) }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="relative mt-6 flex flex-wrap items-center gap-3">
                    <span
                      v-if="provider.isConnected"
                      class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full"
                      style="background: rgba(72, 199, 116, 0.12); color: var(--color-secondary); border: 1px solid rgba(72, 199, 116, 0.25);"
                    >
                      <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1" />
                      Connecté
                    </span>
                    <UButton
                      v-else
                      size="sm"
                      :disabled="!provider.isConfigured"
                      @click="handleProviderLink(provider.provider)"
                      :style="provider.isConfigured ?
                        'background: var(--color-secondary); color: var(--text-white); border: none;' :
                        'background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border-color); opacity: 0.6; cursor: not-allowed;'"
                    >
                      <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
                      {{ provider.isConfigured ? 'Connecter' : 'Non disponible' }}
                    </UButton>
                    <span v-if="provider.isPrimary" class="text-xs" style="color: var(--text-secondary); opacity: 0.7;">Principal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'info'" class="space-y-6">
            <div class="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
              <h3 class="text-xl font-bold mb-6 text-gray-900 flex items-center">
                <UIcon name="i-heroicons-user-circle" class="w-5 h-5 mr-2" style="color: var(--color-secondary);" />
                Informations personnelles
              </h3>

              <div class="grid md:grid-cols-2 gap-6">
                <InfoCard
                  icon="i-heroicons-identification"
                >
                  <template #default>
                    <div class="space-y-2">
                      <label class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Prénom</label>
                      <p class="text-xl font-bold text-gray-900">{{ user?.firstName || 'Non renseigné' }}</p>
                    </div>
                  </template>
                </InfoCard>

                <InfoCard
                  icon="i-heroicons-tag"
                >
                  <template #default>
                    <div class="space-y-2">
                      <label class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Nom</label>
                      <p class="text-xl font-bold text-gray-900">{{ user?.lastName || 'Non renseigné' }}</p>
                    </div>
                  </template>
                </InfoCard>
              </div>

              <div class="mt-6">
                <InfoCard
                  icon="i-heroicons-envelope"
                  class="bg-gradient-to-r from-gray-50 via-white to-gray-50 hover:from-green-50 hover:via-white hover:to-green-50"
                >
                  <template #header-actions>
                    <span class="text-xs font-medium px-2.5 py-0.5 rounded-full" style="background: var(--color-primary); color: var(--color-tertiary);">Vérifié</span>
                  </template>
                  <template #default>
                    <div class="space-y-2">
                      <label class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Adresse email</label>
                      <p class="text-xl font-bold text-gray-900">{{ user?.email }}</p>
                    </div>
                  </template>
                </InfoCard>
              </div>
            </div>

          </div>

          <!-- Onglet Sécurité -->
          <div v-if="activeTab === 'security'" class="space-y-6">
            <div class="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
              <h3 class="text-xl font-bold mb-6 text-gray-900 flex items-center">
                <UIcon name="i-heroicons-shield-check" class="w-5 h-5 mr-2" style="color: var(--color-secondary);" />
                Sécurité du compte
              </h3>

              <InfoCard
                title="Mot de passe"
                icon="i-heroicons-key"
                icon-size="lg"
              >
                <template #subtitle>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-3 h-3 mr-1" />
                    Ancienneté: 30+ jours
                  </span>
                </template>
                <template #header-actions>
                  <div class="flex items-center space-x-3">
                    <span class="text-xs bg-gray-200 px-3 py-1 rounded-full font-medium">Bientôt disponible</span>
                    <UButton variant="outline" disabled size="sm">
                      <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 mr-2" />
                      Modifier
                    </UButton>
                  </div>
                </template>
              </InfoCard>
            </div>

            <!-- Zone de danger -->
            <div class="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
              <div class="bg-gradient-to-r from-red-50 to-red-100 p-6 border-b border-red-200">
                <h4 class="text-xl font-bold text-red-800 flex items-center">
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 mr-2" />
                  Zone de danger
                </h4>
                <p class="text-sm text-red-600 mt-1">Les actions ci-dessous sont irréversibles. Procédez avec prudence.</p>
              </div>

              <div class="p-8">
                <div class="group relative overflow-hidden rounded-lg border-2 border-red-200 p-6 transition-all duration-200 hover:border-red-300 hover:shadow-lg bg-gradient-to-r from-red-50 to-white">
                  <!-- Effet de warning animé -->
                  <div class="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div class="relative flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                      <div class="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 group-hover:bg-red-200 transition-all duration-200 group-hover:scale-110">
                        <UIcon name="i-heroicons-trash" class="w-7 h-7 text-red-600" />
                      </div>
                      <div>
                        <h5 class="text-lg font-bold text-red-800 mb-1">Supprimer le compte</h5>
                        <p class="text-sm text-red-600 leading-relaxed">
                          Supprime définitivement votre compte et toutes vos données.<br>
                          <strong>Cette action ne peut pas être annulée.</strong>
                        </p>
                      </div>
                    </div>

                    <div class="flex flex-col items-end space-y-2">
                      <span class="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold border border-red-200">
                        Fonctionnalité désactivée
                      </span>
                      <button
                        disabled
                        class="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-sm opacity-50 cursor-not-allowed"
                      >
                        <UIcon name="i-heroicons-trash" class="w-4 h-4 mr-2" />
                        Supprimer le compte
                        <div class="absolute inset-0 bg-red-700 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div class="flex items-start space-x-3">
                    <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-amber-600 mt-0.5" />
                    <div class="text-sm text-amber-800">
                      <p class="font-semibold mb-1">Avant de supprimer votre compte :</p>
                      <ul class="list-disc list-inside space-y-1 text-amber-700">
                        <li>Sauvegardez vos workflows importants</li>
                        <li>Déconnectez tous vos services intégrés</li>
                        <li>Vérifiez que vous n'avez pas d'automations actives</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

// Import the InfoCard component explicitly to ensure it's available
import InfoCard from '~/components/ui/InfoCard.vue'

const { user, logout, updateProfile, linkProvider } = useAuth()
const { providers, isLoading: isLoadingProviders, error: providersError, fetchProviders } = useAuthProviders()

const isEditing = ref(false)
const isSaving = ref(false)
const activeTab = ref('overview')

// All OAuth providers from backend are now supported dynamically
const isSupportedProvider = (provider: string): boolean => {
  // Check if provider is configured (has OAuth auth type)
  const providerInfo = providers.value.find(p => p.provider === provider)
  return providerInfo?.isConfigured || false
}

const tabs = [
  {
    id: 'overview',
    name: 'Vue d\'ensemble',
    icon: 'i-heroicons-home'
  },
  {
    id: 'info',
    name: 'Informations',
    icon: 'i-heroicons-user'
  },
  {
    id: 'connections',
    name: 'Services connectés',
    icon: 'i-heroicons-link'
  },
  {
    id: 'security',
    name: 'Sécurité',
    icon: 'i-heroicons-shield-check'
  }
]

const editForm = ref({
  firstName: '',
  lastName: '',
  email: ''
})

const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return first + last || '??'
}

const initEditForm = () => {
  editForm.value = {
    firstName: user.value?.firstName || '',
    lastName: user.value?.lastName || '',
    email: user.value?.email || ''
  }
}

const saveProfile = async () => {
  isSaving.value = true
  try {
    await updateProfile({
      firstName: editForm.value.firstName,
      lastName: editForm.value.lastName
    })
    isEditing.value = false
  } catch (error) {
    console.error('Error saving profile:', error)
    // TODO: Afficher une notification d'erreur
  } finally {
    isSaving.value = false
  }
}

const cancelEdit = () => {
  isEditing.value = false
  initEditForm()
}

const handleLogout = async () => {
  await logout()
}

const handleProviderLink = (provider: string) => {
  if (!isSupportedProvider(provider)) {
    console.warn(`Provider ${provider} non configuré`)
    return
  }

  try {
    providersError.value = null
    // Tous les services utilisent maintenant /api/auth/{service}
    linkProvider(provider.toLowerCase())
  } catch (error) {
    console.error('Provider link error:', error)
  }
}

const connectedProvidersCount = computed(() => providers.value.filter(provider => provider.isConnected).length)

const formatDate = (value?: string | null) => {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(value))
  } catch (error) {
    try {
      return new Date(value).toLocaleDateString('fr-FR')
    } catch (_err) {
      return ''
    }
  }
}

watch(() => user.value, () => {
  if (user.value) {
    initEditForm()
    fetchProviders()
  }
}, { immediate: true })

watch(activeTab, (value) => {
  if (value === 'connections') {
    fetchProviders()
  }
})

useHead({
  title: 'Mon Profil - Auto',
  meta: [
    { name: 'description', content: 'Gérez votre profil et vos paramètres de compte Auto.' }
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
</style>