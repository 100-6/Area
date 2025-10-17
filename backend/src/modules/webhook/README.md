# Webhook Module

Receive HTTP POST webhooks with custom data and trigger workflows. Simple name-based endpoints like ntfy.sh - no tokens, no authentication required.

## Features

- **Simple naming**: Choose a webhook name, get an endpoint
- **No authentication**: Public endpoints for IoT devices and external services
- **Auto-restoration**: Webhooks automatically restored on backend restart
- **Flexible payloads**: Supports JSON and form-data
- **Variable templating**: Access webhook data in actions via `{{variable}}`

## Usage

### 1. Create a Workflow

Add the **Webhook Receiver** trigger to your workflow and configure:

```json
{
  "webhookName": "temperature-sensor"
}
```

### 2. Get Your Endpoint

Your endpoint will be:
```
POST https://your-domain.com/webhook/temperature-sensor
```

### 3. Send Data

#### Plain text (simplest - no headers needed)
```bash
curl -X POST https://your-domain.com/webhook/temperature-sensor \
  -d "Hello from my sensor!"
```

#### JSON payload
```bash
curl -X POST https://your-domain.com/webhook/temperature-sensor \
  -H "Content-Type: application/json" \
  -d '{"temp": 22.5, "humidity": 60, "location": "bedroom"}'
```

#### Form data (multiple fields)
```bash
curl -X POST https://your-domain.com/webhook/contact-form \
  -d "name=John Doe" \
  -d "email=john@example.com" \
  -d "message=Hello!"
```

### 4. Use Variables in Actions

Access webhook data in downstream actions:

```
Plain text: {{text}}
Temperature: {{body.temp}}°C
Humidity: {{body.humidity}}%
Location: {{body.location}}
Received at: {{receivedAt}}
```

**Important**: 
- For **plain text** sent via `curl -d "message"`, use `{{text}}`
- For **JSON** fields, use `{{body.fieldName}}`
- For **form data**, use `{{body.fieldName}}`

## Configuration Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `webhookName` | string | Yes | Unique webhook name (3-50 chars, lowercase, numbers, dash, underscore) |

**Valid names**: `my-sensor`, `temperature_data`, `doorbell-events`
**Invalid names**: `My-Sensor` (uppercase), `test@webhook` (special chars)

## Output Schema

Webhook payloads include the following data:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `receivedAt` | string | ISO 8601 timestamp | `2025-10-17T14:30:00.000Z` |
| `webhookName` | string | Webhook endpoint name | `temperature-sensor` |
| `contentType` | string | HTTP Content-Type header | `application/json` |
| `text` | string | Raw text content (for plain text requests) | `"Hello World"` |
| `body` | object | Parsed POST body | `{ "temp": 22.5 }` or `{ "text": "..." }` |
| `headers` | object | Selected HTTP headers | `{ "user-agent": "ESP32" }` |

### Available Headers

- `user-agent`: Client user agent
- `referer`: HTTP referer
- `x-forwarded-for`: Client IP (when behind proxy)

## Example Workflows

### Simple Text Notification

**Trigger**: Webhook Receiver (`notifications`)

**Send**:
```bash
curl -X POST http://localhost:8080/webhook/notifications \
  -d "Server is down!"
```

**Actions**:
1. **Discord**: Send message "⚠️ Alert: {{text}}"

### IoT Temperature Alert

**Trigger**: Webhook Receiver (`temperature-sensor`)

**Send**:
```bash
curl -X POST http://localhost:8080/webhook/temperature-sensor \
  -H "Content-Type: application/json" \
  -d '{"temp": 27, "location": "bedroom"}'
```

**Actions**:
1. **Condition**: If `{{body.temp}}` > 25
2. **Discord**: Send message "🔥 High temperature alert: {{body.temp}}°C in {{body.location}}"

### Form Submission to Email

**Trigger**: Webhook Receiver (`contact-form`)

**Actions**:
1. **Gmail**: Send email
   - To: `admin@example.com`
   - Subject: `New contact from {{body.name}}`
   - Body: `Email: {{body.email}}\nMessage: {{body.message}}`

### Doorbell Notification

**Trigger**: Webhook Receiver (`doorbell`)

**Send**:
```bash
curl -X POST http://localhost:8080/webhook/doorbell \
  -d "Doorbell pressed"
```

**Actions**:
1. **Telegram**: Send message "🔔 {{text}}"
2. **Console**: Log `Event at {{receivedAt}}: {{text}}`

## Content-Type Handling

The webhook intelligently parses different content types:

| Content-Type | curl Command | Variable Access | Example |
|--------------|--------------|-----------------|---------|
| **None** (plain text) | `curl -d "text"` | `{{text}}` | `"Hello"` |
| **text/plain** | `curl -H "Content-Type: text/plain" -d "text"` | `{{text}}` | `"Hello"` |
| **application/json** | `curl -H "Content-Type: application/json" -d '{"key":"value"}'` | `{{body.key}}` | `{"key":"value"}` |
| **form-urlencoded** (single field) | `curl -d "message"` | `{{text}}` | Auto-detected as plain text |
| **form-urlencoded** (multiple) | `curl -d "name=John" -d "age=30"` | `{{body.name}}`, `{{body.age}}` | `{"name":"John","age":"30"}` |

**Smart Detection**: When curl sends `-d "text"` without specifying Content-Type, it becomes form-data `{"text": ""}`. The webhook detects this pattern and treats it as plain text automatically!

## Limitations

- **No rate limiting**: Endpoints can be spammed (by design for simplicity)
- **No authentication**: Anyone with the URL can trigger the webhook
- **Max body size**: 10MB (configured in Express)
- **Name conflicts**: Last workflow wins if multiple use same name

## Security Considerations

⚠️ **Important**: Webhook endpoints are **public** and **unauthenticated**.

### Recommendations

1. **Use unpredictable names**: `sensor-a7f2c3` instead of `sensor`
2. **Validate data**: Add condition actions to check payload structure
3. **Monitor usage**: Check logs for unexpected triggers
4. **Limit exposure**: Don't share webhook URLs publicly

### Future Enhancements (Not Implemented)

- HMAC signature validation
- IP whitelist
- Rate limiting per webhook
- Secret tokens

## Troubleshooting

### Webhook not found (404)

- Check workflow is **active** (enabled)
- Verify webhook name matches URL exactly (case-sensitive)
- Restart backend if recently created

### Trigger not firing

- Check backend logs for errors
- Verify payload is valid JSON or form-data
- Ensure Content-Type header is set correctly

### Variables not working

- Use exact field names from POST body
- Check output in Console module first
- Use `{{body.fieldName}}` syntax (not `{{fieldName}}`)

## Health Check

Check webhook service status:

```bash
curl https://your-domain.com/webhook/health
```

Response:
```json
{
  "success": true,
  "service": "webhook",
  "status": "operational",
  "activeWebhooks": 5,
  "timestamp": "2025-10-17T14:30:00.000Z"
}
```

## Technical Details

### Architecture

- **Storage**: In-memory Map (no database)
- **Restoration**: Automatic via `ModuleSync` on startup
- **Event system**: Uses EventBus (`trigger.fired` event)
- **Parsing**: Express middleware (`express.json()`, `express.urlencoded()`, `express.text()`)
- **Smart detection**: Automatically treats single-field form-data as plain text

### Content-Type Processing

```typescript
// Plain text (curl -d "text")
if (single key with empty value in form-data) {
  text = keyName
  body = { text: keyName }
}

// JSON (curl -H "Content-Type: application/json" -d '{"key":"val"}')
if (application/json) {
  body = parsedJSON
}

// Form data (curl -d "key1=val1" -d "key2=val2")
if (multiple fields in form-data) {
  body = { key1: val1, key2: val2 }
}
```

### Lifecycle

1. **Workflow created** → `trigger.start()` → Register in `WebhookRegistry`
2. **POST received** → Route handler → Parse body → `trigger.handleIncomingWebhook()` → Emit event
3. **WorkflowExecutor** → Listen for `trigger.fired` → Execute actions with `triggerData`
4. **Actions** → Use `VariableReplacer` → Replace `{{text}}` or `{{body.field}}` → Execute
5. **Workflow deleted** → `trigger.stop()` → Unregister from registry
6. **Backend restart** → `ModuleSync` → Call `start()` for all active workflows → Registry rebuilt

### Code Structure

```
backend/src/modules/webhook/
├── WebhookRegistry.ts       # In-memory storage (singleton)
├── config.ts                # JSON schemas
├── service.ts               # WebhookModule class
├── routes.ts                # Express routes (POST /webhook/:name)
├── triggers/
│   └── WebhookReceiver.ts  # BaseTrigger implementation
└── README.md               # This file
```

## Version

**v1.0.0** - Initial release
