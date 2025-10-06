class Area {
  final String id;
  final String userId;
  final String name;
  final String? description;
  final bool isActive;
  final int executionCount;
  final DateTime? lastTriggeredAt;
  final String? lastExecutionStatus;
  final DateTime createdAt;
  final DateTime updatedAt;

  Area({
    required this.id,
    required this.userId,
    required this.name,
    this.description,
    required this.isActive,
    required this.executionCount,
    this.lastTriggeredAt,
    this.lastExecutionStatus,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Area.fromJson(Map<String, dynamic> json) {
    return Area(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      isActive: json['is_active'] as bool,
      executionCount: json['execution_count'] as int,
      lastTriggeredAt: json['last_triggered_at'] != null
          ? DateTime.parse(json['last_triggered_at'] as String)
          : null,
      lastExecutionStatus: json['last_execution_status'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'name': name,
      'description': description,
      'is_active': isActive,
      'execution_count': executionCount,
      'last_triggered_at': lastTriggeredAt?.toIso8601String(),
      'last_execution_status': lastExecutionStatus,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  Area copyWith({
    String? id,
    String? userId,
    String? name,
    String? description,
    bool? isActive,
    int? executionCount,
    DateTime? lastTriggeredAt,
    String? lastExecutionStatus,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Area(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      description: description ?? this.description,
      isActive: isActive ?? this.isActive,
      executionCount: executionCount ?? this.executionCount,
      lastTriggeredAt: lastTriggeredAt ?? this.lastTriggeredAt,
      lastExecutionStatus: lastExecutionStatus ?? this.lastExecutionStatus,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
