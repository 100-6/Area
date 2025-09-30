<template>
  <div class="flex justify-center">
    <div class="relative">
      <!-- Cercle décoratif en arrière-plan -->
      <div
        class="absolute inset-0 rounded-full animate-pulse"
        :class="backgroundOpacity"
        :style="backgroundStyle"
      ></div>

      <!-- Robot GIF -->
      <img
        :src="computedRobotSrc"
        :alt="alt"
        :class="robotClasses"
        class="relative z-10 object-contain drop-shadow-2xl"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  // Taille du robot (sm, md, lg, xl)
  size?: 'sm' | 'md' | 'lg' | 'xl'
  // Afficher les éléments flottants
  showFloatingElements?: boolean
  // Opacité du cercle d'arrière-plan
  backgroundOpacity?: string
  // Type de robot/GIF à afficher
  robotType?: 'happy' | 'register' | 'custom'
  // Source de l'image personnalisée (utilisée avec robotType: 'custom')
  robotSrc?: string
  // Texte alternatif
  alt?: string
  // Alignement (center, left, right)
  alignment?: 'center' | 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'lg',
  showFloatingElements: true,
  backgroundOpacity: 'opacity-20',
  robotType: 'happy',
  robotSrc: '',
  alt: 'Robot automatisation',
  alignment: 'center'
})

// Source du robot calculée selon le type
const computedRobotSrc = computed(() => {
  if (props.robotType === 'custom' && props.robotSrc) {
    return props.robotSrc
  }

  const robotSources = {
    happy: '/happy-retro-robot.gif',
    register: '/robot_regisster.gif'
  }

  return robotSources[props.robotType] || robotSources.happy
})

// Classes dynamiques basées sur la taille
const robotClasses = computed(() => {
  const sizeClasses = {
    sm: 'w-32 h-32 lg:w-40 lg:h-40',
    md: 'w-48 h-48 lg:w-56 lg:h-56',
    lg: 'w-80 h-80 lg:w-96 lg:h-96',
    xl: 'w-96 h-96 lg:w-[28rem] lg:h-[28rem]'
  }
  return sizeClasses[props.size]
})

// Style du fond radial
const backgroundStyle = computed(() => ({
  background: 'radial-gradient(circle, var(--color-primary), transparent 70%)'
}))

// Classes d'alignement pour le conteneur parent
const containerClasses = computed(() => {
  const alignmentClasses = {
    center: 'justify-center',
    left: 'justify-start',
    right: 'justify-end'
  }
  return `flex ${alignmentClasses[props.alignment]}`
})
</script>