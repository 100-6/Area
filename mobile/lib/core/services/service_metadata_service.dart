import 'api_service.dart';

/// Service pour récupérer les métadonnées des services (icônes, couleurs)
/// Utilise /api/about.json qui est accessible sans authentification
class ServiceMetadataService {
  final ApiService _apiService;

  // Cache des métadonnées
  static Map<String, ServiceMetadata>? _cachedMetadata;
  static DateTime? _cacheTime;
  static const _cacheDuration = Duration(minutes: 30);

  ServiceMetadataService({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  /// Récupère les métadonnées de tous les services
  Future<Map<String, ServiceMetadata>> getServicesMetadata() async {
    // Vérifier le cache
    if (_cachedMetadata != null && _cacheTime != null) {
      final now = DateTime.now();
      if (now.difference(_cacheTime!) < _cacheDuration) {
        return _cachedMetadata!;
      }
    }

    try {
      final response = await _apiService.get('/api/about.json');

      if (response['server'] != null && response['server']['services'] != null) {
        final services = response['server']['services'] as List;
        final metadata = <String, ServiceMetadata>{};

        for (var service in services) {
          final name = service['name'] as String;
          metadata[name] = ServiceMetadata(
            name: name,
            displayName: service['displayName'] as String?,
            iconUrl: service['iconUrl'] as String?,
            color: service['color'] as String?,
          );
        }

        // Mettre en cache
        _cachedMetadata = metadata;
        _cacheTime = DateTime.now();

        return metadata;
      }

      return {};
    } catch (e) {
      print('Erreur lors de la récupération des métadonnées des services: $e');
      // En cas d'erreur, retourner le cache si disponible
      return _cachedMetadata ?? {};
    }
  }

  /// Récupère les métadonnées d'un service spécifique
  Future<ServiceMetadata?> getServiceMetadata(String serviceName) async {
    final metadata = await getServicesMetadata();
    return metadata[serviceName.toLowerCase()];
  }

  /// Vide le cache
  static void clearCache() {
    _cachedMetadata = null;
    _cacheTime = null;
  }
}

/// Métadonnées d'un service
class ServiceMetadata {
  final String name;
  final String? displayName;
  final String? iconUrl;
  final String? color;

  ServiceMetadata({
    required this.name,
    this.displayName,
    this.iconUrl,
    this.color,
  });

  String get effectiveDisplayName => displayName ?? name;
}
