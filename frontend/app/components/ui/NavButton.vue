<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="nav-item group flex items-center px-2 py-1.5 rounded-md transition-all duration-200"
    :class="{ 'nav-active': isActive }"
    @click="$emit('click')"
  >
    <UIcon :name="icon" class="w-6 h-6 mr-1" />
    <span class="nav-text text-sm">{{ label }}</span>
  </NuxtLink>

  <button
    v-else
    class="nav-item group flex items-center px-2 py-1.5 rounded-md transition-all duration-200"
    :class="{ 'nav-active': isActive }"
    @click="$emit('click')"
  >
    <UIcon v-if="icon" :name="icon" class="w-6 h-6 mr-1" />
    <slot name="icon" />
    <span class="nav-text text-sm">{{ label }}</span>
    <slot name="suffix" />
  </button>
</template>

<script setup lang="ts">
interface Props {
  label: string
  icon?: string
  to?: string
  isActive?: boolean
}

defineProps<Props>()
defineEmits<{
  click: []
}>()
</script>

<style scoped>
/* Navigation styles */
.nav-item {
  color: var(--text-secondary);
  border-radius: var(--border-radius-md);
  transition: var(--transition-normal);
}

.nav-item:hover:not(.nav-active) {
  color: var(--color-tertiary);
}

.nav-item.nav-active {
  background: var(--color-tertiary);
  color: var(--text-white);
  box-shadow: var(--shadow-green);
}

.nav-item.nav-active .nav-text {
  font-weight: var(--font-weight-medium);
}

.nav-item:not(.nav-active) .nav-text {
  opacity: 0;
  max-width: 0;
  overflow: hidden;
  transition: all var(--transition-normal);
}

.nav-item:not(.nav-active):hover .nav-text {
  opacity: 1;
  max-width: 100px;
  margin-left: 0.5rem;
}
</style>