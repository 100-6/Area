import 'package:url_launcher/url_launcher.dart';
import '../constants/api_constants.dart';

/// Service pour gérer l'authentification OAuth
class OAuthService {
  /// Providers OAuth disponibles
  static const List<OAuthProvider> availableProviders = [
    OAuthProvider.google,
    OAuthProvider.github,
    OAuthProvider.gitlab,
    OAuthProvider.discord,
  ];

  /// Lance le flux OAuth pour un provider
  Future<OAuthResult> signInWithProvider(OAuthProvider provider) async {
    try {
      final authUrl = _getAuthUrl(provider);

      // Ouvrir l'URL dans le navigateur externe avec paramètre mobile
      final uri = Uri.parse('$authUrl?mobile=true');

      if (await canLaunchUrl(uri)) {
        await launchUrl(
          uri,
          mode: LaunchMode.externalApplication,
        );

        // Le callback sera géré via deep linking
        return OAuthResult.pending();
      } else {
        return OAuthResult.error('Impossible d\'ouvrir le navigateur');
      }
    } catch (e) {
      return OAuthResult.error('Erreur OAuth: ${e.toString()}');
    }
  }

  /// Obtient l'URL d'authentification pour un provider
  String _getAuthUrl(OAuthProvider provider) {
    final baseUrl = ApiConstants.baseUrl;
    
    switch (provider) {
      case OAuthProvider.google:
        return '$baseUrl/api/auth/google';
      case OAuthProvider.github:
        return '$baseUrl/api/auth/github';
      case OAuthProvider.gitlab:
        return '$baseUrl/api/auth/gitlab';
      case OAuthProvider.discord:
        return '$baseUrl/api/auth/discord';
    }
  }

}

/// Énumération des providers OAuth
enum OAuthProvider {
  google,
  github,
  gitlab,
  discord;

  /// Nom affiché du provider
  String get displayName {
    switch (this) {
      case OAuthProvider.google:
        return 'Google';
      case OAuthProvider.github:
        return 'GitHub';
      case OAuthProvider.gitlab:
        return 'GitLab';
      case OAuthProvider.discord:
        return 'Discord';
    }
  }

  /// Icône du provider
  String get iconName {
    switch (this) {
      case OAuthProvider.google:
        return 'google';
      case OAuthProvider.github:
        return 'github';
      case OAuthProvider.gitlab:
        return 'gitlab';
      case OAuthProvider.discord:
        return 'discord';
    }
  }

  /// Couleur principale du provider
  int get color {
    switch (this) {
      case OAuthProvider.google:
        return 0xFF4285F4; // Bleu Google
      case OAuthProvider.github:
        return 0xFF181717; // Noir GitHub
      case OAuthProvider.gitlab:
        return 0xFFFC6D26; // Orange GitLab
      case OAuthProvider.discord:
        return 0xFF5865F2; // Violet Discord
    }
  }
}

/// Résultat d'une opération OAuth
class OAuthResult {
  final bool isSuccess;
  final bool isPending;
  final String? token;
  final String? error;

  const OAuthResult._({
    required this.isSuccess,
    required this.isPending,
    this.token,
    this.error,
  });

  factory OAuthResult.success(String token) => OAuthResult._(
        isSuccess: true,
        isPending: false,
        token: token,
      );

  factory OAuthResult.pending() => const OAuthResult._(
        isSuccess: false,
        isPending: true,
      );

  factory OAuthResult.error(String error) => OAuthResult._(
        isSuccess: false,
        isPending: false,
        error: error,
      );
}
