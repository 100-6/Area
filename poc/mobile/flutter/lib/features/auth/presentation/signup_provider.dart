import 'package:flutter/foundation.dart';
import 'package:formz/formz.dart';
import '../data/auth_repository.dart';
import '../../../shared/models/email.dart';
import '../../../shared/models/password.dart';

/// Provider pour la gestion du formulaire d'inscription
class SignUpProvider extends ChangeNotifier {
  SignUpProvider({required AuthRepository authRepository})
      : _authRepository = authRepository;

  final AuthRepository _authRepository;

  String _name = '';
  Email _email = const Email.pure();
  Password _password = const Password.pure();
  Password _confirmPassword = const Password.pure();
  FormzSubmissionStatus _status = FormzSubmissionStatus.initial;
  String? _errorMessage;

  /// Nom actuel
  String get name => _name;

  /// Email actuel
  Email get email => _email;

  /// Mot de passe actuel
  Password get password => _password;

  /// Confirmation du mot de passe
  Password get confirmPassword => _confirmPassword;

  /// Statut de soumission du formulaire
  FormzSubmissionStatus get status => _status;

  /// Message d'erreur
  String? get errorMessage => _errorMessage;

  /// Vérifie si le formulaire est valide
  bool get isValid {
    return _name.isNotEmpty &&
        Formz.validate([_email, _password, _confirmPassword]) &&
        _password.value == _confirmPassword.value;
  }

  /// Met à jour le nom
  void nameChanged(String value) {
    _name = value;
    _errorMessage = null;
    notifyListeners();
  }

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

  /// Met à jour la confirmation du mot de passe
  void confirmPasswordChanged(String value) {
    _confirmPassword = Password.dirty(value);
    _errorMessage = null;
    notifyListeners();
  }

  /// Vérifie si les mots de passe correspondent
  bool get passwordsMatch => _password.value == _confirmPassword.value;

  /// Soumission du formulaire d'inscription
  Future<void> signUpWithCredentials() async {
    if (!isValid) return;

    _status = FormzSubmissionStatus.inProgress;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _authRepository.signUp(
        email: _email.value,
        password: _password.value,
        name: _name,
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
    _name = '';
    _email = const Email.pure();
    _password = const Password.pure();
    _confirmPassword = const Password.pure();
    _status = FormzSubmissionStatus.initial;
    _errorMessage = null;
    notifyListeners();
  }
}
