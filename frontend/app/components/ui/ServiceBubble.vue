<template>
  <div class="service-bubble">
    <div class="service-bubble-before"></div>
    <UIcon :name="icon" class="service-icon" :style="`color: ${color};`" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon: string
  color: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})
</script>

<style scoped>
.service-bubble {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(12px);
  transition: all 0.3s ease;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.service-bubble[data-size="sm"] {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.service-bubble[data-size="lg"] {
  width: 48px;
  height: 48px;
  border-radius: 16px;
}

.service-bubble-before {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.02));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.service-bubble:hover .service-bubble-before {
  opacity: 1;
}

.service-icon {
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  width: 16px;
  height: 16px;
}

.service-bubble[data-size="sm"] .service-icon {
  width: 14px;
  height: 14px;
}

.service-bubble[data-size="lg"] .service-icon {
  width: 20px;
  height: 20px;
}

.service-bubble:hover .service-icon {
  transform: scale(1.1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}
</style>