# Node.js Backend & Benchmark

## Présentation
Ce backend Node.js propose une API REST pour l'authentification et la gestion des utilisateurs, similaire à la version Python. Il utilise Express, SQLite, JWT et bcrypt pour garantir sécurité et rapidité.

## Avantages
- **Performance** : Node.js gère de nombreuses requêtes simultanées grâce à son modèle asynchrone.
- **Simplicité** : Installation rapide, dépendances limitées, pas besoin de compilation.
- **Interopérabilité** : Facile à intégrer avec des frontends modernes (React, Vue, Angular).
- **Benchmark inclus** : Un script de benchmark (`benchmark.js`) permet de tester les endpoints `/register`, `/login` et `/me`.
- **Sécurité** : Utilisation de JWT pour l'authentification et bcrypt pour le hash des mots de passe.

## Installation
```bash
cd nodejs
npm install
```

## Lancement du serveur
```bash
node app.js
```

## Lancement du benchmark
```bash
node benchmark.js
```

## Endpoints
- `POST /register` : Inscription d'un nouvel utilisateur
- `POST /login` : Connexion et récupération du token JWT
- `GET /me` : Récupération des infos de l'utilisateur connecté

## Dépendances
- express
- sqlite3
- bcrypt
- jsonwebtoken
- axios
- express-validator

## Fichier de base de données
La base SQLite est créée automatiquement dans `app.db`.

---
Ce backend est idéal pour des prototypes rapides, des tests de performance, ou des applications nécessitant une API simple et efficace.
