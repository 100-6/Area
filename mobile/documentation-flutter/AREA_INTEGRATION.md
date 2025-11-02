# Area Integration Guide

**Version:** 1.0.0
**Last Updated:** 2025-01-02

---

## Table of Contents

1. [Overview](#overview)
2. [Area Architecture](#area-architecture)
3. [Creating an Area](#creating-an-area)
4. [Editing an Area](#editing-an-area)
5. [Managing Workflow Nodes](#managing-workflow-nodes)
6. [Node Configuration](#node-configuration)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## Overview

An **Area** is an automation workflow that connects triggers and actions. When a trigger event occurs (e.g., "new Discord message"), it executes a sequence of actions (e.g., "create GitHub issue").

### Key Concepts

- **Area**: A workflow container with a name, description, and active status
- **Trigger**: The event that starts the workflow (only 1 per area)
- **Action**: Operations executed sequentially (N actions per area)
- **Node**: Individual workflow component (trigger or action)
- **Connection**: Link between nodes defining execution order

### Workflow Structure

```
[Trigger Node] → [Action Node 1] → [Action Node 2] → [Action Node N]
```

---

## Area Architecture

### Data Models

#### Area Model

```dart
class Area {
  final String id;
  final String userId;
  final String name;
  final String? description;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? updatedAt;
}
```

#### WorkflowNode Model

```dart
class WorkflowNode {
  final String id;              // Node UUID or temp_action_N for new nodes
  final String areaId;
  final String nodeType;        // 'trigger' or 'action'
  final String? serviceId;      // Service name (discord, github, etc.)
  final String? actionId;       // Trigger name (for triggers)
  final String? reactionId;     // Action name (for actions)
  final Map<String, dynamic> config;  // Node configuration
  final double positionX;       // UI position
  final double positionY;
  final String? label;
  final DateTime createdAt;
  final DateTime? updatedAt;
}
```

### API Endpoints

- `GET /api/areas` - List all user areas
- `GET /api/areas/:id` - Get specific area
- `POST /api/areas` - Create new area
- `PATCH /api/areas/:id` - Update area
- `DELETE /api/areas/:id` - Delete area
- `PATCH /api/areas/:id/toggle` - Toggle area active/inactive

---

## Creating an Area

### Step-by-Step Flow

#### 1. Create Area Entity

```dart
final result = await areaService.createArea(
  name: 'Discord to GitHub Sync',
  description: 'Creates GitHub issues from Discord messages',
  token: userToken,
);

if (result.isSuccess) {
  final area = result.data;
  print('Area created: ${area.id}');
}
```

#### 2. Create Trigger Node

```dart
final triggerResult = await areaService.createWorkflowNode(
  areaId: area.id,
  nodeType: 'trigger',
  serviceId: 'discord',
  actionId: 'new_message',
  config: {
    'channel_id': '123456789',
    'keywords': ['urgent', 'bug'],
  },
  positionX: 100,
  positionY: 100,
  token: userToken,
);
```

#### 3. Create Action Nodes

```dart
final action1Result = await areaService.createWorkflowNode(
  areaId: area.id,
  nodeType: 'action',
  serviceId: 'github',
  reactionId: 'create_issue',
  config: {
    'repository': 'owner/repo',
    'title': '{{trigger.message_content}}',
    'body': 'Issue from Discord: {{trigger.author}}',
  },
  positionX: 300,
  positionY: 100,
  token: userToken,
);
```

#### 4. Create Connections

```dart
await areaService.createWorkflowConnection(
  areaId: area.id,
  sourceNodeId: triggerNode.id,
  targetNodeId: action1Node.id,
  token: userToken,
);
```

### Complete Example

```dart
Future<void> createCompleteArea() async {
  final token = await storageService.getToken();

  // 1. Create area
  final areaResult = await areaService.createArea(
    name: 'Weather Notification',
    description: 'Send notification when it rains',
    token: token,
  );

  if (!areaResult.isSuccess) {
    print('Error: ${areaResult.failure?.message}');
    return;
  }

  final area = areaResult.data!;

  // 2. Create trigger
  final triggerResult = await areaService.createWorkflowNode(
    areaId: area.id,
    nodeType: 'trigger',
    serviceId: 'weather',
    actionId: 'rain_detected',
    config: {'city': 'Paris', 'threshold': 50},
    positionX: 100,
    positionY: 100,
    token: token,
  );

  final trigger = triggerResult.data!;

  // 3. Create action
  final actionResult = await areaService.createWorkflowNode(
    areaId: area.id,
    nodeType: 'action',
    serviceId: 'ntfy',
    reactionId: 'send_notification',
    config: {
      'topic': 'weather-alerts',
      'message': 'Rain detected in {{trigger.city}}!',
    },
    positionX: 300,
    positionY: 100,
    token: token,
  );

  final action = actionResult.data!;

  // 4. Connect nodes
  await areaService.createWorkflowConnection(
    areaId: area.id,
    sourceNodeId: trigger.id,
    targetNodeId: action.id,
    token: token,
  );

  print('Area created successfully: ${area.id}');
}
```

---

## Editing an Area

### Update Flow

When editing an existing area, the system:

1. Updates area metadata (name, description)
2. Identifies new nodes (IDs starting with `temp_`)
3. Creates new nodes in backend
4. Connects new nodes to existing workflow

### Detecting New Nodes

```dart
// In AreaEditorScreen
final newNodes = _actionNodes.where((node) => node.id.startsWith('temp_')).toList();

print('Found ${newNodes.length} new nodes to create');
```

### Adding Nodes to Existing Area

```dart
Future<void> addActionsToArea(String areaId, List<WorkflowNode> newNodes) async {
  final token = await storageService.getToken();

  // Get existing nodes to find last node
  final nodesResult = await areaService.getWorkflowNodes(
    areaId: areaId,
    token: token,
  );

  if (!nodesResult.isSuccess) return;

  final existingNodes = nodesResult.data!;
  String? lastNodeId = existingNodes.isNotEmpty ? existingNodes.last.id : null;

  // Create each new node and connect it
  for (final newNode in newNodes) {
    // Create node
    final createResult = await areaService.createWorkflowNode(
      areaId: areaId,
      nodeType: newNode.nodeType,
      serviceId: newNode.serviceId,
      reactionId: newNode.reactionId,
      config: newNode.config,
      positionX: newNode.positionX,
      positionY: newNode.positionY,
      token: token,
    );

    if (!createResult.isSuccess) continue;

    final createdNode = createResult.data!;

    // Connect to previous node
    if (lastNodeId != null) {
      await areaService.createWorkflowConnection(
        areaId: areaId,
        sourceNodeId: lastNodeId,
        targetNodeId: createdNode.id,
        token: token,
      );
    }

    lastNodeId = createdNode.id;
  }
}
```

---

## Managing Workflow Nodes

### Deleting Nodes

Node deletion depends on whether the node exists in the backend:

```dart
Future<void> deleteNode(WorkflowNode node, String? areaId) async {
  final token = await storageService.getToken();

  // If node exists in backend, delete it first
  if (areaId != null && !node.id.startsWith('temp_')) {
    final result = await areaService.deleteWorkflowNode(
      nodeId: node.id,
      token: token,
    );

    if (!result.isSuccess) {
      print('Error deleting node: ${result.failure?.message}');
      return;
    }
  }

  // Remove from local state
  setState(() {
    _actionNodes.remove(node);
  });
}
```

### Node Validation

Before saving, validate the workflow:

```dart
bool validateWorkflow() {
  // Check if trigger exists
  if (_triggerNode == null) {
    showError('Trigger is required');
    return false;
  }

  // Check if at least one action exists
  if (_actionNodes.isEmpty) {
    showError('At least one action is required');
    return false;
  }

  // Check if trigger is configured
  if (_triggerNode!.config.isEmpty) {
    showError('Trigger must be configured');
    return false;
  }

  // Check if all actions are configured
  for (final action in _actionNodes) {
    if (action.config.isEmpty) {
      showError('All actions must be configured');
      return false;
    }
  }

  return true;
}
```

---

## Node Configuration

### Opening Configuration Screen

```dart
Future<void> configureNode(WorkflowNode node) async {
  // Get previous node outputs for variable resolution
  final previousOutputs = await _getPreviousNodeOutputs(node);

  final config = await NodeConfigHelper.openConfigScreen(
    context: context,
    nodeType: node.nodeType,
    serviceName: node.serviceId!,
    actionName: node.nodeType == 'trigger' ? node.actionId! : node.reactionId!,
    serviceReaction: await _getServiceMetadata(node),
    previousNodeOutputSchema: previousOutputs,
    currentConfig: node.config,
  );

  if (config != null) {
    setState(() {
      node.config = config;
    });
  }
}
```

### Variable Interpolation

Use variables from previous nodes in action configurations:

```dart
// Example: Use trigger output in action config
{
  'title': '{{trigger.message_content}}',
  'author': '{{trigger.user_name}}',
  'timestamp': '{{trigger.timestamp}}'
}

// Example: Use previous action output
{
  'issue_url': '{{action_1.issue_url}}',
  'issue_number': '{{action_1.issue_number}}'
}
```

### Schema Conversion

Node configurations are converted between backend and mobile formats:

```dart
// Convert backend schema to mobile schema
final mobileSchema = SchemaConverter.convertToMobileSchema(backendSchema);

// Convert mobile config to backend format
final backendConfig = SchemaConverter.convertMobileConfigToBackend(
  mobileConfig,
  serviceName,
);
```

---

## Common Patterns

### Pattern 1: Notification on Event

```
[Service Trigger] → [Ntfy Notification]
```

Example: Discord message → Ntfy notification

```dart
// Trigger
{
  'serviceId': 'discord',
  'actionId': 'new_message',
  'config': {'channel_id': '123'}
}

// Action
{
  'serviceId': 'ntfy',
  'reactionId': 'send_notification',
  'config': {
    'topic': 'alerts',
    'message': '{{trigger.message_content}}'
  }
}
```

### Pattern 2: Multi-Service Sync

```
[Service A Trigger] → [Service B Action] → [Service C Action]
```

Example: GitHub PR → Discord notification → Slack message

### Pattern 3: Data Aggregation

```
[Timer Trigger] → [Fetch Data] → [Process Data] → [Store Result]
```

Example: Daily weather report sent via email

### Pattern 4: Conditional Actions

```
[Trigger] → [Filter Action] → [Conditional Action]
```

Example: Monitor RSS feed → Filter by keywords → Send notification

---

## Troubleshooting

### Common Issues

#### Issue: "Area save fails silently"

**Cause**: Missing trigger or action configuration

**Solution**:
```dart
// Validate before saving
if (!validateWorkflow()) {
  return;
}
```

#### Issue: "Duplicate nodes created on multiple saves"

**Cause**: No loading flag to prevent duplicate requests

**Solution**:
```dart
bool _isSaving = false;

Future<void> saveArea() async {
  if (_isSaving) return;

  setState(() => _isSaving = true);

  try {
    // Save logic
  } finally {
    setState(() => _isSaving = false);
  }
}
```

#### Issue: "Variables not resolved in action config"

**Cause**: Incorrect variable format or missing output schema

**Solution**:
```dart
// Use correct format: {{node_type.variable_name}}
'title': '{{trigger.message_content}}'  // ✅ Correct
'title': '{trigger.message_content}'    // ❌ Wrong
'title': '{{message_content}}'          // ❌ Wrong
```

#### Issue: "Node deletion fails"

**Cause**: Trying to delete backend node without proper authentication

**Solution**:
```dart
// Always pass token
await areaService.deleteWorkflowNode(
  nodeId: node.id,
  token: await storageService.getToken(),  // Don't forget token
);
```

### Debugging Tips

**Enable API logging:**

```dart
// In ApiService
print('Request: $method $url');
print('Body: ${jsonEncode(body)}');
print('Response: ${response.body}');
```

**Check node state:**

```dart
print('Trigger: ${_triggerNode?.id}');
print('Actions: ${_actionNodes.map((n) => n.id).toList()}');
print('New nodes: ${_actionNodes.where((n) => n.id.startsWith("temp_")).length}');
```

**Verify connections:**

```dart
final connections = await areaService.getWorkflowConnections(areaId: areaId);
print('Connections: ${connections.length}');
```

---

## Best Practices

1. **Always validate workflows** before saving
2. **Use loading flags** to prevent duplicate saves
3. **Handle errors gracefully** with user feedback
4. **Keep configurations simple** for better maintainability
5. **Test with real services** before deploying
6. **Document custom variables** for future reference
7. **Use descriptive names** for areas and nodes

---

**See also:**
- [OAuth Integration](OAUTH_INTEGRATION.md)
- [Schema System Documentation](SCHEMA_SYSTEM_DOCUMENTATION.md)
- [Technical Documentation](TECHNICAL_DOCUMENTATION.md)
