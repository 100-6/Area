# Documentation POC Flutter

## Vue d'ensemble

Ce POC Flutter démontre une application mobile cross-platform avec un système d'authentification complet utilisant l'architecture Clean et les bonnes pratiques de développement Flutter.

## Architecture

L'application suit une architecture Clean organisée en couches :

### Structure des dossiers

```
lib/
├── core/                    # Configuration et utilitaires globaux
│   ├── constants/          # Routes et constantes
│   ├── errors/             # Gestion des erreurs
│   ├── theme/              # Thème de l'application
│   └── utils/              # Utilitaires partagés
├── features/               # Fonctionnalités par domaine
│   ├── auth/               # Module d'authentification
│   │   ├── data/           # Repository et sources de données
│   │   ├── domain/         # Entités et logique métier
│   │   └── presentation/   # UI et gestion d'état
│   └── home/               # Module d'accueil
│       └── presentation/   # Écrans d'accueil
├── shared/                 # Composants partagés
│   ├── models/             # Modèles de validation
│   └── widgets/            # Widgets réutilisables
└── main.dart               # Point d'entrée
```

## Fonctionnalités

### Authentification
- **Écran de connexion** avec validation en temps réel
- **Écran d'inscription** pour nouveaux utilisateurs
- **Gestion d'état** avec Provider pattern
- **Persistance locale** avec SharedPreferences
- **Comptes de démonstration** intégrés pour test

### Interface utilisateur
- **Design moderne** avec Material Design 3
- **Thème sombre/clair** automatique selon système
- **Widgets personnalisés** : CustomTextField, LoadingOverlay, GradientBackground
- **Navigation** avec GoRouter
- **Animations** et transitions fluides

### Validation
- **Validation de formulaires** avec le package Formz
- **Validation email** avec regex
- **Validation mot de passe** avec critères sécurisés
- **Messages d'erreur** contextuels

## Dépendances principales

```yaml
dependencies:
  # État et navigation
  provider: ^6.1.2         # Gestion d'état
  go_router: ^14.2.7       # Navigation déclarative
  
  # Validation et formulaires
  formz: ^0.7.0            # Validation de formulaires
  
  # Persistance
  shared_preferences: ^2.2.3  # Stockage local
  
  # Utilitaires
  equatable: ^2.0.5        # Comparaison d'objets
  cupertino_icons: ^1.0.8  # Icônes iOS
```

## Comptes de test

L'application inclut des comptes de démonstration :
- **admin@example.com** / admin123
- **user@example.com** / user123
- **demo@example.com** / demo123

## Installation et lancement

### Prérequis
- Flutter SDK ≥ 3.7.0
- Dart SDK ≥ 3.0.0
- Éditeur (VS Code, Android Studio)

### Installation
```bash
cd flutter/
flutter pub get
```

### Lancement
```bash
# Mode développement
flutter run

# Build Android
flutter build apk

# Build iOS (macOS requis)
flutter build ios
```

## Structure technique

### Gestion d'état
L'application utilise le pattern Provider avec trois niveaux :
- **AuthProvider** : État global d'authentification
- **LoginProvider** : État spécifique à la connexion
- **SignupProvider** : État spécifique à l'inscription

### Navigation
GoRouter gère la navigation avec protection des routes :
```dart
// Routes protégées par authentification
router.go('/home');  // Redirige vers login si non authentifié
```

### Thème
Support automatique des thèmes clair/sombre :
```dart
ThemeMode.system  // Suit les préférences système
```

### Validation
Validation en temps réel avec Formz :
- Email : Format valide requis
- Mot de passe : Minimum 6 caractères, majuscule, chiffre

## Points d'extension

1. **Backend** : Intégrer API REST/GraphQL
2. **Base de données** : Remplacer SharedPreferences par SQLite
3. **Authentification** : Ajouter OAuth, biométrie
4. **Tests** : Implémenter tests unitaires et d'intégration
5. **CI/CD** : Pipeline automatisé avec GitHub Actions

## Bonnes pratiques appliquées

- **Architecture Clean** : Séparation des responsabilités
- **SOLID principles** : Code maintenable et extensible
- **Validation robuste** : Sécurité et UX optimisées
- **Gestion d'erreurs** : Messages utilisateur clairs
- **Performance** : Widgets optimisés et lazy loading
- **Accessibilité** : Semantic labels et navigation

## Conclusion

Ce POC démontre une base solide pour une application Flutter professionnelle avec authentification, architecture propre et interface moderne. Il peut servir de template pour des projets plus complexes.