# Application Android Kotlin avec Jetpack Compose

Une application Android moderne développée avec Kotlin et Jetpack Compose, implémentant un système d'authentification local avec interface utilisateur Material Design 3.

## ✨ Fonctionnalités

- 🔐 **Système d'authentification local** (Connexion & Inscription)
- 🎨 **Interface Material Design 3** avec Jetpack Compose
- 📱 **Design responsive et adaptatif**
- 🏗️ **Architecture moderne Android**
- 🔧 **Gestion d'état avec Compose State**
- 💾 **Persistance locale avec SharedPreferences**
- 🛡️ **Chiffrement des mots de passe (SHA-256)**
- 🌙 **Support du thème sombre automatique**

## 🚀 Démarrage rapide

### Prérequis

- [Android Studio](https://developer.android.com/studio) (version Hedgehog ou supérieure)
- Android SDK (API 24 minimum, API 36 recommandé)
- Kotlin 1.9+
- Gradle 8.0+

### Installation

1. Clonez le repository ou naviguez vers le dossier du projet
```bash
cd poc/mobile/Kotlin
```

2. Ouvrez le projet dans Android Studio

3. Synchronisez le projet avec Gradle
```bash
./gradlew sync
```

4. Lancez l'application sur un émulateur ou un appareil physique
```bash
./gradlew installDebug
```

## 🧪 Utilisation

### Premier démarrage
L'application démarre sur l'écran de connexion. Aucun compte n'est préconfiguré.

### Création de compte
1. Cliquez sur "Créer un compte"
2. Renseignez les informations :
   - **Nom d'utilisateur** : requis, non vide
   - **Email** : doit contenir un @
   - **Mot de passe** : minimum 6 caractères
3. Le compte est créé et vous êtes automatiquement connecté

### Connexion
1. Utilisez soit votre nom d'utilisateur, soit votre email
2. Entrez votre mot de passe
3. Cliquez sur "Se connecter"

### Limitations du POC
- Un seul utilisateur peut être enregistré à la fois
- Les données sont stockées localement uniquement
- Pas de récupération de mot de passe

## 🏗️ Architecture

Le projet suit les bonnes pratiques Android modernes :

```
src/main/java/com/example/myapplication/
├── MainActivity.kt              # Activité principale et navigation
├── data/                        # Couche de données
│   └── AuthStore.kt            # Gestion de l'authentification
└── ui/                         # Interface utilisateur
    ├── auth/                   # Écrans d'authentification
    │   ├── LoginScreen.kt      # Écran de connexion
    │   └── RegisterScreen.kt   # Écran d'inscription
    ├── profile/                # Écran de profil
    │   └── ProfileScreen.kt    # Écran utilisateur connecté
    └── theme/                  # Thème Material Design
        ├── Color.kt            # Couleurs
        ├── Theme.kt            # Configuration du thème
        └── Type.kt             # Typographie
```

## 🔧 Technologies utilisées

- **Kotlin** - Langage de programmation
- **Jetpack Compose** - Framework UI moderne
- **Material Design 3** - Système de design
- **SharedPreferences** - Stockage local
- **Coroutines** - Programmation asynchrone
- **Android Gradle Plugin** - Build system

## 📱 Écrans

### Écran de connexion
- Interface Material Design 3
- Validation en temps réel
- Gestion des erreurs
- Navigation vers l'inscription

### Écran d'inscription
- Formulaire avec validation
- Vérification de l'email
- Contraintes de mot de passe
- Création automatique du compte

### Écran de profil
- Affichage des informations utilisateur
- Option de déconnexion
- Interface utilisateur connectée

## 🧪 Tests

### Tests unitaires
```bash
./gradlew test
```

### Tests d'interface
```bash
./gradlew connectedAndroidTest
```

## 📦 Build de production

### APK de debug
```bash
./gradlew assembleDebug
```

### APK de release
```bash
./gradlew assembleRelease
```

### Bundle Android (AAB)
```bash
./gradlew bundleRelease
```

## 🛠️ Configuration

### Version Android ciblée
- **minSdk** : 24 (Android 7.0)
- **compileSdk** : 36 (Android 14)
- **targetSdk** : 36 (Android 14)

### Dépendances principales
- androidx.core:core-ktx
- androidx.activity:activity-compose
- androidx.compose.ui:ui
- androidx.compose.material3:material3
- androidx.lifecycle:lifecycle-runtime-ktx

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche de feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Si vous avez des questions ou rencontrez des problèmes :

1. Vérifiez les [issues existantes](../../issues)
2. Créez une nouvelle issue si nécessaire
3. Consultez la [documentation Android](https://developer.android.com/docs)
4. Consultez la [documentation Jetpack Compose](https://developer.android.com/jetpack/compose)

## 📊 Spécifications techniques

### Performance
- Interface réactive avec Jetpack Compose
- Persistance rapide avec SharedPreferences
- Navigation fluide entre les écrans

### Compatibilité
- Android 7.0+ (API 24+)
- Architecture ARM et x86
- Support des tablettes et téléphones

---

Développé avec ❤️ en Kotlin et Jetpack Compose