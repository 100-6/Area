<template>
  <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
    <UContainer>
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="group">
          <img
            src="/AutoLogo.png"
            alt="Auto Logo"
            class="h-16 w-auto object-contain transition-all duration-200 group-hover:scale-110"
          />
        </NuxtLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-8">
          <NuxtLink to="/" class="text-gray-700 hover:text-brand-tertiary transition-colors duration-200">
            Accueil
          </NuxtLink>
          <NuxtLink to="/services" class="text-gray-700 hover:text-brand-tertiary transition-colors duration-200">
            Services
          </NuxtLink>
          <NuxtLink to="/pricing" class="text-gray-700 hover:text-brand-tertiary transition-colors duration-200">
            Tarifs
          </NuxtLink>
          <NuxtLink to="/docs" class="text-gray-700 hover:text-brand-tertiary transition-colors duration-200">
            Documentation
          </NuxtLink>
        </nav>

        <!-- Desktop CTA -->
        <div class="hidden md:flex items-center space-x-4">
          <NuxtLink to="/login">
            <UButton variant="ghost" color="gray">
              Se connecter
            </UButton>
          </NuxtLink>
          <NuxtLink to="/register">
            <UButton
              style="background-color: var(--color-tertiary); color: var(--text-white);"
              class="hover:opacity-90"
            >
              S'inscrire
            </UButton>
          </NuxtLink>
        </div>

        <!-- Mobile Menu Button -->
        <UButton
          variant="ghost"
          color="gray"
          size="sm"
          class="md:hidden"
          @click="isMenuOpen = !isMenuOpen"
        >
          <UIcon :name="isMenuOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'" class="w-5 h-5" />
        </UButton>
      </div>

      <!-- Mobile Navigation -->
      <div v-show="isMenuOpen" class="md:hidden py-4 border-t border-gray-100">
        <nav class="flex flex-col space-y-4">
          <NuxtLink
            to="/"
            class="text-gray-700 hover:text-brand-tertiary transition-colors duration-200 py-2"
            @click="isMenuOpen = false"
          >
            Accueil
          </NuxtLink>
          <NuxtLink
            to="/services"
            class="text-gray-700 hover:text-brand-tertiary transition-colors duration-200 py-2"
            @click="isMenuOpen = false"
          >
            Services
          </NuxtLink>
          <NuxtLink
            to="/pricing"
            class="text-gray-700 hover:text-brand-tertiary transition-colors duration-200 py-2"
            @click="isMenuOpen = false"
          >
            Tarifs
          </NuxtLink>
          <NuxtLink
            to="/docs"
            class="text-gray-700 hover:text-brand-tertiary transition-colors duration-200 py-2"
            @click="isMenuOpen = false"
          >
            Documentation
          </NuxtLink>

          <div class="flex flex-col space-y-2 pt-4 border-t border-gray-100">
            <NuxtLink to="/login" @click="isMenuOpen = false">
              <UButton variant="ghost" color="gray" block>
                Se connecter
              </UButton>
            </NuxtLink>
            <NuxtLink to="/register" @click="isMenuOpen = false">
              <UButton
                style="background-color: var(--color-tertiary); color: var(--text-white);"
                class="hover:opacity-90"
                block
              >
                S'inscrire
              </UButton>
            </NuxtLink>
          </div>
        </nav>
      </div>
    </UContainer>
  </header>
</template>

<script setup lang="ts">
const isMenuOpen = ref(false)

// Close mobile menu when route changes
const route = useRoute()
watch(() => route.path, () => {
  isMenuOpen.value = false
})
</script>