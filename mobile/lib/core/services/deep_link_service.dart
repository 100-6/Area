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
  Function(String serviceName)? _onServiceConnected;
  Function(String error)? _onOAuthError;

  /// Initialise le service avec l'AuthRepository
  void initialize(
    AuthRepository authRepository, {
    Function(String)? onServiceConnected,
    Function(String)? onOAuthError,
  }) {
    _authRepository = authRepository;
    _onServiceConnected = onServiceConnected;
    _onOAuthError = onOAuthError;
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

    if (uri.scheme == 'autoarea' && (uri.host == 'oauth' || uri.host == 'auth')) {
      _handleOAuthCallback(uri);
    }
  }

  /// Gère les callbacks OAuth de manière générique
  void _handleOAuthCallback(Uri uri) {
    final path = uri.path;
    final queryParams = uri.queryParameters;

    print('OAuth callback - Path: $path, Params: $queryParams');

    // Vérifier si c'est une erreur (priorité haute)
    if (queryParams.containsKey('error') || path.contains('error')) {
      final error = queryParams['error'] ?? queryParams['message'] ?? 'Erreur OAuth inconnue';
      _handleOAuthError(error);
      return;
    }

    // 1. Authentification (login/register) - Contient un token
    if (queryParams.containsKey('token')) {
      final token = queryParams['token'];
      final refreshToken = queryParams['refresh'];
      final provider = queryParams['provider'];

      print('OAuth authentication - Provider: $provider');
      _handleOAuthSuccess(token!, refreshToken, provider);
      return;
    }

    // 2. Connexion de service - Chercher le nom du service dans les query params
    // Supports: ?service=..., ?success=..., ?provider=...
    final serviceName = queryParams['service'] ??
                        queryParams['success'] ??
                        queryParams['provider'];

    if (serviceName != null && serviceName.isNotEmpty) {
      print('Service OAuth connecté: $serviceName');
      _handleServiceConnected(serviceName);
      return;
    }

    // 3. Fallback: Si le path contient "success" sans paramètres, extraire du path
    if (path.contains('success') || path.contains('succes')) {
      // Essayer d'extraire le service du path (ex: /github/success -> github)
      final pathSegments = uri.pathSegments;
      if (pathSegments.isNotEmpty) {
        // Chercher un segment qui n'est pas 'auth', 'service', 'success', 'oauth'
        final serviceFromPath = pathSegments.firstWhere(
          (segment) => !['auth', 'service', 'services', 'success', 'succes', 'oauth'].contains(segment),
          orElse: () => 'unknown',
        );

        if (serviceFromPath != 'unknown') {
          print('Service OAuth connecté (extrait du path): $serviceFromPath');
          _handleServiceConnected(serviceFromPath);
          return;
        }
      }
    }

    // Si aucun cas ne correspond, logger
    print('OAuth callback non géré: $path avec params $queryParams');
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

    // Appeler le callback si défini
    if (_onServiceConnected != null) {
      _onServiceConnected!(serviceName);
    }
  }

  /// Gère les erreurs OAuth
  void _handleOAuthError(String error) {
    print('OAuth Error: $error');
    
    // Appeler le callback d'erreur si défini
    if (_onOAuthError != null) {
      _onOAuthError!(error);
    }
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