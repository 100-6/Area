# ============================================
# Stage 1: Base Flutter Image
# ============================================
FROM ubuntu:22.04 AS flutter-base

# Éviter les prompts interactifs
ENV DEBIAN_FRONTEND=noninteractive

# Installation des dépendances système
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    xz-utils \
    zip \
    libglu1-mesa \
    openjdk-11-jdk \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Configuration des variables d'environnement
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

# Installation du SDK Android
RUN mkdir -p $ANDROID_HOME/cmdline-tools && \
    cd $ANDROID_HOME/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip && \
    unzip commandlinetools-linux-9477386_latest.zip && \
    mv cmdline-tools latest && \
    rm commandlinetools-linux-9477386_latest.zip

# Accepter les licences Android
RUN yes | sdkmanager --licenses

# Installation des composants Android nécessaires
RUN sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"

# Installation de Flutter
ENV FLUTTER_VERSION=3.24.3
ENV FLUTTER_HOME=/opt/flutter
ENV PATH="$PATH:$FLUTTER_HOME/bin"

RUN git clone --depth 1 --branch ${FLUTTER_VERSION} https://github.com/flutter/flutter.git ${FLUTTER_HOME}

# Pré-téléchargement des dépendances Flutter
RUN flutter precache --android
RUN flutter doctor

# ============================================
# Stage 2: Build APK
# ============================================
FROM flutter-base AS build

WORKDIR /app

# Copie des fichiers de configuration
COPY pubspec.yaml pubspec.lock ./

# Installation des dépendances
RUN flutter pub get

# Copie du code source
COPY . .

# Configuration de l'URL de l'API pour la production
ARG API_URL=http://10.0.2.2:8080
ENV API_URL=$API_URL

# Build de l'APK en mode release
RUN flutter build apk --release

# ============================================
# Stage 3: APK Export (léger)
# ============================================
FROM alpine:latest AS export

WORKDIR /output

# Copie de l'APK depuis le stage de build
COPY --from=build /app/build/app/outputs/flutter-apk/app-release.apk ./app-release.apk

# Commande pour garder le container actif
CMD ["sh", "-c", "echo 'APK disponible dans /output/app-release.apk' && tail -f /dev/null"]