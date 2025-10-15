import 'package:flutter/material.dart';
import '../models/service_info.dart';
import '../models/config_schema.dart';
import '../screens/dynamic_node_config_screen.dart';

/// Helper pour gérer la configuration des nodes en chargeant dynamiquement depuis l'API
class NodeConfigHelper {
  /// Ouvre l'écran de configuration en chargeant le schéma depuis l'API /api/modules
  static Future<Map<String, dynamic>?> openConfigScreen({
    required BuildContext context,
    String? nodeId, // UUID du node pour édition
    required String nodeType,
    required String serviceName,
    required String actionName,
    required String description,
    ServiceAction? serviceAction,
    ServiceReaction? serviceReaction,
    Map<String, dynamic>? existingConfig,
  }) async {
    // Utiliser le nouveau système dynamique qui charge depuis l'API
    return await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => DynamicNodeConfigScreen(
          nodeId: nodeId, // Passer le nodeId si disponible
          nodeType: nodeType,
          serviceName: serviceName,
          actionName: actionName,
          description: description,
          existingConfig: existingConfig,
        ),
      ),
    );
  }

  /// Obtient un texte d'affichage formaté pour un trigger/action
  static String getDisplayText({
    required String serviceName,
    required String actionName,
    String? label,
  }) {
    if (label != null && label.isNotEmpty) {
      return label;
    }

    // Formatter le nom de façon lisible
    return _formatActionName(serviceName, actionName);
  }

  /// Obtient un texte de configuration formaté
  static String getConfigSummary({
    required String serviceName,
    required String actionName,
    required Map<String, dynamic> config,
    ConfigSchema? schema,
  }) {
    if (config.isEmpty) return '';

    // Si un schéma existe, utiliser les labels des champs
    if (schema != null) {
      final parts = <String>[];
      for (var field in schema.fields) {
        final value = config[field.key];
        if (value != null && value.toString().isNotEmpty) {
          parts.add('${field.label}: ${_formatValue(value)}');
        }
      }
      return parts.join(' • ');
    }

    // Sinon, affichage basique
    final parts = <String>[];
    config.forEach((key, value) {
      if (value != null && value.toString().isNotEmpty) {
        parts.add('$key: ${_formatValue(value)}');
      }
    });
    return parts.join(' • ');
  }

  static String _formatActionName(String serviceName, String actionName) {
    // Convertir snake_case en Title Case
    final words = actionName.split('_');
    final formatted = words.map((word) {
      return word[0].toUpperCase() + word.substring(1);
    }).join(' ');

    return '$serviceName: $formatted';
  }

  static String _formatValue(dynamic value) {
    if (value is String && value.length > 30) {
      return '${value.substring(0, 30)}...';
    }
    return value.toString();
  }
}

/// Extension pour faciliter l'accès au schéma depuis ServiceAction/ServiceReaction
extension ServiceActionExtension on ServiceAction {
  bool get hasSchema => configSchema != null;

  ConfigSchema? get schema => configSchema;
}

extension ServiceReactionExtension on ServiceReaction {
  bool get hasSchema => configSchema != null;

  ConfigSchema? get schema => configSchema;
}
