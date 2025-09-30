import 'package:formz/formz.dart';

enum PasswordValidationError { invalid }

extension PasswordValidationErrorExtension on PasswordValidationError {
  String get message {
    switch (this) {
      case PasswordValidationError.invalid:
        return 'Mot de passe trop court (min 6 caractères)';
    }
  }
}

class Password extends FormzInput<String, PasswordValidationError> {
  const Password.pure() : super.pure('');
  const Password.dirty([super.value = '']) : super.dirty();

  @override
  PasswordValidationError? validator(String value) {
    if (value.isEmpty || value.length < 6) {
      return PasswordValidationError.invalid;
    }
    return null;
  }
}