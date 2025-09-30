import 'package:equatable/equatable.dart';

/// Modèle représentant un utilisateur
class User extends Equatable {
  const User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.avatarUrl,
  });

  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? avatarUrl;

  /// Nom complet de l'utilisateur
  String get fullName => '$firstName $lastName'.trim();

  /// Utilisateur vide utilisé pour les états non connectés
  static const empty = User(
    id: '',
    email: '',
    firstName: '',
    lastName: '',
  );

  /// Vérifie si l'utilisateur est vide (non connecté)
  bool get isEmpty => this == User.empty;

  /// Vérifie si l'utilisateur est connecté
  bool get isNotEmpty => this != User.empty;

  /// Crée une instance depuis JSON
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String?,
    );
  }

  /// Convertit en JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
    };
  }

  /// Crée une copie de l'utilisateur avec les nouveaux paramètres
  User copyWith({
    String? id,
    String? email,
    String? firstName,
    String? lastName,
    String? avatarUrl,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
    );
  }

  @override
  List<Object?> get props => [id, email, firstName, lastName, avatarUrl];
}
