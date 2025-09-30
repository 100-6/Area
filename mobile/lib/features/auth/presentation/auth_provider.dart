import 'package:flutter/foundation.dart';
import '../domain/user.dart';
import '../domain/auth_status.dart';
import '../data/auth_repository.dart';

/// Provider pour la gestion de l'état d'authentification
class AuthProvider extends ChangeNotifier {
  AuthProvider({required AuthRepository authRepository})
      : _authRepository = authRepository {
    _init();
  }

  final AuthRepository _authRepository;

  AuthStatus _status = AuthStatus.unknown;
  User _user = User.empty;

  /// État d'authentification actuel
  AuthStatus get status => _status;

  /// Utilisateur connecté actuel
  User get user => _user;

  /// Initialise le provider en écoutant les changements d'état
  void _init() {
    _authRepository.status.listen((status) async {
      _status = status;
      if (status == AuthStatus.authenticated) {
        _user = await _authRepository.getCurrentUser();
      } else {
        _user = User.empty;
      }
      notifyListeners();
    });
  }

  /// Connexion avec email et mot de passe
  Future<bool> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final result = await _authRepository.signIn(
        email: email,
        password: password,
      );
      return result.isSuccess;
    } catch (e) {
      return false;
    }
  }

  /// Déconnexion
  Future<void> signOut() async {
    await _authRepository.signOut();
  }

  /// Force un refresh de l'état (utile pour l'initialisation)
  void refresh() {
    notifyListeners();
  }
}
