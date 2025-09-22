import 'package:formz/formz.dart';

/// Erreurs de validation pour le mot de passe
enum PasswordValidationError {
  /// Mot de passe vide
  empty,
  
  /// Mot de passe trop court
  tooShort,
}

/// Modèle de validation pour le mot de passe
class Password extends FormzInput<String, PasswordValidationError> {
  const Password.pure() : super.pure('');
  const Password.dirty([super.value = '']) : super.dirty();

  static const int _minLength = 6;

  @override
  PasswordValidationError? validator(String value) {
    if (value.isEmpty) {
      return PasswordValidationError.empty;
    } else if (value.length < _minLength) {
      return PasswordValidationError.tooShort;
    }
    return null;
  }
}

/// Extension pour obtenir les messages d'erreur
extension PasswordValidationErrorX on PasswordValidationError {
  String get message {
    switch (this) {
      case PasswordValidationError.empty:
        return 'Le mot de passe est requis';
      case PasswordValidationError.tooShort:
        return 'Le mot de passe doit contenir au moins 6 caractères';
    }
  }
}
