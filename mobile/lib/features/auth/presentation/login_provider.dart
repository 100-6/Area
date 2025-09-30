import 'package:flutter/foundation.dart';
import 'package:formz/formz.dart';
import '../data/auth_repository.dart';
import '../../../shared/models/email.dart';
import '../../../shared/models/password.dart';

/// Provider pour la gestion du formulaire de connexion
class LoginProvider extends ChangeNotifier {
  LoginProvider({required AuthRepository authRepository})
      : _authRepository = authRepository;

  final AuthRepository _authRepository;

  Email _email = const Email.pure();
  Password _password = const Password.pure();
  FormzSubmissionStatus _status = FormzSubmissionStatus.initial;
  String? _errorMessage;

  /// Email actuel
  Email get email => _email;

  /// Mot de passe actuel
  Password get password => _password;

  /// Statut de soumission du formulaire
  FormzSubmissionStatus get status => _status;

  /// Message d'erreur
  String? get errorMessage => _errorMessage;

  /// Vérifie si le formulaire est valide
  bool get isValid => Formz.validate([_email, _password]);

  /// Met à jour l'email
  void emailChanged(String value) {
    _email = Email.dirty(value);
    _errorMessage = null;
    notifyListeners();
  }

  /// Met à jour le mot de passe
  void passwordChanged(String value) {
    _password = Password.dirty(value);
    _errorMessage = null;
    notifyListeners();
  }

  /// Soumission du formulaire de connexion
  Future<void> signInWithCredentials() async {
    if (!isValid) return;

    // Éviter les appels multiples si déjà en cours
    if (_status == FormzSubmissionStatus.inProgress) return;

    _status = FormzSubmissionStatus.inProgress;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _authRepository.signIn(
        email: _email.value,
        password: _password.value,
      );

      if (result.isSuccess) {
        _status = FormzSubmissionStatus.success;
      } else {
        _status = FormzSubmissionStatus.failure;
        _errorMessage = result.failure?.message;
      }
    } catch (e) {
      _status = FormzSubmissionStatus.failure;
      _errorMessage = 'Une erreur inattendue s\'est produite';
    }

    notifyListeners();
  }

  /// Remet à zéro le formulaire
  void reset() {
    _email = const Email.pure();
    _password = const Password.pure();
    _status = FormzSubmissionStatus.initial;
    _errorMessage = null;
    notifyListeners();
  }
}
