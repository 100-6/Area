# Module Variables API - Quick Reference

## 📋 Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/modules` | List all available modules | ✅ Yes |
| GET | `/api/modules/:identifier` | Get variables for module or node | ✅ Yes |

## 🔗 URL Structure

### Get Module Variables by Name
```
GET /api/modules/{moduleName}
```

**Example:**
```bash
curl http://localhost:8080/api/modules/discord \
  -H "Authorization: Bearer TOKEN"
```

### Get Variables by Node UUID
```
GET /api/modules/{nodeUuid}
```

**Example:**
```bash
curl http://localhost:8080/api/modules/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer TOKEN"
```

### Filter Module by Type
```
GET /api/modules/{moduleName}?type={trigger|action}
```

**Examples:**
```bash
# Get only triggers
curl http://localhost:8080/api/modules/discord?type=trigger \
  -H "Authorization: Bearer TOKEN"

# Get only actions
curl http://localhost:8080/api/modules/discord?type=action \
  -H "Authorization: Bearer TOKEN"
```

## 📊 Response Examples

### Module Response (discord)
```json
{
  "success": true,
  "moduleName": "discord",
  "displayName": "Discord",
  "description": "Discord integration",
  "triggers": [...],
  "actions": [...]
}
```

### Node Response (UUID)
```json
{
  "success": true,
  "nodeId": "550e8400-...",
  "nodeType": "trigger",
  "moduleName": "discord",
  "triggerName": "on_message_created",
  "outputSchema": {...},
  "currentConfig": {...}
}
```

## 🎯 Use Cases

| Use Case | Endpoint | Purpose |
|----------|----------|---------|
| List all modules | `GET /api/modules` | Show available integrations |
| Module documentation | `GET /api/modules/discord` | Show all discord capabilities |
| Variable picker UI | `GET /api/modules/{nodeId}` | Show available variables for a node |
| Filter by type | `GET /api/modules/discord?type=trigger` | Show only triggers |
| Workflow validation | `GET /api/modules/{nodeId}` | Validate variable references |

## 🔍 Identifier Detection

The API automatically detects the identifier type:

| Format | Type | Example |
|--------|------|---------|
| UUID pattern | Node ID | `550e8400-e29b-41d4-a716-446655440000` |
| String | Module name | `discord`, `timer`, `console` |

**UUID Regex:** `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`

## ⚠️ Common Errors

| Status | Error | Reason |
|--------|-------|--------|
| 400 | `Identifier required` | Missing path parameter |
| 400 | `Node does not have service` | Node not properly configured |
| 401 | `AUTHORIZATION_HEADER_MISSING` | No auth token provided |
| 404 | `Module not found` | Invalid module name |
| 404 | `Node not found` | Invalid node UUID |

## 💡 Tips

1. **Cache module schemas** - They don't change at runtime
2. **Use node IDs for specific data** - More accurate than module-level
3. **Filter by type** - Reduces payload size when you only need triggers or actions
4. **Check outputSchema** - Use it to build variable pickers in your UI

## 🔐 Authentication

All endpoints require JWT Bearer token:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📚 Full Documentation

See `/backend/docs/API_MODULE_VARIABLES.md` for complete API documentation.
