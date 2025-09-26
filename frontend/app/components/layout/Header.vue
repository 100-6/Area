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
          <!-- Utilisateur non connecté -->
          <template v-if="!isLoggedIn">
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
          </template>

          <!-- Utilisateur connecté -->
          <template v-else>
            <NuxtLink to="/dashboard">
              <UButton variant="ghost" color="gray">
                <UIcon name="i-heroicons-squares-2x2" class="w-4 h-4 mr-2" />
                Dashboard
              </UButton>
            </NuxtLink>

            <!-- Menu utilisateur -->
            <div class="relative">
              <UButton variant="ghost" color="gray" class="flex items-center space-x-2" @click="isProfileMenuOpen = !isProfileMenuOpen">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                     style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: var(--color-tertiary);">
                  {{ getUserInitials() }}
                </div>
                <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
              </UButton>

              <!-- Menu dropdown manuel -->
              <div v-if="isProfileMenuOpen" class="absolute right-0 top-full mt-2 w-48 rounded-lg border shadow-lg z-50" style="background: var(--bg-card); border-color: var(--border-color);">
                <div class="py-2">
                  <button @click="navigateTo('/me'); isProfileMenuOpen = false" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center" style="color: var(--text-primary);">
                    <UIcon name="i-heroicons-user-circle" class="w-4 h-4 mr-2" />
                    Mon Profil
                  </button>
                  <button @click="navigateTo('/dashboard'); isProfileMenuOpen = false" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center" style="color: var(--text-primary);">
                    <UIcon name="i-heroicons-squares-2x2" class="w-4 h-4 mr-2" />
                    Dashboard
                  </button>
                  <hr class="my-1" style="border-color: var(--border-color);">
                  <button @click="handleLogout; isProfileMenuOpen = false" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center text-red-600">
                    <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4 mr-2" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          </template>
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
            <!-- Mobile - Utilisateur non connecté -->
            <template v-if="!isLoggedIn">
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
            </template>

            <!-- Mobile - Utilisateur connecté -->
            <template v-else>
              <NuxtLink to="/dashboard" @click="isMenuOpen = false">
                <UButton variant="ghost" color="gray" block>
                  <UIcon name="i-heroicons-squares-2x2" class="w-4 h-4 mr-2" />
                  Dashboard
                </UButton>
              </NuxtLink>
              <NuxtLink to="/me" @click="isMenuOpen = false">
                <UButton variant="ghost" color="gray" block>
                  <UIcon name="i-heroicons-user-circle" class="w-4 h-4 mr-2" />
                  Mon Profil
                </UButton>
              </NuxtLink>
              <UButton variant="ghost" color="gray" block @click="handleLogout">
                <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4 mr-2" />
                Se déconnecter
              </UButton>
            </template>
          </div>
        </nav>
      </div>
    </UContainer>
  </header>
</template>

<script setup lang="ts">
const isMenuOpen = ref(false)
const isProfileMenuOpen = ref(false)
const { user, isLoggedIn, logout } = useAuth()

// Menu utilisateur dropdown
const userMenuItems = [
  [{
    label: 'Mon Profil',
    icon: 'i-heroicons-user-circle',
    click: () => navigateTo('/me')
  }],
  [{
    label: 'Dashboard',
    icon: 'i-heroicons-squares-2x2',
    click: () => navigateTo('/dashboard')
  }],
  [{
    label: 'Se déconnecter',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    click: () => handleLogout()
  }]
]

const getUserInitials = () => {
  if (!user.value) return '??'
  const first = user.value.firstName?.charAt(0)?.toUpperCase() || ''
  const last = user.value.lastName?.charAt(0)?.toUpperCase() || ''
  return first + last || '??'
}

const handleLogout = async () => {
  await logout()
  isMenuOpen.value = false
}

const route = useRoute()
watch(() => route.path, () => {
  isMenuOpen.value = false
})
</script>