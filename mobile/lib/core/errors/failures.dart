import 'package:equatable/equatable.dart';

/// Classe de base pour toutes les erreurs métier
abstract class Failure extends Equatable {
  const Failure(this.message);

  final String message;

  @override
  List<Object> get props => [message];
}

/// Erreur d'authentification
class AuthFailure extends Failure {
  const AuthFailure(super.message);
}

/// Erreur de réseau
class NetworkFailure extends Failure {
  const NetworkFailure(super.message);
}

/// Erreur de serveur
class ServerFailure extends Failure {
  const ServerFailure(super.message);
}

/// Erreur de validation
class ValidationFailure extends Failure {
  const ValidationFailure(super.message);
}
