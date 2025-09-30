import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../domain/user.dart';
import '../domain/auth_status.dart';
import '../../../core/errors/failures.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_constants.dart';

/// Repository d'authentification avec API backend
class AuthRepository {
  final ApiService _apiService;

  AuthRepository({ApiService? apiService}) 
      : _apiService = apiService ?? ApiService() {
    _initStatusStream();
  }

  final StreamController<AuthStatus> _statusController = 
      StreamController<AuthStatus>.broadcast();

  // Clés pour SharedPreferences
  static const String _tokenKey = 'auth_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userKey = 'user_data';

  /// Initialise le stream d'état
  void _initStatusStream() async {
    final currentStatus = await _getAuthStatus();
    _statusController.add(currentStatus);

    Timer.periodic(const Duration(milliseconds: 500), (timer) async {
      final status = await _getAuthStatus();
      if (!_statusController.isClosed) {
        _statusController.add(status);
      }
    });
  }

  /// Stream pour écouter les changements d'état d'authentification
  Stream<AuthStatus> get status => _statusController.stream;

  /// Obtient l'état d'authentification actuel
  Future<AuthStatus> _getAuthStatus() async {
    final token = await getToken();
    return token != null ? AuthStatus.authenticated : AuthStatus.unauthenticated;
  }

  /// Obtient le token d'authentification
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  /// Obtient le refresh token
  Future<String?> getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_refreshTokenKey);
  }

  /// Obtient l'utilisateur connecté actuel
  Future<User> getCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString(_userKey);
    
    if (userJson == null) {
      return User.empty;
    }

    try {
      final userData = jsonDecode(userJson) as Map<String, dynamic>;
      return User.fromJson(userData);
    } catch (e) {
      return User.empty;
    }
  }

  /// Connexion avec email et mot de passe
  Future<Result<User>> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiService.post(
        ApiConstants.loginEndpoint,
        body: {
          'email': email,
          'password': password,
        },
      );

      // Extraction des données de la réponse
      final userData = response['user'] as Map<String, dynamic>;
      final token = response['token'] as String;
      final refreshToken = response['refreshToken'] as String?;

      final user = User.fromJson(userData);

      // Sauvegarde des tokens et de l'utilisateur
      await _saveAuthData(
        user: user,
        token: token,
        refreshToken: refreshToken,
      );

      _notifyStatusChange();

      return Result.success(user);
    } on ApiException catch (e) {
      return Result.failure(AuthFailure(e.message));
    } catch (e) {
      return Result.failure(
        AuthFailure('Erreur lors de la connexion: ${e.toString()}'),
      );
    }
  }

  /// Inscription
  Future<Result<User>> signUp({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
  }) async {
    try {
      final response = await _apiService.post(
        ApiConstants.registerEndpoint,
        body: {
          'email': email,
          'password': password,
          'firstName': firstName,
          'lastName': lastName,
        },
      );

      // Extraction des données de la réponse
      final userData = response['user'] as Map<String, dynamic>;
      final token = response['token'] as String;
      final refreshToken = response['refreshToken'] as String?;

      final user = User.fromJson(userData);

      // Sauvegarde des tokens et de l'utilisateur
      await _saveAuthData(
        user: user,
        token: token,
        refreshToken: refreshToken,
      );

      _notifyStatusChange();

      return Result.success(user);
    } on ApiException catch (e) {
      return Result.failure(AuthFailure(e.message));
    } catch (e) {
      return Result.failure(
        AuthFailure('Erreur lors de l\'inscription: ${e.toString()}'),
      );
    }
  }

  /// Connexion avec OAuth (depuis deep link)
  Future<Result<User>> signInWithOAuth({
    required String token,
    String? refreshToken,
  }) async {
    try {
      // Vérifier le token et récupérer les données utilisateur
      final response = await _apiService.get(
        ApiConstants.verifyTokenEndpoint,
        headers: {'Authorization': 'Bearer $token'},
      );

      // Extraction des données de la réponse
      final userData = response['user'] as Map<String, dynamic>;
      final user = User.fromJson(userData);

      // Sauvegarde des tokens et de l'utilisateur
      await _saveAuthData(
        user: user,
        token: token,
        refreshToken: refreshToken,
      );

      _notifyStatusChange();

      return Result.success(user);
    } on ApiException catch (e) {
      return Result.failure(AuthFailure(e.message));
    } catch (e) {
      return Result.failure(
        AuthFailure('Erreur lors de la connexion OAuth: ${e.toString()}'),
      );
    }
  }

  /// Déconnexion
  Future<void> signOut() async {
    try {
      // Optionnel : appeler l'endpoint de logout du backend
      final token = await getToken();
      if (token != null) {
        try {
          await _apiService.post(
            ApiConstants.logoutEndpoint,
            headers: {'Authorization': 'Bearer $token'},
          );
        } catch (e) {
          // Ignorer les erreurs de logout côté serveur
        }
      }
    } finally {
      // Toujours nettoyer les données locales
      await _clearAuthData();
      _notifyStatusChange();
    }
  }

  /// Sauvegarde les données d'authentification
  Future<void> _saveAuthData({
    required User user,
    required String token,
    String? refreshToken,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    if (refreshToken != null) {
      await prefs.setString(_refreshTokenKey, refreshToken);
    }
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  /// Nettoie les données d'authentification
  Future<void> _clearAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_refreshTokenKey);
    await prefs.remove(_userKey);
  }

  /// Force la mise à jour immédiate du stream d'état
  void _notifyStatusChange() async {
    final status = await _getAuthStatus();
    if (!_statusController.isClosed) {
      _statusController.add(status);
    }
  }

  /// Nettoie les ressources
  void dispose() {
    _statusController.close();
    _apiService.dispose();
  }
}

/// Classe pour encapsuler les résultats avec succès ou échec
class Result<T> {
  const Result._({
    this.data,
    this.failure,
  });

  final T? data;
  final Failure? failure;

  bool get isSuccess => data != null;
  bool get isFailure => failure != null;

  /// Constructeur pour un résultat de succès
  factory Result.success(T data) => Result._(data: data);
  
  /// Constructeur pour un résultat d'échec
  factory Result.failure(Failure failure) => Result._(failure: failure);

  /// Retourne la donnée ou lance une exception si échec
  T get dataOrThrow {
    if (isSuccess) return data!;
    throw failure!;
  }
}