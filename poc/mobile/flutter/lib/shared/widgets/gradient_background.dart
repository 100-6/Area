import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

/// Widget de fond avec gradient blanc et touches de rose dans les coins
class GradientBackground extends StatelessWidget {
  const GradientBackground({
    super.key,
    required this.child,
  });

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: RadialGradient(
          colors: [
            Colors.white,
            Colors.white,
            AppTheme.primaryPink.withOpacity(0.03),
          ],
          stops: const [0.0, 0.7, 1.0],
          center: Alignment.center,
          radius: 1.5,
        ),
      ),
      child: Stack(
        children: [
          // Touches de rose dans les coins
          _buildCornerAccents(),
          // Contenu principal
          child,
        ],
      ),
    );
  }

  Widget _buildCornerAccents() {
    return Stack(
      children: [
        // Coin supérieur gauche
        Positioned(
          top: -50,
          left: -50,
          child: Container(
            width: 150,
            height: 150,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  AppTheme.primaryPink.withOpacity(0.1),
                  AppTheme.primaryPink.withOpacity(0.05),
                  Colors.transparent,
                ],
                stops: const [0.0, 0.6, 1.0],
              ),
            ),
          ),
        ),
        // Coin supérieur droit
        Positioned(
          top: -30,
          right: -30,
          child: Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  AppTheme.primaryPink.withOpacity(0.08),
                  AppTheme.primaryPink.withOpacity(0.03),
                  Colors.transparent,
                ],
                stops: const [0.0, 0.7, 1.0],
              ),
            ),
          ),
        ),
        // Coin inférieur gauche
        Positioned(
          bottom: -40,
          left: -40,
          child: Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  AppTheme.primaryPink.withOpacity(0.06),
                  AppTheme.primaryPink.withOpacity(0.02),
                  Colors.transparent,
                ],
                stops: const [0.0, 0.5, 1.0],
              ),
            ),
          ),
        ),
        // Coin inférieur droit
        Positioned(
          bottom: -60,
          right: -60,
          child: Container(
            width: 180,
            height: 180,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  AppTheme.primaryPink.withOpacity(0.12),
                  AppTheme.primaryPink.withOpacity(0.06),
                  AppTheme.primaryPink.withOpacity(0.02),
                  Colors.transparent,
                ],
                stops: const [0.0, 0.4, 0.7, 1.0],
              ),
            ),
          ),
        ),
        // Accent central subtil
        Positioned(
          top: 200,
          right: -20,
          child: Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  AppTheme.primaryPink.withOpacity(0.04),
                  Colors.transparent,
                ],
                stops: const [0.0, 1.0],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Version simplifiée pour les petits conteneurs
class SimpleGradientBackground extends StatelessWidget {
  const SimpleGradientBackground({
    super.key,
    required this.child,
  });

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white,
            AppTheme.primaryPink.withOpacity(0.02),
            Colors.white,
            AppTheme.primaryPink.withOpacity(0.03),
          ],
          stops: const [0.0, 0.3, 0.7, 1.0],
        ),
      ),
      child: child,
    );
  }
}
