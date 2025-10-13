# Module Variables API - Implementation Summary

## 🎯 Feature Overview

Added a new RESTful API endpoint system to retrieve module output variables and schemas using path parameters. The API automatically detects whether the identifier is:
1. **Module name** - Get all triggers and actions for a module (e.g., `discord`, `timer`)
2. **Node UUID** - Get specific variables for a workflow node (e.g., `550e8400-e29b-41d4-a716-446655440000`)

The endpoint uses a clean RESTful design: `/api/modules/:identifier` where the identifier can be either type.

## 📁 Files Created/Modified

### New Files Created:

1. **Controller**: `/backend/src/core/controllers/ModuleController.ts`
   - Handles module variable retrieval logic
   - Automatically detects if identifier is a UUID (node ID) or module name
   - Supports querying by module name or node ID via path parameter
   - Integrates with module registry and workflow model

2. **Routes**: `/backend/src/core/routes/modules.ts`
   - Defines RESTful API endpoints for module operations
   - Applies authentication middleware
   - Routes: `GET /api/modules` and `GET /api/modules/:identifier`

3. **Tests**: `/backend/__tests__/unit/core/ModuleController.test.ts`
   - Comprehensive unit tests for all endpoints
   - Tests for success cases, error cases, and edge cases
   - Mock dependencies for isolated testing

4. **Documentation**: `/backend/docs/API_MODULE_VARIABLES.md`
   - Complete API documentation
   - Usage examples (cURL, TypeScript, Bash)
   - Error response specifications
   - Best practices and guidelines

### Modified Files:

1. **Main Router**: `/backend/src/core/routes/_index.ts`
   - Added module routes: `router.use('/api/modules', moduleRoutes);`

## 🔌 API Endpoints

### 1. List All Modules
```
GET /api/modules
```
Returns all available modules with their basic information (name, display name, auth type, trigger/action counts).

### 2. Get Module Variables
```
GET /api/modules/:identifier
```

**Path Parameters:**
- `identifier` (string): Module name (e.g., 'discord', 'timer') OR node UUID

**Query Parameters:**
- `type` (optional): Filter by 'trigger' or 'action' (only works with module names)

**Examples:**
```bash
# Get Discord module variables
GET /api/modules/discord

# Get only Discord triggers
GET /api/modules/discord?type=trigger

# Get variables for a specific node
GET /api/modules/550e8400-e29b-41d4-a716-446655440000
```

**Returns:**
- Output schemas (JSON Schema format)
- Configuration schemas
- Required OAuth scopes
- Descriptions and metadata

## 💡 Use Cases

### 1. Dynamic UI Building
Frontend applications can query available variables to build:
- Variable pickers/selectors
- Autocomplete for `{{variable}}` syntax
- Dynamic form fields based on config schemas

### 2. Workflow Validation
Backend can validate workflows before execution:
- Check if variable references are valid
- Verify required scopes are available
- Ensure configurations match schemas

### 3. Documentation Generation
Generate documentation for:
- Available modules and their capabilities
- Variable names and types
- Example workflows

## 🔒 Security

- All endpoints require authentication (JWT Bearer token)
- Uses existing `requireAuth` middleware
- Validates user sessions and tokens
- Rate limiting applies (inherited from global middleware)

## 🧪 Testing

Comprehensive test suite covers:
- ✅ Listing all modules
- ✅ Getting variables by module name
- ✅ Getting variables by node ID
- ✅ Filtering by trigger/action type
- ✅ Error handling (404, 400, 401, 500)
- ✅ Edge cases (empty lists, missing data)

Run tests:
```bash
cd backend
npm test -- ModuleController.test.ts
```

## 📊 Example Responses

### List Modules
```json
{
  "success": true,
  "count": 3,
  "modules": [
    {
      "name": "discord",
      "displayName": "Discord",
      "isActive": true,
      "triggerCount": 3,
      "actionCount": 4
    }
  ]
}
```

### Get Variables by Module Name
```json
{
  "success": true,
  "moduleName": "discord",
  "displayName": "Discord",
  "triggers": [
    {
      "name": "on_message_created",
      "description": "Triggered when a message is created",
      "outputSchema": {
        "type": "object",
        "properties": {
          "message": { "type": "object" },
          "author": { "type": "object" }
        }
      }
    }
  ],
  "actions": [...]
}
```

### Get Variables by Node ID
```json
{
  "success": true,
  "nodeId": "550e8400-e29b-41d4-a716-446655440000",
  "nodeType": "trigger",
  "moduleName": "discord",
  "triggerName": "on_message_created",
  "outputSchema": {...},
  "currentConfig": {
    "channelId": "123456789012345678"
  }
}
```

## 🔗 Integration Points

### Module Registry
- Uses `moduleRegistry.getModule(name)` to fetch modules
- Accesses triggers via `module.getAllTriggers()`
- Accesses actions via `module.getAllActions()`

### Workflow Model
- Uses `workflowModel.getNodeById(id)` to fetch nodes
- Resolves service names via `getServiceNameById()`
- Resolves trigger/action names via `getActionNameById()` and `getReactionNameById()`

### Base Classes
- Leverages `BaseTrigger.getOutputSchema()` method
- Leverages `BaseAction.getOutputSchema()` method
- Uses existing schema definitions from modules

## 🚀 Future Enhancements

Possible future improvements:
1. **Caching**: Add Redis caching for module schemas (they're static)
2. **Filtering**: Advanced filtering by auth type, active status, etc.
3. **Search**: Full-text search across module descriptions
4. **Version Control**: Track schema versions for backwards compatibility
5. **Validation Endpoint**: Dedicated endpoint to validate variable references
6. **GraphQL**: Alternative GraphQL API for more flexible queries

## 🐛 Known Limitations

1. Output schemas must be defined in modules (uses `getOutputSchema()` method)
2. Modules without schemas will return `null` for `outputSchema`
3. No pagination for module lists (not needed for small number of modules)
4. No real-time updates (client must poll for changes)

## ✅ Testing the Implementation

### Start the server
```bash
cd backend
npm run dev
```

### Test with cURL
```bash
# Get Discord variables
curl -X GET "http://localhost:8080/api/modules/discord" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get variables for a specific node
curl -X GET "http://localhost:8080/api/modules/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 Documentation

Full API documentation is available at:
- `/backend/docs/API_MODULE_VARIABLES.md`

Includes:
- Detailed endpoint specifications
- Request/response examples
- Error codes and messages
- Usage examples in multiple languages
- Best practices
- Variable templating guide

## ✨ Summary

This implementation provides a robust, well-tested RESTful API for retrieving module variables and output schemas. It uses clean path parameters (`/api/modules/:identifier`) with automatic detection of module names vs node UUIDs, making it intuitive and flexible for various use cases including UI building, validation, and documentation generation.

The code follows RESTful best practices, uses proper error handling, includes comprehensive tests, and is fully documented.
