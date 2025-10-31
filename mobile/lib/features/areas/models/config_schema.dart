/// Modèle représentant un champ de configuration
class ConfigField {
  final String key;
  final String type;
  final String label;
  final String? hint;
  final bool required;
  final dynamic defaultValue;
  final String? dependsOn;
  final int? min;
  final int? max;
  final int? maxLength;
  final List<String>? options;
  final Map<String, dynamic>? validation;

  ConfigField({
    required this.key,
    required this.type,
    required this.label,
    this.hint,
    this.required = false,
    this.defaultValue,
    this.dependsOn,
    this.min,
    this.max,
    this.maxLength,
    this.options,
    this.validation,
  });

  factory ConfigField.fromJson(Map<String, dynamic> json) {
    return ConfigField(
      key: json['key'] as String,
      type: json['type'] as String,
      label: json['label'] as String,
      hint: json['hint'] as String?,
      required: json['required'] as bool? ?? false,
      defaultValue: json['default'],
      dependsOn: json['dependsOn'] as String?,
      min: json['min'] as int?,
      max: json['max'] as int?,
      maxLength: json['maxLength'] as int?,
      options: json['options'] != null
          ? List<String>.from(json['options'] as List)
          : null,
      validation: json['validation'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'key': key,
      'type': type,
      'label': label,
      if (hint != null) 'hint': hint,
      'required': required,
      if (defaultValue != null) 'default': defaultValue,
      if (dependsOn != null) 'dependsOn': dependsOn,
      if (min != null) 'min': min,
      if (max != null) 'max': max,
      if (maxLength != null) 'maxLength': maxLength,
      if (options != null) 'options': options,
      if (validation != null) 'validation': validation,
    };
  }
}

/// Modèle représentant le schéma de configuration complet
class ConfigSchema {
  final List<ConfigField> fields;
  final Map<String, String>? outputSchema;

  ConfigSchema({
    required this.fields,
    this.outputSchema,
  });

  factory ConfigSchema.fromJson(Map<String, dynamic> json) {
    return ConfigSchema(
      fields: json['fields'] != null
          ? (json['fields'] as List)
              .map((f) => ConfigField.fromJson(f as Map<String, dynamic>))
              .toList()
          : [],
      outputSchema: json['outputSchema'] != null
          ? Map<String, String>.from(json['outputSchema'] as Map)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'fields': fields.map((f) => f.toJson()).toList(),
      if (outputSchema != null) 'outputSchema': outputSchema,
    };
  }
}

/// Types de champs supportés
class ConfigFieldType {
  static const String text = 'text';
  static const String textarea = 'textarea';
  static const String number = 'number';
  static const String time = 'time';
  static const String boolean = 'boolean';
  static const String dropdown = 'dropdown';
  static const String discordGuild = 'discord_guild';
  static const String discordChannel = 'discord_channel';
  static const String discordRole = 'discord_role';
  static const String githubRepository = 'github_repository';
  static const String githubBranch = 'github_branch';
  static const String gitlabProject = 'gitlab_project';
  static const String email = 'email';
  static const String url = 'url';

  /// Vérifie si un type nécessite des ressources externes
  static bool requiresResource(String type) {
    return [
      discordGuild,
      discordChannel,
      discordRole,
      githubRepository,
      githubBranch,
      gitlabProject,
    ].contains(type);
  }

  /// Retourne le type de ressource pour un type de champ
  static String? getResourceType(String type) {
    switch (type) {
      case discordGuild:
        return 'discord_guilds';
      case discordChannel:
        return 'discord_channels';
      case discordRole:
        return 'discord_roles';
      case githubRepository:
        return 'github_repositories';
      case githubBranch:
        return 'github_branches';
      case gitlabProject:
        return 'gitlab_projects';
      default:
        return null;
    }
  }
}
