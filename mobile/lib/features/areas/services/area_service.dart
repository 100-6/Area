import '../../../core/services/api_service.dart';
import '../models/area.dart';
import '../models/workflow_node.dart';
import '../models/workflow_connection.dart';
import '../models/service_info.dart';

class AreaService {
  final ApiService _apiService;

  AreaService({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  /// Récupérer toutes les AREAs de l'utilisateur
  Future<List<Area>> getAreas(String token) async {
    final response = await _apiService.get(
      '/api/areas',
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response['areas'] != null) {
      return (response['areas'] as List)
          .map((json) => Area.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Récupérer une AREA par son ID
  Future<Area> getAreaById(String areaId, String token) async {
    final response = await _apiService.get(
      '/api/areas/$areaId',
      headers: {'Authorization': 'Bearer $token'},
    );

    return Area.fromJson(response['area'] as Map<String, dynamic>);
  }

  /// Créer une nouvelle AREA
  Future<Area> createArea({
    required String name,
    String? description,
    required String token,
  }) async {
    final response = await _apiService.post(
      '/api/areas',
      body: {
        'name': name,
        if (description != null) 'description': description,
      },
      headers: {'Authorization': 'Bearer $token'},
    );

    return Area.fromJson(response['area'] as Map<String, dynamic>);
  }

  /// Mettre à jour une AREA
  Future<Area> updateArea({
    required String areaId,
    String? name,
    String? description,
    required String token,
  }) async {
    final response = await _apiService.patch(
      '/api/areas/$areaId',
      body: {
        if (name != null) 'name': name,
        if (description != null) 'description': description,
      },
      headers: {'Authorization': 'Bearer $token'},
    );

    return Area.fromJson(response['area'] as Map<String, dynamic>);
  }

  /// Activer/désactiver une AREA
  Future<void> toggleArea({
    required String areaId,
    required bool isActive,
    required String token,
  }) async {
    await _apiService.patch(
      '/api/areas/$areaId/toggle',
      body: {'is_active': isActive},
      headers: {'Authorization': 'Bearer $token'},
    );
  }

  /// Mettre à jour la configuration d'un workflow node
  Future<void> updateWorkflowNode({
    required String nodeId,
    required Map<String, dynamic> config,
    String? label,
    required String token,
  }) async {
    await _apiService.patch(
      '/api/workflows/nodes/$nodeId',
      body: {
        'config': config,
        if (label != null) 'label': label,
      },
      headers: {'Authorization': 'Bearer $token'},
    );
  }

  /// Supprimer un nœud de workflow
  Future<void> deleteWorkflowNode({
    required String nodeId,
    required String token,
  }) async {
    await _apiService.delete(
      '/api/workflows/nodes/$nodeId',
      headers: {'Authorization': 'Bearer $token'},
    );
  }

  /// Supprimer une AREA
  Future<void> deleteArea({
    required String areaId,
    required String token,
  }) async {
    await _apiService.delete(
      '/api/areas/$areaId',
      headers: {'Authorization': 'Bearer $token'},
    );
  }

  /// Récupérer les services disponibles
  Future<List<ServiceInfo>> getAvailableServices() async {
    final response = await _apiService.get('/api/about.json');

    if (response['server'] != null &&
        response['server']['services'] != null) {
      return (response['server']['services'] as List)
          .map((json) => ServiceInfo.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Récupérer les nodes d'une AREA (workflow)
  Future<List<WorkflowNode>> getWorkflowNodes({
    required String areaId,
    required String token,
  }) async {
    final response = await _apiService.get(
      '/api/workflows/$areaId',
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response['workflow'] != null && response['workflow']['nodes'] != null) {
      return (response['workflow']['nodes'] as List)
          .map((json) => WorkflowNode.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Récupérer les connexions d'une AREA
  Future<List<WorkflowConnection>> getWorkflowConnections({
    required String areaId,
    required String token,
  }) async {
    final response = await _apiService.get(
      '/api/workflows/$areaId',
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response['workflow'] != null && response['workflow']['connections'] != null) {
      return (response['workflow']['connections'] as List)
          .map((json) =>
              WorkflowConnection.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Créer un node dans le workflow
  Future<WorkflowNode> createWorkflowNode({
    required String areaId,
    required String nodeType,
    String? serviceId,
    String? actionId,
    String? reactionId,
    Map<String, dynamic>? config,
    required double positionX,
    required double positionY,
    String? label,
    required String token,
  }) async {
    final response = await _apiService.post(
      '/api/workflows/$areaId/nodes',
      body: {
        'nodeType': nodeType,
        if (serviceId != null) 'serviceId': serviceId,
        if (actionId != null) 'actionId': actionId,
        if (reactionId != null) 'reactionId': reactionId,
        if (config != null) 'config': config,
        'positionX': positionX,
        'positionY': positionY,
        if (label != null) 'label': label,
      },
      headers: {'Authorization': 'Bearer $token'},
    );

    return WorkflowNode.fromJson(response['node'] as Map<String, dynamic>);
  }

  /// Créer une connexion entre deux nodes
  Future<WorkflowConnection> createWorkflowConnection({
    required String areaId,
    required String sourceNodeId,
    required String targetNodeId,
    Map<String, dynamic>? condition,
    required String token,
  }) async {
    final response = await _apiService.post(
      '/api/workflows/$areaId/connections',
      body: {
        'sourceNodeId': sourceNodeId,
        'targetNodeId': targetNodeId,
        if (condition != null) 'condition': condition,
      },
      headers: {'Authorization': 'Bearer $token'},
    );

    return WorkflowConnection.fromJson(
        response['connection'] as Map<String, dynamic>);
  }
}
