<template>
  <div class="py-20" style="font-family: var(--font-family-sans); background: var(--bg-primary);">
    <UContainer>
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-6" style="color: var(--text-primary);">
          Bienvenue {{ user?.firstName }} !
        </h1>
        <p class="text-xl mb-8" style="color: var(--text-secondary);">
          Votre dashboard d'automatisation
        </p>

        <UButton @click="handleLogout" variant="outline" size="lg">
          <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-5 h-5 mr-2" />
          Se déconnecter
        </UButton>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { user, logout } = useAuth()

const handleLogout = async () => {
  await logout()
}

useHead({
  title: 'Dashboard - Auto'
})
</script>