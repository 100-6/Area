import 'package:equatable/equatable.dart';

/// Modèle représentant un utilisateur
class User extends Equatable {
  const User({
    required this.id,
    required this.email,
    required this.name,
    this.avatarUrl,
  });

  final String id;
  final String email;
  final String name;
  final String? avatarUrl;

  /// Utilisateur vide utilisé pour les états non connectés
  static const empty = User(
    id: '',
    email: '',
    name: '',
  );

  /// Vérifie si l'utilisateur est vide (non connecté)
  bool get isEmpty => this == User.empty;

  /// Vérifie si l'utilisateur est connecté
  bool get isNotEmpty => this != User.empty;

  /// Crée une copie de l'utilisateur avec les nouveaux paramètres
  User copyWith({
    String? id,
    String? email,
    String? name,
    String? avatarUrl,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      avatarUrl: avatarUrl ?? this.avatarUrl,
    );
  }

  @override
  List<Object?> get props => [id, email, name, avatarUrl];
}
