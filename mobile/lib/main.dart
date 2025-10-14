import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import 'core/theme/app_theme.dart';
import 'core/constants/app_router.dart';
import 'core/services/deep_link_service.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/auth/presentation/auth_provider.dart';

void main() {
  runApp(const AutoApp());
}

/// Application principale avec système d'authentification
class AutoApp extends StatefulWidget {
  const AutoApp({super.key});

  @override
  State<AutoApp> createState() => _AutoAppState();
}

class _AutoAppState extends State<AutoApp> {
  late final AuthRepository _authRepository;
  late final AuthProvider _authProvider;
  late final GoRouter _router;
  late final DeepLinkService _deepLinkService;

  @override
  void initState() {
    super.initState();
    _authRepository = AuthRepository();
    _authProvider = AuthProvider(authRepository: _authRepository);
    _deepLinkService = DeepLinkService();

    // Le router doit être créé après l'initialisation du provider
    _router = AppRouter.router(_authProvider);

    // Initialiser le service de deep links avec l'AuthRepository et le callback
    _deepLinkService.initialize(
      _authRepository,
      onServiceConnected: (serviceName) {
        // Callback quand un service est connecté via OAuth
        print('Service $serviceName connecté ! Le deep link ramène automatiquement à l\'app.');
      },
    );
    _deepLinkService.startListening();
    _deepLinkService.checkInitialLink();

    // Forcer un refresh initial après un court délai
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _authProvider.refresh();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Repository
        Provider<AuthRepository>.value(value: _authRepository),
        
        // Providers d'état
        ChangeNotifierProvider<AuthProvider>.value(value: _authProvider),
      ],
      child: MaterialApp.router(
        title: 'Auto',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        themeMode: ThemeMode.light,
        routerConfig: _router,
      ),
    );
  }

  @override
  void dispose() {
    _deepLinkService.stopListening();
    _authRepository.dispose();
    _authProvider.dispose();
    super.dispose();
  }
}
