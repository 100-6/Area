# Guide Rapide - Ajouter des Features

**Version:** 1.0.0
**Last Updated:** 2025-01-02

Ce guide explique comment ajouter rapidement de nouvelles fonctionnalités à l'application Mirror Area Mobile.

---

## Table des Matières

1. [Ajouter un Nouveau Service](#ajouter-un-nouveau-service)
2. [Ajouter un Nouveau Trigger](#ajouter-un-nouveau-trigger)
3. [Ajouter une Nouvelle Action](#ajouter-une-nouvelle-action)
4. [Ajouter un Nouvel Écran](#ajouter-un-nouvel-écran)
5. [Ajouter une Route de Navigation](#ajouter-une-route-de-navigation)
6. [Ajouter un Provider](#ajouter-un-provider)

---

## Ajouter un Nouveau Service

### 1. Ajouter les Métadonnées du Service

**Fichier:** `lib/core/constants/service_constants.dart`

```dart
// 1. Ajouter l'URL du logo
static String getServiceIconUrl(String service) {
  final urls = {
    // ... services existants
    'mon_service': 'https://path/to/logo.png',  // ← AJOUTER ICI
  };
  return urls[service] ?? urls['default']!;
}

// 2. Ajouter la couleur
static Color getServiceColor(String service) {
  final colors = {
    // ... services existants
    'mon_service': const Color(0xFF123456),  // ← AJOUTER ICI
  };
  return colors[service] ?? colors['default']!;
}

// 3. Ajouter l'icône
static IconData getServiceIcon(String service) {
  final icons = {
    // ... services existants
    'mon_service': Icons.mon_icone,  // ← AJOUTER ICI
  };
  return icons[service] ?? icons['default']!;
}
```

### 2. Configurer l'OAuth (si nécessaire)

**Fichier:** `lib/core/services/oauth_service.dart`

```dart
String _getServiceAuthUrl(String service) {
  final baseUrl = ApiConstants.baseUrl;

  // Si le service a une route dédiée
  if (service == 'mon_service') {
    return '$baseUrl/api/mon_service/connect';  // ← AJOUTER ICI
  }

  // Sinon, utilise la route générique
  return '$baseUrl/api/auth/$service';
}
```

### 3. Tester la Connexion

1. Lancer l'app : `flutter run`
2. Aller sur l'écran Services
3. Cliquer sur le nouveau service
4. Tester le flow OAuth complet

---

## Ajouter un Nouveau Trigger

### Backend d'abord

**Le trigger doit d'abord exister dans le backend** avant d'être utilisable dans le mobile.

### Utilisation dans le Mobile

Une fois le trigger créé dans le backend, il apparaîtra automatiquement dans l'app mobile via l'API `/api/modules/:identifier`.

**Aucune modification du code mobile n'est nécessaire** - le système de schéma dynamique gère tout automatiquement.

### Vérifier le Trigger

1. Créer une nouvelle Area
2. Sélectionner le service
3. Le nouveau trigger doit apparaître dans la liste
4. Configurer et tester

---

## Ajouter une Nouvelle Action

### Backend d'abord

**L'action doit d'abord exister dans le backend** avant d'être utilisable dans le mobile.

### Utilisation dans le Mobile

Comme pour les triggers, les actions apparaissent automatiquement une fois créées dans le backend.

**Aucune modification du code mobile n'est nécessaire** - le système de schéma dynamique gère tout automatiquement.

### Vérifier l'Action

1. Créer ou éditer une Area
2. Ajouter une action
3. Sélectionner le service
4. La nouvelle action doit apparaître dans la liste
5. Configurer et tester

---

## Ajouter un Nouvel Écran

### 1. Créer le Fichier de l'Écran

**Fichier:** `lib/features/mon_feature/screens/mon_ecran_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class MonEcranScreen extends StatefulWidget {
  const MonEcranScreen({super.key});

  @override
  State<MonEcranScreen> createState() => _MonEcranScreenState();
}

class _MonEcranScreenState extends State<MonEcranScreen> {
  @override
  void initState() {
    super.initState();
    // Initialisation
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mon Écran'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Mon contenu'),
            ElevatedButton(
              onPressed: () {
                // Action
              },
              child: const Text('Action'),
            ),
          ],
        ),
      ),
    );
  }
}
```

### 2. Ajouter la Route

Voir la section [Ajouter une Route de Navigation](#ajouter-une-route-de-navigation).

---

## Ajouter une Route de Navigation

### Utiliser GoRouter

**Fichier:** `lib/features/navigation/app_router.dart`

```dart
final appRouter = GoRouter(
  routes: [
    // ... routes existantes

    // AJOUTER VOTRE ROUTE ICI
    GoRoute(
      path: '/mon-ecran',
      name: 'mon-ecran',
      builder: (context, state) => const MonEcranScreen(),
    ),

    // Route avec paramètres
    GoRoute(
      path: '/mon-ecran/:id',
      name: 'mon-ecran-detail',
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return MonEcranDetailScreen(id: id);
      },
    ),
  ],
);
```

### Navigation vers l'Écran

```dart
// Navigation simple
context.go('/mon-ecran');

// Navigation avec paramètres
context.go('/mon-ecran/123');

// Navigation par nom
context.goNamed('mon-ecran');

// Navigation par nom avec paramètres
context.goNamed('mon-ecran-detail', pathParameters: {'id': '123'});

// Push (ajoute à la pile)
context.push('/mon-ecran');

// Pop (retour arrière)
context.pop();
```

---

## Ajouter un Provider

### 1. Créer le Repository/Provider

**Fichier:** `lib/features/mon_feature/data/mon_repository.dart`

```dart
import 'package:flutter/foundation.dart';
import '../../../core/models/result.dart';
import '../../../core/services/api_service.dart';
import '../../../core/errors/failures.dart';

class MonRepository extends ChangeNotifier {
  final ApiService _apiService;

  MonRepository({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  // État
  List<MonModel> _items = [];
  bool _isLoading = false;

  // Getters
  List<MonModel> get items => _items;
  bool get isLoading => _isLoading;

  // Méthodes
  Future<Result<List<MonModel>>> fetchItems(String token) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.get(
        '/api/mon-endpoint',
        headers: {'Authorization': 'Bearer $token'},
      );

      _items = (response['data'] as List)
          .map((item) => MonModel.fromJson(item))
          .toList();

      _isLoading = false;
      notifyListeners();

      return Result.success(_items);
    } on NetworkFailure catch (e) {
      _isLoading = false;
      notifyListeners();
      return Result.failure(e);
    } on ServerFailure catch (e) {
      _isLoading = false;
      notifyListeners();
      return Result.failure(e);
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return Result.failure(ServerFailure('Erreur: $e'));
    }
  }

  Future<Result<MonModel>> createItem(MonModel item, String token) async {
    try {
      final response = await _apiService.post(
        '/api/mon-endpoint',
        body: item.toJson(),
        headers: {'Authorization': 'Bearer $token'},
      );

      final newItem = MonModel.fromJson(response['data']);
      _items.add(newItem);
      notifyListeners();

      return Result.success(newItem);
    } catch (e) {
      return Result.failure(ServerFailure('Erreur: $e'));
    }
  }

  Future<Result<void>> deleteItem(String id, String token) async {
    try {
      await _apiService.delete(
        '/api/mon-endpoint/$id',
        headers: {'Authorization': 'Bearer $token'},
      );

      _items.removeWhere((item) => item.id == id);
      notifyListeners();

      return Result.success(null);
    } catch (e) {
      return Result.failure(ServerFailure('Erreur: $e'));
    }
  }
}
```

### 2. Enregistrer le Provider

**Fichier:** `lib/main.dart`

```dart
void main() {
  runApp(
    MultiProvider(
      providers: [
        // ... providers existants

        // AJOUTER VOTRE PROVIDER ICI
        ChangeNotifierProvider(
          create: (_) => MonRepository(),
        ),
      ],
      child: const MyApp(),
    ),
  );
}
```

### 3. Utiliser le Provider dans un Widget

```dart
class MonWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // Lire sans écouter les changements
    final monRepo = context.read<MonRepository>();

    // Écouter les changements
    final items = context.watch<MonRepository>().items;
    final isLoading = context.watch<MonRepository>().isLoading;

    // Sélectionner une propriété spécifique
    final itemCount = context.select<MonRepository, int>(
      (repo) => repo.items.length,
    );

    return Column(
      children: [
        if (isLoading)
          const CircularProgressIndicator()
        else
          ListView.builder(
            itemCount: items.length,
            itemBuilder: (context, index) {
              return ListTile(
                title: Text(items[index].name),
              );
            },
          ),
        ElevatedButton(
          onPressed: () async {
            final token = 'user-token';
            final result = await monRepo.fetchItems(token);

            if (result.isSuccess) {
              // Succès
              print('Items chargés: ${result.data?.length}');
            } else {
              // Erreur
              print('Erreur: ${result.failure?.message}');
            }
          },
          child: const Text('Charger'),
        ),
      ],
    );
  }
}
```

---

## Checklist pour Ajouter une Feature

### Nouveau Service
- [ ] Ajouter logo, couleur, icône dans `service_constants.dart`
- [ ] Configurer OAuth dans `oauth_service.dart` (si nécessaire)
- [ ] Tester la connexion OAuth
- [ ] Vérifier que le service apparaît dans l'écran Services

### Nouveau Trigger/Action
- [ ] Créer le trigger/action dans le backend
- [ ] Vérifier que le schéma est correct via l'API
- [ ] Tester dans l'app mobile (aucun code mobile nécessaire)

### Nouvel Écran
- [ ] Créer le fichier screen dans `lib/features/mon_feature/screens/`
- [ ] Ajouter la route dans `app_router.dart`
- [ ] Créer le repository si nécessaire
- [ ] Enregistrer le provider dans `main.dart`
- [ ] Tester la navigation
- [ ] Tester le chargement des données

### Nouveau Provider
- [ ] Créer le repository avec `ChangeNotifier`
- [ ] Implémenter les méthodes avec `Result<T>`
- [ ] Appeler `notifyListeners()` après les changements d'état
- [ ] Enregistrer dans `MultiProvider` dans `main.dart`
- [ ] Tester avec `context.read()`, `context.watch()`, `context.select()`

---

## Conseils et Bonnes Pratiques

### Performance

1. **Utilisez `context.select()` pour des propriétés spécifiques**
   ```dart
   // ✅ Bon - ne rebuild que si itemCount change
   final itemCount = context.select<MonRepository, int>(
     (repo) => repo.items.length,
   );

   // ❌ Mauvais - rebuild à chaque changement du repository
   final repo = context.watch<MonRepository>();
   final itemCount = repo.items.length;
   ```

2. **Évitez `context.watch()` dans des widgets qui rebuild souvent**
   - Utilisez plutôt `Consumer` ou `Selector` widgets

### Gestion d'Erreurs

1. **Toujours utiliser `Result<T>` pour les opérations asynchrones**
   ```dart
   final result = await monRepo.fetchItems(token);

   if (result.isSuccess) {
     // Succès
   } else {
     // Afficher l'erreur à l'utilisateur
     ScaffoldMessenger.of(context).showSnackBar(
       SnackBar(content: Text(result.failure!.message)),
     );
   }
   ```

2. **Gérer les différents types d'erreurs**
   ```dart
   if (result.failure is NetworkFailure) {
     // Pas de connexion internet
   } else if (result.failure is AuthFailure) {
     // Problème d'authentification
   } else {
     // Autre erreur
   }
   ```

### État de Chargement

1. **Toujours gérer les états de chargement**
   ```dart
   if (isLoading) {
     return const CircularProgressIndicator();
   }

   if (items.isEmpty) {
     return const Text('Aucun élément');
   }

   return ListView.builder(...);
   ```

### Navigation

1. **Préférer `context.go()` pour navigation principale**
   ```dart
   context.go('/home');  // Remplace toute la pile
   ```

2. **Utiliser `context.push()` pour navigation temporaire**
   ```dart
   context.push('/details');  // Ajoute à la pile
   ```

---

## Exemples Complets

### Exemple: Ajouter un Service "Notion"

```dart
// 1. service_constants.dart
'notion': 'https://notion.so/logo.png',
'notion': const Color(0xFF000000),
'notion': Icons.note,

// 2. oauth_service.dart
if (service == 'notion') {
  return '$baseUrl/api/notion/authorize';
}

// 3. Tester dans l'app - c'est tout! 🎉
```

### Exemple: Ajouter un Écran "Statistiques"

```dart
// 1. Créer le screen
// lib/features/stats/screens/stats_screen.dart
class StatsScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Statistiques')),
      body: const Center(child: Text('Mes stats')),
    );
  }
}

// 2. Ajouter la route
// lib/features/navigation/app_router.dart
GoRoute(
  path: '/stats',
  name: 'stats',
  builder: (context, state) => const StatsScreen(),
),

// 3. Naviguer
context.go('/stats');
```

---

## Ressources

- [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) - Architecture générale
- [AREA_INTEGRATION.md](AREA_INTEGRATION.md) - Système de workflows
- [OAUTH_INTEGRATION.md](OAUTH_INTEGRATION.md) - OAuth et services
- [SCHEMA_SYSTEM_DOCUMENTATION.md](SCHEMA_SYSTEM_DOCUMENTATION.md) - Schémas dynamiques

---

**Document Version:** 1.0.0
**Last Updated:** 2025-01-02
**Maintained By:** Development Team
