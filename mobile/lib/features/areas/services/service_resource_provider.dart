import 'discord_service.dart';

/// Interface pour un fournisseur de ressources
abstract class ResourceProvider {
  Future<List<ResourceItem>> fetchResources({
    required String token,
    Map<String, dynamic>? params,
  });
}

/// Item de ressource générique
class ResourceItem {
  final String id;
  final String name;
  final Map<String, dynamic>? metadata;

  ResourceItem({
    required this.id,
    required this.name,
    this.metadata,
  });
}

/// Provider pour les ressources Discord
class DiscordGuildProvider implements ResourceProvider {
  final DiscordService _discordService = DiscordService();

  @override
  Future<List<ResourceItem>> fetchResources({
    required String token,
    Map<String, dynamic>? params,
  }) async {
    final guilds = await _discordService.getGuilds(token: token);
    return guilds.map((guild) {
      return ResourceItem(
        id: guild.id,
        name: guild.name,
        metadata: {
          'icon': guild.icon,
          'memberCount': guild.memberCount,
        },
      );
    }).toList();
  }
}

class DiscordChannelProvider implements ResourceProvider {
  final DiscordService _discordService = DiscordService();

  @override
  Future<List<ResourceItem>> fetchResources({
    required String token,
    Map<String, dynamic>? params,
  }) async {
    final guildId = params?['guildId'] as String?;
    if (guildId == null) {
      throw Exception('guildId is required for discord_channel');
    }

    final channels = await _discordService.getChannels(
      guildId: guildId,
      token: token,
    );

    return channels.map((channel) {
      return ResourceItem(
        id: channel.id,
        name: channel.name,
        metadata: {
          'type': channel.type,
          'typeLabel': channel.typeLabel,
        },
      );
    }).toList();
  }
}

class DiscordRoleProvider implements ResourceProvider {
  final DiscordService _discordService = DiscordService();

  @override
  Future<List<ResourceItem>> fetchResources({
    required String token,
    Map<String, dynamic>? params,
  }) async {
    final guildId = params?['guildId'] as String?;
    if (guildId == null) {
      throw Exception('guildId is required for discord_role');
    }

    final roles = await _discordService.getRoles(
      guildId: guildId,
      token: token,
    );

    return roles.map((role) {
      return ResourceItem(
        id: role.id,
        name: role.name,
        metadata: {
          'color': role.color,
          'position': role.position,
        },
      );
    }).toList();
  }
}

/// Service centralisé pour gérer les ressources
class ServiceResourceProvider {
  static final Map<String, ResourceProvider> _providers = {
    'discord_guilds': DiscordGuildProvider(),
    'discord_channels': DiscordChannelProvider(),
    'discord_roles': DiscordRoleProvider(),
    // Ajouter d'autres providers ici (github_repos, gitlab_projects, etc.)
  };

  /// Récupère les ressources pour un type donné
  static Future<List<ResourceItem>> fetchResources({
    required String resourceType,
    required String token,
    Map<String, dynamic>? params,
  }) async {
    final provider = _providers[resourceType];
    if (provider == null) {
      throw Exception('No provider registered for resource type: $resourceType');
    }

    return provider.fetchResources(token: token, params: params);
  }

  /// Enregistre un nouveau provider
  static void registerProvider(String resourceType, ResourceProvider provider) {
    _providers[resourceType] = provider;
  }

  /// Vérifie si un provider existe
  static bool hasProvider(String resourceType) {
    return _providers.containsKey(resourceType);
  }
}
