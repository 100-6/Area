import 'package:shared_preferences/shared_preferences.dart';
import '../domain/user.dart';
import '../domain/auth_status.dart';
import '../../../core/errors/failures.dart';

/// Repository d'authentification mock
class AuthRepository {
  AuthRepository();

  static const String _userKey = 'user_logged_in';
  static const String _userIdKey = 'user_id';
  static const String _userEmailKey = 'user_email';
  static const String _userNameKey = 'user_name';

  // Utilisateurs mock pour la démo
  final Map<String, Map<String, String>> _mockUsers = {
    'admin@test.com': {
      'password': 'password123',
      'id': '1',
      'name': 'Administrateur',
    },
    'user@test.com': {
      'password': 'password123',
      'id': '2',
      'name': 'Utilisateur Test',
    },
    'demo@test.com': {
      'password': 'demo123',
      'id': '3',
      'name': 'Démo User',
    },
  };

  /// Stream pour écouter les changements d'état d'authentification
  Stream<AuthStatus> get status async* {
    yield* Stream.periodic(
      const Duration(seconds: 1),
      (index) => index,
    ).asyncMap((_) async => await _getAuthStatus());
  }

  /// Obtient l'état d'authentification actuel
  Future<AuthStatus> _getAuthStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final isLoggedIn = prefs.getBool(_userKey) ?? false;
    return isLoggedIn ? AuthStatus.authenticated : AuthStatus.unauthenticated;
  }

  /// Obtient l'utilisateur connecté actuel
  Future<User> getCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final isLoggedIn = prefs.getBool(_userKey) ?? false;
    
    if (!isLoggedIn) {
      return User.empty;
    }

    final id = prefs.getString(_userIdKey) ?? '';
    final email = prefs.getString(_userEmailKey) ?? '';
    final name = prefs.getString(_userNameKey) ?? '';

    return User(
      id: id,
      email: email,
      name: name,
    );
  }

  /// Connexion avec email et mot de passe
  Future<Result<User>> signIn({
    required String email,
    required String password,
  }) async {
    try {
      // Simulation d'un appel réseau
      await Future.delayed(const Duration(seconds: 2));

      // Vérification des identifiants mock
      final userData = _mockUsers[email.toLowerCase()];
      if (userData == null) {
        return Result.failure(
          const AuthFailure('Aucun compte trouvé avec cet email'),
        );
      }

      if (userData['password'] != password) {
        return Result.failure(
          const AuthFailure('Mot de passe incorrect'),
        );
      }

      // Création de l'utilisateur
      final user = User(
        id: userData['id']!,
        email: email,
        name: userData['name']!,
      );

      // Sauvegarde en local
      await _saveUserToPrefs(user);

      return Result.success(user);
    } catch (e) {
      return Result.failure(
        AuthFailure('Erreur lors de la connexion: ${e.toString()}'),
      );
    }
  }

  /// Inscription (mock)
  Future<Result<User>> signUp({
    required String email,
    required String password,
    required String name,
  }) async {
    try {
      // Simulation d'un appel réseau
      await Future.delayed(const Duration(seconds: 2));

      // Vérification si l'utilisateur existe déjà
      if (_mockUsers.containsKey(email.toLowerCase())) {
        return Result.failure(
          const AuthFailure('Un compte existe déjà avec cet email'),
        );
      }

      // Création du nouvel utilisateur
      final newId = (_mockUsers.length + 1).toString();
      final user = User(
        id: newId,
        email: email,
        name: name,
      );

      // Ajout à la base mock
      _mockUsers[email.toLowerCase()] = {
        'password': password,
        'id': newId,
        'name': name,
      };

      // Sauvegarde en local
      await _saveUserToPrefs(user);

      return Result.success(user);
    } catch (e) {
      return Result.failure(
        AuthFailure('Erreur lors de l\'inscription: ${e.toString()}'),
      );
    }
  }

  /// Déconnexion
  Future<void> signOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
    await prefs.remove(_userIdKey);
    await prefs.remove(_userEmailKey);
    await prefs.remove(_userNameKey);
  }

  /// Sauvegarde l'utilisateur dans SharedPreferences
  Future<void> _saveUserToPrefs(User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_userKey, true);
    await prefs.setString(_userIdKey, user.id);
    await prefs.setString(_userEmailKey, user.email);
    await prefs.setString(_userNameKey, user.name);
  }

  /// Obtient la liste des utilisateurs mock (pour les tests)
  Map<String, String> getMockCredentials() {
    return _mockUsers.map(
      (email, data) => MapEntry(email, data['password']!),
    );
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
