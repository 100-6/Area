<template>
  <div
    :class="[
      'group p-6 rounded-lg border border-gray-100 transition-all duration-200',
      'bg-gradient-to-br from-gray-50 to-white',
      hoverable && 'hover:from-green-50 hover:to-white hover:border-green-200 hover:shadow-md',
      clickable && 'cursor-pointer',
      variant === 'danger' && 'border-red-200 bg-gradient-to-r from-red-50 to-white',
      variant === 'warning' && 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-white',
      className
    ]"
    @click="clickable && $emit('click')"
  >
    <!-- Layout pour les cartes de stats (layout horizontal) -->
    <div v-if="layout === 'stat'" class="flex items-center justify-between">
      <div>
        <p v-if="title" class="text-sm text-gray-600 font-medium">{{ title }}</p>
        <p v-if="value" class="text-3xl font-bold text-gray-900 mt-1">{{ value }}</p>
      </div>
      <div
        v-if="icon"
        :class="[
          'p-3 rounded-full',
          iconSize === 'sm' && 'p-2',
          iconSize === 'lg' && 'p-4',
          iconSize === 'xl' && 'p-5'
        ]"
        :style="iconBackground"
      >
        <UIcon
          :name="icon"
          :class="[
            'w-6 h-6',
            iconSize === 'sm' && 'w-4 h-4',
            iconSize === 'lg' && 'w-8 h-8',
            iconSize === 'xl' && 'w-10 h-10'
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

        <!-- Contenu simple avec value -->
        <div v-if="value && !slots.default" class="text-xl font-bold text-gray-900">
          {{ value }}
        </div>

        <!-- Description -->
        <p v-if="description" class="text-sm text-gray-500">{{ description }}</p>
      </div>

      <!-- Footer avec actions -->
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
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  iconSize: 'md',
  variant: 'default',
  layout: 'default',
  hoverable: true,
  clickable: false
})

const emit = defineEmits<{
  click: []
}>()

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
      return 'background: rgba(239, 68, 68, 0.1);'
    case 'warning':
      return 'background: rgba(245, 158, 11, 0.1);'
    case 'success':
      return 'background: var(--color-secondary);'
    default:
      return 'background: rgba(72, 199, 116, 0.1);'
  }
})

const iconColor = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'color: #dc2626;'
    case 'warning':
      return 'color: #d97706;'
    case 'success':
      return 'color: white;'
    default:
      return 'color: var(--color-secondary);'
  }
})
</script>