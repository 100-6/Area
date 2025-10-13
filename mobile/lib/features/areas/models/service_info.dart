import 'config_schema.dart';

class ServiceInfo {
  final String name;
  final List<ServiceAction> actions;
  final List<ServiceReaction> reactions;

  ServiceInfo({
    required this.name,
    required this.actions,
    required this.reactions,
  });

  factory ServiceInfo.fromJson(Map<String, dynamic> json) {
    return ServiceInfo(
      name: json['name'] as String,
      actions: (json['actions'] as List<dynamic>)
          .map((e) => ServiceAction.fromJson(e as Map<String, dynamic>))
          .toList(),
      reactions: (json['reactions'] as List<dynamic>)
          .map((e) => ServiceReaction.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'actions': actions.map((e) => e.toJson()).toList(),
      'reactions': reactions.map((e) => e.toJson()).toList(),
    };
  }
}

class ServiceAction {
  final String name;
  final String description;
  final ConfigSchema? configSchema;

  ServiceAction({
    required this.name,
    required this.description,
    this.configSchema,
  });

  factory ServiceAction.fromJson(Map<String, dynamic> json) {
    return ServiceAction(
      name: json['name'] as String,
      description: json['description'] as String,
      configSchema: json['configSchema'] != null
          ? ConfigSchema.fromJson(json['configSchema'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      if (configSchema != null) 'configSchema': configSchema!.toJson(),
    };
  }
}

class ServiceReaction {
  final String name;
  final String description;
  final ConfigSchema? configSchema;

  ServiceReaction({
    required this.name,
    required this.description,
    this.configSchema,
  });

  factory ServiceReaction.fromJson(Map<String, dynamic> json) {
    return ServiceReaction(
      name: json['name'] as String,
      description: json['description'] as String,
      configSchema: json['configSchema'] != null
          ? ConfigSchema.fromJson(json['configSchema'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      if (configSchema != null) 'configSchema': configSchema!.toJson(),
    };
  }
}
