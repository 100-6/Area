# Mirror Area - Mobile Application

**Version:** 1.0.0
**Flutter SDK:** ^3.7.0
**Platforms:** Android, iOS

---

## Vue d'ensemble

Area est une application mobile Flutter permettant de créer et gérer des workflows d'automatisation (Areas). L'application connecte différents services via OAuth et permet de définir des déclencheurs (triggers) et des actions séquentielles.

### Fonctionnalités principales

- ✅ Authentification utilisateur (email/password + OAuth)
- ✅ Connexion à une grande base de services (Discord, GitHub, Spotify, etc.)
- ✅ Création et édition de workflows (Areas)
- ✅ Configuration dynamique des triggers et actions
- ✅ Gestion des variables entre les nœuds
- ✅ Interface utilisateur intuitive et moderne

---

## Démarrage rapide

### Prérequis

- Flutter SDK `^3.7.0`
- Dart `^2.19.0`
- Android Studio / Xcode
- Backend API en cours d'exécution

### Installation

```bash
# Cloner le repository
git clone https://github.com/your-org/mirror-area.git
cd mirror-area/mobile

# Installer les dépendances
flutter pub get

# Lancer l'application
flutter run
```

### Configuration

**Configurer l'URL de l'API :**

Modifier [lib/core/constants/api_constants.dart](lib/core/constants/api_constants.dart) :

```dart
static const String baseUrl = 'http://localhost:8080';  // Ou votre URL API
```

**Démarrer le backend (avec Docker) :**

```bash
cd ..
docker-compose up -d
```

---

## 📚 Documentation

La documentation complète est organisée par thème dans le dossier [documentation-flutter/](documentation-flutter/).

### Guide de démarrage

- **[Quick Start Guide](documentation-flutter/QUICK_START_AREA_MOBILE.md)** ⭐
  *Guide de démarrage rapide pour les nouveaux développeurs*
  - Installation et configuration
  - Première exécution
  - Tâches courantes
  - Dépannage de base

### Documentation technique

- **[Technical Documentation](documentation-flutter/TECHNICAL_DOCUMENTATION.md)** 📖
  *Documentation technique complète de l'architecture*
  - Architecture et patterns
  - Structure du projet
  - Gestion d'état avec Provider
  - Communication API
  - Gestion des erreurs

### Guides fonctionnels

- **[Area Integration](documentation-flutter/AREA_INTEGRATION.md)** 🔄
  *Guide complet sur la création et gestion des Areas*
  - Architecture des workflows
  - Création et édition d'Areas
  - Gestion des nœuds (triggers/actions)
  - Configuration des nœuds
  - Patterns courants

- **[OAuth Integration](documentation-flutter/OAUTH_INTEGRATION.md)** 🔐
  *Intégration OAuth et connexion aux services*
  - Architecture du flux OAuth
  - Services supportés (30+)
  - Configuration des deep links
  - Tests des flux OAuth
  - Troubleshooting

- **[Schema System](documentation-flutter/SCHEMA_SYSTEM_DOCUMENTATION.md)** 📋
  *Système de conversion de schémas et configuration dynamique*
  - Format des schémas backend/mobile
  - Conversion entre formats
  - Système de variables
  - Génération de formulaires dynamiques

### Guides de développement

- **[Docker Guide](documentation-flutter/DOCKER.md)** 🐳
  *Configuration et utilisation de Docker pour le développement*
  - Setup de l'environnement Docker
  - Démarrage des services backend
  - Configuration réseau pour mobile
  - Commandes utiles

- **[Mobile Build](documentation-flutter/MOBILE_BUILD.md)** 🔨
  *Guide de compilation pour Android et iOS*
  - Configuration des builds
  - Build debug et release
  - Code signing
  - Gestion des versions
  - Build flavors

- **[Testing](documentation-flutter/TESTING.md)** 🧪
  *Stratégie et guide de tests*
  - Tests unitaires
  - Tests de widgets
  - Tests d'intégration
  - Coverage
  - Mocking avec Mockito

- **[Deployment](documentation-flutter/DEPLOYMENT.md)** 🚀
  *Guide de déploiement en production*
  - Checklist pré-déploiement
  - Déploiement Android (Google Play)
  - Déploiement iOS (App Store)
  - Gestion des versions
  - Processus de release

---

## Structure du projet

```
mobile/
├── lib/
│   ├── core/                       # Infrastructure de base
│   │   ├── constants/              # Constantes (API, services)
│   │   ├── errors/                 # Gestion des erreurs
│   │   ├── models/                 # Modèles de base
│   │   ├── services/               # Services core (API, OAuth, Storage)
│   │   └── theme/                  # Thème de l'application
│   │
│   ├── features/                   # Modules fonctionnels
│   │   ├── areas/                  # Gestion des Areas
│   │   │   ├── models/             # Modèles (Area, WorkflowNode)
│   │   │   ├── screens/            # Écrans (liste, éditeur)
│   │   │   ├── services/           # Services métier
│   │   │   └── utils/              # Utilitaires
│   │   │
│   │   ├── auth/                   # Authentification
│   │   │   ├── data/               # Repository et modèles
│   │   │   ├── presentation/       # Écrans et providers
│   │   │   └── domain/             # Logique métier
│   │   │
│   │   ├── services/               # Connexion aux services
│   │   └── navigation/             # Navigation (GoRouter)
│   │
│   ├── shared/                     # Composants partagés
│   │   ├── widgets/                # Widgets réutilisables
│   │   └── transitions/            # Transitions de pages
│   │
│   └── main.dart                   # Point d'entrée
│
├── documentation-flutter/          # Documentation complète
│   ├── TECHNICAL_DOCUMENTATION.md
│   ├── QUICK_START_AREA_MOBILE.md
│   ├── AREA_INTEGRATION.md
│   ├── OAUTH_INTEGRATION.md
│   ├── SCHEMA_SYSTEM_DOCUMENTATION.md
│   ├── DOCKER.md
│   ├── MOBILE_BUILD.md
│   ├── TESTING.md
│   └── DEPLOYMENT.md
│
├── test/                           # Tests
│   ├── unit/                       # Tests unitaires
│   ├── widget/                     # Tests de widgets
│   └── integration/                # Tests d'intégration
│
├── android/                        # Configuration Android
├── ios/                            # Configuration iOS
└── pubspec.yaml                    # Dépendances
```

---

## Commandes utiles

### Développement

```bash
# Lancer l'application
flutter run

# Hot reload (dans le terminal)
r

# Hot restart
R

# Analyser le code
flutter analyze

# Formater le code
dart format lib/

# Nettoyer les builds
flutter clean
```

### Tests

```bash
# Lancer tous les tests
flutter test

# Tests avec coverage
flutter test --coverage

# Tests d'un fichier spécifique
flutter test test/unit/services/area_service_test.dart
```

### Build

```bash
# Build APK Android (debug)
flutter build apk --debug

# Build APK Android (release)
flutter build apk --release

# Build App Bundle (Google Play)
flutter build appbundle --release

# Build iOS (release)
flutter build ios --release

# Build IPA (App Store)
flutter build ipa --release
```

---

## Architecture

### Pattern architectural

L'application suit une **architecture feature-first** avec :

- **Repository Pattern** pour l'accès aux données
- **Provider** pour la gestion d'état
- **Separation of Concerns** (UI / Business Logic / Data)
- **Dependency Injection** via constructeurs

### Technologies clés

- **Flutter** : Framework UI
- **Provider** : State management
- **GoRouter** : Navigation
- **http** : Client HTTP
- **flutter_secure_storage** : Stockage sécurisé
- **app_links** : Deep linking

---

## Workflow de développement

### 1. Créer une branche

```bash
git checkout -b feature/nom-de-la-feature
```

### 2. Développer

- Écrire le code
- Ajouter des tests
- Tester sur simulateurs et devices réels

### 3. Vérifier la qualité

```bash
flutter analyze
flutter test
dart format lib/
```

### 4. Commit et Push

```bash
git add .
git commit -m "feat: description de la feature"
git push origin feature/nom-de-la-feature
```

### 5. Créer une Pull Request

- Description détaillée
- Screenshots si changements UI
- Lier les issues concernées

---

## Services supportés

### OAuth 2.0 (30 services)

**Réseaux sociaux & Communication :**
- Discord, Reddit, Slack, Twitch

**Développement :**
- GitHub, GitLab

**Productivité :**
- Google, Gmail, Outlook, Dropbox, Trello

**Média :**
- Spotify, Strava

**Utilitaires :**
- Bitly

### API Key

- OpenAI, Telegram, Shodan

### Sans authentification

- Timer, Console, RSS, Webhook, Ntfy, Weather, Currency, Crypto, Books, AppleMusic

Voir [OAuth Integration](documentation-flutter/OAUTH_INTEGRATION.md) pour plus de détails.

---

## Contribution

### Guidelines

1. **Suivre les conventions Dart/Flutter**
2. **Écrire des tests** pour toute nouvelle fonctionnalité
3. **Documenter** le code et les fonctionnalités
4. **Respecter l'architecture** existante
5. **Commenter les Pull Requests** de manière constructive

### Convention de commits

```
feat: nouvelle fonctionnalité
fix: correction de bug
docs: mise à jour documentation
refactor: refactoring sans changement fonctionnel
test: ajout ou modification de tests
chore: tâches diverses (dépendances, etc.)
```

---

## Dépannage rapide

### Problème : "Cannot connect to backend"

**Solution :**

Vérifier l'URL API dans [api_constants.dart](lib/core/constants/api_constants.dart) :

```dart
// iOS Simulator
static const String baseUrl = 'http://localhost:8080';

// Android Emulator
static const String baseUrl = 'http://10.0.2.2:8080';

// Physical Device
static const String baseUrl = 'http://YOUR_COMPUTER_IP:8080';
```

### Problème : "OAuth callback not working"

**Solution :**

Vérifier la configuration des deep links :
- Android : [AndroidManifest.xml](android/app/src/main/AndroidManifest.xml)
- iOS : [Info.plist](ios/Runner/Info.plist)

Voir [OAuth Integration](documentation-flutter/OAUTH_INTEGRATION.md) pour plus de détails.

### Problème : "Build failed"

**Solution :**

```bash
flutter clean
flutter pub get
flutter run
```

Voir [Troubleshooting complet](documentation-flutter/QUICK_START_AREA_MOBILE.md#troubleshooting).

---

## Resources

### Documentation officielle

- [Flutter Documentation](https://docs.flutter.dev/)
- [Dart Language](https://dart.dev/)
- [Provider Package](https://pub.dev/packages/provider)

### Outils

- [Android Studio](https://developer.android.com/studio)
- [Xcode](https://developer.apple.com/xcode/)
- [VS Code Flutter Extension](https://marketplace.visualstudio.com/items?itemName=Dart-Code.flutter)

### Communauté

- **GitHub Issues** : [github.com/your-org/mirror-area/issues](https://github.com/your-org/mirror-area/issues)
- **Discord** : [discord.gg/mirror-area](#)
- **Email** : support@mirrorarea.com

---

## License

[MIT License](../LICENSE)

---

## Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique des versions.

---

## Support

Pour toute question ou problème :

1. Consulter la [documentation](documentation-flutter/)
2. Rechercher dans les [issues GitHub](https://github.com/your-org/mirror-area/issues)
3. Créer une nouvelle issue si nécessaire
4. Rejoindre notre Discord pour de l'aide en temps réel

---

