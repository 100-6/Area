<template>
  <div style="font-family: var(--font-family-sans); background: var(--bg-primary); min-height: 100vh;">
    <!-- Hero Section -->
    <section class="py-16 lg:py-24" style="background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-primary) 100%);">
      <UContainer>
        <div class="text-center max-w-3xl mx-auto">
          <h1 class="text-4xl lg:text-5xl font-bold mb-6" style="color: var(--text-primary);">
            Tarifs simples et transparents
          </h1>
          <p class="text-xl mb-8" style="color: var(--text-secondary);">
            Choisissez le plan qui correspond à vos besoins. Commencez gratuitement, pas de carte de crédit requise.
          </p>
        </div>
      </UContainer>
    </section>

    <!-- Pricing Cards -->
    <section class="py-12 lg:py-16">
      <UContainer>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <!-- Free Plan -->
          <div class="pricing-card" style="background: var(--bg-card); border: 2px solid var(--border-color);">
            <div class="p-8">
              <div class="mb-6">
                <h3 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Gratuit</h3>
                <p class="text-sm" style="color: var(--text-secondary);">Pour découvrir Auto</p>
              </div>

              <div class="mb-8">
                <div class="flex items-baseline">
                  <span class="text-5xl font-bold" style="color: var(--text-primary);">0€</span>
                  <span class="text-lg ml-2" style="color: var(--text-secondary);">/mois</span>
                </div>
              </div>

              <ul class="space-y-4 mb-8">
                <li class="flex items-start">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style="color: var(--color-secondary);" />
                  <span style="color: var(--text-secondary);">5 workflows actifs</span>
                </li>
                <li class="flex items-start">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style="color: var(--color-secondary);" />
                  <span style="color: var(--text-secondary);">100 exécutions/mois</span>
                </li>
                <li class="flex items-start">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style="color: var(--color-secondary);" />
                  <span style="color: var(--text-secondary);">Intégrations basiques</span>
                </li>
                <li class="flex items-start">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style="color: var(--color-secondary);" />
                  <span style="color: var(--text-secondary);">Support communautaire</span>
                </li>
              </ul>

              <UButton
                size="lg"
                block
                variant="outline"
                style="border-color: var(--border-color); color: var(--text-primary);"
                @click="navigateTo('/register')"
              >
                Commencer gratuitement
              </UButton>
            </div>
          </div>

          <!-- Pro Plan (Featured) -->
          <div class="pricing-card pricing-card-featured" style="background: linear-gradient(135deg, var(--color-secondary), var(--color-tertiary)); border: 2px solid var(--color-secondary); transform: scale(1.05); box-shadow: 0 20px 40px rgba(72, 199, 116, 0.2);">
            <div class="absolute top-0 right-0 mt-4 mr-4">
              <span class="px-3 py-1 rounded-full text-xs font-semibold" style="background: var(--color-primary); color: var(--color-tertiary);">
                Populaire
              </span>
            </div>

            <div class="p-8">
              <div class="mb-6">
                <h3 class="text-2xl font-bold mb-2 text-white">Pro</h3>
                <p class="text-sm text-white/80">Pour les professionnels</p>
              </div>

              <div class="mb-8">
                <div class="flex items-baseline">
                  <span class="text-5xl font-bold text-white">19€</span>
                  <span class="text-lg ml-2 text-white/80">/mois</span>
                </div>
              </div>

              <ul class="space-y-4 mb-8">
                <li class="flex items-start">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-white" />
                  <span class="text-white">50 workflows actifs</span>
                </li>
                <li class="flex items-start">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-white" />
                  <span class="text-white">10 000 exécutions/mois</span>
                </li>
                <li class="flex items-start">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-white" />
                  <span class="text-white">Toutes les intégrations</span>
                </li>
                <li class="flex items-start">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-white" />
                  <span class="text-white">Support prioritaire</span>
                </li>
                <li class="flex items-start">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-white" />
                  <span class="text-white">Statistiques avancées</span>
                </li>
                <li class="flex items-start">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-white" />
                  <span class="text-white">Webhooks personnalisés</span>
                </li>
              </ul>

              <UButton
                size="lg"
                block
                style="background: white; color: var(--color-secondary);"
                @click="navigateTo('/register')"
              >
                Commencer l'essai gratuit
              </UButton>
            </div>
          </div>

          <!-- Enterprise Plan -->
          <div class="pricing-card" style="background: var(--bg-card); border: 2px solid var(--border-color);">
            <div class="p-8">
              <div class="mb-6">
                <h3 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Enterprise</h3>
                <p class="text-sm" style="color: var(--text-secondary);">Pour les équipes</p>
              </div>

              <div class="mb-8">
                <div class="flex items-baseline">
                  <span class="text-5xl font-bold" style="color: var(--text-primary);">Sur mesure</span>
                </div>
              </div>

              <ul class="space-y-4 mb-8">
                <li class="flex items-start">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style="color: var(--color-secondary);" />
                  <span style="color: var(--text-secondary);">Workflows illimités</span>
                </li>
                <li class="flex items-start">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style="color: var(--color-secondary);" />
                  <span style="color: var(--text-secondary);">Exécutions illimitées</span>
                </li>
                <li class="flex items-start">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style="color: var(--color-secondary);" />
                  <span style="color: var(--text-secondary);">Intégrations sur mesure</span>
                </li>
                <li class="flex items-start">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style="color: var(--color-secondary);" />
                  <span style="color: var(--text-secondary);">Support dédié 24/7</span>
                </li>
                <li class="flex items-start">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style="color: var(--color-secondary);" />
                  <span style="color: var(--text-secondary);">SLA garanti</span>
                </li>
                <li class="flex items-start">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style="color: var(--color-secondary);" />
                  <span style="color: var(--text-secondary);">Hébergement privé</span>
                </li>
              </ul>

              <UButton
                size="lg"
                block
                variant="outline"
                style="border-color: var(--color-secondary); color: var(--color-secondary);"
                @click="navigateTo('/contact')"
              >
                Nous contacter
              </UButton>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- FAQ Section -->
    <section class="py-16 lg:py-24" style="background: var(--bg-card);">
      <UContainer>
        <div class="max-w-3xl mx-auto">
          <h2 class="text-3xl lg:text-4xl font-bold text-center mb-12" style="color: var(--text-primary);">
            Questions fréquentes
          </h2>

          <div class="space-y-6">
            <div class="faq-item p-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-color);">
              <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">
                Puis-je changer de plan à tout moment ?
              </h3>
              <p style="color: var(--text-secondary);">
                Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements sont effectifs immédiatement.
              </p>
            </div>

            <div class="faq-item p-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-color);">
              <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">
                Que se passe-t-il si je dépasse mon quota d'exécutions ?
              </h3>
              <p style="color: var(--text-secondary);">
                Vos workflows seront automatiquement mis en pause. Vous pouvez upgrader votre plan ou attendre le prochain mois.
              </p>
            </div>

            <div class="faq-item p-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-color);">
              <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">
                Y a-t-il une période d'essai gratuite ?
              </h3>
              <p style="color: var(--text-secondary);">
                Oui, tous les plans payants incluent une période d'essai gratuite de 14 jours, sans carte de crédit requise.
              </p>
            </div>

            <div class="faq-item p-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-color);">
              <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">
                Proposez-vous des réductions pour les associations ?
              </h3>
              <p style="color: var(--text-secondary);">
                Oui, nous offrons des réductions spéciales pour les associations et organisations à but non lucratif. Contactez-nous pour plus d'informations.
              </p>
            </div>
          </div>
        </div>
      </UContainer>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Tarifs - Auto',
  meta: [
    { name: 'description', content: 'Découvrez nos plans tarifaires simples et transparents. Commencez gratuitement.' }
  ]
})
</script>

<style scoped>
.pricing-card {
  border-radius: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.pricing-card-featured {
  position: relative;
  z-index: 10;
}

.faq-item {
  transition: all 0.3s ease;
}

.faq-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .pricing-card-featured {
    transform: scale(1) !important;
  }
}
</style>
