import 'package:flutter/material.dart';
import '../../core/services/oauth_service.dart';
import '../../core/constants/service_constants.dart';

/// Bouton OAuth stylisé
class OAuthButton extends StatelessWidget {
  final OAuthProvider provider;
  final VoidCallback onPressed;
  final bool isLoading;

  const OAuthButton({
    super.key,
    required this.provider,
    required this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: ServiceConstants.getServiceColor(provider.name),
          foregroundColor: Colors.white,
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _getProviderIcon(provider),
                  const SizedBox(width: 12),
                  Text(
                    'Continuer avec ${provider.displayName}',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  /// Récupère l'icône/logo du provider
  Widget _getProviderIcon(OAuthProvider provider) {
    final iconUrl = ServiceConstants.getServiceIconUrl(provider.name);

    if (iconUrl != null) {
      return Image.network(
        iconUrl,
        width: 24,
        height: 24,
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) {
          // Fallback sur icône Material en cas d'erreur
          final icon = ServiceConstants.getServiceIcon(provider.name);
          return Icon(icon, size: 24);
        },
      );
    }

    // Fallback sur icône Material
    final icon = ServiceConstants.getServiceIcon(provider.name);
    return Icon(icon, size: 24);
  }
}

/// Widget pour afficher tous les boutons OAuth disponibles
class OAuthButtons extends StatefulWidget {
  final Function(OAuthProvider provider)? onProviderSelected;

  const OAuthButtons({
    super.key,
    this.onProviderSelected,
  });

  @override
  State<OAuthButtons> createState() => _OAuthButtonsState();
}

class _OAuthButtonsState extends State<OAuthButtons> {
  final OAuthService _oauthService = OAuthService();
  OAuthProvider? _loadingProvider;

  Future<void> _handleOAuthLogin(OAuthProvider provider) async {
    setState(() {
      _loadingProvider = provider;
    });

    try {
      final result = await _oauthService.signInWithProvider(provider);
      
      if (result.isSuccess) {
        // Succès - le token sera géré par le callback
        widget.onProviderSelected?.call(provider);
      } else if (result.isPending) {
        // En attente du callback (navigateur ouvert)
        widget.onProviderSelected?.call(provider);
      } else if (result.error != null) {
        // Erreur
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.error!),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } finally {
      if (mounted) {
        setState(() {
          _loadingProvider = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ...OAuthService.authenticationProviders.map(
          (provider) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: OAuthButton(
              provider: provider,
              onPressed: () => _handleOAuthLogin(provider),
              isLoading: _loadingProvider == provider,
            ),
          ),
        ),
      ],
    );
  }
}

/// Petit bouton OAuth compact (pour une grille)
class CompactOAuthButton extends StatelessWidget {
  final OAuthProvider provider;
  final VoidCallback onPressed;
  final bool isLoading;

  const CompactOAuthButton({
    super.key,
    required this.provider,
    required this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: isLoading ? null : onPressed,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 60,
        height: 60,
        decoration: BoxDecoration(
          color: ServiceConstants.getServiceColor(provider.name),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: ServiceConstants.getServiceColor(provider.name).withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Center(
          child: isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : _getProviderIcon(provider),
        ),
      ),
    );
  }

  /// Récupère l'icône/logo du provider
  Widget _getProviderIcon(OAuthProvider provider) {
    final iconUrl = ServiceConstants.getServiceIconUrl(provider.name);

    if (iconUrl != null) {
      return Image.network(
        iconUrl,
        width: 28,
        height: 28,
        fit: BoxFit.contain,
        color: Colors.white,
        colorBlendMode: BlendMode.srcIn,
        errorBuilder: (context, error, stackTrace) {
          // Fallback sur icône Material en cas d'erreur
          final icon = ServiceConstants.getServiceIcon(provider.name);
          return Icon(icon, size: 28, color: Colors.white);
        },
      );
    }

    // Fallback sur icône Material
    final icon = ServiceConstants.getServiceIcon(provider.name);
    return Icon(icon, size: 28, color: Colors.white);
  }
}

/// Grille compacte de boutons OAuth
class CompactOAuthButtons extends StatefulWidget {
  final Function(OAuthProvider provider)? onProviderSelected;

  const CompactOAuthButtons({
    super.key,
    this.onProviderSelected,
  });

  @override
  State<CompactOAuthButtons> createState() => _CompactOAuthButtonsState();
}

class _CompactOAuthButtonsState extends State<CompactOAuthButtons> {
  final OAuthService _oauthService = OAuthService();
  OAuthProvider? _loadingProvider;

  Future<void> _handleOAuthLogin(OAuthProvider provider) async {
    setState(() {
      _loadingProvider = provider;
    });

    try {
      final result = await _oauthService.signInWithProvider(provider);
      
      if (result.isSuccess || result.isPending) {
        widget.onProviderSelected?.call(provider);
      } else if (result.error != null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.error!),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } finally {
      if (mounted) {
        setState(() {
          _loadingProvider = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final providers = OAuthService.authenticationProviders;

    // Séparer les providers en deux lignes : 3 sur la première, le reste sur la deuxième
    final firstRow = providers.take(3).toList();
    final secondRow = providers.skip(3).toList();

    return Column(
      children: [
        // Première ligne - 3 boutons
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: firstRow.map((provider) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: CompactOAuthButton(
                provider: provider,
                onPressed: () => _handleOAuthLogin(provider),
                isLoading: _loadingProvider == provider,
              ),
            );
          }).toList(),
        ),
        if (secondRow.isNotEmpty) ...[
          const SizedBox(height: 16),
          // Deuxième ligne - reste des boutons
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: secondRow.map((provider) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: CompactOAuthButton(
                  provider: provider,
                  onPressed: () => _handleOAuthLogin(provider),
                  isLoading: _loadingProvider == provider,
                ),
              );
            }).toList(),
          ),
        ],
      ],
    );
  }
}
