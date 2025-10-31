import '../../../core/services/api_service.dart';

/// Modèle pour un repository GitHub
class GitHubRepository {
  final int id;
  final String name;
  final String fullName;
  final String? description;
  final String owner;
  final bool isPrivate;
  final String? language;
  final int stargazersCount;
  final int forksCount;

  GitHubRepository({
    required this.id,
    required this.name,
    required this.fullName,
    this.description,
    required this.owner,
    required this.isPrivate,
    this.language,
    required this.stargazersCount,
    required this.forksCount,
  });

  factory GitHubRepository.fromJson(Map<String, dynamic> json) {
    return GitHubRepository(
      id: json['id'] as int,
      name: json['name'] as String,
      fullName: json['full_name'] as String,
      description: json['description'] as String?,
      owner: json['owner']?['login'] as String? ?? '',
      isPrivate: json['private'] as bool? ?? false,
      language: json['language'] as String?,
      stargazersCount: json['stargazers_count'] as int? ?? 0,
      forksCount: json['forks_count'] as int? ?? 0,
    );
  }
}

/// Modèle pour une branche GitHub
class GitHubBranch {
  final String name;
  final String commitSha;
  final bool isProtected;

  GitHubBranch({
    required this.name,
    required this.commitSha,
    required this.isProtected,
  });

  factory GitHubBranch.fromJson(Map<String, dynamic> json) {
    return GitHubBranch(
      name: json['name'] as String,
      commitSha: json['commit']?['sha'] as String? ?? '',
      isProtected: json['protected'] as bool? ?? false,
    );
  }
}

/// Modèle pour une organisation GitHub
class GitHubOrganization {
  final int id;
  final String login;
  final String? description;
  final String? avatarUrl;

  GitHubOrganization({
    required this.id,
    required this.login,
    this.description,
    this.avatarUrl,
  });

  factory GitHubOrganization.fromJson(Map<String, dynamic> json) {
    return GitHubOrganization(
      id: json['id'] as int,
      login: json['login'] as String,
      description: json['description'] as String?,
      avatarUrl: json['avatar_url'] as String?,
    );
  }
}

/// Service pour interagir avec l'API GitHub
class GitHubService {
  final ApiService _apiService = ApiService();

  /// Récupère la liste des repositories GitHub
  Future<List<GitHubRepository>> getRepositories({
    required String token,
    String affiliation = 'all',
    String sort = 'updated',
    int perPage = 100,
  }) async {
    final response = await _apiService.get(
      '/api/github/repositories?affiliation=$affiliation&sort=$sort&per_page=$perPage',
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response['repositories'] != null) {
      return (response['repositories'] as List)
          .map((json) => GitHubRepository.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Récupère les branches d'un repository GitHub
  Future<List<GitHubBranch>> getBranches({
    required String owner,
    required String repo,
    required String token,
    int perPage = 100,
  }) async {
    final response = await _apiService.get(
      '/api/github/repositories/$owner/$repo/branches?per_page=$perPage',
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response['branches'] != null) {
      return (response['branches'] as List)
          .map((json) => GitHubBranch.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Récupère la liste des organisations GitHub
  Future<List<GitHubOrganization>> getOrganizations({
    required String token,
  }) async {
    final response = await _apiService.get(
      '/api/github/organizations',
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response['organizations'] != null) {
      return (response['organizations'] as List)
          .map((json) => GitHubOrganization.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }
}
