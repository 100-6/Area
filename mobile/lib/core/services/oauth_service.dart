import 'package:url_launcher/url_launcher.dart';
import '../constants/api_constants.dart';

/// Service pour gérer l'authentification OAuth
class OAuthService {
  /// Providers OAuth pour l'authentification (login/register)
  /// Uniquement les services de connexion pure (en dur)
  static const List<OAuthProvider> authenticationProviders = [
    OAuthProvider.google,
    OAuthProvider.discord,
    OAuthProvider.github,
    OAuthProvider.gitlab,
    OAuthProvider.dropbox,
  ];

  /// Mapping des noms de services vers OAuthProvider
  static OAuthProvider? getProviderByName(String name) {
    switch (name.toLowerCase()) {
      case 'google':
        return OAuthProvider.google;
      case 'gmail':
        return OAuthProvider.gmail;
      case 'github':
        return OAuthProvider.github;
      case 'gitlab':
        return OAuthProvider.gitlab;
      case 'discord':
        return OAuthProvider.discord;
      case 'dropbox':
        return OAuthProvider.dropbox;
      default:
        return null;
    }
  }

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

  /// Lance le flux OAuth pour connecter un service externe (Discord, GitHub, etc.)
  /// Utilisé pour connecter un service à utiliser dans les Areas, pas pour se connecter à l'app
  /// Note: Réutilise les routes OAuth existantes (/api/auth/discord, etc.) mais le backend
  /// redirigera vers /service/success au lieu de /auth/success si l'utilisateur est déjà authentifié
  Future<OAuthResult> connectService(String serviceName, {String? userToken}) async {
    try {
      final authUrl = _getServiceAuthUrl(serviceName);

      // Construire l'URL avec mobile=true et le token JWT pour que le backend
      // puisse détecter que l'utilisateur est déjà authentifié
      var url = '$authUrl?mobile=true';
      if (userToken != null) {
        url += '&token=$userToken';
      }

      final uri = Uri.parse(url);

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
      case OAuthProvider.gmail:
        // Gmail a sa propre route OAuth
        return '$baseUrl/api/gmail/connect';
      case OAuthProvider.github:
        return '$baseUrl/api/auth/github';
      case OAuthProvider.gitlab:
        return '$baseUrl/api/auth/gitlab';
      case OAuthProvider.discord:
        return '$baseUrl/api/auth/discord';
      case OAuthProvider.dropbox:
        return '$baseUrl/api/auth/dropbox';
    }
  }

  /// Obtient l'URL OAuth pour connecter un service externe
  /// Utilise les routes OAuth existantes (/api/auth/discord, etc.)
  String _getServiceAuthUrl(String serviceName) {
    final baseUrl = ApiConstants.baseUrl;
    final service = serviceName.toLowerCase();

    // Services avec leur propre route /connect
    if (service == 'gmail') {
      return '$baseUrl/api/gmail/connect';
    }
    if (service == 'outlook' || service == 'microsoft') {
      return '$baseUrl/api/outlook/connect';
    }
    if (service == 'spotify') {
      return '$baseUrl/api/spotify/connect';
    }

    // Réutilise les routes OAuth existantes pour les autres services
    // (Discord, GitHub, GitLab, Dropbox, Google, Telegram)
    return '$baseUrl/api/auth/$service';
  }

}

/// Énumération des providers OAuth
enum OAuthProvider {
  google,
  gmail,
  github,
  gitlab,
  discord,
  dropbox;

  /// Nom affiché du provider
  String get displayName {
    switch (this) {
      case OAuthProvider.google:
        return 'Google';
      case OAuthProvider.gmail:
        return 'Gmail';
      case OAuthProvider.github:
        return 'GitHub';
      case OAuthProvider.gitlab:
        return 'GitLab';
      case OAuthProvider.discord:
        return 'Discord';
      case OAuthProvider.dropbox:
        return 'Dropbox';
    }
  }

  /// Icône du provider
  String get iconName {
    switch (this) {
      case OAuthProvider.google:
        return 'google';
      case OAuthProvider.gmail:
        return 'gmail';
      case OAuthProvider.github:
        return 'github';
      case OAuthProvider.gitlab:
        return 'gitlab';
      case OAuthProvider.discord:
        return 'discord';
      case OAuthProvider.dropbox:
        return 'dropbox';
    }
  }

  /// Couleur principale du provider
  int get color {
    switch (this) {
      case OAuthProvider.google:
        return 0xFF4285F4; // Bleu Google
      case OAuthProvider.gmail:
        return 0xFFEA4335; // Rouge Gmail
      case OAuthProvider.github:
        return 0xFF181717; // Noir GitHub
      case OAuthProvider.gitlab:
        return 0xFFFC6D26; // Orange GitLab
      case OAuthProvider.discord:
        return 0xFF5865F2; // Violet Discord
      case OAuthProvider.dropbox:
        return 0xFF0061FF; // Bleu Dropbox
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
