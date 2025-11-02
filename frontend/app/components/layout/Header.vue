<template>
  <header class="sticky top-0 z-50 backdrop-blur-md" style="background: var(--bg-primary)/80;">
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

        <!-- Desktop Navigation - Absolument centré -->
        <nav class="hidden md:flex items-center space-x-6 absolute left-1/2 transform -translate-x-1/2">
          <UiNavButton
            label="Accueil"
            icon="i-heroicons-home"
            to="/"
            :is-active="route.path === '/'"
          />
          <UiNavButton
            label="Services"
            icon="i-heroicons-cog-6-tooth"
            to="/services"
            :is-active="route.path === '/services'"
          />
          <UiNavButton
            label="Téléchargement"
            icon="i-heroicons-arrow-down-tray"
            to="/download"
            :is-active="route.path === '/download'"
          />
        </nav>

        <!-- Desktop CTA -->
        <div class="hidden md:flex items-center space-x-6">
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
            <UiNavButton
              label="Dashboard"
              icon="i-heroicons-squares-2x2"
              to="/dashboard"
              :is-active="isDashboardActive"
            />

            <!-- Menu utilisateur -->
            <div class="relative">
              <UiNavButton
                label="Profil"
                :is-active="isProfileActive"
                @click="isProfileMenuOpen = !isProfileMenuOpen"
              >
                <template #icon>
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-1"
                       style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: var(--color-tertiary);">
                    {{ getUserInitials() }}
                  </div>
                </template>
                <template #suffix>
                  <UIcon name="i-heroicons-chevron-down" class="w-3 h-3 ml-1" />
                </template>
              </UiNavButton>

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
                  <button @click="() => { handleLogout(); isProfileMenuOpen = false }" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center text-red-600">
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
      <div v-show="isMenuOpen" class="md:hidden py-4 border-t" style="border-color: var(--border-color);">
        <nav class="flex flex-col space-y-2">
          <NuxtLink
            to="/"
            class="nav-item-mobile group flex items-center px-3 py-3 rounded-lg transition-all duration-200"
            :class="{ 'nav-active-mobile': $route.path === '/' }"
            @click="isMenuOpen = false"
          >
            <UIcon name="i-heroicons-home" class="w-5 h-5 mr-3" />
            <span>Accueil</span>
          </NuxtLink>
          <NuxtLink
            to="/services"
            class="nav-item-mobile group flex items-center px-3 py-3 rounded-lg transition-all duration-200"
            :class="{ 'nav-active-mobile': $route.path === '/services' }"
            @click="isMenuOpen = false"
          >
            <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 mr-3" />
            <span>Services</span>
          </NuxtLink>
          <NuxtLink
            to="/download"
            class="nav-item-mobile group flex items-center px-3 py-3 rounded-lg transition-all duration-200"
            :class="{ 'nav-active-mobile': $route.path === '/download' }"
            @click="isMenuOpen = false"
          >
            <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5 mr-3" />
            <span>Téléchargement</span>
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
              <UButton variant="ghost" color="gray" block @click="() => { handleLogout(); isMenuOpen = false }">
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
  isProfileMenuOpen.value = false
}

const route = useRoute()

// Computed properties for active states to ensure reactivity
const isDashboardActive = computed(() => route.path === '/dashboard')
const isProfileActive = computed(() => route.path === '/me')

watch(() => route.path, () => {
  isMenuOpen.value = false
})
</script>

<style scoped>
/* Mobile navigation styles */
.nav-item-mobile {
  color: var(--text-primary);
  border-radius: var(--border-radius-md);
  transition: var(--transition-normal);
}

.nav-item-mobile:hover {
  background: var(--color-primary);
  color: var(--color-tertiary);
}

.nav-item-mobile.nav-active-mobile {
  background: var(--color-tertiary);
  color: var(--text-white);
  font-weight: var(--font-weight-medium);
}
</style>
