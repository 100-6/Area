# Intégration de la fonctionnalité AREA dans l'application mobile

## Vue d'ensemble

## Structure créée

```
mobile/lib/features/areas/
├── models/
│   ├── area.dart                    # Modèle principal AREA
│   ├── workflow_node.dart           # Nœuds de workflow (trigger/action)
│   ├── workflow_connection.dart     # Connexions entre nœuds
│   └── service_info.dart            # Informations sur les services disponibles
├── services/
│   └── area_service.dart            # Service API pour gérer les AREAs
├── screens/
│   ├── areas_list_screen.dart       # Liste des applets
│   ├── area_editor_screen.dart      # Création/édition d'applets
│   └── service_selector_screen.dart # Sélection de services/actions
├── widgets/
│   ├── workflow_node_card.dart      # Card réutilisable pour IF/THEN
│   └── area_status_chip.dart        # Chip de statut/stats
├── areas.dart                       # Export barrel file
└── README.md                        # Documentation détaillée
```

Endpoints disponibles :

```
GET    /api/areas                           # Liste des AREAs
POST   /api/areas                           # Créer une AREA
GET    /api/areas/:id                       # Détails d'une AREA
PATCH  /api/areas/:id                       # Modifier
PATCH  /api/areas/:id/toggle                # Toggle active
DELETE /api/areas/:id                       # Supprimer

GET    /about.json                          # Services disponibles

GET    /api/workflow/areas/:id/nodes        # Nœuds du workflow
POST   /api/workflow/areas/:id/nodes        # Créer un nœud
GET    /api/workflow/areas/:id/connections  # Connexions
POST   /api/workflow/areas/:id/connections  # Créer une connexion
```

## Support et documentation

- Documentation détaillée : `mobile/lib/features/areas/README.md`
- Exemples d'utilisation : Dans chaque fichier screen
- Architecture backend : `backend/src/core/`
