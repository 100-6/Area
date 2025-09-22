import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../auth_provider.dart';
import '../../../../core/constants/app_routes.dart';
import '../../domain/auth_status.dart';
import '../../../../shared/widgets/gradient_background.dart';

/// Écran de démarrage qui détermine où rediriger l'utilisateur
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.0, 0.6, curve: Curves.easeIn),
    ));

    _scaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.0, 0.6, curve: Curves.elasticOut),
    ));

    _animationController.forward();

    // Écouter les changements d'état d'authentification
    _checkAuthenticationStatus();
  }

  void _checkAuthenticationStatus() {
    final authProvider = context.read<AuthProvider>();
    
    // Délai pour l'animation puis navigation
    Future.delayed(const Duration(milliseconds: 2500), () {
      if (mounted) {
        switch (authProvider.status) {
          case AuthStatus.authenticated:
            context.go(AppRoutes.home);
            break;
          case AuthStatus.unauthenticated:
            context.go(AppRoutes.login);
            break;
          case AuthStatus.unknown:
            // Attendre un peu plus et vérifier à nouveau
            Future.delayed(const Duration(milliseconds: 500), () {
              if (mounted) {
                if (authProvider.status == AuthStatus.authenticated) {
                  context.go(AppRoutes.home);
                } else {
                  context.go(AppRoutes.login);
                }
              }
            });
            break;
        }
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      body: GradientBackground(
        child: Center(
        child: AnimatedBuilder(
          animation: _animationController,
          builder: (context, child) {
            return FadeTransition(
              opacity: _fadeAnimation,
              child: ScaleTransition(
                scale: _scaleAnimation,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Logo de l'application
                    Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: Image.asset(
                          'assets/images/logo.png',
                          width: 120,
                          height: 120,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            // Fallback en cas d'erreur
                            return Icon(
                              Icons.lock_person_rounded,
                              size: 60,
                              color: theme.colorScheme.primary,
                            );
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    // Nom de l'application
                    Text(
                      'Clean Login',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Authentification moderne',
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 48),
                    // Indicateur de chargement
                    SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          theme.colorScheme.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
        ),
      ),
    );
  }
}
