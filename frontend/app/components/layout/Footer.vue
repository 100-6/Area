<template>
  <footer class="border-t border-gray-100">
    <!-- Main Footer -->
    <div style="background-color: var(--bg-secondary);" class="py-12 lg:py-16">
      <UContainer>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <!-- Brand Section -->
          <div class="lg:col-span-1">
            <div class="mb-6">
              <img
                src="/AutoLogo.png"
                alt="Auto Logo"
                class="h-16 w-auto object-contain"
              />
            </div>
            <p class="text-gray-600 mb-6 leading-relaxed">
              Connectez et automatisez vos services préférés en quelques clics.
              Simplifiez votre quotidien avec nos solutions d'automatisation.
            </p>
            <div class="flex space-x-4">
              <UButton
                variant="ghost"
                color="gray"
                size="sm"
                square
                class="hover:bg-brand-primary/10"
              >
                <UIcon name="i-heroicons-envelope" class="w-4 h-4" />
              </UButton>
              <UButton
                variant="ghost"
                color="gray"
                size="sm"
                square
                class="hover:bg-brand-primary/10"
              >
                <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-4 h-4" />
              </UButton>
              <UButton
                variant="ghost"
                color="gray"
                size="sm"
                square
                class="hover:bg-brand-primary/10"
              >
                <UIcon name="i-heroicons-code-bracket" class="w-4 h-4" />
              </UButton>
            </div>
          </div>

          <!-- Product -->
          <div>
            <h3 class="font-semibold text-gray-900 mb-4">Produit</h3>
            <ul class="space-y-3">
              <li>
                <NuxtLink to="/features" class="text-gray-600 hover:text-brand-tertiary transition-colors duration-200">
                  Fonctionnalités
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/pricing" class="text-gray-600 hover:text-brand-tertiary transition-colors duration-200">
                  Tarifs
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/integrations" class="text-gray-600 hover:text-brand-tertiary transition-colors duration-200">
                  Intégrations
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/changelog" class="text-gray-600 hover:text-brand-tertiary transition-colors duration-200">
                  Nouveautés
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Support -->
          <div>
            <h3 class="font-semibold text-gray-900 mb-4">Support</h3>
            <ul class="space-y-3">
              <li>
                <NuxtLink to="/help" class="text-gray-600 hover:text-brand-tertiary transition-colors duration-200">
                  Centre d'aide
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/contact" class="text-gray-600 hover:text-brand-tertiary transition-colors duration-200">
                  Contact
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/status" class="text-gray-600 hover:text-brand-tertiary transition-colors duration-200">
                  Statut
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Company -->
          <div>
            <h3 class="font-semibold text-gray-900 mb-4">Entreprise</h3>
            <ul class="space-y-3">
              <li>
                <NuxtLink to="/about" class="text-gray-600 hover:text-brand-tertiary transition-colors duration-200">
                  À propos
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/blog" class="text-gray-600 hover:text-brand-tertiary transition-colors duration-200">
                  Blog
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/careers" class="text-gray-600 hover:text-brand-tertiary transition-colors duration-200">
                  Carrières
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/press" class="text-gray-600 hover:text-brand-tertiary transition-colors duration-200">
                  Presse
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </UContainer>
    </div>

    <!-- Bottom Footer -->
    <div class="py-6 border-t border-gray-200">
      <UContainer>
        <div class="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <p class="text-sm text-gray-500">
            © {{ currentYear }} Auto. Tous droits réservés.
          </p>

          <div class="flex items-center space-x-4">
            <UBadge
              style="background-color: var(--color-success); color: var(--text-white);"
              variant="solid"
              size="lg"
            >
              <UIcon name="i-heroicons-check-circle" class="w-3 h-3 mr-1"/>
              Tous systèmes opérationnels
            </UBadge>
          </div>
        </div>
      </UContainer>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>
