<template>
  <div class="mobile-app-promotion">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              Automatisez vos tâches
              <span class="highlight">partout avec vous</span>
            </h1>
            <p class="hero-description">
              Découvrez AREA Mobile - L'application qui vous permet de créer et gérer vos automatisations
              directement depuis votre smartphone Android. Simple, puissant et toujours dans votre poche.
            </p>
            <div class="hero-buttons">
              <UButton
                size="xl"
                color="primary"
                icon="i-simple-icons-googleplay"
                class="download-btn"
                @click="handleDownload"
              >
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
                <div class="screen-placeholder">
                  <div class="placeholder-content">
                    <UIcon name="i-heroicons-device-phone-mobile" class="phone-icon" />
                    <p>Screenshot principal<br/>de l'application</p>
                  </div>
                </div>
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

          <div class="feature-card">
            <div class="feature-icon">
              <UIcon name="i-heroicons-bell" />
            </div>
            <h3>Notifications intelligentes</h3>
            <p>Recevez des notifications pertinentes sur l'état de vos automatisations</p>
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
              <div class="screenshot-placeholder">
                <UIcon name="i-heroicons-home" class="screenshot-icon" />
                <p>Écran d'accueil</p>
              </div>
            </div>
            <h4>Tableau de bord</h4>
            <p>Vue d'ensemble de toutes vos automatisations</p>
          </div>

          <div class="screenshot-item">
            <div class="screenshot-mockup">
              <div class="screenshot-placeholder">
                <UIcon name="i-heroicons-plus" class="screenshot-icon" />
                <p>Création d'automatisation</p>
              </div>
            </div>
            <h4>Créateur visuel</h4>
            <p>Interface glisser-déposer intuitive</p>
          </div>

          <div class="screenshot-item">
            <div class="screenshot-mockup">
              <div class="screenshot-placeholder">
                <UIcon name="i-heroicons-cog-8-tooth" class="screenshot-icon" />
                <p>Configuration des services</p>
              </div>
            </div>
            <h4>Paramètres</h4>
            <p>Configurez facilement vos services préférés</p>
          </div>

          <div class="screenshot-item">
            <div class="screenshot-mockup">
              <div class="screenshot-placeholder">
                <UIcon name="i-heroicons-chart-bar" class="screenshot-icon" />
                <p>Statistiques d'usage</p>
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
              color="primary"
              icon="i-simple-icons-googleplay"
              class="cta-download-btn"
              @click="handleDownload"
            >
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

        <div class="cta-phones">
          <div class="phone-mockup-small">
            <div class="phone-screen-small">
              <div class="screen-placeholder-small">
                <UIcon name="i-heroicons-rocket-launch" class="placeholder-icon" />
                <p>App en action</p>
              </div>
            </div>
          </div>
          <div class="phone-mockup-small">
            <div class="phone-screen-small">
              <div class="screen-placeholder-small">
                <UIcon name="i-heroicons-sparkles" class="placeholder-icon" />
                <p>Interface moderne</p>
              </div>
            </div>
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

          <div class="faq-item">
            <h3>Puis-je utiliser l'app hors ligne ?</h3>
            <p>Vous pouvez consulter vos automatisations hors ligne, mais une connexion est requise pour les exécuter.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const handleDownload = () => {
  // Faux lien vers Google Play Store
  const fakePlayStoreUrl = 'https://play.google.com/store/apps/details?id=com.area.mobile.fake'

  // Simulation d'un téléchargement
  const toast = useToast()
  toast.add({
    title: 'Redirection vers Google Play',
    description: 'Vous allez être redirigé vers le Play Store...',
    color: 'green',
    timeout: 3000,
    icon: 'i-simple-icons-googleplay'
  })

  // Simuler une redirection (ne fonctionne pas vraiment)
  setTimeout(() => {
    console.log('Redirection simulée vers:', fakePlayStoreUrl)
    // window.open(fakePlayStoreUrl, '_blank')
  }, 1000)
}

useHead({
  title: 'AREA Mobile - Automatisez vos tâches partout avec vous',
  meta: [
    {
      name: 'description',
      content: 'Découvrez AREA Mobile pour Android. Créez et gérez vos automatisations directement depuis votre smartphone. Téléchargement gratuit sur Google Play.'
    },
    { property: 'og:title', content: 'AREA Mobile - L\'automation dans votre poche' },
    { property: 'og:description', content: 'Application mobile Android pour créer et gérer vos automatisations AREA partout avec vous.' },
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
}

.download-btn, .demo-btn {
  padding: 1rem 2rem !important;
  font-size: 1.1rem !important;
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
  color: var(--color-primary);
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
  padding: 20px;
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
  padding: 15px;
  margin: 0 auto 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.screenshot-placeholder {
  width: 100%;
  height: 100%;
  background: var(--bg-card);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--border-color);
}

.screenshot-icon {
  width: 3rem;
  height: 3rem;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.screenshot-placeholder p {
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-align: center;
}

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

.cta-download-btn {
  padding: 1.25rem 3rem !important;
  font-size: 1.25rem !important;
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

.cta-phones {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.phone-mockup-small {
  width: 150px;
  height: 300px;
  background: #1a1a1a;
  border-radius: 20px;
  padding: 10px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.phone-screen-small {
  width: 100%;
  height: 100%;
  background: var(--bg-card);
  border-radius: 15px;
  overflow: hidden;
}

.screen-placeholder-small {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--border-color);
}

.placeholder-icon {
  width: 2rem;
  height: 2rem;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.screen-placeholder-small p {
  color: var(--text-secondary);
  font-size: 0.75rem;
  text-align: center;
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

  .cta-phones {
    flex-direction: column;
    align-items: center;
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