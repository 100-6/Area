import 'package:formz/formz.dart';

enum EmailValidationError { invalid }

extension EmailValidationErrorExtension on EmailValidationError {
  String get message {
    switch (this) {
      case EmailValidationError.invalid:
        return 'Email invalide';
    }
  }
}

class Email extends FormzInput<String, EmailValidationError> {
  const Email.pure() : super.pure('');
  const Email.dirty([super.value = '']) : super.dirty();

  static final RegExp _emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );

  @override
  EmailValidationError? validator(String value) {
    if (value.isEmpty || !_emailRegex.hasMatch(value)) {
      return EmailValidationError.invalid;
    }
    return null;
  }
}