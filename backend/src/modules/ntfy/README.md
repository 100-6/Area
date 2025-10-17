# Ntfy Module

Send and receive push notifications via [ntfy.sh](https://ntfy.sh) - a simple HTTP-based pub/sub notification service.

## Overview

The **Ntfy module** enables you to:
- **Trigger workflows** when messages are received on ntfy topics (via Server-Sent Events)
- **Send notifications** to ntfy topics with rich formatting options
- **Attach files** via external URLs
- Use **variable templating** to create dynamic notifications from workflow data

## Authentication

**No authentication required!** Ntfy works without registration by default.

- Public topics on `https://ntfy.sh` are accessible to anyone
- For private topics, you can self-host ntfy or use authenticated topics (not yet implemented in this module)

## Triggers

### Message Received

Listens to a ntfy topic using Server-Sent Events (SSE) and fires when a new message is received.

**Configuration:**

| Field | Type | Required | Description | Default |
|-------|------|----------|-------------|---------|
| `baseUrl` | string | No | Ntfy server URL | `https://ntfy.sh` |
| `topic` | string | Yes | Topic to subscribe to (alphanumeric, dashes, underscores only) | - |
| `since` | string | No | Only return messages since this time (`10m`, `2h`, `all`) | `10m` |
| `priority` | number[] | No | Filter by priority (1-5). Empty = all priorities | - |

**Output Data:**

```typescript
{
  id: string,           // Message ID
  time: number,         // Unix timestamp
  event: string,        // Event type (message, open, keepalive)
  topic: string,        // Topic name
  priority: number,     // Message priority (1-5)
  tags: string[],       // Message tags/emojis
  title: string,        // Notification title
  message: string,      // Notification message body
  click: string,        // Click URL
  attachment: {         // Attachment info (if present)
    name: string,
    url: string,
    type: string,
    size: number,
    expires: number
  }
}
```

**Example:**

```json
{
  "topic": "my-alerts",
  "since": "10m",
  "priority": [4, 5]
}
```

This listens to the `my-alerts` topic and only triggers on high/urgent priority messages.

## Actions

### Send Notification

Sends a notification to a ntfy topic.

**Configuration:**

| Field | Type | Required | Description | Default |
|-------|------|----------|-------------|---------|
| `baseUrl` | string | No | Ntfy server URL | `https://ntfy.sh` |
| `topic` | string | Yes | Topic to publish to | - |
| `message` | string | Yes | Notification message body (1-4096 chars) | - |
| `title` | string | No | Notification title (max 256 chars) | - |
| `priority` | number | No | Message priority: 1=min, 3=default, 5=max | `3` |
| `tags` | string[] | No | Emoji shortcodes or tags (e.g., `["warning", "skull"]`) | - |
| `click` | string | No | URL to open when notification is clicked | - |
| `delay` | string | No | Schedule delivery (e.g., `30min`, `2h`, `1d`) | - |

**Variable Templating:**

All string fields support variable templating using `{{variable.path}}` syntax:

```json
{
  "topic": "alerts",
  "title": "New GitHub Issue",
  "message": "Issue #{{issue.number}}: {{issue.title}}\nBy: {{issue.author.username}}",
  "click": "{{issue.url}}",
  "tags": ["github", "issue"]
}
```

**Output Data:**

```typescript
{
  success: boolean,     // Whether notification was sent successfully
  topic: string,        // Topic the notification was sent to
  messageId: string     // ID of the sent message
}
```

**Priority Levels:**

- `1` - Min (no notification sound)
- `2` - Low
- `3` - Default
- `4` - High
- `5` - Max/Urgent (critical alert)

**Example Usage:**

Simple notification:
```json
{
  "topic": "my-phone",
  "message": "Hello from Mirror-Area!",
  "title": "Test Notification",
  "priority": 3
}
```

With emojis and click URL:
```json
{
  "topic": "alerts",
  "message": "Your workflow completed successfully!",
  "title": "Success",
  "tags": ["white_check_mark", "tada"],
  "click": "https://mirror-area.example.com/workflows/123",
  "priority": 4
}
```

Scheduled notification:
```json
{
  "topic": "reminders",
  "message": "Meeting in 30 minutes",
  "title": "Reminder",
  "delay": "30min"
}
```

### Send Notification with Attachment

Sends a notification with an external URL attachment.

**Configuration:**

Same as "Send Notification" plus:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `attachmentUrl` | string | Yes | External URL to attach (must be publicly accessible) |
| `filename` | string | No | Display name for the attachment |

**Example:**

```json
{
  "topic": "reports",
  "message": "Your weekly report is ready",
  "title": "Weekly Report",
  "attachmentUrl": "https://example.com/reports/week-45.pdf",
  "filename": "Week45_Report.pdf",
  "priority": 3
}
```

**Note:** The attachment URL must be publicly accessible. Ntfy will download and cache the file for a limited time.

## Common Use Cases

### 1. GitHub Issue Notifications

**Trigger:** GitHub - New Issue  
**Action:** Ntfy - Send Notification

```json
{
  "topic": "github-alerts",
  "title": "New Issue: {{issue.title}}",
  "message": "Repository: {{repository.name}}\nAuthor: {{issue.user.login}}\n\n{{issue.body}}",
  "click": "{{issue.html_url}}",
  "tags": ["github", "issue"],
  "priority": 3
}
```

### 2. Timer-Based Reminders

**Trigger:** Timer - Daily at Time  
**Action:** Ntfy - Send Notification

```json
{
  "topic": "reminders",
  "title": "Daily Standup",
  "message": "Time for your daily standup meeting!",
  "tags": ["alarm_clock"],
  "priority": 4
}
```

### 3. Workflow Error Alerts

**Trigger:** (Any trigger that might fail)  
**Action (on error):** Ntfy - Send Notification

```json
{
  "topic": "errors",
  "title": "Workflow Error",
  "message": "Workflow failed: {{error.message}}",
  "tags": ["rotating_light", "x"],
  "priority": 5
}
```

### 4. Discord Message Forwarding

**Trigger:** Discord - Message Received  
**Action:** Ntfy - Send Notification

```json
{
  "topic": "discord-mirror",
  "title": "{{author.username}} in #{{channel.name}}",
  "message": "{{message.content}}",
  "tags": ["speech_balloon"],
  "priority": 2
}
```

## Available Emoji Tags

Ntfy supports emoji shortcodes. Common ones include:

- ✅ `white_check_mark`, `heavy_check_mark`
- ❌ `x`, `cross_mark`
- ⚠️ `warning`
- 🔥 `fire`
- 💀 `skull`
- 🎉 `tada`
- 🚨 `rotating_light`
- 📧 `email`, `envelope`
- 💬 `speech_balloon`
- ⏰ `alarm_clock`
- 📊 `bar_chart`

See [Emoji Cheat Sheet](https://www.webfx.com/tools/emoji-cheat-sheet/) for more.

## Self-Hosting

You can use your own ntfy server instead of `https://ntfy.sh`:

1. Install ntfy: https://docs.ntfy.sh/install/
2. Set the `baseUrl` in trigger/action config:

```json
{
  "baseUrl": "https://ntfy.mycompany.com",
  "topic": "private-alerts",
  "message": "Hello from self-hosted ntfy!"
}
```

## Technical Details

### Server-Sent Events (SSE)

The **Message Received** trigger uses SSE for real-time message delivery:
- Efficient long-lived HTTP connection
- Automatic reconnection on network failures
- No polling overhead
- Messages delivered within milliseconds

### Message Deduplication

The trigger tracks seen message IDs to prevent duplicate workflow executions:
- Each AREA maintains its own set of processed message IDs
- IDs are cleared when the trigger is stopped
- Keepalive events are automatically filtered out

### Rate Limiting

Ntfy.sh has these limits:
- **Public topics**: ~100 messages/min per topic
- **No authentication**: Rate limited by IP
- **Self-hosted**: Configure your own limits

For high-volume workflows, consider:
1. Self-hosting ntfy
2. Using multiple topics
3. Batching notifications

## Troubleshooting

### Trigger not receiving messages

1. Check the topic name (must be alphanumeric + dashes/underscores)
2. Verify messages are being sent to the correct topic
3. Check the `since` parameter - increase to capture older messages
4. Look at backend logs for SSE connection errors

### Notifications not being sent

1. Verify the topic name is valid
2. Check that the message is not empty
3. For attachments, ensure the URL is publicly accessible
4. Check for network connectivity to ntfy.sh
5. Review backend logs for HTTP errors

### Variables not being replaced

1. Ensure variable syntax is correct: `{{path.to.field}}`
2. Check that the data exists in the trigger output
3. Use debug logging to see available variables
3. Variable paths are case-sensitive

## API Reference

### Ntfy HTTP API

The module uses these ntfy endpoints:

**Subscribe (SSE):**
```
GET https://ntfy.sh/{topic}/sse?since=10m
Accept: text/event-stream
```

**Publish:**
```
POST https://ntfy.sh/{topic}
Content-Type: text/plain; charset=utf-8
Title: {title}
Priority: {priority}
Tags: {tags}
Click: {click}
Attach: {attachmentUrl}
Delay: {delay}

{message body}
```

Full API documentation: https://docs.ntfy.sh/

## Module Information

- **Name:** `ntfy`
- **Display Name:** Ntfy
- **Auth Type:** `none`
- **Icon:** `/icons/ntfy.png`
- **Color:** `#338574`

## Future Enhancements

Planned features:
- [ ] Authentication support (Bearer tokens for protected topics)
- [ ] Action buttons in notifications (view/http/broadcast actions)
- [ ] Email forwarding integration
- [ ] Message history/replay
- [ ] Topic pattern matching (wildcards)
- [ ] Binary file uploads (not just external URLs)
- [ ] Message queuing and retry logic
- [ ] Custom notification sounds

## Resources

- [Ntfy Documentation](https://docs.ntfy.sh/)
- [Ntfy GitHub](https://github.com/binwiederhier/ntfy)
- [Self-Hosting Guide](https://docs.ntfy.sh/install/)
- [Android App](https://play.google.com/store/apps/details?id=io.heckel.ntfy)
- [iOS App](https://apps.apple.com/us/app/ntfy/id1625396347)

## Support

For issues or questions:
1. Check the [ntfy documentation](https://docs.ntfy.sh/)
2. Review backend logs for error messages
3. Open an issue on the Mirror-Area repository
4. Contact the development team

---

**Built with ❤️ for the Mirror-Area automation platform**
