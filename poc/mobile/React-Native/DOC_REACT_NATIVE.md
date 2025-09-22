# Documentation POC React Native

## Vue d'ensemble

Ce POC React Native démontre une application mobile cross-platform avec système d'authentification, développée avec Expo et TypeScript. L'application suit les bonnes pratiques modernes de développement React Native.

## Architecture

L'application utilise une architecture modulaire et organisée :

### Structure des dossiers

```
src/
├── navigation/             # Navigation et routing
│   └── AppNavigator.tsx   # Navigateur principal avec logique auth
├── screens/               # Écrans de l'application
│   ├── LoginScreen.tsx    # Écran de connexion
│   └── HomeScreen.tsx     # Écran d'accueil
├── services/              # Services et logique métier
│   └── AuthService.ts     # Service d'authentification
└── types/                 # Définitions TypeScript
    └── index.ts           # Types partagés
```

## Fonctionnalités

### Authentification
- **Écran de connexion** avec validation
- **Gestion d'état** d'authentification globale
- **Persistance** avec AsyncStorage
- **Navigation conditionnelle** selon l'état auth
- **Compte de test** : test@test.com / password

### Interface utilisateur
- **Design moderne** avec thème sombre
- **Couleurs cohérentes** : palette violet/bleu (#4f46e5)
- **Interface responsive** adaptée mobile
- **Feedback utilisateur** : loading states, alerts
- **Typographie** claire et lisible

### Navigation
- **React Navigation v7** avec Native Stack
- **Navigation conditionnelle** basée sur l'authentification
- **Gestion d'état** centralisée pour auth flow
- **Écrans sans header** pour expérience immersive

## Dépendances principales

```json
{
  "dependencies": {
    // Framework et base
    "expo": "~54.0.8",
    "react": "19.1.0",
    "react-native": "0.81.4",
    
    // Navigation
    "@react-navigation/native": "^7.1.17",
    "@react-navigation/native-stack": "^7.3.26",
    
    // Stockage et persistance
    "@react-native-async-storage/async-storage": "^2.2.0",
    
    // UI et interactions
    "expo-haptics": "~15.0.7",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-reanimated": "~4.1.0"
  }
}
```

## Installation et lancement

### Prérequis
- Node.js ≥ 18
- Expo CLI
- iOS Simulator ou Android Emulator

### Installation
```bash
cd React-Native/
npm install
```

### Lancement
```bash
# Démarrer le serveur Expo
npm start

# Lancer sur Android
npm run android

# Lancer sur iOS
npm run ios

# Lancer sur web
npm run web
```

## Structure technique

### Service d'authentification
Le service `AuthService` gère :
- **Connexion** avec validation des credentials
- **Déconnexion** et nettoyage du stockage
- **Vérification** de l'état d'authentification
- **Gestion utilisateur** avec persistance locale

```typescript
// Exemple d'utilisation
const result = await AuthService.login(email, password);
if (result.success) {
  // Connexion réussie
}
```

### Gestion d'état
État d'authentification géré dans `AppNavigator` :
- **État local** avec hooks React
- **Persistance** automatique via AsyncStorage
- **Navigation conditionnelle** selon l'état auth

### Types TypeScript
Définitions strictes pour :
- **User** : Modèle utilisateur
- **AuthResponse** : Réponse d'authentification
- **RootStackParamList** : Types de navigation

## Fonctionnalités par écran

### LoginScreen
- **Formulaire** email/password
- **Validation** basique côté client
- **Loading state** pendant authentification
- **Messages d'erreur** avec Alert
- **Placeholders** avec credentials de test

### HomeScreen
- **Interface d'accueil** personnalisée
- **Bouton déconnexion** avec confirmation
- **Affichage** informations utilisateur
- **Design cohérent** avec le thème global

## Compte de test

Credentials de démonstration :
- **Email** : test@test.com
- **Mot de passe** : password

## Expo Features

L'application tire parti d'Expo pour :
- **Développement rapide** avec hot reload
- **Build automatisé** pour iOS/Android
- **OTA Updates** pour déploiement rapide
- **APIs natives** : haptics, splash screen, etc.
- **Web support** avec même codebase

## Bonnes pratiques appliquées

- **TypeScript strict** : Typage complet
- **Architecture modulaire** : Code organisé et maintenable
- **Error handling** : Gestion robuste des erreurs
- **User feedback** : Loading et états visuels
- **Performance** : Navigation optimisée
- **UX moderne** : Interface intuitive et responsive

## Scripts disponibles

```bash
npm start           # Démarrer Expo
npm run android     # Build Android
npm run ios         # Build iOS  
npm run web         # Version web
npm run lint        # Linter ESLint
```

## Conclusion

Ce POC React Native avec Expo offre une base solide pour développer des applications mobiles modernes. Il démontre l'intégration harmonieuse des technologies React Native, TypeScript, et Expo pour créer une expérience utilisateur fluide avec authentification robuste.

L'architecture modulaire et les bonnes pratiques appliquées permettent une extension facile vers des fonctionnalités plus complexes et une maintenance simplifiée du code.