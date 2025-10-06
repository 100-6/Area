# Exemples d'utilisation de la fonctionnalité AREA

## 1. Ajouter l'écran AREA dans votre navigation

### Option A : Bottom Navigation Bar

```dart
import 'package:flutter/material.dart';
import 'package:your_app/features/areas/screens/areas_list_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const AreasListScreen(),  // Écran AREA
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.auto_awesome),
            label: 'Applets',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
```

### Option B : Drawer Menu

```dart
import 'package:flutter/material.dart';
import 'package:your_app/features/areas/screens/areas_list_screen.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(color: Colors.blue),
            child: Text(
              'Menu',
              style: TextStyle(color: Colors.white, fontSize: 24),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.home),
            title: const Text('Home'),
            onTap: () {
              Navigator.pop(context);
              // Navigate to home
            },
          ),
          ListTile(
            leading: const Icon(Icons.auto_awesome),
            title: const Text('My Applets'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const AreasListScreen(),
                ),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('Profile'),
            onTap: () {
              Navigator.pop(context);
              // Navigate to profile
            },
          ),
        ],
      ),
    );
  }
}
```

### Option C : Routes nommées

```dart
import 'package:flutter/material.dart';
import 'package:your_app/features/areas/areas.dart';

class AppRoutes {
  static const String home = '/';
  static const String areasList = '/areas';
  static const String areaEditor = '/areas/editor';
  static const String serviceSelector = '/areas/services';

  static Map<String, WidgetBuilder> routes = {
    home: (context) => const HomeScreen(),
    areasList: (context) => const AreasListScreen(),
    areaEditor: (context) => const AreaEditorScreen(),
    serviceSelector: (context) => const ServiceSelectorScreen(nodeType: 'trigger'),
  };
}

// Dans main.dart
MaterialApp(
  routes: AppRoutes.routes,
  initialRoute: AppRoutes.home,
);

// Pour naviguer
Navigator.pushNamed(context, AppRoutes.areasList);
```

## 2. Intégrer l'authentification

```dart
// Créer un wrapper pour obtenir le token
import 'package:your_app/core/services/auth_service.dart';

class AuthenticatedAreasListScreen extends StatelessWidget {
  const AuthenticatedAreasListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<String>(
      future: AuthService().getToken(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (snapshot.hasError || !snapshot.hasData) {
          return Scaffold(
            body: Center(
              child: Text('Authentication error: ${snapshot.error}'),
            ),
          );
        }

        return AreasListScreen(token: snapshot.data!);
      },
    );
  }
}
```

## 3. Utilisation avec Provider/Riverpod

### Avec Provider

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:your_app/features/areas/services/area_service.dart';
import 'package:your_app/features/areas/models/area.dart';

class AreaProvider extends ChangeNotifier {
  final AreaService _areaService = AreaService();
  List<Area> _areas = [];
  bool _isLoading = false;
  String? _error;

  List<Area> get areas => _areas;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadAreas(String token) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _areas = await _areaService.getAreas(token);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> toggleArea(String areaId, bool isActive, String token) async {
    try {
      await _areaService.toggleArea(
        areaId: areaId,
        isActive: isActive,
        token: token,
      );
      await loadAreas(token);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }
}

// Utilisation dans l'écran
class AreasListScreenWithProvider extends StatelessWidget {
  const AreasListScreenWithProvider({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AreaProvider()..loadAreas('token'),
      child: Consumer<AreaProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return Center(child: Text('Error: ${provider.error}'));
          }

          return ListView.builder(
            itemCount: provider.areas.length,
            itemBuilder: (context, index) {
              final area = provider.areas[index];
              return ListTile(
                title: Text(area.name),
                trailing: Switch(
                  value: area.isActive,
                  onChanged: (value) {
                    provider.toggleArea(area.id, value, 'token');
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
```

## 4. Créer des templates d'AREAs

```dart
class AreaTemplate {
  final String name;
  final String description;
  final String triggerService;
  final String triggerAction;
  final List<ActionTemplate> actions;

  AreaTemplate({
    required this.name,
    required this.description,
    required this.triggerService,
    required this.triggerAction,
    required this.actions,
  });
}

class ActionTemplate {
  final String service;
  final String action;

  ActionTemplate({required this.service, required this.action});
}

// Templates prédéfinis
final popularTemplates = [
  AreaTemplate(
    name: 'Daily Morning Notification',
    description: 'Get notified every morning at 8am',
    triggerService: 'timer',
    triggerAction: 'daily_at_time',
    actions: [
      ActionTemplate(service: 'console', action: 'log_message'),
    ],
  ),
  AreaTemplate(
    name: 'Hourly Reminder',
    description: 'Receive a reminder every hour',
    triggerService: 'timer',
    triggerAction: 'every_x_minutes',
    actions: [
      ActionTemplate(service: 'console', action: 'log_message'),
    ],
  ),
];

// Écran de templates
class AreaTemplatesScreen extends StatelessWidget {
  const AreaTemplatesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Popular Templates')),
      body: ListView.builder(
        itemCount: popularTemplates.length,
        itemBuilder: (context, index) {
          final template = popularTemplates[index];
          return Card(
            margin: const EdgeInsets.all(8),
            child: ListTile(
              title: Text(template.name),
              subtitle: Text(template.description),
              trailing: const Icon(Icons.arrow_forward),
              onTap: () {
                // Créer l'AREA à partir du template
                _createAreaFromTemplate(context, template);
              },
            ),
          );
        },
      ),
    );
  }

  Future<void> _createAreaFromTemplate(
    BuildContext context,
    AreaTemplate template,
  ) async {
    // Navigation vers l'éditeur avec le template
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AreaEditorScreen(
          template: template,
        ),
      ),
    );
  }
}
```

## 5. Tests unitaires

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:your_app/features/areas/services/area_service.dart';
import 'package:your_app/features/areas/models/area.dart';

class MockApiService extends Mock implements ApiService {}

void main() {
  group('AreaService', () {
    late AreaService areaService;
    late MockApiService mockApiService;

    setUp(() {
      mockApiService = MockApiService();
      areaService = AreaService(apiService: mockApiService);
    });

    test('getAreas returns list of areas', () async {
      // Arrange
      final mockResponse = {
        'areas': [
          {
            'id': '1',
            'user_id': 'user1',
            'name': 'Test Area',
            'is_active': true,
            'execution_count': 0,
            'created_at': DateTime.now().toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
          }
        ]
      };

      when(mockApiService.get(any, headers: anyNamed('headers')))
          .thenAnswer((_) async => mockResponse);

      // Act
      final areas = await areaService.getAreas('test_token');

      // Assert
      expect(areas, isA<List<Area>>());
      expect(areas.length, 1);
      expect(areas.first.name, 'Test Area');
    });

    test('createArea creates new area', () async {
      // Arrange
      final mockResponse = {
        'area': {
          'id': '2',
          'user_id': 'user1',
          'name': 'New Area',
          'is_active': true,
          'execution_count': 0,
          'created_at': DateTime.now().toIso8601String(),
          'updated_at': DateTime.now().toIso8601String(),
        }
      };

      when(mockApiService.post(
        any,
        body: anyNamed('body'),
        headers: anyNamed('headers'),
      )).thenAnswer((_) async => mockResponse);

      // Act
      final area = await areaService.createArea(
        name: 'New Area',
        token: 'test_token',
      );

      // Assert
      expect(area, isA<Area>());
      expect(area.name, 'New Area');
    });
  });
}
```

## 6. Widget tests

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:your_app/features/areas/screens/areas_list_screen.dart';

void main() {
  testWidgets('AreasListScreen shows empty state', (tester) async {
    // Build the widget
    await tester.pumpWidget(
      const MaterialApp(
        home: AreasListScreen(),
      ),
    );

    // Verify empty state is shown
    expect(find.text('No applets yet'), findsOneWidget);
    expect(find.text('Create your first automation'), findsOneWidget);
  });

  testWidgets('AreasListScreen has create button', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: AreasListScreen(),
      ),
    );

    // Find the FAB
    expect(find.byType(FloatingActionButton), findsOneWidget);
    expect(find.text('Create'), findsOneWidget);
  });
}
```

## 7. Personnaliser les couleurs

```dart
import 'package:flutter/material.dart';

class AreaTheme {
  static const Color triggerColor = Color(0xFF2196F3); // Bleu
  static const Color actionColor = Color(0xFF4CAF50);  // Vert
  static const Color errorColor = Color(0xFFF44336);   // Rouge
  static const Color successColor = Color(0xFF4CAF50); // Vert
  static const Color backgroundColor = Color(0xFFF5F5F5); // Gris clair

  static ThemeData getTheme() {
    return ThemeData(
      primaryColor: triggerColor,
      colorScheme: ColorScheme.fromSeed(
        seedColor: triggerColor,
        secondary: actionColor,
      ),
      scaffoldBackgroundColor: backgroundColor,
      cardTheme: CardTheme(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
      ),
    );
  }
}
```

Ces exemples couvrent les cas d'utilisation les plus courants de la fonctionnalité AREA.
