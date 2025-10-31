import 'package:flutter/material.dart';
import '../../../core/services/oauth_service.dart';
import '../../../core/constants/service_constants.dart';

/// Dialogue pour demander à l'utilisateur de se connecter à un service
class ServiceConnectionDialog extends StatelessWidget {
  final String serviceName;
  final OAuthProvider provider;

  const ServiceConnectionDialog({
    super.key,
    required this.serviceName,
    required this.provider,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      contentPadding: EdgeInsets.zero,
      content: Container(
        width: 320,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.white,
              Colors.grey[50]!,
            ],
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header avec icône
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    ServiceConstants.getServiceColor(provider.name),
                    ServiceConstants.getServiceColor(provider.name).withValues(alpha: 0.8),
                  ],
                ),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              child: Column(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: _buildProviderIcon(provider),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    provider.displayName,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),

            // Contenu
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Text(
                    'Connexion requise',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[800],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Vous devez connecter votre compte ${provider.displayName} pour utiliser ce service.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Boutons
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(context, false),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            side: BorderSide(color: Colors.grey[300]!),
                          ),
                          child: const Text(
                            'Annuler',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => Navigator.pop(context, true),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: ServiceConstants.getServiceColor(provider.name),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            'Connecter',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Construit l'icône/logo du provider
  Widget _buildProviderIcon(OAuthProvider provider) {
    final iconUrl = ServiceConstants.getServiceIconUrl(provider.name);

    if (iconUrl != null) {
      return Image.network(
        iconUrl,
        width: 36,
        height: 36,
        fit: BoxFit.contain,
        color: Colors.white,
        colorBlendMode: BlendMode.srcIn,
        errorBuilder: (context, error, stackTrace) {
          // Fallback sur icône Material en cas d'erreur
          final icon = ServiceConstants.getServiceIcon(provider.name);
          return Icon(icon, size: 36, color: Colors.white);
        },
      );
    }

    // Fallback sur icône Material
    final icon = ServiceConstants.getServiceIcon(provider.name);
    return Icon(icon, size: 36, color: Colors.white);
  }

  /// Affiche le dialogue et retourne true si l'utilisateur veut se connecter
  static Future<bool?> show(
    BuildContext context, {
    required String serviceName,
    required OAuthProvider provider,
  }) {
    return showDialog<bool>(
      context: context,
      builder: (context) => ServiceConnectionDialog(
        serviceName: serviceName,
        provider: provider,
      ),
    );
  }
}
