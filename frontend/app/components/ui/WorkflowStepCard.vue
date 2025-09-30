<template>
  <div class="relative group">
    <!-- Carte normale -->
    <div v-if="!isEmpty" class="p-8 rounded-2xl border backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:scale-105"
         style="background: var(--bg-card); border-color: var(--border-color); box-shadow: var(--shadow-lg);">

      <!-- Badge numéroté -->
      <div class="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
           :style="{ background: 'var(--color-tertiary)' }">
        {{ step }}
      </div>

      <!-- Icône centrale -->
      <div class="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
           :style="{ background: iconBackground }">
        <UIcon :name="icon" class="w-8 h-8" :style="{ color: iconColor }" />
      </div>

      <!-- Contenu -->
      <h3 class="text-xl font-bold mb-3" style="color: var(--text-primary);">
        {{ title }}
      </h3>
      <p style="color: var(--text-secondary);">
        {{ description }}
      </p>

      <!-- Exemple de service (optionnel) -->
      <div v-if="example" class="mt-6 p-3 rounded-lg border flex items-center gap-3"
           :style="{
             background: exampleBackground,
             borderColor: exampleBorderColor
           }">
        <UIcon :name="exampleIcon" class="w-6 h-6" style="color: var(--color-tertiary);" />
        <span class="font-medium" style="color: var(--text-primary);">{{ example }}</span>
      </div>
    </div>

    <!-- Carte vide -->
    <div v-else class="p-8 rounded-2xl border-2 border-dashed transition-all duration-500 hover:scale-105 cursor-pointer bg-transparent"
         style="border-color: var(--border-color); opacity: 0.6;">

      <!-- Badge numéroté pour état vide -->
      <div class="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 border-dashed"
           style="background: transparent; border-color: var(--border-color); color: var(--text-secondary);">
        {{ step }}
      </div>

      <!-- Zone centrale vide avec icône + -->
      <div class="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center border-2 border-dashed"
           style="border-color: var(--border-color); background: transparent;">
        <UIcon name="i-heroicons-plus" class="w-8 h-8" style="color: var(--text-secondary);" />
      </div>

      <!-- Texte d'invite -->
      <h3 class="text-xl font-bold mb-3 text-center" style="color: var(--text-secondary);">
        Ajouter une réaction
      </h3>
      <p class="text-center" style="color: var(--text-secondary); opacity: 0.7;">
        Cliquez pour configurer une action
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  // Numéro de l'étape
  step: number
  // État vide de la carte
  isEmpty?: boolean
  // Icône principale
  icon?: string
  // Titre de l'étape
  title?: string
  // Description
  description?: string
  // Couleur de fond de l'icône
  iconBackground?: string
  // Couleur de l'icône
  iconColor?: string
  // Exemple de service (optionnel)
  example?: string
  // Icône pour l'exemple
  exampleIcon?: string
  // Couleur de fond pour l'exemple
  exampleBackground?: string
  // Couleur de bordure pour l'exemple
  exampleBorderColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  isEmpty: false,
  icon: 'i-heroicons-cog-6-tooth',
  title: '',
  description: '',
  iconBackground: 'var(--color-primary)',
  iconColor: 'var(--color-tertiary)',
  exampleIcon: 'i-heroicons-envelope',
  exampleBackground: 'rgba(167, 240, 186, 0.1)',
  exampleBorderColor: 'var(--color-primary)'
})
</script>