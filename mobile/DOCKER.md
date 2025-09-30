# 🐳 Guide Docker pour l'Application Mobile Flutter (APK uniquement)

## 📋 Vue d'ensemble

Le Dockerfile permet de **construire des APK Android** de manière reproductible et isolée, sans avoir besoin d'installer Flutter ou le SDK Android sur votre machine.

---

## 🏗️ Architecture du Dockerfile

```
┌─────────────────────┐
│  flutter-base       │  ← Ubuntu + Flutter + Android SDK
└──────────┬──────────┘
           │
           ▼
    ┌──────────┐
    │  build   │  ← Compilation de l'APK
    └─────┬────┘
          │
          ▼
    ┌──────────┐
    │  export  │  ← Export de l'APK (image légère)
    └──────────┘
```

### Stages disponibles

1. **flutter-base** (~4-5 GB)
   - Ubuntu 22.04
   - Flutter 3.24.3
   - Android SDK 33
   - Java 11

2. **build** (~4-5 GB)
   - Compilation de l'APK en mode release
   - Optimisations activées

3. **export** (~100 MB)
   - Image légère Alpine
   - Contient uniquement l'APK final

---

## 🚀 Utilisation

### Option 1 : Build direct avec Docker Compose (Recommandé)

```bash
# Build de l'APK
docker compose --profile mobile build mobile-apk-builder
docker compose --profile mobile run --rm mobile-apk-builder

# Récupérer l'APK
docker cp area_mobile_apk_builder:/app/build/app/outputs/flutter-apk/app-release.apk ./app-release.apk
```

### Option 2 : Avec le service d'export

```bash
# Build et export
docker compose --profile mobile up -d mobile-apk-export

# L'APK est disponible dans le volume
docker cp area_mobile_apk_export:/output/app-release.apk ./app-release.apk

# Nettoyage
docker compose down mobile-apk-export
```

### Option 3 : Build manuel avec Docker

```bash
# Build de l'image
docker build -t area-mobile:latest --target build ./mobile

# Créer un container temporaire et copier l'APK
docker create --name temp-mobile area-mobile:latest
docker cp temp-mobile:/app/build/app/outputs/flutter-apk/app-release.apk ./
docker rm temp-mobile
```

---

## ⚙️ Configuration de l'API

L'URL de l'API backend peut être configurée via une variable d'environnement.

### Dans le fichier `.env`

```env
# URL de l'API pour l'APK
MOBILE_API_URL=http://10.0.2.2:8080
```

### URLs selon l'environnement

- **Émulateur Android** : `http://10.0.2.2:8080` (par défaut)
- **Appareil physique** : `http://VOTRE_IP:8080` (ex: `http://192.168.1.100:8080`)
- **Production** : `https://api.votredomaine.com`

### Build avec une URL personnalisée

```bash
# Via docker-compose
MOBILE_API_URL=https://api.production.com docker compose --profile mobile build mobile-apk-builder

# Via docker build
docker build --build-arg API_URL=https://api.production.com -t area-mobile ./mobile
```

---

## 📦 Workflow complet

### 1. Build de l'APK

```bash
# Build l'image (1ère fois: ~15-20 min, ensuite: ~5-10 min)
docker compose --profile mobile build mobile-apk-builder

# Générer l'APK
docker compose --profile mobile run --rm mobile-apk-builder
```

### 2. Récupération de l'APK

```bash
# Copier depuis le container
docker cp area_mobile_apk_builder:/app/build/app/outputs/flutter-apk/app-release.apk ./app-release.apk

# Vérifier la taille
ls -lh app-release.apk
```

### 3. Installation sur un appareil

```bash
# Via adb (Android Debug Bridge)
adb install app-release.apk

# Ou transférer le fichier manuellement sur votre téléphone
```

---

## 🐛 Troubleshooting

### Le build est très lent la première fois

**C'est normal !** Le premier build télécharge :
- Flutter SDK (~800 MB)
- Android SDK (~2 GB)
- Dépendances système (~500 MB)

Les builds suivants sont beaucoup plus rapides grâce au cache Docker.

**Astuce** : Lancez le build et allez prendre un café ☕

### APK non trouvé après le build

```bash
# Vérifier que le build a réussi
docker compose logs mobile-apk-builder

# Lister les fichiers dans le container
docker run --rm -v area_mobile_builds:/data alpine ls -la /data

# Rebuild sans cache
docker compose build --no-cache mobile-apk-builder
```

### Erreur de licences Android

Les licences Android sont pré-acceptées dans le Dockerfile. Si vous rencontrez une erreur :

```bash
# Rebuild complet
docker compose build --no-cache mobile-apk-builder
```

### Problème de mémoire lors du build

```bash
# Augmenter la mémoire allouée à Docker
# Docker Desktop → Settings → Resources → Memory: 8 GB minimum

# Ou builder avec moins de jobs
docker build --build-arg FLUTTER_BUILD_ARGS="--no-tree-shake-icons" ./mobile
```

### Changer la version de Flutter

Éditez le `Dockerfile` :

```dockerfile
ENV FLUTTER_VERSION=3.27.0  # Au lieu de 3.24.3
```

Puis rebuild :

```bash
docker compose build --no-cache mobile-apk-builder
```

---

## 📊 Tailles des images

| Image | Taille | Utilisation |
|-------|--------|-------------|
| flutter-base | ~4-5 GB | Base (jamais utilisée directement) |
| build | ~4-5 GB | Build APK (temporaire) |
| export | ~100 MB | Export APK uniquement |

---

## 🔄 Intégration CI/CD

### GitHub Actions

```yaml
name: Build APK
on: [push]

jobs:
  build-apk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build APK with Docker
        run: |
          docker compose --profile mobile build mobile-apk-builder
          docker compose --profile mobile run --rm mobile-apk-builder
          docker cp area_mobile_apk_builder:/app/build/app/outputs/flutter-apk/app-release.apk ./
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-release
          path: app-release.apk
```

### GitLab CI

```yaml
build-apk:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker compose --profile mobile build mobile-apk-builder
    - docker compose --profile mobile run --rm mobile-apk-builder
    - docker cp area_mobile_apk_builder:/app/build/app/outputs/flutter-apk/app-release.apk ./
  artifacts:
    paths:
      - app-release.apk
    expire_in: 1 week
```

---

## 🧹 Nettoyage

### Supprimer les containers et images

```bash
# Arrêter et supprimer les containers
docker compose down mobile-apk-builder mobile-apk-export

# Supprimer les images
docker rmi area-mobile:latest

# Supprimer le volume des builds
docker volume rm area_mobile_builds
```

### Nettoyage complet

```bash
# Supprimer toutes les images non utilisées
docker image prune -a

# Supprimer tous les volumes non utilisés
docker volume prune

# Nettoyage global
docker system prune -a --volumes
```

---

## 💡 Bonnes pratiques

### 1. Développement local

Pour le développement quotidien, **utilisez Flutter directement** sur votre machine :

```bash
cd mobile
flutter run
```

Docker est **principalement pour** :
- ✅ Builds de production
- ✅ CI/CD
- ✅ Environnement reproductible
- ✅ Pas besoin d'installer Flutter localement

### 2. Optimiser le temps de build

```bash
# Build en parallèle si plusieurs services
docker compose build --parallel

# Utiliser BuildKit pour un cache amélioré
export DOCKER_BUILDKIT=1
docker build ./mobile
```

### 3. Versionning des APK

```bash
# Nommer l'APK avec la version
docker cp area_mobile_apk_builder:/app/build/app/outputs/flutter-apk/app-release.apk ./app-v1.0.0.apk

# Ou utiliser un script
VERSION=$(grep "version:" mobile/pubspec.yaml | cut -d " " -f2)
docker cp area_mobile_apk_builder:/app/build/app/outputs/flutter-apk/app-release.apk ./app-v${VERSION}.apk
```

---

## 📚 Commandes utiles

```bash
# Voir les logs du build
docker compose logs mobile-apk-builder

# Voir l'espace disque utilisé
docker system df

# Inspecter l'image
docker image inspect area-mobile:latest

# Voir l'historique des layers
docker history area-mobile:latest

# Exécuter une commande dans le container
docker run --rm area-mobile:latest flutter --version

# Debugger un build qui échoue
docker build --progress=plain --no-cache ./mobile
```

---

## ✅ Checklist de déploiement

- [ ] Vérifier que le backend est accessible depuis le réseau
- [ ] Configurer `MOBILE_API_URL` dans `.env`
- [ ] Builder l'APK : `docker compose --profile mobile build`
- [ ] Récupérer l'APK
- [ ] Tester l'APK sur un appareil Android
- [ ] Vérifier la connexion à l'API
- [ ] Tester l'inscription et la connexion
- [ ] Publier l'APK (Play Store, distribution interne, etc.)

---

## 🎯 Résumé des commandes

```bash
# BUILD APK
docker compose --profile mobile build mobile-apk-builder
docker compose --profile mobile run --rm mobile-apk-builder

# RÉCUPÉRER APK
docker cp area_mobile_apk_builder:/app/build/app/outputs/flutter-apk/app-release.apk ./app.apk

# INSTALLER
adb install app.apk

# NETTOYER
docker compose down
docker system prune -a
```

---

**Prêt à builder votre APK ! 🚀**