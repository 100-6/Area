import 'package:formz/formz.dart';

/// Erreurs de validation pour l'email
enum EmailValidationError {
  /// Email vide
  empty,
  
  /// Format d'email invalide
  invalid,
}

/// Modèle de validation pour l'email
class Email extends FormzInput<String, EmailValidationError> {
  const Email.pure() : super.pure('');
  const Email.dirty([super.value = '']) : super.dirty();

  static final _emailRegExp = RegExp(
    r'^[a-zA-Z0-9.!#$%&*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$',
  );

  @override
  EmailValidationError? validator(String value) {
    if (value.isEmpty) {
      return EmailValidationError.empty;
    } else if (!_emailRegExp.hasMatch(value)) {
      return EmailValidationError.invalid;
    }
    return null;
  }
}

/// Extension pour obtenir les messages d'erreur
extension EmailValidationErrorX on EmailValidationError {
  String get message {
    switch (this) {
      case EmailValidationError.empty:
        return 'L\'email est requis';
      case EmailValidationError.invalid:
        return 'Format d\'email invalide';
    }
  }
}
