<template>
  <div class="status-indicator" :class="`status-${status}`">
    <div class="status-pulse"></div>
    <span class="status-text">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  status: 'active' | 'paused' | 'error'
  label: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showLabel: true
})
</script>

<style scoped>
.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.1) inset;
}

.status-indicator[data-size="sm"] {
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  gap: 0.375rem;
}

.status-indicator[data-size="lg"] {
  padding: 0.75rem 1.25rem;
  border-radius: 24px;
  gap: 0.75rem;
}

.status-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.status-indicator[data-size="sm"] .status-pulse {
  width: 6px;
  height: 6px;
}

.status-indicator[data-size="lg"] .status-pulse {
  width: 10px;
  height: 10px;
}

.status-active .status-pulse {
  background: #10b981;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: pulse-glow 2s infinite;
}

.status-paused .status-pulse {
  background: #f59e0b;
  box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
}

.status-error .status-pulse {
  background: #ef4444;
  box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  animation: pulse-glow 1s infinite;
}

@keyframes pulse-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.status-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.status-indicator[data-size="sm"] .status-text {
  font-size: 0.6875rem;
}

.status-indicator[data-size="lg"] .status-text {
  font-size: 0.875rem;
}

/* Version sans label (juste le dot) */
.status-indicator:not([data-show-label="true"]) {
  padding: 0.5rem;
  width: auto;
  min-width: auto;
}

.status-indicator:not([data-show-label="true"]) .status-text {
  display: none;
}
</style>