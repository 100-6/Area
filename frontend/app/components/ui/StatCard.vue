<template>
  <div class="stat-card">
    <div class="stat-content">
      <div class="stat-info">
        <p class="stat-label">{{ label }}</p>
        <p class="stat-value">{{ formattedValue }}</p>
      </div>
      <div class="stat-icon-wrapper" :style="`background: ${iconBackground};`">
        <UIcon :name="icon" class="stat-icon" :style="`color: ${iconColor};`" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  icon: string
  iconColor: string
  iconBackground: string
  formatValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  formatValue: true
})

const formattedValue = computed(() => {
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
</script>

<style scoped>
.stat-card {
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid #f3f4f6;
  background: white;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-color: #e5e7eb;
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
  line-height: 1.4;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  letter-spacing: -0.025em;
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon-wrapper {
  transform: scale(1.05);
}

.stat-icon {
  width: 24px;
  height: 24px;
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
}

/* Responsive */
@media (max-width: 768px) {
  .stat-card {
    padding: 1.25rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .stat-icon {
    width: 20px;
    height: 20px;
  }
}
</style>