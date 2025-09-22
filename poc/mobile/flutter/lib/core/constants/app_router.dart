import 'package:go_router/go_router.dart';

import '../../features/auth/domain/auth_status.dart';
import '../../features/auth/presentation/auth_provider.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/signup_screen.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import 'app_routes.dart';

/// Configuration du routeur de l'application
class AppRouter {
  static GoRouter router(AuthProvider authProvider) {
    return GoRouter(
      initialLocation: AppRoutes.splash,
      redirect: (context, state) {
        final authStatus = authProvider.status;
        final isLoggedIn = authStatus == AuthStatus.authenticated;
        final isLoggingIn = state.matchedLocation == AppRoutes.login ||
            state.matchedLocation == AppRoutes.signUp;

        // Si l'utilisateur n'est pas connecté et n'est pas sur une page de connexion,
        // rediriger vers la page de connexion
        if (!isLoggedIn && !isLoggingIn && state.matchedLocation != AppRoutes.splash) {
          return AppRoutes.login;
        }

        // Si l'utilisateur est connecté et est sur une page de connexion,
        // rediriger vers la page d'accueil
        if (isLoggedIn && isLoggingIn) {
          return AppRoutes.home;
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
        GoRoute(
          path: AppRoutes.home,
          name: 'home',
          builder: (context, state) => const HomeScreen(),
        ),
      ],
    );
  }
}
