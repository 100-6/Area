# POC Frontend React

## Description

Ce dossier contient un **Proof of Concept (POC)** d'application frontend développée avec React.js.

## Contenu

- `src/` - Code source de l'application React
- `public/` - Fichiers publics statiques
- `package.json` - Dépendances et scripts npm
- `Dockerfile` - Configuration Docker pour le déploiement
- `.env` - Variables d'environnement

## Technologies utilisées

- **React 19** - Bibliothèque JavaScript pour les interfaces utilisateur
- **React DOM** - Rendu DOM pour React
- **React Scripts** - Outils de build et de développement
- **Testing Library** - Suite de tests pour React
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
npm start
```
L'application sera accessible sur http://localhost:3000

### Tests
```bash
npm test
```

### Construction
```bash
npm run build
```

## Déploiement Docker

```bash
# Construction de l'image
docker build -t area-react-poc .

# Lancement du conteneur
docker run -d -p 3000:3000 --name area-react-container area-react-poc
```

## Fonctionnalités du POC

- Architecture React avec composants fonctionnels
- Hooks React modernes
- Suite de tests intégrée avec Testing Library
- Hot reloading en développement
- Build optimisé pour production
- Configuration Docker prête

## Scripts disponibles

- `npm start` - Mode développement avec hot reload
- `npm run build` - Construction pour production
- `npm test` - Exécution des tests
- `npm run eject` - Éjection de la configuration (irréversible)

## Structure du projet

```
src/
├── components/     # Composants React réutilisables
├── pages/         # Pages/vues de l'application
├── hooks/         # Hooks personnalisés
├── utils/         # Fonctions utilitaires
├── styles/        # Fichiers CSS/SCSS
└── App.js         # Composant principal
```

## Notes

Ce POC démontre l'utilisation de React.js avec les dernières fonctionnalités et bonnes pratiques pour créer une application web moderne et réactive.
