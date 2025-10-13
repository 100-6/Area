import 'dart:async';
import 'package:app_links/app_links.dart';
import 'package:flutter/services.dart';

import '../../features/auth/data/auth_repository.dart';

/// Service pour gérer les deep links OAuth
class DeepLinkService {
  DeepLinkService._internal();
  static final DeepLinkService _instance = DeepLinkService._internal();
  factory DeepLinkService() => _instance;

  final AppLinks _appLinks = AppLinks();
  StreamSubscription<Uri>? _linkSubscription;
  AuthRepository? _authRepository;

  /// Initialise le service avec l'AuthRepository
  void initialize(AuthRepository authRepository) {
    _authRepository = authRepository;
  }

  /// Démarre l'écoute des deep links
  void startListening() {
    _linkSubscription = _appLinks.uriLinkStream.listen(
      _handleDeepLink,
      onError: (err) {
        print('Deep link error: $err');
      },
    );
  }

  /// Arrête l'écoute des deep links
  void stopListening() {
    _linkSubscription?.cancel();
    _linkSubscription = null;
  }

  /// Gère les deep links entrants
  void _handleDeepLink(Uri uri) {
    print('Deep link reçu: $uri');

    if (uri.scheme == 'autoarea' && uri.host == 'oauth') {
      _handleOAuthCallback(uri);
    }
  }

  /// Gère les callbacks OAuth
  void _handleOAuthCallback(Uri uri) {
    final path = uri.path;
    final queryParams = uri.queryParameters;

    print('OAuth callback - Path: $path, Params: $queryParams');

    // Gérer les variantes de "success" (avec faute de frappe du backend)
    if (path == '/auth/success' || path == '/auth/succes') {
      final token = queryParams['token'];
      final refreshToken = queryParams['refresh'];
      final provider = queryParams['provider'];

      if (token != null) {
        _handleOAuthSuccess(token, refreshToken, provider);
      } else {
        _handleOAuthError('Token manquant');
      }
    } else if (path == '/service/success' || path == '/service/succes') {
      // Connexion à un service externe (Discord, GitHub, etc.)
      final provider = queryParams['provider'];
      final serviceName = queryParams['service'];

      print('Service OAuth connecté: $serviceName / $provider');
      _handleServiceConnected(serviceName ?? provider ?? 'unknown');
    } else if (path == '/auth/error' || path == '/service/error') {
      final error = queryParams['error'] ?? queryParams['message'] ?? 'Erreur OAuth inconnue';
      _handleOAuthError(error);
    }
  }

  /// Gère le succès OAuth
  void _handleOAuthSuccess(String token, String? refreshToken, String? provider) async {
    print('OAuth Success - Token: ${token.substring(0, 10)}..., Provider: $provider');

    if (_authRepository == null) {
      print('Erreur: AuthRepository non initialisé');
      return;
    }

    try {
      // Utiliser l'AuthRepository pour sauvegarder les tokens et récupérer l'utilisateur
      final result = await _authRepository!.signInWithOAuth(
        token: token,
        refreshToken: refreshToken,
      );

      if (result.isSuccess) {
        print('OAuth connecté avec succès: ${result.data?.email}');
      } else {
        print('Erreur OAuth: ${result.failure?.message}');
        _handleOAuthError(result.failure?.message ?? 'Erreur inconnue');
      }
    } catch (e) {
      print('Erreur lors de la connexion OAuth: $e');
      _handleOAuthError(e.toString());
    }
  }

  /// Gère la connexion réussie à un service
  void _handleServiceConnected(String serviceName) {
    print('Service $serviceName connecté avec succès');
    // Le service est maintenant connecté
    // L'utilisateur peut fermer le navigateur et revenir à l'app
    // La prochaine fois qu'il vérifiera le statut du service, il sera connecté
  }

  /// Gère les erreurs OAuth
  void _handleOAuthError(String error) {
    print('OAuth Error: $error');
    // TODO: Afficher un message d'erreur à l'utilisateur
    // Par exemple: SnackBar, Dialog, etc.
  }

  /// Vérifie et traite le deep link initial (quand l'app est fermée)
  Future<void> checkInitialLink() async {
    try {
      final uri = await _appLinks.getInitialLink();
      if (uri != null) {
        _handleDeepLink(uri);
      }
    } on PlatformException catch (e) {
      print('Erreur lors de la vérification du deep link initial: $e');
    }
  }
}