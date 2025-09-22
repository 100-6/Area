# POC Frontend HTML/CSS

## Description

Ce dossier contient un **Proof of Concept (POC)** d'une interface de connexion développée en HTML/CSS pur avec JavaScript vanilla.

## Contenu

- `index.html` - Page de connexion complète avec styles CSS et JavaScript intégrés
- `Dockerfile` - Configuration Docker pour servir la page avec nginx

## Fonctionnalités

- Interface de connexion responsive
- Validation des champs email et mot de passe
- Toggle d'affichage/masquage du mot de passe
- Case "Se souvenir de moi"
- Messages d'erreur dynamiques
- Animation de chargement lors de la soumission
- Design moderne avec dégradés et effets visuels

## Utilisation

### Méthode 1: Ouverture directe
Ouvrir le fichier `index.html` dans un navigateur web.

### Méthode 2: Docker (recommandé)
```bash
# Construction de l'image Docker
docker build -t area-login-html .

# Lancement du conteneur
docker run -d -p 8080:80 --name area-login-container area-login-html

# Accès à la page
# Ouvrir http://localhost:8080 dans votre navigateur
```

## Validation du formulaire

- **Email** : Format email valide requis
- **Mot de passe** : Minimum 6 caractères
- Simulation d'une connexion avec délai de 1.5 secondes

## Technologies utilisées

- HTML5
- CSS3 (Flexbox, animations, dégradés)
- JavaScript vanilla (ES6+)
- Docker 

## Notes

Ce POC démontre une implémentation frontend simple sans framework JavaScript moderne.