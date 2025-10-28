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
    switch (name.toLowerCase()) {
      case 'google':
        return 0xFF4285F4; // Bleu Google
      case 'gmail':
        return 0xFFEA4335; // Rouge Gmail
      case 'github':
        return 0xFF181717; // Noir GitHub
      case 'gitlab':
        return 0xFFFC6D26; // Orange GitLab
      case 'discord':
        return 0xFF5865F2; // Violet Discord
      case 'dropbox':
        return 0xFF0061FF; // Bleu Dropbox
      case 'telegram':
        return 0xFF0088CC; // Bleu Telegram
      case 'outlook':
        return 0xFF0078D4; // Bleu Outlook
      case 'spotify':
        return 0xFF1DB954; // Vert Spotify
      default:
        return 0xFF6B7280; // Gris par défaut
    }
  }

}
