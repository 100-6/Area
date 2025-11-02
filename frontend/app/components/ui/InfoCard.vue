<template>
  <div
    :class="[
      'group rounded-lg border border-gray-100 bg-white',
      layout === 'stat' ? 'p-6 transition-all duration-300 cubic-bezier-smooth shadow-sm' : 'p-6 bg-gradient-to-br from-gray-50 to-white transition-all duration-200',
      layout === 'stat' && hoverable && 'hover:translate-y-[-3px] hover:shadow-lg hover:border-gray-200',
      layout !== 'stat' && hoverable && 'hover:from-green-50 hover:to-white hover:border-green-200 hover:shadow-md',
      clickable && 'cursor-pointer',
      variant === 'danger' && 'border-red-200 bg-gradient-to-r from-red-50 to-white',
      variant === 'warning' && 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-white',
      className
    ]"
    @click="clickable && $emit('click')"
  >
    <!-- Layout pour les cartes de stats -->
    <div v-if="layout === 'stat'" class="flex items-center justify-between">
      <div class="flex-1">
        <p v-if="title" class="text-sm font-medium mb-1 leading-normal" style="color: var(--text-secondary)">{{ title }}</p>
        <p v-if="value !== undefined && value !== null" class="text-3xl font-bold leading-tight tracking-tight" style="color: var(--text-primary); letter-spacing: -0.025em;">{{ formattedValue }}</p>
      </div>
      <div
        v-if="icon"
        :class="[
          'flex items-center justify-center flex-shrink-0 rounded-xl transition-all duration-300 ease-out group-hover:scale-105',
          iconSize === 'sm' && 'w-10 h-10',
          iconSize === 'md' && 'w-12 h-12',
          iconSize === 'lg' && 'w-14 h-14',
          iconSize === 'xl' && 'w-16 h-16'
        ]"
        :style="iconBackground"
      >
        <UIcon
          :name="icon"
          :class="[
            'transition-all duration-300 ease-out group-hover:scale-110',
            iconSize === 'sm' && 'w-5 h-5',
            iconSize === 'md' && 'w-6 h-6',
            iconSize === 'lg' && 'w-7 h-7',
            iconSize === 'xl' && 'w-8 h-8'
          ]"
          :style="iconColor"
        />
      </div>
    </div>

    <!-- Layout standard (layout vertical) -->
    <div v-else>
      <!-- Header avec icône et titre -->
      <div v-if="icon || title || subtitle || slots['header-actions'] || slots['title-extra']" class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <!-- Icône -->
          <div
            v-if="icon"
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center',
              iconSize === 'sm' && 'w-8 h-8',
              iconSize === 'lg' && 'w-12 h-12',
              iconSize === 'xl' && 'w-14 h-14'
            ]"
            :style="iconBackground"
          >
            <UIcon
              :name="icon"
              :class="[
                'w-5 h-5',
                iconSize === 'sm' && 'w-4 h-4',
                iconSize === 'lg' && 'w-6 h-6',
                iconSize === 'xl' && 'w-7 h-7'
              ]"
              :style="iconColor"
            />
          </div>

          <!-- Titre et labels -->
          <div class="flex-1">
            <div v-if="title || slots['title-extra']" class="flex items-center space-x-2">
              <h4 v-if="title" :class="titleClass">{{ title }}</h4>
              <slot name="title-extra" />
            </div>
            <p v-if="subtitle" :class="subtitleClass">{{ subtitle }}</p>
            <slot name="subtitle" />
          </div>
        </div>

        <!-- Actions header (badges, boutons, etc.) -->
        <div v-if="slots['header-actions']" class="flex items-center space-x-2">
          <slot name="header-actions" />
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="space-y-3">
        <slot name="default" />

        <div v-if="(value !== undefined && value !== null) && !slots.default" class="text-xl font-bold text-gray-900">
          {{ value }}
        </div>

        <p v-if="description" class="text-sm text-gray-500">{{ description }}</p>
      </div>

      <div v-if="slots.footer" class="mt-4 pt-4 border-t border-gray-100">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const slots = useSlots()

interface Props {
  title?: string
  subtitle?: string
  description?: string
  value?: string | number
  icon?: string
  iconSize?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'danger' | 'warning' | 'success'
  layout?: 'default' | 'stat'
  hoverable?: boolean
  clickable?: boolean
  formatValue?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  iconSize: 'md',
  variant: 'default',
  layout: 'default',
  hoverable: true,
  clickable: false,
  formatValue: true
})

const emit = defineEmits<{
  click: []
}>()

// Formatage des valeurs (repris de StatCard)
const formattedValue = computed(() => {
  if (props.value === undefined || props.value === null) return ''

  if (!props.formatValue || typeof props.value === 'string') {
    return props.value
  }

  const num = Number(props.value)
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
})

// Classes dynamiques
const titleClass = computed(() => [
  'font-semibold',
  props.iconSize === 'sm' ? 'text-sm' :
  props.iconSize === 'lg' ? 'text-lg' :
  props.iconSize === 'xl' ? 'text-xl' : 'text-base',
  props.variant === 'danger' ? 'text-red-800' :
  props.variant === 'warning' ? 'text-yellow-800' :
  props.variant === 'success' ? 'text-white' :
  'text-gray-900'
])

const subtitleClass = computed(() => [
  'text-sm',
  props.variant === 'danger' ? 'text-red-600' :
  props.variant === 'warning' ? 'text-yellow-600' :
  props.variant === 'success' ? 'text-white/80' :
  'text-gray-500'
])

// Styles d'icône basés sur les variables CSS du site
const iconBackground = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);'
    case 'warning':
      return 'background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2);'
    case 'success':
      return 'background: rgba(255, 255, 255, 0.1); border: 1px solid var(--color-primary);'
    default:
      return 'background: rgba(255, 255, 255, 0.1); border: 1px solid var(--color-primary);'
  }
})

const iconColor = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'color: #dc2626;'
    case 'warning':
      return 'color: #d97706;'
    case 'success':
      return 'color: black;'
    default:
      return 'color: black;'
  }
})
</script>

<style scoped>
.cubic-bezier-smooth {
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

/* Responsive pour le layout stat */
@media (max-width: 768px) {
  .group[class*="layout"] .text-3xl {
    font-size: 1.5rem;
  }

  .group[class*="layout"] .w-12 {
    width: 2.5rem;
    height: 2.5rem;
  }

  .group[class*="layout"] .w-6 {
    width: 1.25rem;
    height: 1.25rem;
  }
}
</style>