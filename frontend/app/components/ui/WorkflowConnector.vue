<template>
  <div class="hidden lg:flex justify-center items-center py-8">
    <div class="relative">

      <!-- Capsule continue -->
      <div class="flex items-center">

        <!-- Nœud de départ -->
        <div class="relative z-10">
          <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
               style="border-color: var(--color-secondary); background: var(--bg-card);">
            <div class="w-2 h-2 rounded-full animate-pulse"
                 style="background: var(--color-secondary); animation-duration: 2s;"></div>
          </div>
        </div>

        <!-- Capsule de liaison unifiée -->
        <div class="relative mx-2">
          <div class="h-4 rounded-full border-2 flex items-center relative overflow-hidden"
               :style="{
                 width: linked ? '80px' : '40px',
                 borderColor: 'var(--color-tertiary)',
                 background: 'var(--bg-card)',
                 transition: 'all 0.5s ease-in-out'
               }">

            <!-- Points de progression dans la capsule -->
            <div class="absolute inset-0 flex items-center justify-center">
              <div v-for="i in (linked ? 6 : 3)" :key="i"
                   class="w-1 h-1 rounded-full mx-0.5 animate-pulse"
                   :style="{
                     background: 'var(--color-secondary)',
                     animationDelay: `${(i-1) * 0.3}s`,
                     animationDuration: '2s'
                   }"></div>
            </div>

            <!-- Vague de progression -->
            <div class="absolute inset-0 rounded-full animate-wave"
                 :style="{
                   background: 'linear-gradient(90deg, transparent, rgba(167, 240, 186, 0.3), transparent)',
                   animationDuration: linked ? '3s' : '2s'
                 }"></div>
          </div>
        </div>

        <!-- Nœud d'arrivée (conditionnel) -->
        <div v-if="linked" class="relative z-10">
          <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
               style="border-color: var(--color-secondary); background: var(--bg-card);">
            <div class="w-2 h-2 rounded-full animate-pulse"
                 style="background: var(--color-secondary); animation-duration: 2.5s; animation-delay: 1s;"></div>
          </div>
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
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}

.animate-wave {
  animation: wave linear infinite;
}
</style>