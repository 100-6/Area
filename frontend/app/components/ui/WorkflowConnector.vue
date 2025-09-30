<template>
  <div class="hidden lg:flex justify-center items-center py-8">
    <div class="relative">

      <!-- Capsule de liaison unifiée allongée -->
      <div class="relative">
        <div class="h-6 rounded-full border-3 flex items-center relative overflow-hidden shadow-lg"
             :style="{
               width: linked ? '300px' : '120px',
               borderColor: 'var(--color-tertiary)',
               background: 'var(--bg-card)',
               transition: 'all 0.5s ease-in-out'
             }">

          <!-- Points de progression dans la capsule -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div v-for="i in (linked ? 20 : 10)" :key="i"
                 class="w-1.5 h-1.5 rounded-full mx-1 animate-pulse"
                 :style="{
                   background: 'var(--color-secondary)',
                   animationDelay: `${(i-1) * 0.12}s`,
                   animationDuration: '2s'
                 }"></div>
          </div>

          <!-- Vague de progression principale -->
          <div class="absolute inset-0 rounded-full animate-wave"
               :style="{
                 background: 'linear-gradient(90deg, transparent, rgba(167, 240, 186, 0.3), rgba(72, 199, 116, 0.2), rgba(167, 240, 186, 0.3), transparent)',
                 animationDuration: linked ? '3s' : '2s'
               }"></div>

          <!-- Vague secondaire pour plus d'intensité -->
          <div class="absolute inset-0 rounded-full animate-wave"
               :style="{
                 background: 'linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.15), rgba(34, 197, 94, 0.2), transparent)',
                 animationDuration: linked ? '2s' : '1.5s',
                 animationDelay: '0.5s'
               }"></div>

          <!-- Éclats d'énergie -->
          <div class="absolute inset-0 rounded-full animate-wave"
               :style="{
                 background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                 animationDuration: linked ? '1.5s' : '1s',
                 animationDelay: '1s'
               }"></div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  // Mode de liaison : true = deux nœuds connectés, false = un seul nœud
  linked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  linked: true
})
</script>

<style scoped>
@keyframes wave {
  0% {
    transform: translateX(-120%);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateX(220%);
    opacity: 0;
  }
}

@keyframes energy-pulse {
  0%, 100% {
    box-shadow: 0 0 5px rgba(167, 240, 186, 0.2);
  }
  50% {
    box-shadow: 0 0 20px rgba(167, 240, 186, 0.3), 0 0 30px rgba(72, 199, 116, 0.2);
  }
}

.animate-wave {
  animation: wave linear infinite;
}

/* Ajouter un effet de pulsation au conteneur */
.animate-wave:first-child {
  animation: wave linear infinite, energy-pulse 2s ease-in-out infinite;
}
</style>