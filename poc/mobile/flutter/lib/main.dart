import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import 'core/theme/app_theme.dart';
import 'core/constants/app_router.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/auth/presentation/auth_provider.dart';

void main() {
  runApp(const CleanLoginApp());
}

/// Application principale avec système d'authentification
class CleanLoginApp extends StatefulWidget {
  const CleanLoginApp({super.key});

  @override
  State<CleanLoginApp> createState() => _CleanLoginAppState();
}

class _CleanLoginAppState extends State<CleanLoginApp> {
  late final AuthRepository _authRepository;
  late final AuthProvider _authProvider;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _authRepository = AuthRepository();
    _authProvider = AuthProvider(authRepository: _authRepository);
    _router = AppRouter.router(_authProvider);
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
        title: 'Clean Login App',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: ThemeMode.system,
        routerConfig: _router,
      ),
    );
  }

  @override
  void dispose() {
    _authProvider.dispose();
    super.dispose();
  }
}
