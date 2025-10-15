<template>
  <UModal
    v-model:open="isOpen"
    :prevent-close="false"
    @close="closeModal"
    :ui="{
      content: 'fixed bg-white divide-y divide-gray-200 flex flex-col focus:outline-none border-0 ring-0 shadow-xl',
      overlay: 'fixed inset-0 bg-gray-900/50',
      header: 'flex items-center gap-1.5 p-4 sm:px-6 min-h-16 bg-white',
      body: 'flex-1 overflow-y-auto p-4 sm:p-6 bg-white',
      footer: 'flex items-center gap-1.5 p-4 sm:px-6 bg-white'
    }"
  >
    <!-- Header personnalisé -->
    <template #header>
      <div style="padding: 1.5rem;">
        <h3 style="color: var(--text-primary); font-size: 1.25rem; font-weight: 600; margin: 0;">
          Choisir un service
        </h3>
        <p style="color: var(--text-secondary); font-size: 0.875rem; margin: 0.25rem 0 0 0;">
          Sélectionnez un service pour démarrer votre automatisation
        </p>
      </div>
    </template>
    <template #body>
      <div class="space-y-4">
        <!-- Barre de recherche -->
        <div class="relative">
          <UInput
            v-model="searchTerm"
            placeholder="Rechercher un service..."
            icon="i-heroicons-magnifying-glass"
            size="lg"
            class="w-full"
            style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);"
          />
        </div>

        <!-- Filtres par catégorie -->
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="category in categories"
            :key="category.value"
            :variant="selectedCategory === category.value ? 'solid' : 'outline'"
            size="sm"
            :style="selectedCategory === category.value ?
              'background: var(--color-tertiary); color: var(--text-white); border-color: var(--color-tertiary);' :
              'background: var(--bg-card); color: var(--text-secondary); border-color: var(--border-color);'"
            @click="selectedCategory = category.value"
          >
            {{ category.label }}
          </UButton>
        </div>

        <!-- Loading state -->
        <div v-if="isLoadingServices" class="flex items-center justify-center py-8">
          <div class="flex items-center gap-3">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span style="color: var(--text-secondary);">Chargement des services...</span>
          </div>
        </div>

        <!-- Liste des services -->
        <div v-else class="grid gap-3 max-h-96 overflow-y-auto" :class="selectedCategory === 'all' ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'">
          <div
            v-for="service in filteredServices"
            :key="service.id"
            class="service-card"
            :class="{
              'service-card-disabled': !service.isActive,
              'service-card-compact': selectedCategory === 'all'
            }"
            @click="selectService(service)"
          >
            <!-- Affichage compact pour "Tous" -->
            <div v-if="selectedCategory === 'all'" class="service-card-content-compact">
              <div class="service-icon-compact" :style="`background-color: ${service.color}15`">
                <UIcon :name="service.icon" class="w-5 h-5" :style="`color: ${service.color}`" />
              </div>
              <h3 class="service-name-compact">{{ service.name }}</h3>
              <span v-if="!service.isActive" class="status-dot status-inactive"></span>
              <span v-else class="status-dot status-active"></span>
            </div>

            <!-- Affichage détaillé pour les catégories spécifiques -->
            <div v-else class="service-card-content">
              <div class="service-icon" :style="`background-color: ${service.color}15`">
                <UIcon :name="service.icon" class="w-6 h-6" :style="`color: ${service.color}`" />
              </div>

              <div class="service-info">
                <h3 class="service-name">{{ service.name }}</h3>
                <p class="service-description">{{ service.description }}</p>
                <div class="service-badge">
                  <span class="category-badge">{{ getCategoryLabel(service.category) }}</span>
                  <span v-if="!service.isActive" class="status-badge status-inactive">Indisponible</span>
                  <span v-else class="status-badge status-active">Disponible</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Message si aucun service trouvé -->
        <div v-if="filteredServices.length === 0" class="empty-state">
          <UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 mx-auto mb-4" style="color: var(--text-secondary);" />
          <p class="text-center" style="color: var(--text-primary);">Aucun service trouvé</p>
          <p class="text-center text-sm" style="color: var(--text-secondary);">Essayez de modifier vos critères de recherche</p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          variant="outline"
          style="background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border-color);"
          @click="closeModal"
        >
          Annuler
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Service } from '~/types'

interface Props {
  open?: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'service-selected', service: Service): void
}

const props = withDefaults(defineProps<Props>(), {
  open: false
})

const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const searchTerm = ref('')
const selectedCategory = ref<string>('all')

// Catégories disponibles
const categories = [
  { value: 'all', label: 'Tous' },
  { value: 'communication', label: 'Communication' },
  { value: 'productivity', label: 'Productivité' },
  { value: 'automation', label: 'Automation' },
  { value: 'development', label: 'Développement' },
  { value: 'storage', label: 'Stockage' },
  { value: 'other', label: 'Autres' }
]

const { getAvailableServices } = useServiceManagement()
const availableServices = ref<Service[]>([])
const isLoadingServices = ref(false)

onMounted(async () => {
  try {
    isLoadingServices.value = true
    availableServices.value = await getAvailableServices()
  } catch (error) {
    console.error('Failed to load services:', error)
    availableServices.value = []
  } finally {
    isLoadingServices.value = false
  }
})

const filteredServices = computed(() => {
  let services = availableServices.value

  if (selectedCategory.value !== 'all') {
    services = services.filter(service => service.category === selectedCategory.value)
  }

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    services = services.filter(service =>
      service.name.toLowerCase().includes(term) ||
      service.description.toLowerCase().includes(term)
    )
  }

  return services
})

const selectService = (service: Service) => {
  if (!service.isActive) return

  emit('service-selected', service)
}

const closeModal = () => {
  isOpen.value = false
  searchTerm.value = ''
  selectedCategory.value = 'all'
}

const getCategoryLabel = (category: string) => {
  const cat = categories.find(c => c.value === category)
  return cat?.label || category
}
</script>

<style scoped>

.service-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.service-card-compact {
  padding: 0.75rem;
  border-radius: 12px;
  min-height: 80px;
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary);
}

.service-card-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.service-card-disabled:hover {
  transform: none;
  box-shadow: none;
  border-color: var(--border-color);
}

.service-card-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.service-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.service-info {
  flex: 1;
  min-width: 0;
}

/* Styles pour l'affichage compact */
.service-card-content-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
  position: relative;
}

.service-icon-compact {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin: 0 auto;
}

.service-name-compact {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
  margin: 0;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 100%;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  position: absolute;
  top: 4px;
  right: 4px;
}

.status-dot.status-active {
  background: var(--color-secondary);
}

.status-dot.status-inactive {
  background: var(--color-error);
}

.service-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  line-height: 1.2;
}

.service-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.service-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-weight: 500;
}

.status-active {
  background: rgba(72, 199, 116, 0.1);
  color: var(--color-secondary);
  border: 1px solid rgba(72, 199, 116, 0.2);
}

.status-inactive {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

/* Mobile responsive */
@media (max-width: 640px) {
  .service-card-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .service-info {
    width: 100%;
  }
}
</style>