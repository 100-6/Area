# Module Variables API Documentation

## Overview

The Module Variables API provides endpoints to retrieve information about module output schemas and variables. This is useful for:
- Understanding what data is returned by triggers and actions
- Building dynamic UIs that display available variables
- Validating workflow configurations
- Debugging workflow executions

## Base URL

```
/api/modules
```

## Authentication

All endpoints require authentication via Bearer token:

```http
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. List All Modules

Get a list of all available modules with their basic information.

**Endpoint:** `GET /api/modules`

**Response:**

```json
{
  "success": true,
  "count": 3,
  "modules": [
    {
      "name": "discord",
      "displayName": "Discord",
      "description": "Discord integration for messaging and server management",
      "authType": "oauth2",
      "isActive": true,
      "triggerCount": 3,
      "actionCount": 4
    },
    {
      "name": "timer",
      "displayName": "Timer / Scheduler",
      "description": "Time-based triggers for scheduled actions",
      "authType": "none",
      "isActive": true,
      "triggerCount": 2,
      "actionCount": 0
    },
    {
      "name": "console",
      "displayName": "Console",
      "description": "Debug actions for logging",
      "authType": "none",
      "isActive": true,
      "triggerCount": 0,
      "actionCount": 1
    }
  ]
}
```

**Example:**

```bash
curl -X GET "http://localhost:8080/api/modules" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. Get Module Variables

Retrieve output schemas and variables for a module or specific workflow node.

**Endpoint:** `GET /api/modules/:identifier`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `identifier` | string | Yes | Module name (e.g., 'discord', 'timer') OR node UUID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Optional | Filter by type: 'trigger' or 'action' (only works with module names, not UUIDs) |

**Note:** The endpoint automatically detects whether the `identifier` is a module name or a node UUID based on the format.

---

#### 2.1. Get Variables by Module Name

Retrieve all triggers and actions for a specific module.

**Example Request:**

```bash
curl -X GET "http://localhost:8080/api/modules/discord" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "moduleName": "discord",
  "displayName": "Discord",
  "description": "Discord integration for messaging and server management",
  "triggers": [
    {
      "name": "on_message_created",
      "description": "Triggered when a message is created in a Discord channel",
      "type": "webhook",
      "outputSchema": {
        "type": "object",
        "properties": {
          "message": {
            "type": "object",
            "properties": {
              "id": { "type": "string", "description": "ID of the message" },
              "content": { "type": "string", "description": "Message content" },
              "channelId": { "type": "string", "description": "Channel ID" },
              "channelName": { "type": "string", "description": "Channel name" }
            }
          },
          "author": {
            "type": "object",
            "properties": {
              "id": { "type": "string", "description": "Author ID" },
              "username": { "type": "string", "description": "Author username" },
              "tag": { "type": "string", "description": "Author tag" }
            }
          }
        }
      },
      "configSchema": {
        "type": "object",
        "properties": {
          "channelId": { "type": "string", "required": true },
          "keyword": { "type": "string", "required": false }
        }
      }
    }
  ],
  "actions": [
    {
      "name": "send_message",
      "description": "Send a message to a Discord channel",
      "outputSchema": {
        "type": "object",
        "properties": {
          "messageId": { "type": "string", "description": "ID of the sent message" },
          "channelId": { "type": "string", "description": "Channel ID" },
          "content": { "type": "string", "description": "Message content" },
          "timestamp": { "type": "string", "description": "Timestamp ISO 8601" }
        }
      },
      "configSchema": {
        "type": "object",
        "properties": {
          "channelId": { "type": "string", "required": true },
          "content": { "type": "string", "required": true }
        }
      },
      "requiredScopes": ["messages.write"]
    }
  ]
}
```

**Filter by Type:**

```bash
# Get only triggers
curl -X GET "http://localhost:8080/api/modules/discord?type=trigger" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get only actions
curl -X GET "http://localhost:8080/api/modules/discord?type=action" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### 2.2. Get Variables by Node ID

Retrieve output schema for a specific workflow node.

**Example Request:**

```bash
curl -X GET "http://localhost:8080/api/modules/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (Trigger Node):**

```json
{
  "success": true,
  "nodeId": "550e8400-e29b-41d4-a716-446655440000",
  "nodeType": "trigger",
  "moduleName": "discord",
  "displayName": "Discord",
  "label": "On Message Created",
  "triggerName": "on_message_created",
  "description": "Triggered when a message is created in a Discord channel",
  "type": "webhook",
  "outputSchema": {
    "type": "object",
    "properties": {
      "message": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "content": { "type": "string" },
          "channelId": { "type": "string" }
        }
      },
      "author": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "username": { "type": "string" }
        }
      }
    }
  },
  "configSchema": {
    "type": "object",
    "properties": {
      "channelId": { "type": "string", "required": true }
    }
  },
  "currentConfig": {
    "channelId": "123456789012345678"
  }
}
```

**Response (Action Node):**

```json
{
  "success": true,
  "nodeId": "660e8400-e29b-41d4-a716-446655440001",
  "nodeType": "action",
  "moduleName": "discord",
  "displayName": "Discord",
  "label": "Send Message",
  "actionName": "send_message",
  "description": "Send a message to a Discord channel",
  "outputSchema": {
    "type": "object",
    "properties": {
      "messageId": { "type": "string" },
      "channelId": { "type": "string" },
      "content": { "type": "string" },
      "timestamp": { "type": "string" }
    }
  },
  "configSchema": {
    "type": "object",
    "properties": {
      "channelId": { "type": "string", "required": true },
      "content": { "type": "string", "required": true }
    }
  },
  "requiredScopes": ["messages.write"],
  "currentConfig": {
    "channelId": "123456789012345678",
    "content": "Hello {{author.username}}!"
  }
}
```

---

## Error Responses

### 400 Bad Request

Missing identifier:

```json
{
  "success": false,
  "error": "Identifier (module name or node ID) is required"
}
```

Node without service:

```json
{
  "success": false,
  "error": "Node does not have an associated service"
}
```

### 404 Not Found

Module not found:

```json
{
  "success": false,
  "error": "Module \"nonexistent\" not found"
}
```

Node not found:

```json
{
  "success": false,
  "error": "Node \"550e8400-e29b-41d4-a716-446655440000\" not found"
}
```

Trigger/Action not found:

```json
{
  "success": false,
  "error": "Trigger \"invalid_trigger\" not found in module \"discord\""
}
```

### 401 Unauthorized

Missing or invalid authentication:

```json
{
  "success": false,
  "error": "AUTHORIZATION_HEADER_MISSING"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Database connection failed"
}
```

---

## Usage Examples

### Frontend: Display Available Variables

When building a workflow editor, you can fetch variables for each node:

```typescript
// Get all variables from a module
async function getModuleVariables(moduleName: string) {
  const response = await fetch(
    `/api/modules/${moduleName}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.json();
}

// Get variables from a specific node
async function getNodeVariables(nodeId: string) {
  const response = await fetch(
    `/api/modules/${nodeId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.json();
}

// Example: Building a variable picker UI
const nodeData = await getNodeVariables(selectedNodeId);
const variables = extractVariablesFromSchema(nodeData.outputSchema);

// Display variables like: {{message.content}}, {{author.username}}, etc.
displayVariablePicker(variables);
```

### Backend: Validate Workflow Configuration

```typescript
// Validate that a workflow uses correct variable references
async function validateWorkflow(workflowNodes: any[]) {
  for (const node of workflowNodes) {
    const nodeVars = await getNodeVariables(node.id);
    
    // Check if config uses valid variables
    const configStr = JSON.stringify(node.config);
    const usedVars = extractVariableReferences(configStr); // e.g., {{message.content}}
    
    // Validate against outputSchema
    for (const varRef of usedVars) {
      if (!isValidVariable(varRef, nodeVars.outputSchema)) {
        console.error(`Invalid variable: ${varRef}`);
      }
    }
  }
}
```

### CLI Tool

```bash
#!/bin/bash

TOKEN="your-jwt-token"
API_BASE="http://localhost:8080/api/modules"

# List all modules
echo "Available modules:"
curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE" | jq '.modules[].name'

# Get Discord module details
echo -e "\nDiscord triggers and actions:"
curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/discord" | jq '.'

# Get specific node details
NODE_ID="550e8400-e29b-41d4-a716-446655440000"
echo -e "\nNode $NODE_ID details:"
curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/$NODE_ID" | jq '.'
```

---

## Variable Templating

Output variables can be used in subsequent action configurations using template syntax:

```
{{variablePath}}
```

### Examples:

From a Discord `on_message_created` trigger:
- `{{message.id}}` - Message ID
- `{{message.content}}` - Message text
- `{{author.username}}` - Author's username
- `{{message.channelName}}` - Channel name

From a Discord `send_message` action:
- `{{messageId}}` - ID of the sent message
- `{{timestamp}}` - When the message was sent

### Nested Access:

```
{{message.author.username}}
{{reaction.emoji}}
{{member.joinedAt}}
```

---

## Best Practices

1. **Cache Module Schemas**: Module schemas are static, so cache them on the frontend to reduce API calls.

2. **Validate Before Execution**: Use this API to validate workflow configurations before saving or executing them.

3. **Dynamic UI**: Build dynamic forms based on `configSchema` to help users configure actions correctly.

4. **Variable Autocomplete**: Use `outputSchema` to provide autocomplete suggestions when users type `{{` in configuration fields.

5. **Error Prevention**: Check `requiredScopes` before allowing users to add actions that require authentication.

---

## Rate Limiting

All endpoints are subject to standard rate limiting (1000 requests/hour per authenticated user).

---

## Changelog

### v1.0.0 (2025-10-13)
- Initial release
- Added `/api/modules` endpoint to list all modules
- Added `/api/modules/:identifier` endpoint with automatic detection of module name vs node UUID
- Support for filtering by trigger/action type via `?type=` query parameter
- RESTful design using path parameters instead of query parameters
