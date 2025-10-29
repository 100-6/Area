<template>
  <div class="screenshot-container">
    <img
      v-if="imageSrc && !imageError"
      :src="imageSrc"
      :alt="alt"
      class="real-screenshot"
      @error="handleImageError"
      @load="handleImageLoad"
    />

    <!-- Fallback placeholder si l'image n'existe pas -->
    <div v-else class="screenshot-placeholder">
      <UIcon :name="icon" class="screenshot-icon" />
      <p>{{ placeholder }}</p>
      <span v-if="imageError" class="error-text">Image non trouvée</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  imageSrc?: string
  alt: string
  placeholder: string
  icon: string
}

const props = defineProps<Props>()

const imageError = ref(false)
const imageLoaded = ref(false)

const handleImageError = () => {
  imageError.value = true
  console.warn(`Screenshot not found: ${props.imageSrc}`)
}

const handleImageLoad = () => {
  imageLoaded.value = true
  imageError.value = false
}

// Reset error state when imageSrc changes
watch(() => props.imageSrc, () => {
  imageError.value = false
  imageLoaded.value = false
})
</script>

<style scoped>
.screenshot-container {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.real-screenshot {
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  object-fit: contain;
  border-radius: 10px;
  transition: transform 0.3s ease;
  background: var(--bg-card);
}

.real-screenshot:hover {
  transform: scale(1.02);
}

.screenshot-placeholder {
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  background: var(--bg-card);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--border-color);
  position: relative;
  margin: 2px;
}

.screenshot-icon {
  width: 3rem;
  height: 3rem;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.screenshot-placeholder p {
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-align: center;
  margin: 0;
}

.error-text {
  position: absolute;
  bottom: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-error);
  opacity: 0.7;
}
</style>