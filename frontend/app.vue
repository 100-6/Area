<template>
    <NuxtLoadingIndicator />
    <UNotifications />
    <UModal />

    <UApp>
        <UMain>
            <NuxtLayout>
                <NuxtPage />
            </NuxtLayout>
        </UMain>
    </UApp>
    
</template>

<script setup lang="ts">
definePageMeta({
  pageTransition: { name: 'fade', mode: 'out-in' }
})
</script>

<style>
    .fade-enter-active, .fade-leave-active {
        transition: opacity .2s ease;
    }
    .fade-enter-from, .fade-leave-to {
        opacity: 0;
    }
</style>