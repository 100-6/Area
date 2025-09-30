<template>
  <div
    ref="containerRef"
    class="relative overflow-hidden cursor-pointer"
    :style="containerStyle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Contenu -->
    <div class="relative z-10 w-full h-full">
      <slot />
    </div>

    <!-- Effet de glare sweep -->
    <div
      class="absolute pointer-events-none z-20 top-0 bottom-0"
      :class="{ 'glare-sweep': isAnimating }"
      :style="glareStyle"
    ></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  width?: string
  height?: string
  background?: string
  borderColor?: string
  borderRadius?: string
  glareColor?: string
  glareOpacity?: number
  glareSize?: number
  transitionDuration?: number
  playOnce?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: 'auto',
  background: '#0b0b0b',
  borderColor: '#222222',
  borderRadius: '8px',
  glareColor: '#ffffff',
  glareOpacity: 0.3,
  glareSize: 100,
  transitionDuration: 800,
  playOnce: false
})

const containerRef = ref<HTMLElement>()
const isAnimating = ref(false)
const hasPlayed = ref(false)

// Style du conteneur
const containerStyle = computed(() => ({
  width: props.width,
  height: props.height,
  background: props.background,
  border: `1px solid ${props.borderColor}`,
  borderRadius: props.borderRadius
}))

// Style de l'effet glare
const glareStyle = computed(() => ({
  width: `${props.glareSize}px`,
  background: `linear-gradient(90deg, transparent, ${props.glareColor}, transparent)`,
  opacity: props.glareOpacity,
  transform: 'translateX(-100%)',
  '--glare-duration': `${props.transitionDuration}ms`
}))

const handleMouseEnter = () => {
  if (props.playOnce && hasPlayed.value) return

  isAnimating.value = true

  // Réinitialiser l'animation après qu'elle soit terminée
  setTimeout(() => {
    isAnimating.value = false
    if (props.playOnce) {
      hasPlayed.value = true
    }
  }, props.transitionDuration)
}

const handleMouseLeave = () => {
  // Ne pas interrompre l'animation en cours
}
</script>

<style scoped>
.glare-sweep {
  animation: sweep var(--glare-duration) ease-out;
}

@keyframes sweep {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(calc(100vw + 100px));
  }
}
</style>