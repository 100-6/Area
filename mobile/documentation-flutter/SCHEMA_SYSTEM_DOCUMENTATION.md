# Schema System Documentation

**Version:** 1.0.0
**Last Updated:** 2025-01-02

---

## Table of Contents

1. [Overview](#overview)
2. [Schema Architecture](#schema-architecture)
3. [Backend Schema Format](#backend-schema-format)
4. [Mobile Schema Format](#mobile-schema-format)
5. [Schema Conversion](#schema-conversion)
6. [Variable System](#variable-system)
7. [Configuration Flow](#configuration-flow)
8. [Examples](#examples)
9. [Best Practices](#best-practices)

---

## Overview

The Schema System manages the conversion between backend configuration schemas and mobile-friendly UI schemas. It enables dynamic form generation for configuring triggers and actions in workflow nodes.

### Key Responsibilities

1. **Schema Conversion**: Translate backend schemas to mobile format
2. **Variable Resolution**: Handle dynamic variables from previous nodes
3. **Form Generation**: Create UI inputs from schema definitions
4. **Validation**: Ensure configuration meets requirements
5. **Data Transformation**: Convert user inputs to backend format

### Components

- **Backend Schema**: JSON schema from API defining configuration structure
- **Mobile Schema**: Simplified schema for mobile UI generation
- **SchemaConverter**: Service converting between formats
- **NodeConfigHelper**: Utility for opening configuration screens
- **Variable System**: Handles interpolation of previous node outputs

---

## Schema Architecture

### Data Flow

```
┌──────────────────┐
│  Backend API     │
│  Returns schema  │
└────────┬─────────┘
         │
         │ JSON Schema
         ▼
┌──────────────────────┐
│  SchemaConverter     │
│  Converts to mobile  │
└────────┬─────────────┘
         │
         │ Mobile Schema
         ▼
┌──────────────────────┐
│  UI Form Generator   │
│  Creates input fields│
└────────┬─────────────┘
         │
         │ User fills form
         ▼
┌──────────────────────┐
│  SchemaConverter     │
│  Converts to backend │
└────────┬─────────────┘
         │
         │ Backend Config
         ▼
┌──────────────────┐
│  Save to API     │
└──────────────────┘
```

---

## Backend Schema Format

### Structure

Backend schemas define the expected configuration structure for each trigger or action.

```json
{
  "type": "object",
  "properties": {
    "channel_id": {
      "type": "string",
      "description": "Discord channel ID",
      "required": true,
      "format": "text"
    },
    "message": {
      "type": "string",
      "description": "Message to send",
      "required": true,
      "format": "textarea"
    },
    "mention_role": {
      "type": "boolean",
      "description": "Mention @everyone",
      "required": false,
      "default": false
    },
    "priority": {
      "type": "string",
      "description": "Message priority",
      "enum": ["low", "normal", "high"],
      "default": "normal"
    }
  },
  "required": ["channel_id", "message"]
}
```

### Field Types

| Type | Description | UI Element |
|------|-------------|------------|
| `string` | Text input | TextField |
| `string` (textarea) | Multi-line text | TextField (multiline) |
| `boolean` | True/false | Switch |
| `number` | Numeric value | TextField (numeric) |
| `integer` | Integer value | TextField (numeric) |
| `enum` | Select from options | Dropdown |
| `array` | List of values | Multiple inputs |
| `object` | Nested object | Nested form |

### Field Properties

- **type**: Data type (string, number, boolean, etc.)
- **description**: Human-readable label
- **required**: Whether field is mandatory
- **default**: Default value
- **enum**: List of allowed values (for dropdowns)
- **format**: Special formatting (text, textarea, url, email, etc.)
- **pattern**: Regex validation pattern
- **minimum/maximum**: Numeric constraints
- **minLength/maxLength**: String length constraints

---

## Mobile Schema Format

### Structure

Mobile schemas are simplified for easier UI generation.

```dart
class MobileSchemaField {
  final String key;              // Field identifier
  final String label;            // Display label
  final String type;             // Field type
  final bool required;           // Is required?
  final dynamic defaultValue;    // Default value
  final List<String>? options;   // For dropdowns
  final String? placeholder;     // Placeholder text
  final Map<String, dynamic>? validation;  // Validation rules
}
```

### Example

```dart
[
  MobileSchemaField(
    key: 'channel_id',
    label: 'Discord channel ID',
    type: 'text',
    required: true,
  ),
  MobileSchemaField(
    key: 'message',
    label: 'Message to send',
    type: 'textarea',
    required: true,
    placeholder: 'Enter your message...',
  ),
  MobileSchemaField(
    key: 'mention_role',
    label: 'Mention @everyone',
    type: 'boolean',
    required: false,
    defaultValue: false,
  ),
  MobileSchemaField(
    key: 'priority',
    label: 'Message priority',
    type: 'select',
    required: false,
    options: ['low', 'normal', 'high'],
    defaultValue: 'normal',
  ),
]
```

---

## Schema Conversion

### Backend to Mobile

**`lib/features/areas/services/schema_converter.dart`:**

```dart
class SchemaConverter {
  /// Convert backend schema to mobile schema
  static List<MobileSchemaField> convertToMobileSchema(
    Map<String, dynamic> backendSchema,
  ) {
    final List<MobileSchemaField> fields = [];

    // Extract properties from backend schema
    final properties = backendSchema['properties'] as Map<String, dynamic>?;
    final required = backendSchema['required'] as List<dynamic>? ?? [];

    if (properties == null) return fields;

    // Convert each property to mobile field
    properties.forEach((key, value) {
      final fieldSchema = value as Map<String, dynamic>;

      fields.add(MobileSchemaField(
        key: key,
        label: fieldSchema['description'] ?? key,
        type: _convertType(fieldSchema),
        required: required.contains(key),
        defaultValue: fieldSchema['default'],
        options: _extractOptions(fieldSchema),
        placeholder: _generatePlaceholder(fieldSchema),
        validation: _extractValidation(fieldSchema),
      ));
    });

    return fields;
  }

  /// Convert backend type to mobile type
  static String _convertType(Map<String, dynamic> schema) {
    final type = schema['type'] as String?;
    final format = schema['format'] as String?;

    if (schema.containsKey('enum')) return 'select';
    if (type == 'boolean') return 'boolean';
    if (type == 'number' || type == 'integer') return 'number';
    if (format == 'textarea') return 'textarea';
    if (format == 'email') return 'email';
    if (format == 'url') return 'url';

    return 'text';
  }

  /// Extract enum options
  static List<String>? _extractOptions(Map<String, dynamic> schema) {
    final enumValues = schema['enum'] as List<dynamic>?;
    return enumValues?.map((e) => e.toString()).toList();
  }

  /// Generate placeholder text
  static String? _generatePlaceholder(Map<String, dynamic> schema) {
    final type = schema['type'] as String?;

    if (type == 'string') return 'Enter ${schema['description'] ?? 'value'}';
    if (type == 'number') return 'Enter number';
    if (type == 'integer') return 'Enter integer';

    return null;
  }

  /// Extract validation rules
  static Map<String, dynamic>? _extractValidation(Map<String, dynamic> schema) {
    final validation = <String, dynamic>{};

    if (schema['pattern'] != null) {
      validation['pattern'] = schema['pattern'];
    }
    if (schema['minLength'] != null) {
      validation['minLength'] = schema['minLength'];
    }
    if (schema['maxLength'] != null) {
      validation['maxLength'] = schema['maxLength'];
    }
    if (schema['minimum'] != null) {
      validation['minimum'] = schema['minimum'];
    }
    if (schema['maximum'] != null) {
      validation['maximum'] = schema['maximum'];
    }

    return validation.isEmpty ? null : validation;
  }
}
```

### Mobile to Backend

```dart
class SchemaConverter {
  /// Convert mobile config to backend format
  static Map<String, dynamic> convertMobileConfigToBackend(
    Map<String, dynamic> mobileConfig,
    String serviceName,
  ) {
    final backendConfig = <String, dynamic>{};

    mobileConfig.forEach((key, value) {
      // Handle variable interpolation
      if (value is String && value.contains('{{')) {
        backendConfig[key] = value;  // Keep variables as-is
      }
      // Handle boolean conversion
      else if (value is bool) {
        backendConfig[key] = value;
      }
      // Handle number conversion
      else if (value is num) {
        backendConfig[key] = value;
      }
      // Handle string conversion
      else {
        backendConfig[key] = value.toString();
      }
    });

    return backendConfig;
  }
}
```

---

## Variable System

### Variable Interpolation

Variables allow actions to use data from previous nodes (trigger or earlier actions).

### Variable Format

```
{{node_type.variable_name}}
```

**Examples:**

```dart
// Use trigger output
'{{trigger.message_content}}'
'{{trigger.user_name}}'
'{{trigger.timestamp}}'

// Use previous action output
'{{action_1.issue_url}}'
'{{action_1.issue_number}}'
'{{action_2.response_body}}'
```

### Variable Schema

Previous nodes provide output schemas defining available variables:

```dart
Map<String, dynamic> triggerOutputSchema = {
  'type': 'object',
  'properties': {
    'message_content': {
      'type': 'string',
      'description': 'The message content',
    },
    'user_name': {
      'type': 'string',
      'description': 'The user who sent the message',
    },
    'timestamp': {
      'type': 'string',
      'description': 'Message timestamp',
    },
  },
};
```

### Variable Resolution UI

The configuration screen displays available variables:

```dart
// Display available variables
Widget _buildVariablesList(Map<String, dynamic> outputSchema) {
  final properties = outputSchema['properties'] as Map<String, dynamic>? ?? {};

  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text('Available Variables:', style: TextStyle(fontWeight: FontWeight.bold)),
      ...properties.entries.map((entry) {
        return ListTile(
          title: Text('{{trigger.${entry.key}}}'),
          subtitle: Text(entry.value['description'] ?? ''),
          trailing: IconButton(
            icon: Icon(Icons.copy),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: '{{trigger.${entry.key}}}'));
            },
          ),
        );
      }),
    ],
  );
}
```

---

## Configuration Flow

### Complete Configuration Flow

#### 1. Fetch Schema from Backend

```dart
Future<Map<String, dynamic>> getSchema({
  required String serviceName,
  required String actionName,
  required String type,  // 'trigger' or 'action'
}) async {
  final response = await apiService.get(
    '/api/modules/$serviceName/$type/$actionName/schema',
    headers: {'Authorization': 'Bearer $token'},
  );

  return response;
}
```

#### 2. Convert to Mobile Schema

```dart
final backendSchema = await getSchema(
  serviceName: 'discord',
  actionName: 'send_message',
  type: 'action',
);

final mobileSchema = SchemaConverter.convertToMobileSchema(backendSchema);
```

#### 3. Get Previous Node Outputs

```dart
Map<String, dynamic> getPreviousNodeOutputs(WorkflowNode currentNode) {
  final previousNodes = _getNodesBeforeCurrent(currentNode);

  final outputs = <String, dynamic>{};

  for (final node in previousNodes) {
    final nodeKey = node.nodeType == 'trigger' ? 'trigger' : 'action_${node.id}';
    outputs[nodeKey] = node.outputSchema ?? {};
  }

  return outputs;
}
```

#### 4. Open Configuration Screen

```dart
final config = await NodeConfigHelper.openConfigScreen(
  context: context,
  nodeType: 'action',
  serviceName: 'discord',
  actionName: 'send_message',
  serviceReaction: reactionMetadata,
  previousNodeOutputSchema: previousOutputs,
  currentConfig: existingConfig,
);
```

#### 5. User Fills Form

User enters configuration values, using variables from previous nodes if needed.

#### 6. Validate Input

```dart
bool validateConfig(Map<String, dynamic> config, List<MobileSchemaField> schema) {
  for (final field in schema) {
    if (field.required && !config.containsKey(field.key)) {
      return false;
    }

    // Additional validation based on field type
    if (field.validation != null) {
      // Validate pattern, min/max length, etc.
    }
  }

  return true;
}
```

#### 7. Convert to Backend Format

```dart
final backendConfig = SchemaConverter.convertMobileConfigToBackend(
  userConfig,
  'discord',
);
```

#### 8. Save to Backend

```dart
await areaService.updateWorkflowNode(
  nodeId: node.id,
  config: backendConfig,
  token: token,
);
```

---

## Examples

### Example 1: Discord Send Message

**Backend Schema:**

```json
{
  "type": "object",
  "properties": {
    "channel_id": {
      "type": "string",
      "description": "Channel ID",
      "required": true
    },
    "message": {
      "type": "string",
      "description": "Message content",
      "format": "textarea",
      "required": true
    }
  }
}
```

**Mobile Schema:**

```dart
[
  MobileSchemaField(
    key: 'channel_id',
    label: 'Channel ID',
    type: 'text',
    required: true,
  ),
  MobileSchemaField(
    key: 'message',
    label: 'Message content',
    type: 'textarea',
    required: true,
  ),
]
```

**User Configuration:**

```dart
{
  'channel_id': '123456789',
  'message': 'New issue created: {{action_1.issue_url}}',
}
```

### Example 2: GitHub Create Issue with Variables

**Backend Schema:**

```json
{
  "type": "object",
  "properties": {
    "repository": {
      "type": "string",
      "description": "Repository (owner/repo)",
      "required": true
    },
    "title": {
      "type": "string",
      "description": "Issue title",
      "required": true
    },
    "body": {
      "type": "string",
      "description": "Issue body",
      "format": "textarea",
      "required": false
    },
    "labels": {
      "type": "array",
      "items": {"type": "string"},
      "description": "Issue labels"
    }
  }
}
```

**Previous Node Output (Trigger):**

```dart
{
  'trigger': {
    'properties': {
      'message_content': {'type': 'string', 'description': 'Message text'},
      'author': {'type': 'string', 'description': 'Message author'},
      'channel': {'type': 'string', 'description': 'Channel name'},
    }
  }
}
```

**User Configuration with Variables:**

```dart
{
  'repository': 'owner/repo',
  'title': 'Issue from {{trigger.channel}}',
  'body': 'Reported by {{trigger.author}}:\n\n{{trigger.message_content}}',
  'labels': ['from-discord', 'needs-triage'],
}
```

### Example 3: Enum Field

**Backend Schema:**

```json
{
  "type": "object",
  "properties": {
    "priority": {
      "type": "string",
      "description": "Issue priority",
      "enum": ["low", "medium", "high", "critical"],
      "default": "medium"
    }
  }
}
```

**Mobile Schema:**

```dart
MobileSchemaField(
  key: 'priority',
  label: 'Issue priority',
  type: 'select',
  options: ['low', 'medium', 'high', 'critical'],
  defaultValue: 'medium',
)
```

**UI Rendering:**

```dart
DropdownButtonFormField<String>(
  value: config['priority'] ?? 'medium',
  items: ['low', 'medium', 'high', 'critical']
      .map((option) => DropdownMenuItem(
            value: option,
            child: Text(option),
          ))
      .toList(),
  onChanged: (value) {
    setState(() => config['priority'] = value);
  },
)
```

---

## Best Practices

### Schema Design

1. **Keep schemas simple** - Only required fields
2. **Provide clear descriptions** - Help users understand fields
3. **Use appropriate types** - Match UI element to data type
4. **Set sensible defaults** - Reduce user input required
5. **Validate on backend** - Don't trust mobile validation alone

### Variable Usage

1. **Show available variables** prominently in UI
2. **Provide copy button** for easy variable insertion
3. **Validate variable syntax** before saving
4. **Test with real data** to ensure variables resolve correctly
5. **Handle missing variables** gracefully in backend

### Error Handling

1. **Validate before saving** - Check required fields
2. **Show clear error messages** - Tell users what's wrong
3. **Highlight invalid fields** - Visual feedback
4. **Handle backend validation errors** - Display server-side errors
5. **Provide examples** - Show correct format

### Performance

1. **Cache schemas** - Don't fetch repeatedly
2. **Lazy load schemas** - Only when needed
3. **Debounce validation** - Don't validate on every keystroke
4. **Optimize conversions** - Cache converted schemas

---

**See also:**
- [Area Integration Guide](AREA_INTEGRATION.md)
- [Technical Documentation](TECHNICAL_DOCUMENTATION.md)
