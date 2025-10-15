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
  final GlobalKey<ScaffoldMessengerState> _scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

  @override
  void initState() {
    super.initState();
    _authRepository = AuthRepository();
    _authProvider = AuthProvider(authRepository: _authRepository);
    _deepLinkService = DeepLinkService();

    // Le router doit être créé après l'initialisation du provider
    _router = AppRouter.router(_authProvider);

    // Initialiser le service de deep links avec l'AuthRepository et les callbacks
    _deepLinkService.initialize(
      _authRepository,
      onServiceConnected: (serviceName) {
        // Callback quand un service est connecté via OAuth
        print('Service $serviceName connecté ! Le deep link ramène automatiquement à l\'app.');
        _showSuccessMessage('Service $serviceName connecté avec succès !');
      },
      onOAuthError: (error) {
        // Callback en cas d'erreur OAuth
        print('Erreur OAuth reçue: $error');
        _showErrorMessage('Échec de l\'authentification: $error');
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

  /// Affiche un message d'erreur à l'utilisateur
  void _showErrorMessage(String message) {
    _scaffoldMessengerKey.currentState?.showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(fontSize: 15),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.red[700],
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 5),
        action: SnackBarAction(
          label: 'OK',
          textColor: Colors.white,
          onPressed: () {},
        ),
      ),
    );
  }

  /// Affiche un message de succès à l'utilisateur
  void _showSuccessMessage(String message) {
    _scaffoldMessengerKey.currentState?.showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_outline, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(fontSize: 15),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF4CAF50),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );
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
        scaffoldMessengerKey: _scaffoldMessengerKey,
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
