import '../../../core/services/api_service.dart';

/// Modèle pour un serveur Discord (Guild)
class DiscordGuild {
  final String id;
  final String name;
  final String? icon;
  final int memberCount;

  DiscordGuild({
    required this.id,
    required this.name,
    this.icon,
    required this.memberCount,
  });

  factory DiscordGuild.fromJson(Map<String, dynamic> json) {
    return DiscordGuild(
      id: json['id'].toString(),
      name: json['name'] as String,
      icon: json['icon'] as String?,
      memberCount: json['memberCount'] as int? ?? 0,
    );
  }
}

/// Modèle pour un channel Discord
class DiscordChannel {
  final String id;
  final String name;
  final int type;

  DiscordChannel({
    required this.id,
    required this.name,
    required this.type,
  });

  factory DiscordChannel.fromJson(Map<String, dynamic> json) {
    return DiscordChannel(
      id: json['id'].toString(),
      name: json['name'] as String,
      type: json['type'] as int,
    );
  }

  /// Retourne le type de channel en format lisible
  String get typeLabel {
    switch (type) {
      case 0:
        return 'Text';
      case 2:
        return 'Voice';
      case 4:
        return 'Category';
      case 5:
        return 'News';
      case 11:
        return 'Thread';
      case 13:
        return 'Stage';
      case 15:
        return 'Forum';
      default:
        return 'Unknown';
    }
  }
}

/// Modèle pour un rôle Discord
class DiscordRole {
  final String id;
  final String name;
  final String color;
  final int position;

  DiscordRole({
    required this.id,
    required this.name,
    required this.color,
    required this.position,
  });

  factory DiscordRole.fromJson(Map<String, dynamic> json) {
    return DiscordRole(
      id: json['id'].toString(),
      name: json['name'] as String,
      color: json['color'] as String? ?? '#000000',
      position: json['position'] as int? ?? 0,
    );
  }
}

/// Service pour interagir avec l'API Discord
class DiscordService {
  final ApiService _apiService = ApiService();

  /// Récupère la liste des serveurs Discord
  Future<List<DiscordGuild>> getGuilds({required String token}) async {
    final response = await _apiService.get(
      '/api/discord/guilds',
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response['guilds'] != null) {
      return (response['guilds'] as List)
          .map((json) => DiscordGuild.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Récupère les channels d'un serveur Discord
  Future<List<DiscordChannel>> getChannels({
    required String guildId,
    required String token,
  }) async {
    final response = await _apiService.get(
      '/api/discord/guilds/$guildId/channels',
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response['channels'] != null) {
      return (response['channels'] as List)
          .map((json) => DiscordChannel.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Récupère les rôles d'un serveur Discord
  Future<List<DiscordRole>> getRoles({
    required String guildId,
    required String token,
  }) async {
    final response = await _apiService.get(
      '/api/discord/guilds/$guildId/roles',
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response['roles'] != null) {
      return (response['roles'] as List)
          .map((json) => DiscordRole.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Vérifie le statut du bot Discord
  Future<Map<String, dynamic>> getBotStatus({required String token}) async {
    final response = await _apiService.get(
      '/api/discord/bot/status',
      headers: {'Authorization': 'Bearer $token'},
    );
    return response;
  }

  /// Récupère l'URL d'invitation du bot Discord
  Future<String?> getBotInviteUrl({required String token}) async {
    final response = await _apiService.get(
      '/api/discord/bot/invite-url',
      headers: {'Authorization': 'Bearer $token'},
    );
    return response['inviteUrl'] as String?;
  }
}
