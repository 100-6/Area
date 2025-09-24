<template>
  <span class="inline-flex items-center">
    <span>{{ displayedText }}</span>
    <span
      v-if="showCursor"
      class="animate-pulse"
      :class="cursorClass"
    >{{ cursorCharacter }}</span>
  </span>
</template>

<script setup lang="ts">
interface Props {
  text: string[]
  typingSpeed?: number
  pauseDuration?: number
  showCursor?: boolean
  cursorCharacter?: string
  cursorClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  typingSpeed: 75,
  pauseDuration: 1500,
  showCursor: true,
  cursorCharacter: '|',
  cursorClass: 'ml-1 font-bold'
})

const displayedText = ref('')
const currentTextIndex = ref(0)
const currentCharIndex = ref(0)
const isTyping = ref(true)
const isDeleting = ref(false)

const typeText = () => {
  const currentText = props.text[currentTextIndex.value]

  if (isDeleting.value) {
    displayedText.value = currentText.substring(0, currentCharIndex.value - 1)
    currentCharIndex.value--

    if (currentCharIndex.value === 0) {
      isDeleting.value = false
      currentTextIndex.value = (currentTextIndex.value + 1) % props.text.length
      setTimeout(typeText, props.typingSpeed)
      return
    }
  } else {
    displayedText.value = currentText.substring(0, currentCharIndex.value + 1)
    currentCharIndex.value++

    if (currentCharIndex.value === currentText.length) {
      isDeleting.value = true
      setTimeout(typeText, props.pauseDuration)
      return
    }
  }

  setTimeout(typeText, props.typingSpeed)
}

onMounted(() => {
  typeText()
})

onUnmounted(() => {
})
</script>