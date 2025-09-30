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
    )..repeat();

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
            context.go(AppRoutes.dashboard);
            break;
          case AuthStatus.unauthenticated:
            context.go(AppRoutes.login);
            break;
          case AuthStatus.unknown:
            // Attendre un peu plus et vérifier à nouveau
            Future.delayed(const Duration(milliseconds: 500), () {
              if (mounted) {
                if (authProvider.status == AuthStatus.authenticated) {
                  context.go(AppRoutes.dashboard);
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
                    Image.asset(
                      'assets/images/logo.png',
                      width: 150,
                      height: 150,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        // Fallback en cas d'erreur
                        return Icon(
                          Icons.lock_person_rounded,
                          size: 100,
                          color: theme.colorScheme.primary,
                        );
                      },
                    ),
                    const SizedBox(height: 48),
                    // Loader original avec animation
                    SizedBox(
                      width: 60,
                      height: 60,
                      child: Stack(
                        children: [
                          // Premier cercle
                          Positioned.fill(
                            child: CircularProgressIndicator(
                              strokeWidth: 3,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                theme.colorScheme.primary.withOpacity(0.3),
                              ),
                            ),
                          ),
                          // Deuxième cercle animé
                          Positioned.fill(
                            child: RotationTransition(
                              turns: _animationController,
                              child: CircularProgressIndicator(
                                strokeWidth: 3,
                                value: 0.3,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  theme.colorScheme.primary,
                                ),
                              ),
                            ),
                          ),
                          // Points centraux
                          Center(
                            child: Container(
                              width: 20,
                              height: 20,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: theme.colorScheme.primary.withOpacity(0.2),
                              ),
                              child: Center(
                                child: Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: theme.colorScheme.primary,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
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
