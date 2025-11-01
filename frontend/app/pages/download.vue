<template>
  <div class="mobile-app-promotion">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              Automatisez vos tâches
              <span class="highlight-gradient">partout avec vous</span>
            </h1>
            <p class="hero-description">
              Découvrez AREA Mobile - L'application qui vous permet de créer et gérer vos automatisations
              directement depuis votre smartphone Android. Simple, puissant et toujours dans votre poche.
            </p>
            <div class="hero-buttons">
              <UButton
                size="xl"
                class="download-btn tertiary-btn"
                style="background-color: #166534 !important; background: #166534 !important; color: #FFFFFF !important; border-color: #166534 !important;"
                @click="handleDownload"
              >
                <template #leading>
                  <GooglePlayIcon :size="20" />
                </template>
                Télécharger sur Google Play
              </UButton>
              <UButton
                size="xl"
                variant="outline"
                icon="i-heroicons-play"
                class="demo-btn"
              >
                Voir la démo
              </UButton>
            </div>
            <div class="hero-stats">
              <div class="stat">
                <span class="stat-number">10K+</span>
                <span class="stat-label">Téléchargements</span>
              </div>
              <div class="stat">
                <span class="stat-number">4.8</span>
                <span class="stat-label">Note sur Play Store</span>
              </div>
              <div class="stat">
                <span class="stat-number">500+</span>
                <span class="stat-label">Services connectés</span>
              </div>
            </div>
          </div>
          <div class="hero-phone">
            <div class="phone-mockup">
              <div class="phone-screen">
                <ScreenshotPlaceholder
                  image-src="/screenshots/mobile/home-screen.png"
                  alt="AREA Mobile - Application principale"
                  placeholder="Screenshot principal de l'application"
                  icon="i-heroicons-device-phone-mobile"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Fonctionnalités principales</h2>
          <p class="section-subtitle">
            Tout ce dont vous avez besoin pour automatiser votre quotidien
          </p>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <UIcon name="i-heroicons-bolt" />
            </div>
            <h3>Création rapide</h3>
            <p>Créez des automatisations en quelques clics avec notre interface intuitive</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <UIcon name="i-heroicons-wifi" />
            </div>
            <h3>Synchronisation temps réel</h3>
            <p>Vos automatisations se synchronisent instantanément entre tous vos appareils</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <UIcon name="i-heroicons-shield-check" />
            </div>
            <h3>Sécurisé & Privé</h3>
            <p>Vos données sont chiffrées et protégées selon les standards les plus élevés</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Screenshots Section -->
    <section class="screenshots-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Découvrez l'interface</h2>
          <p class="section-subtitle">
            Une expérience utilisateur pensée pour la mobilité
          </p>
        </div>

        <div class="screenshots-carousel">
          <div class="screenshot-item">
            <div class="screenshot-mockup">
              <div class="phone-inner-frame">
                <ScreenshotPlaceholder
                  image-src="/screenshots/mobile/home-screen.png"
                  alt="Écran d'accueil AREA Mobile"
                  placeholder="Écran d'accueil"
                  icon="i-heroicons-home"
                />
              </div>
            </div>
            <h4>Tableau de bord</h4>
            <p>Vue d'ensemble de toutes vos automatisations</p>
          </div>

          <div class="screenshot-item">
            <div class="screenshot-mockup">
              <div class="phone-inner-frame">
                <ScreenshotPlaceholder
                  image-src="/screenshots/mobile/workflow-creator.png"
                  alt="Créateur de workflow AREA Mobile"
                  placeholder="Création d'automatisation"
                  icon="i-heroicons-plus"
                />
              </div>
            </div>
            <h4>Créateur visuel</h4>
            <p>Interface glisser-déposer intuitive</p>
          </div>

          <div class="screenshot-item">
            <div class="screenshot-mockup">
              <div class="phone-inner-frame">
                <ScreenshotPlaceholder
                  image-src="/screenshots/mobile/service-config.png"
                  alt="Configuration des services AREA Mobile"
                  placeholder="Configuration des services"
                  icon="i-heroicons-cog-8-tooth"
                />
              </div>
            </div>
            <h4>Paramètres</h4>
            <p>Configurez facilement vos services préférés</p>
          </div>

          <div class="screenshot-item">
            <div class="screenshot-mockup">
              <div class="phone-inner-frame">
                <ScreenshotPlaceholder
                  image-src="/screenshots/mobile/analytics.png"
                  alt="Statistiques AREA Mobile"
                  placeholder="Statistiques d'usage"
                  icon="i-heroicons-chart-bar"
                />
              </div>
            </div>
            <h4>Analytics</h4>
            <p>Suivez les performances de vos automatisations</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Download CTA Section -->
    <section class="download-cta-section">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">Prêt à automatiser votre quotidien ?</h2>
          <p class="cta-description">
            Rejoignez des milliers d'utilisateurs qui ont déjà simplifié leur vie avec AREA Mobile
          </p>
          <div class="cta-buttons">
            <UButton
              size="xl"
              class="cta-download-btn tertiary-btn"
              style="background-color: #166534 !important; background: #166534 !important; color: #FFFFFF !important; border-color: #166534 !important;"
              @click="handleDownload"
            >
              <template #leading>
                <GooglePlayIcon :size="20" />
              </template>
              Télécharger gratuitement
            </UButton>
          </div>
          <div class="download-info">
            <p class="download-text">
              <UIcon name="i-heroicons-check-circle" class="check-icon" />
              Gratuit • Compatible Android 7.0+ • 25 MB
            </p>
          </div>
        </div>

      </div>
    </section>

    <!-- FAQ Section -->
    <section class="faq-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Questions fréquentes</h2>
        </div>

        <div class="faq-grid">
          <div class="faq-item">
            <h3>L'application est-elle gratuite ?</h3>
            <p>Oui, AREA Mobile est entièrement gratuite avec toutes les fonctionnalités de base incluses.</p>
          </div>

          <div class="faq-item">
            <h3>Quels services sont supportés ?</h3>
            <p>Plus de 500 services sont supportés : Gmail, Slack, Discord, Twitter, et bien d'autres.</p>
          </div>

          <div class="faq-item">
            <h3>Mes données sont-elles sécurisées ?</h3>
            <p>Absolument. Nous utilisons un chiffrement de bout en bout et ne stockons jamais vos mots de passe.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import ScreenshotPlaceholder from '~/components/ui/ScreenshotPlaceholder.vue'
import GooglePlayIcon from '~/components/ui/GooglePlayIcon.vue'

definePageMeta({
  layout: 'default'
})

const config = useRuntimeConfig()
const backendUrl = config.public.backendUrl || 'http://localhost:8080'

const handleDownload = async () => {
  const toast = useToast()

  try {
    toast.add({
      title: 'Téléchargement en cours',
      description: 'Préparation du téléchargement de l\'APK...',
      color: 'blue',
      timeout: 2000,
      icon: 'i-heroicons-arrow-down-tray'
    })

    // Appeler la route backend pour télécharger l'APK
    const response = await fetch(`${backendUrl}/api/download/apk`)

    if (!response.ok) {
      throw new Error('Échec du téléchargement')
    }

    // Créer un blob à partir de la réponse
    const blob = await response.blob()

    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'area-mobile.apk'
    document.body.appendChild(link)
    link.click()

    // Nettoyer
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.add({
      title: 'Téléchargement réussi',
      description: 'L\'APK a été téléchargé avec succès',
      color: 'green',
      timeout: 3000,
      icon: 'i-heroicons-check-circle'
    })
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error)
    toast.add({
      title: 'Erreur',
      description: 'Impossible de télécharger l\'APK. Veuillez réessayer.',
      color: 'red',
      timeout: 3000,
      icon: 'i-heroicons-exclamation-circle'
    })
  }
}

useHead({
  title: 'Télécharger AREA Mobile - Application Android Gratuite',
  meta: [
    {
      name: 'description',
      content: 'Téléchargez gratuitement AREA Mobile pour Android. Automatisez vos tâches directement depuis votre smartphone. Compatible Android 7.0+.'
    },
    { property: 'og:title', content: 'Télécharger AREA Mobile - Automatisation Mobile' },
    { property: 'og:description', content: 'Application mobile gratuite pour créer et gérer vos automatisations AREA. Téléchargement APK disponible.' },
    { property: 'og:type', content: 'website' }
  ]
})
</script>

<style scoped>
.mobile-app-promotion {
  min-height: 100vh;
  background: var(--bg-primary);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Hero Section */
.hero-section {
  padding: 4rem 0;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-card) 100%);
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  min-height: 600px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.highlight {
  color: var(--color-primary);
}

.highlight-gradient {
  background: linear-gradient(90deg, #16a34a 0%, #4ade80 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  display: inline-block;
}

.hero-description {
  font-size: 1.25rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
  min-height: 72px;
  align-items: center;
}

.download-btn, .demo-btn {
  padding: 1rem 2rem !important;
  font-size: 1.1rem !important;
  min-width: 200px !important;
  min-height: 56px !important;
  transition: none !important;
  white-space: nowrap !important;
}

.tertiary-btn {
  background-color: var(--color-tertiary) !important;
  background: var(--color-tertiary) !important;
  color: var(--text-white) !important;
  border: none !important;
  border-color: var(--color-tertiary) !important;
}

.tertiary-btn:hover {
  background-color: var(--color-tertiary-hover) !important;
  background: var(--color-tertiary-hover) !important;
}

/* Force les styles Nuxt UI */

/* Styles spécifiques pour UButton */
.tertiary-btn :deep(*) {
  background-color: #166534 !important;
  background: #166534 !important;
  color: #FFFFFF !important;
  border-color: #166534 !important;
}

.tertiary-btn:hover :deep(*) {
  background-color: #115E2D !important;
  background: #115E2D !important;
}

.hero-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #059669;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Phone Mockup */
.hero-phone {
  display: flex;
  justify-content: center;
}

.phone-mockup {
  width: 300px;
  height: 600px;
  background: #1a1a1a;
  border-radius: 30px;
  padding: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  position: relative;
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: var(--bg-card);
  border-radius: 20px;
  overflow: hidden;
}

.screen-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary)20, var(--color-secondary)20);
  border: 2px dashed var(--color-primary);
}

.placeholder-content {
  text-align: center;
  color: var(--text-secondary);
}

.phone-icon {
  width: 4rem;
  height: 4rem;
  margin-bottom: 1rem;
  color: var(--color-primary);
}

/* Features Section */
.features-section {
  padding: 5rem 0;
  background: var(--bg-card);
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: 1.25rem;
  color: var(--text-secondary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
  border: 1px solid var(--border-color);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  width: 4rem;
  height: 4rem;
  background: var(--color-primary)20;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.feature-icon svg {
  width: 2rem;
  height: 2rem;
  color: var(--color-primary);
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.feature-card p {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Screenshots Section */
.screenshots-section {
  padding: 5rem 0;
  background: var(--bg-primary);
}

.screenshots-carousel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.screenshot-item {
  text-align: center;
}

.screenshot-mockup {
  width: 200px;
  height: 400px;
  background: #1a1a1a;
  border-radius: 20px;
  padding: 10px;
  margin: 0 auto 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.phone-inner-frame {
  width: 100%;
  height: 100%;
  background: #f8f9fa;
  border-radius: 15px;
  padding: 5px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

/* Styles pour screenshot-placeholder supprimés car gérés par le composant ScreenshotPlaceholder */

.screenshot-item h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.screenshot-item p {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Download CTA Section */
.download-cta-section {
  padding: 5rem 0;
  background: linear-gradient(135deg, var(--color-primary)10, var(--color-secondary)10);
}

.cta-content {
  text-align: center;
  margin-bottom: 3rem;
}

.cta-title {
  font-size: 3rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.cta-description {
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  min-height: 80px;
  align-items: center;
  justify-content: center;
}

.cta-download-btn {
  padding: 1.25rem 3rem !important;
  font-size: 1.25rem !important;
  min-width: 280px !important;
  min-height: 64px !important;
  transition: none !important;
  white-space: nowrap !important;
}

.cta-download-btn.tertiary-btn {
  background-color: var(--color-tertiary) !important;
  background: var(--color-tertiary) !important;
  color: var(--text-white) !important;
  border: none !important;
  border-color: var(--color-tertiary) !important;
}

.cta-download-btn.tertiary-btn:hover {
  background-color: var(--color-tertiary-hover) !important;
  background: var(--color-tertiary-hover) !important;
}

/* Force les styles pour le CTA aussi */
.cta-download-btn.tertiary-btn >>> * {
  background-color: #166534 !important;
  background: #166534 !important;
  color: #FFFFFF !important;
  border-color: #166534 !important;
}

.cta-download-btn.tertiary-btn:hover >>> * {
  background-color: #115E2D !important;
  background: #115E2D !important;
}

.download-info {
  margin-top: 1rem;
}

.download-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.check-icon {
  color: var(--color-primary);
}

/* FAQ Section */
.faq-section {
  padding: 5rem 0;
  background: var(--bg-card);
}

.faq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.faq-item {
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.faq-item h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.faq-item p {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }

  .hero-stats {
    justify-content: center;
  }

  .phone-mockup {
    width: 250px;
    height: 500px;
  }

  .cta-title {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .phone-mockup {
    width: 200px;
    height: 400px;
  }
}
</style>