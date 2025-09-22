# POC Frontend Nuxt.js

## Description

Ce dossier contient un **Proof of Concept (POC)** d'application frontend développée avec Nuxt.js 3 et Vue.js.

## Contenu

- `app.vue` - Point d'entrée principal de l'application Nuxt
- `components/` - Composants Vue.js réutilisables
- `pages/` - Pages de l'application (routage automatique)
- `assets/` - Ressources statiques (CSS, images, etc.)
- `nuxt.config.ts` - Configuration Nuxt.js
- `package.json` - Dépendances et scripts npm
- `Dockerfile` - Configuration Docker pour le déploiement

## Technologies utilisées

- **Nuxt.js 3** - Framework Vue.js avec SSR/SPA
- **Vue.js** - Framework JavaScript réactif
- **TypeScript** - Support TypeScript intégré
- **Docker** - Conteneurisation

## Installation et développement

### Prérequis
- Node.js 18+
- npm ou yarn

### Installation
```bash
npm install
```

### Développement
```bash
npm run dev
```
L'application sera accessible sur http://localhost:5176

### Construction
```bash
npm run build
```

### Génération statique
```bash
npm run generate
```

## Déploiement Docker

```bash
# Construction de l'image
docker build -t area-nuxt-poc .

# Lancement du conteneur
docker run -d -p 3000:3000 --name area-nuxt-container area-nuxt-poc
```

## Fonctionnalités du POC

- Architecture Nuxt.js avec routage automatique
- Composants Vue.js modulaires
- Support TypeScript
- Hot reloading en développement
- Génération statique possible
- Configuration Docker prête

## Scripts disponibles

- `npm run dev` - Mode développement avec hot reload
- `npm run build` - Construction pour production
- `npm run generate` - Génération de site statique
- `npm run preview` - Prévisualisation du build
- `npm run postinstall` - Préparation post-installation

## Notes

Ce POC démontre l'utilisation de Nuxt.js pour créer une application Vue.js moderne avec des fonctionnalités avancées comme le Server-Side Rendering (SSR) et la génération statique.