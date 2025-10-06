class WorkflowConnection {
  final String id;
  final String areaId;
  final String sourceNodeId;
  final String targetNodeId;
  final Map<String, dynamic>? condition;
  final DateTime createdAt;

  WorkflowConnection({
    required this.id,
    required this.areaId,
    required this.sourceNodeId,
    required this.targetNodeId,
    this.condition,
    required this.createdAt,
  });

  factory WorkflowConnection.fromJson(Map<String, dynamic> json) {
    return WorkflowConnection(
      id: json['id'] as String,
      areaId: json['areaId'] as String,
      sourceNodeId: json['sourceNodeId'] as String,
      targetNodeId: json['targetNodeId'] as String,
      condition: json['condition'] as Map<String, dynamic>?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'areaId': areaId,
      'sourceNodeId': sourceNodeId,
      'targetNodeId': targetNodeId,
      'condition': condition,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
