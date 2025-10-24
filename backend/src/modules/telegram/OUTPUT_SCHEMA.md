# Telegram Module - Output Schemas

This document describes the data structure returned by triggers and actions in the Telegram module.

## Triggers

### on_message_received

Triggered when a new message is received in a Telegram chat.

**Output Data Structure:**

```json
{
  "message": {
    "id": 12345,
    "text": "Hello world!",
    "date": "2024-01-15T10:30:00.000Z",
    "type": "text",
    "isEdited": false,
    "entities": [],
    "replyToMessage": {
      "id": 12344,
      "text": "Previous message"
    }
  },
  "from": {
    "id": 123456789,
    "isBot": false,
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "languageCode": "en"
  },
  "chat": {
    "id": -1001234567890,
    "type": "supergroup",
    "title": "My Group",
    "username": "mygroup",
    "firstName": "",
    "lastName": ""
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Available Variables for Actions:**

- `{{message.id}}` - Message ID (number)
- `{{message.text}}` - Message text content
- `{{message.date}}` - Message timestamp
- `{{message.type}}` - Message type (text, photo, video, etc.)
- `{{message.isEdited}}` - Whether message was edited (boolean)
- `{{message.replyToMessage.id}}` - ID of replied message (if any)
- `{{message.replyToMessage.text}}` - Text of replied message (if any)
- `{{from.id}}` - Sender user ID
- `{{from.firstName}}` - Sender first name
- `{{from.lastName}}` - Sender last name
- `{{from.username}}` - Sender username (without @)
- `{{from.isBot}}` - Whether sender is a bot
- `{{from.languageCode}}` - Sender language code
- `{{chat.id}}` - Chat ID (can be negative for groups)
- `{{chat.type}}` - Chat type (private, group, supergroup, channel)
- `{{chat.title}}` - Chat title (for groups/channels)
- `{{chat.username}}` - Chat username (for public chats)
- `{{chat.firstName}}` - Chat first name (for private chats)
- `{{chat.lastName}}` - Chat last name (for private chats)
- `{{timestamp}}` - Event timestamp

**Message Types:**
- `text` - Text message
- `photo` - Photo message
- `video` - Video message
- `document` - Document/file message
- `audio` - Audio message
- `voice` - Voice message
- `sticker` - Sticker message

---

## Actions

### send_message

Sends a text message to a Telegram chat.

**Output Data Structure:**

```json
{
  "sentMessage": {
    "id": 12346,
    "date": "2024-01-15T10:30:05.000Z",
    "chatId": -1001234567890
  },
  "success": true
}
```

**Available Variables for Chaining:**

- `{{nodeId.sentMessage.id}}` - ID of the sent message
- `{{nodeId.sentMessage.date}}` - When the message was sent
- `{{nodeId.sentMessage.chatId}}` - Chat ID where message was sent
- `{{nodeId.success}}` - Whether the message was sent successfully

Replace `nodeId` with the actual node ID from your workflow.

**Example Usage:**

```json
{
  "chatId": "{{chat.id}}",
  "text": "Hello {{from.firstName}}! You said: {{message.text}}",
  "parseMode": "None",
  "replyToMessageId": "{{message.id}}"
}
```

**Parse Modes:**
- `None` - No formatting
- `Markdown` - Markdown formatting (bold, italic, links, etc.)
- `HTML` - HTML formatting (tags like `<b>`, `<i>`, etc.)

---

## Common Use Cases

### 1. Echo Bot
**Trigger:** on_message_received
**Action:** send_message
```json
{
  "chatId": "{{chat.id}}",
  "text": "You said: {{message.text}}"
}
```

### 2. Auto-Reply in Specific Chat
**Trigger:** on_message_received (with chatId filter)
**Action:** send_message
```json
{
  "chatId": "{{chat.id}}",
  "text": "Thank you for your message! We'll get back to you soon.",
  "replyToMessageId": "{{message.id}}"
}
```

### 3. Forward Message Content to Another Chat
**Trigger:** on_message_received
**Action:** send_message
```json
{
  "chatId": "123456789",
  "text": "New message from {{from.firstName}} in {{chat.title}}: {{message.text}}"
}
```

### 4. Keyword Response
**Trigger:** on_message_received (with keyword filter)
**Action:** send_message
```json
{
  "chatId": "{{chat.id}}",
  "text": "You mentioned the keyword! Here's some information...",
  "parseMode": "Markdown"
}
```

---

## Chat ID Format

Telegram chat IDs have specific formats:
- **Private chats:** Positive integer (e.g., `123456789`)
- **Groups:** Negative integer with `-` prefix (e.g., `-123456789`)
- **Supergroups/Channels:** Negative integer with `-100` prefix (e.g., `-1001234567890`)

You can find a chat ID by:
1. Using the bot info endpoint `/api/telegram/bot/info`
2. Sending a message to the bot and checking the trigger output
3. Using Telegram's `@userinfobot` or similar bots

---

## Error Handling

Common errors and their meanings:

- **"Telegram bot is not connected"** - Bot token is not configured or invalid
- **"Invalid chat ID after variable replacement"** - Chat ID format is incorrect
- **"Invalid message ID after variable replacement"** - Reply-to message ID is invalid
- **"Telegram API Error: chat not found"** - Bot doesn't have access to the chat
- **"Telegram API Error: bot was blocked by the user"** - User has blocked the bot
- **"Message text must be between 1 and 4096 characters"** - Text is too long

---

## Security Notes

1. **Bot Token:** Never expose your bot token in client-side code
2. **Chat IDs:** Chat IDs can be sensitive information - don't expose them unnecessarily
3. **Message Content:** Be careful when forwarding messages to avoid privacy issues
4. **Rate Limits:** Telegram has rate limits (30 messages/second to groups) - design workflows accordingly

---

## Additional Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [BotFather](https://t.me/botfather) - Create and manage Telegram bots
- [Telegram Bot Features](https://core.telegram.org/bots/features)
