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

  String _firstName = '';
  String _lastName = '';
  Email _email = const Email.pure();
  Password _password = const Password.pure();
  Password _confirmPassword = const Password.pure();
  FormzSubmissionStatus _status = FormzSubmissionStatus.initial;
  String? _errorMessage;

  // État des champs "touchés"
  bool _firstNameTouched = false;
  bool _lastNameTouched = false;
  bool _emailTouched = false;
  bool _passwordTouched = false;
  bool _confirmPasswordTouched = false;

  /// Prénom actuel
  String get firstName => _firstName;

  /// Nom actuel
  String get lastName => _lastName;

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
    return _firstName.isNotEmpty &&
        _lastName.isNotEmpty &&
        Formz.validate([_email, _password, _confirmPassword]) &&
        _password.value == _confirmPassword.value;
  }

  /// Met à jour le prénom
  void firstNameChanged(String value) {
    _firstName = value;
    _firstNameTouched = true;
    _errorMessage = null;
    notifyListeners();
  }

  /// Met à jour le nom de famille
  void lastNameChanged(String value) {
    _lastName = value;
    _lastNameTouched = true;
    _errorMessage = null;
    notifyListeners();
  }

  /// Met à jour l'email
  void emailChanged(String value) {
    _email = Email.dirty(value);
    _emailTouched = true;
    _errorMessage = null;
    notifyListeners();
  }

  /// Met à jour le mot de passe
  void passwordChanged(String value) {
    _password = Password.dirty(value);
    _passwordTouched = true;
    _errorMessage = null;
    notifyListeners();
  }

  /// Met à jour la confirmation du mot de passe
  void confirmPasswordChanged(String value) {
    _confirmPassword = Password.dirty(value);
    _confirmPasswordTouched = true;
    _errorMessage = null;
    notifyListeners();
  }

  /// Vérifie si les mots de passe correspondent
  bool get passwordsMatch => _password.value == _confirmPassword.value;

  /// Getters pour l'état "touché" des champs
  bool get firstNameTouched => _firstNameTouched;
  bool get lastNameTouched => _lastNameTouched;
  bool get emailTouched => _emailTouched;
  bool get passwordTouched => _passwordTouched;
  bool get confirmPasswordTouched => _confirmPasswordTouched;

  /// Soumission du formulaire d'inscription
  Future<void> signUpWithCredentials() async {
    // Marquer tous les champs comme touchés lors de la soumission
    _firstNameTouched = true;
    _lastNameTouched = true;
    _emailTouched = true;
    _passwordTouched = true;
    _confirmPasswordTouched = true;

    if (!isValid) {
      notifyListeners();
      return;
    }

    _status = FormzSubmissionStatus.inProgress;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _authRepository.signUp(
        email: _email.value,
        password: _password.value,
        firstName: _firstName,
        lastName: _lastName,
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
    _firstName = '';
    _lastName = '';
    _email = const Email.pure();
    _password = const Password.pure();
    _confirmPassword = const Password.pure();
    _status = FormzSubmissionStatus.initial;
    _errorMessage = null;
    _firstNameTouched = false;
    _lastNameTouched = false;
    _emailTouched = false;
    _passwordTouched = false;
    _confirmPasswordTouched = false;
    notifyListeners();
  }
}
