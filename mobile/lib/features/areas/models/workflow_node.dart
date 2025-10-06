class WorkflowNode {
  final String id;
  final String areaId;
  final String nodeType; // 'trigger', 'action', 'reaction'
  final String? serviceId;
  final String? actionId;
  final String? reactionId;
  final String? connectionId;
  final Map<String, dynamic> config;
  final double positionX;
  final double positionY;
  final String? label;
  final DateTime createdAt;
  final DateTime updatedAt;

  WorkflowNode({
    required this.id,
    required this.areaId,
    required this.nodeType,
    this.serviceId,
    this.actionId,
    this.reactionId,
    this.connectionId,
    required this.config,
    required this.positionX,
    required this.positionY,
    this.label,
    required this.createdAt,
    required this.updatedAt,
  });

  factory WorkflowNode.fromJson(Map<String, dynamic> json) {
    return WorkflowNode(
      id: json['id'] as String,
      areaId: json['areaId'] as String,
      nodeType: json['nodeType'] as String,
      serviceId: json['serviceId'] as String?,
      actionId: json['actionId'] as String?,
      reactionId: json['reactionId'] as String?,
      connectionId: json['connectionId'] as String?,
      config: json['config'] as Map<String, dynamic>? ?? {},
      positionX: (json['positionX'] as num).toDouble(),
      positionY: (json['positionY'] as num).toDouble(),
      label: json['label'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'areaId': areaId,
      'nodeType': nodeType,
      'serviceId': serviceId,
      'actionId': actionId,
      'reactionId': reactionId,
      'connectionId': connectionId,
      'config': config,
      'positionX': positionX,
      'positionY': positionY,
      'label': label,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
