# Intégration de la fonctionnalité AREA dans l'application mobile

## Vue d'ensemble

La fonctionnalité AREA (Action-REAction) a été implémentée dans l'application mobile avec un design inspiré d'IFTTT. Elle permet aux utilisateurs de créer des automations personnalisées en combinant des triggers (déclencheurs) et des actions.

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

## Modifications apportées

### 1. Core API Service (mobile/lib/core/services/api_service.dart)
- ✅ Ajout de la méthode `delete()` pour supporter la suppression d'AREAs

### 2. Nouveaux fichiers créés
- ✅ 4 modèles de données
- ✅ 1 service API complet
- ✅ 3 écrans avec design IFTTT
- ✅ 2 widgets réutilisables
- ✅ Documentation complète

## Prochaines étapes pour finaliser l'intégration

### 1. Intégration de l'authentification

Actuellement, les écrans utilisent un token placeholder. Vous devez intégrer le vrai système d'auth :

```dart
// Dans areas_list_screen.dart et area_editor_screen.dart
// Remplacer :
final token = 'your_token_here';

// Par (exemple avec un AuthService) :
final authService = AuthService();
final token = await authService.getToken();
```

### 2. Ajout dans la navigation

Option A - Ajouter dans le bottom navigation :

```dart
// Dans votre fichier de navigation principal
import 'package:your_app/features/areas/screens/areas_list_screen.dart';

BottomNavigationBarItem(
  icon: Icon(Icons.auto_awesome),
  label: 'Applets',
)

// Dans le body :
pages: [
  HomePage(),
  AreasListScreen(), // Nouvel écran
  ProfilePage(),
]
```

Option B - Ajouter dans un menu/drawer :

```dart
ListTile(
  leading: Icon(Icons.auto_awesome),
  title: Text('My Applets'),
  onTap: () {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AreasListScreen(),
      ),
    );
  },
)
```

### 3. Compléter l'implémentation des workflows

Actuellement, la sélection de services fonctionne mais ne crée pas encore de workflow nodes.

Dans `area_editor_screen.dart`, compléter les TODOs :

```dart
Future<void> _selectTrigger() async {
  final result = await Navigator.push<Map<String, dynamic>>(
    context,
    MaterialPageRoute(
      builder: (context) => const ServiceSelectorScreen(nodeType: 'trigger'),
    ),
  );

  if (result != null && widget.areaId != null) {
    final token = await _authService.getToken();

    // Créer le workflow node
    final node = await _areaService.createWorkflowNode(
      areaId: widget.areaId!,
      nodeType: 'trigger',
      serviceId: result['service'],
      actionId: result['name'],
      positionX: 100,
      positionY: 100,
      label: result['description'],
      token: token,
    );

    setState(() {
      _triggerNode = node;
    });
  }
}
```

### 4. Tests à effectuer

1. **Lister les AREAs** : Vérifier que la liste se charge correctement
2. **Créer une AREA** : Tester la création avec nom et description
3. **Toggle AREA** : Vérifier l'activation/désactivation
4. **Modifier AREA** : Tester l'édition
5. **Supprimer AREA** : Ajouter et tester la suppression
6. **Sélection de services** : Vérifier que la liste des services s'affiche

### 5. Améliorations recommandées

- [ ] Ajouter un loading skeleton pendant le chargement
- [ ] Implémenter le swipe-to-delete sur les AREAs
- [ ] Ajouter des animations de transition
- [ ] Créer un écran de détails avec logs d'exécution
- [ ] Ajouter la recherche/filtrage
- [ ] Implémenter le mode sombre
- [ ] Ajouter des templates d'AREAs populaires
- [ ] Créer des tests unitaires

## Design et UX

### Palette de couleurs

- **Triggers (IF)** : Bleu (`Colors.blue`)
- **Actions (THEN)** : Vert (`Colors.green`)
- **Background** : Gris clair (`Color(0xFFF5F5F5)`)
- **Cards** : Blanc avec elevation de 2
- **Bordures arrondies** : 12px

### Iconographie

- Timer : `Icons.schedule`
- Console : `Icons.code`
- Flash (trigger) : `Icons.flash_on`
- Check (action) : `Icons.check_circle`
- Success : `Icons.check_circle` (vert)
- Error : `Icons.error` (rouge)

## API Backend utilisée

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

## Checklist de déploiement

- [ ] Intégrer le système d'authentification
- [ ] Ajouter la navigation vers AreasListScreen
- [ ] Tester sur device réel
- [ ] Vérifier la connexion au backend
- [ ] Tester tous les flows utilisateur
- [ ] Ajouter analytics/tracking
- [ ] Mettre à jour la documentation utilisateur
