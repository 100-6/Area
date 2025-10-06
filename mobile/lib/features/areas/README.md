# AREA Feature - IFTTT-Style Automation

Cette fonctionnalité permet aux utilisateurs de créer des automations (appelées "applets") de type IFTTT (If This Then That).

## Architecture

```
features/areas/
├── models/              # Modèles de données
│   ├── area.dart       # Modèle AREA (applet)
│   ├── workflow_node.dart        # Nœud de workflow (trigger/action)
│   ├── workflow_connection.dart  # Connexion entre nœuds
│   └── service_info.dart         # Informations sur les services
├── services/
│   └── area_service.dart         # Service API pour gérer les AREAs
├── screens/
│   ├── areas_list_screen.dart    # Liste des AREAs
│   ├── area_editor_screen.dart   # Éditeur d'AREA
│   └── service_selector_screen.dart # Sélecteur de services
└── README.md
```

## Design - Style IFTTT

Le design s'inspire d'IFTTT avec :
- **Cards** arrondies avec élévation
- **Couleurs** : Bleu pour les triggers (IF), Vert pour les actions (THEN)
- **Layout visuel** : IF → connecteur → THEN avec icônes et labels clairs
- **Switches** pour activer/désactiver les applets
- **Stats** : nombre d'exécutions, statut, dernière exécution

### Écran de liste (AreasListScreen)
- Affiche toutes les AREAs de l'utilisateur
- Switch pour activer/désactiver
- Statistiques (runs, status, date)
- Pull-to-refresh
- Bouton FAB pour créer une nouvelle AREA

### Écran d'édition (AreaEditorScreen)
- Formulaire pour nom et description
- Section workflow visuelle :
  - **IF** : Card bleue pour le trigger
  - Connecteur visuel (ligne grise)
  - **THEN** : Card(s) verte(s) pour les actions
  - Bouton "Add action" pour ajouter plusieurs actions
- Bouton "Save" dans l'AppBar

### Sélecteur de services (ServiceSelectorScreen)
- Liste des services disponibles (timer, console, etc.)
- Groupés par service avec icônes
- Chaque action/trigger est cliquable
- Retourne la sélection à l'écran précédent

## API Backend

Les endpoints utilisés :

```
GET    /api/areas              # Liste des AREAs
POST   /api/areas              # Créer une AREA
GET    /api/areas/:id          # Détails d'une AREA
PATCH  /api/areas/:id          # Modifier une AREA
PATCH  /api/areas/:id/toggle   # Activer/désactiver
DELETE /api/areas/:id          # Supprimer une AREA

GET    /about.json             # Services disponibles

GET    /api/workflow/areas/:id/nodes        # Nœuds du workflow
POST   /api/workflow/areas/:id/nodes        # Créer un nœud
GET    /api/workflow/areas/:id/connections  # Connexions
POST   /api/workflow/areas/:id/connections  # Créer une connexion
```

## Utilisation

### 1. Ajouter à votre navigation

```dart
import 'package:your_app/features/areas/screens/areas_list_screen.dart';

// Dans votre navigation
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => const AreasListScreen()),
);
```

### 2. Créer une AREA

1. Cliquer sur le bouton "Create" (FAB)
2. Entrer un nom et une description
3. Cliquer sur la card "IF" pour choisir un trigger
4. Cliquer sur "Add action" pour choisir une action
5. Sauvegarder avec le bouton "Save"

### 3. Gérer les AREAs

- **Activer/Désactiver** : utiliser le switch sur la card
- **Modifier** : cliquer sur la card
- **Voir les stats** : nombre d'exécutions, statut, date

## TODO / Améliorations futures

- [ ] Intégrer le système d'authentification pour récupérer le token
- [ ] Implémenter la création effective de workflow nodes
- [ ] Ajouter un écran de configuration pour les paramètres de trigger/action
- [ ] Ajouter la possibilité de supprimer une AREA (swipe to delete)
- [ ] Ajouter des animations de transition
- [ ] Implémenter la recherche/filtrage des AREAs
- [ ] Ajouter des templates d'AREAs prédéfinis
- [ ] Mode sombre
- [ ] Tests unitaires et d'intégration

## Services disponibles (exemples)

### Timer
- **Triggers** :
  - Every X minutes
  - Daily at time
  - Every weekday

### Console
- **Actions** :
  - Log message
  - Print to console

### GitHub (futur)
- **Triggers** :
  - New issue
  - New pull request
  - Push to repository

### Email (futur)
- **Actions** :
  - Send email
  - Forward email
