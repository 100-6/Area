import '../../../core/services/api_service.dart';

/// Service pour récupérer les schémas de configuration des modules depuis l'API
class ModuleConfigService {
  final ApiService _apiService = ApiService();

  /// Récupère le schéma de configuration d'un module (trigger ou action)
  Future<ModuleConfigSchema?> getModuleConfig({
    required String moduleName,
    required String token,
  }) async {
    try {
      final response = await _apiService.get(
        '/api/modules/$moduleName',
        headers: {'Authorization': 'Bearer $token'},
      );

      return ModuleConfigSchema.fromJson(response);
    } catch (e) {
      print('Error in getModuleConfig: $e');
      return null;
    }
  }

  /// Récupère le schéma d'un trigger spécifique
  TriggerSchema? getTriggerSchema(
    ModuleConfigSchema moduleSchema,
    String triggerName,
  ) {
    return moduleSchema.triggers.firstWhere(
      (t) => t.name == triggerName,
      orElse: () => throw Exception('Trigger $triggerName not found'),
    );
  }

  /// Récupère le schéma d'une action spécifique
  ActionSchema? getActionSchema(
    ModuleConfigSchema moduleSchema,
    String actionName,
  ) {
    return moduleSchema.actions.firstWhere(
      (a) => a.name == actionName,
      orElse: () => throw Exception('Action $actionName not found'),
    );
  }

  /// Convertit le schéma de l'API vers le format ConfigSchema utilisé par le mobile
  Future<dynamic> convertToMobileSchema({
    required String moduleName,
    required String actionOrTriggerName,
    required String type, // 'trigger' ou 'action'
    required String token,
  }) async {
    final moduleSchema = await getModuleConfig(
      moduleName: moduleName,
      token: token,
    );

    if (moduleSchema == null) {
      throw Exception('Could not load module schema for $moduleName');
    }

    // Récupérer le bon schéma (trigger ou action)
    ApiConfigSchema configSchema;
    if (type == 'trigger') {
      final trigger = getTriggerSchema(moduleSchema, actionOrTriggerName);
      if (trigger == null) {
        throw Exception('Trigger $actionOrTriggerName not found in $moduleName');
      }
      configSchema = trigger.configSchema;
    } else {
      final action = getActionSchema(moduleSchema, actionOrTriggerName);
      if (action == null) {
        throw Exception('Action $actionOrTriggerName not found in $moduleName');
      }
      configSchema = action.configSchema;
    }

    // Convertir vers le format mobile
    return SchemaConverter.convertApiSchemaToMobile(
      configSchema,
      moduleName,
    );
  }

  /// Convertit le schéma d'un node existant (via nodeId) vers le format mobile
  Future<Map<String, dynamic>> convertToMobileSchemaByNodeId({
    required String nodeId,
    required String token,
  }) async {
    try {
      // Appeler l'API avec le nodeId
      final response = await _apiService.get(
        '/api/modules/$nodeId',
        headers: {'Authorization': 'Bearer $token'},
      );

      // L'API retourne le schéma directement pour un node
      // Format: { nodeId, nodeType, moduleName, actionName/triggerName, configSchema, currentConfig }
      final String moduleName = response['moduleName'] ?? '';
      final Map<String, dynamic> configSchemaJson = response['configSchema'] ?? {};

      // Parser le configSchema de l'API
      final ApiConfigSchema apiConfigSchema = ApiConfigSchema.fromJson(configSchemaJson);

      // Convertir vers le format mobile
      return SchemaConverter.convertApiSchemaToMobile(
        apiConfigSchema,
        moduleName,
      );
    } catch (e) {
      print('Error in convertToMobileSchemaByNodeId: $e');
      throw Exception('Could not load node schema for nodeId $nodeId: $e');
    }
  }
}

/// Convertisseur de schéma API vers format mobile
class SchemaConverter {
  /// Convertit le configSchema de l'API vers le format ConfigSchema du mobile
  static Map<String, dynamic> convertApiSchemaToMobile(
    ApiConfigSchema apiSchema,
    String moduleName,
  ) {
    final List<Map<String, dynamic>> fields = [];

    // Pour Discord, si on a un channelId ou roleId mais pas de guildId, l'ajouter automatiquement
    if (moduleName == 'discord') {
      final hasChannelOrRole = apiSchema.properties.containsKey('channelId') ||
                                apiSchema.properties.containsKey('roleId');
      final hasGuildId = apiSchema.properties.containsKey('guildId');

      if (hasChannelOrRole && !hasGuildId) {
        // Ajouter guildId en premier
        fields.add({
          'key': 'guildId',
          'type': 'discord_guild',
          'label': 'Discord Server',
          'hint': 'Select the Discord server',
          'required': true,
        });
      }
    }

    apiSchema.properties.forEach((key, field) {
      fields.add(_convertField(key, field, moduleName));
    });

    return {
      'fields': fields,
    };
  }

  static Map<String, dynamic> _convertField(
    String key,
    ApiConfigField field,
    String moduleName,
  ) {
    // Déterminer le type de champ pour le mobile
    String mobileType = _getMobileFieldType(key, field.type, moduleName);

    return {
      'key': key,
      'type': mobileType,
      'label': _generateLabel(key),
      'hint': field.description,
      'required': field.required,
      if (field.defaultValue != null) 'default': field.defaultValue,
      if (field.enumValues != null) 'options': field.enumValues,
      if (field.minValue != null) 'min': field.minValue,
      if (field.maxValue != null) 'max': field.maxValue,
      if (field.maxLength != null) 'maxLength': field.maxLength,
      if (_getFieldDependency(key, moduleName) != null)
        'dependsOn': _getFieldDependency(key, moduleName),
    };
  }

  /// Détermine le type de champ mobile approprié
  static String _getMobileFieldType(String key, String apiType, String moduleName) {
    // Champs spécifiques Discord
    if (moduleName == 'discord') {
      if (key == 'guildId') return 'discord_guild';
      if (key == 'channelId') return 'discord_channel';
      if (key == 'roleId') return 'discord_role';
    }

    // Champs spécifiques GitHub
    if (moduleName == 'github') {
      if (key == 'repository' || key == 'repo') return 'github_repo';
    }

    // Champs spécifiques GitLab
    if (moduleName == 'gitlab') {
      if (key == 'project') return 'gitlab_project';
    }

    // Types génériques
    switch (apiType) {
      case 'boolean':
        return 'boolean';
      case 'number':
      case 'integer':
        return 'number';
      case 'string':
        // Détection de types spéciaux
        if (key.contains('time') || key == 'time') return 'time';
        if (key.contains('email')) return 'email';
        if (key.contains('url')) return 'url';
        if (key.contains('message') || key.contains('content') || key.contains('description')) {
          return 'textarea';
        }
        return 'text';
      default:
        return 'text';
    }
  }

  /// Génère un label lisible à partir d'une clé
  static String _generateLabel(String key) {
    return key
        .replaceAllMapped(RegExp(r'([A-Z])'), (match) => ' ${match.group(1)}')
        .replaceAll('_', ' ')
        .split(' ')
        .map((word) => word.isEmpty
            ? ''
            : word[0].toUpperCase() + word.substring(1).toLowerCase())
        .join(' ')
        .trim();
  }

  /// Retourne la dépendance pour un champ (par exemple channelId dépend de guildId)
  static String? _getFieldDependency(String key, String moduleName) {
    if (moduleName == 'discord') {
      if (key == 'channelId' || key == 'roleId') return 'guildId';
    }
    return null;
  }
}

/// Schéma de configuration d'un module complet
class ModuleConfigSchema {
  final String moduleName;
  final String displayName;
  final String description;
  final List<TriggerSchema> triggers;
  final List<ActionSchema> actions;

  ModuleConfigSchema({
    required this.moduleName,
    required this.displayName,
    required this.description,
    required this.triggers,
    required this.actions,
  });

  factory ModuleConfigSchema.fromJson(Map<String, dynamic> json) {
    return ModuleConfigSchema(
      moduleName: json['moduleName'] ?? '',
      displayName: json['displayName'] ?? '',
      description: json['description'] ?? '',
      triggers: (json['triggers'] as List<dynamic>?)
              ?.map((t) => TriggerSchema.fromJson(t as Map<String, dynamic>))
              .toList() ??
          [],
      actions: (json['actions'] as List<dynamic>?)
              ?.map((a) => ActionSchema.fromJson(a as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

/// Schéma d'un trigger
class TriggerSchema {
  final String name;
  final String description;
  final String type;
  final Map<String, dynamic> outputSchema;
  final ApiConfigSchema configSchema;

  TriggerSchema({
    required this.name,
    required this.description,
    required this.type,
    required this.outputSchema,
    required this.configSchema,
  });

  factory TriggerSchema.fromJson(Map<String, dynamic> json) {
    return TriggerSchema(
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      type: json['type'] ?? '',
      outputSchema: json['outputSchema'] ?? {},
      configSchema: ApiConfigSchema.fromJson(json['configSchema'] ?? {}),
    );
  }
}

/// Schéma d'une action
class ActionSchema {
  final String name;
  final String description;
  final Map<String, dynamic> outputSchema;
  final ApiConfigSchema configSchema;
  final List<String>? requiredScopes;

  ActionSchema({
    required this.name,
    required this.description,
    required this.outputSchema,
    required this.configSchema,
    this.requiredScopes,
  });

  factory ActionSchema.fromJson(Map<String, dynamic> json) {
    return ActionSchema(
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      outputSchema: json['outputSchema'] ?? {},
      configSchema: ApiConfigSchema.fromJson(json['configSchema'] ?? {}),
      requiredScopes: (json['requiredScopes'] as List<dynamic>?)
          ?.map((s) => s.toString())
          .toList(),
    );
  }
}

/// Schéma de configuration de l'API (champs requis pour un trigger ou une action)
class ApiConfigSchema {
  final String type;
  final Map<String, ApiConfigField> properties;

  ApiConfigSchema({
    required this.type,
    required this.properties,
  });

  factory ApiConfigSchema.fromJson(Map<String, dynamic> json) {
    final propertiesMap = <String, ApiConfigField>{};
    final properties = json['properties'] as Map<String, dynamic>? ?? {};

    // Récupérer la liste des champs requis depuis le JSON Schema (format standard)
    final requiredList = (json['required'] as List<dynamic>?)
        ?.map((e) => e.toString())
        .toList() ?? [];

    properties.forEach((key, value) {
      if (value is Map<String, dynamic>) {
        // Marquer le champ comme requis s'il est dans la liste 'required' ou si required: true dans le champ
        final isRequired = requiredList.contains(key) || (value['required'] == true);
        propertiesMap[key] = ApiConfigField.fromJson(value, isRequired: isRequired);
      }
    });

    return ApiConfigSchema(
      type: json['type'] ?? 'object',
      properties: propertiesMap,
    );
  }

  /// Retourne la liste des champs requis
  List<String> get requiredFields {
    return properties.entries
        .where((entry) => entry.value.required)
        .map((entry) => entry.key)
        .toList();
  }
}

/// Champ de configuration de l'API
class ApiConfigField {
  final String type;
  final String? description;
  final bool required;
  final dynamic defaultValue;
  final List<String>? enumValues;
  final int? minValue;
  final int? maxValue;
  final int? maxLength;

  ApiConfigField({
    required this.type,
    this.description,
    this.required = false,
    this.defaultValue,
    this.enumValues,
    this.minValue,
    this.maxValue,
    this.maxLength,
  });

  factory ApiConfigField.fromJson(Map<String, dynamic> json, {bool isRequired = false}) {
    return ApiConfigField(
      type: json['type'] ?? 'string',
      description: json['description'] ?? json['title'], // Utiliser 'title' comme fallback
      required: isRequired || (json['required'] == true),
      defaultValue: json['default'],
      enumValues: (json['enum'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList(),
      minValue: json['minimum'],
      maxValue: json['maximum'],
      maxLength: json['maxLength'],
    );
  }
}
