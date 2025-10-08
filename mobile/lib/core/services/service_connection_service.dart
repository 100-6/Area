import 'api_service.dart';

/// Service pour gérer les connexions aux services externes
class ServiceConnectionService {
  final ApiService _apiService = ApiService();

  /// Vérifie si l'utilisateur est connecté à un service
  Future<bool> isServiceConnected({
    required String serviceName,
    required String token,
  }) async {
    try {
      final response = await _apiService.get(
        '/api/services/$serviceName/status',
        headers: {'Authorization': 'Bearer $token'},
      );

      return response['connected'] == true;
    } catch (e) {
      // Si l'endpoint n'existe pas ou erreur, on considère comme non connecté
      return false;
    }
  }

  /// Récupère la liste des services connectés
  Future<List<String>> getConnectedServices({
    required String token,
  }) async {
    try {
      final response = await _apiService.get(
        '/api/services/connected',
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response['services'] != null) {
        return List<String>.from(response['services']);
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}
