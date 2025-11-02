<template>
  <div class="min-h-screen flex items-center justify-center" style="font-family: var(--font-family-sans); background: var(--bg-primary);">
    <UContainer>
      <div class="text-center max-w-2xl mx-auto">
        <div class="mb-8">
          <UIcon name="i-heroicons-question-mark-circle" class="w-24 h-24 mx-auto mb-6" style="color: var(--color-secondary);" />
        </div>
        <h1 class="text-4xl lg:text-5xl font-bold mb-6" style="color: var(--text-primary);">
          Centre d'aide
        </h1>
        <p class="text-2xl mb-8" style="color: var(--text-secondary);">
          Dans le futur
        </p>
        <UButton
          size="lg"
          style="background: var(--color-tertiary); color: var(--text-white);"
          @click="navigateTo('/')"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-5 h-5 mr-2" />
          Retour à l'accueil
        </UButton>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Centre d\'aide - Auto',
  meta: [
    { name: 'description', content: 'Trouvez de l\'aide et des réponses à vos questions' }
  ]
})
</script>
