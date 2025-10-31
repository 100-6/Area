import '../constants/service_constants.dart';

/// Représente un service/provider disponible dans l'application
class ServiceProvider {
  final String name;
  final String displayName;
  final String? description;
  final String? iconUrl;
  final String authType;
  final bool isConnected;
  final DateTime? connectedAt;

  const ServiceProvider({
    required this.name,
    required this.displayName,
    this.description,
    this.iconUrl,
    required this.authType,
    required this.isConnected,
    this.connectedAt,
  });

  /// Crée un ServiceProvider depuis les données JSON de l'API
  factory ServiceProvider.fromJson(Map<String, dynamic> json) {
    return ServiceProvider(
      name: json['name'] as String,
      displayName: json['displayName'] as String? ?? json['name'] as String,
      description: json['description'] as String?,
      iconUrl: json['iconUrl'] as String?,
      authType: json['authType'] as String? ?? 'none',
      isConnected: json['connected'] == true,
      connectedAt: json['connectedAt'] != null
          ? DateTime.tryParse(json['connectedAt'] as String)
          : null,
    );
  }

  /// Couleur par défaut basée sur le nom du service
  int get color {
    return ServiceConstants.getServiceColorInt(name);
  }

}
