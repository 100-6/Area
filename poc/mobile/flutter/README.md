# Clean Login App

Une application Flutter moderne avec un système d'authentification propre et élégant, développée selon l'architecture Clean Architecture.

## ✨ Fonctionnalités

- 🔐 **Système d'authentification complet** (Connexion & Inscription)
- 🎨 **Interface utilisateur moderne et intuitive**
- 📱 **Design responsive et adaptatif**
- 🏗️ **Architecture Clean avec séparation des couches**
- 🔧 **Gestion d'état avec Provider**
- 🧭 **Navigation déclarative avec GoRouter**
- ✅ **Validation de formulaires avec Formz**
- 💾 **Persistance locale avec SharedPreferences**
- 🌙 **Support du mode sombre**

## 🚀 Démarrage rapide

### Prérequis

- [Flutter](https://flutter.dev/docs/get-started/install) (version 3.7.0 ou supérieure)
- [Dart](https://dart.dev/get-dart) (version 3.7.0 ou supérieure)

### Installation

1. Clonez le repository ou naviguez vers le dossier du projet
```bash
cd clean_login_app
```

2. Installez les dépendances
```bash
flutter pub get
```

3. Lancez l'application
```bash
flutter run
```

## 🧪 Comptes de démonstration

L'application inclut des comptes de démonstration pour tester le système d'authentification :

| Email | Mot de passe |
|-------|-------------|
| `admin@test.com` | `password123` |
| `user@test.com` | `password123` |
| `demo@test.com` | `demo123` |

## 🏗️ Architecture

Le projet suit les principes de Clean Architecture :

```
lib/
├── core/                    # Éléments partagés de l'application
│   ├── constants/          # Constantes et routes
│   ├── theme/              # Thèmes de l'application
│   ├── utils/              # Utilitaires
│   └── errors/             # Gestion des erreurs
├── features/               # Fonctionnalités métier
│   ├── auth/               # Authentification
│   │   ├── data/           # Sources de données et repositories
│   │   ├── domain/         # Entités et logique métier
│   │   └── presentation/   # Interface utilisateur et providers
│   └── home/               # Écran d'accueil
│       └── presentation/
└── shared/                 # Composants partagés
    ├── models/             # Modèles de validation
    └── widgets/            # Widgets réutilisables
```

## 🔧 Technologies utilisées

- **Flutter** - Framework UI
- **Provider** - Gestion d'état
- **GoRouter** - Navigation déclarative
- **Formz** - Validation de formulaires
- **SharedPreferences** - Stockage local
- **Equatable** - Comparaison d'objets

## 📱 Captures d'écran

### Écran de démarrage
- Animation de lancement élégante
- Redirection automatique selon l'état d'authentification

### Écran de connexion
- Interface moderne et intuitive
- Validation en temps réel
- Comptes de démonstration intégrés
- Gestion des erreurs

### Écran d'inscription
- Formulaire complet avec validation
- Confirmation de mot de passe
- Interface cohérente

### Écran d'accueil
- Dashboard personnalisé
- Informations de profil
- Actions rapides
- Statistiques d'utilisation

## 🧪 Tests

Lancez les tests avec :
```bash
flutter test
```

## 📦 Build de production

Pour Android :
```bash
flutter build apk --release
```

Pour iOS :
```bash
flutter build ios --release
```

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
3. Consultez la [documentation Flutter](https://flutter.dev/docs)

---

Développé avec ❤️ en Flutter