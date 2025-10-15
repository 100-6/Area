import 'package:go_router/go_router.dart';

import '../../features/auth/domain/auth_status.dart';
import '../../features/auth/presentation/auth_provider.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/signup_screen.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/navigation/main_navigation.dart';
import '../../features/pages/dashboard/dashboard_screen.dart';
import '../../features/pages/profile/profile_screen.dart';
import '../../features/pages/area/area_screen.dart';
import '../../features/pages/settings/settings_screen.dart';
import 'app_routes.dart';

/// Configuration du routeur de l'application
class AppRouter {
  static GoRouter router(AuthProvider authProvider) {
    return GoRouter(
      initialLocation: AppRoutes.splash,
      refreshListenable: authProvider,
      redirect: (context, state) {
        final authStatus = authProvider.status;
        final isLoggedIn = authStatus == AuthStatus.authenticated;
        final isLoggingIn = state.matchedLocation == AppRoutes.login ||
            state.matchedLocation == AppRoutes.signUp;
        final isNavPage = state.matchedLocation == AppRoutes.dashboard ||
            state.matchedLocation == AppRoutes.profile ||
            state.matchedLocation == AppRoutes.area ||
            state.matchedLocation == AppRoutes.settings;

        // Gérer les deep links OAuth (ne pas les traiter comme des routes)
        if (state.matchedLocation.startsWith('/auth/') || 
            state.matchedLocation.startsWith('/service/')) {
          // Rediriger vers le dashboard (le DeepLinkService gère le callback)
          return isLoggedIn ? AppRoutes.dashboard : AppRoutes.login;
        }

        // Si l'utilisateur n'est pas connecté et n'est pas sur une page de connexion,
        // rediriger vers la page de connexion
        if (!isLoggedIn && !isLoggingIn && state.matchedLocation != AppRoutes.splash) {
          return AppRoutes.login;
        }

        // Si l'utilisateur est connecté et est sur une page de connexion,
        // rediriger vers le dashboard
        if (isLoggedIn && isLoggingIn) {
          return AppRoutes.dashboard;
        }

        // Si l'utilisateur est connecté et accède aux pages de navigation, autoriser
        if (isLoggedIn && isNavPage) {
          return null;
        }

        // Pas de redirection nécessaire
        return null;
      },
      routes: [
        GoRoute(
          path: AppRoutes.splash,
          name: 'splash',
          builder: (context, state) => const SplashScreen(),
        ),
        GoRoute(
          path: AppRoutes.login,
          name: 'login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: AppRoutes.signUp,
          name: 'signup',
          builder: (context, state) => const SignUpScreen(),
        ),
        ShellRoute(
          builder: (context, state, child) {
            return MainNavigation(child: child);
          },
          routes: [
            GoRoute(
              path: AppRoutes.dashboard,
              name: 'dashboard',
              builder: (context, state) => const DashboardScreen(),
            ),
            GoRoute(
              path: AppRoutes.profile,
              name: 'profile',
              builder: (context, state) => const ProfileScreen(),
            ),
            GoRoute(
              path: AppRoutes.area,
              name: 'area',
              builder: (context, state) => const AreaScreen(),
            ),
            GoRoute(
              path: AppRoutes.settings,
              name: 'settings',
              builder: (context, state) => const SettingsScreen(),
            ),
          ],
        ),
      ],
    );
  }
}