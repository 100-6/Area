import 'discord_service.dart';
import 'github_service.dart';

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

/// Provider pour les repositories GitHub
class GitHubRepositoryProvider implements ResourceProvider {
  final GitHubService _githubService = GitHubService();

  @override
  Future<List<ResourceItem>> fetchResources({
    required String token,
    Map<String, dynamic>? params,
  }) async {
    final repositories = await _githubService.getRepositories(token: token);
    return repositories.map((repo) {
      return ResourceItem(
        id: repo.fullName, // Utiliser fullName comme ID (owner/repo)
        name: repo.fullName,
        metadata: {
          'description': repo.description,
          'owner': repo.owner,
          'repoName': repo.name,
          'isPrivate': repo.isPrivate,
          'language': repo.language,
          'stars': repo.stargazersCount,
          'forks': repo.forksCount,
        },
      );
    }).toList();
  }
}

/// Provider pour les branches GitHub
class GitHubBranchProvider implements ResourceProvider {
  final GitHubService _githubService = GitHubService();

  @override
  Future<List<ResourceItem>> fetchResources({
    required String token,
    Map<String, dynamic>? params,
  }) async {
    final repository = params?['repository'] as String?;
    if (repository == null || !repository.contains('/')) {
      throw Exception('repository (format: owner/repo) is required for github_branches');
    }

    final parts = repository.split('/');
    final owner = parts[0];
    final repo = parts[1];

    final branches = await _githubService.getBranches(
      owner: owner,
      repo: repo,
      token: token,
    );

    return branches.map((branch) {
      return ResourceItem(
        id: branch.name,
        name: branch.name,
        metadata: {
          'commitSha': branch.commitSha,
          'isProtected': branch.isProtected,
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
    'github_repositories': GitHubRepositoryProvider(),
    'github_branches': GitHubBranchProvider(),
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
