# Telegram Module

Integration with Telegram Bot API for reading and sending messages.

## Features

### Triggers (Actions)
- **on_message_received**: Triggers when a new message is received in a Telegram chat

### Actions (Reactions)
- **send_message**: Send a text message to a Telegram chat

## Setup

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the bot token (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Configure Environment Variable

Add your bot token to the `.env` file:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### 3. Start Your Bot

The bot will automatically connect when the backend starts.

## Getting Chat IDs

To use the triggers and actions, you need to know the chat ID:

### Easiest Method: Use Bot Commands ⭐

1. Open Telegram and find your bot
2. Send `/start` to begin
3. Send `/myid` to get your chat ID
4. Copy the ID shown by the bot

**For groups:**
- Add the bot to your group
- Send `/myid` in the group
- The bot replies with the group chat ID (negative number)

### Available Bot Commands

- `/start` - Welcome message
- `/myid` - Get your chat ID (personal or group)
- `/help` - Show help and instructions

## API Endpoints

### GET `/api/telegram/bot/status`
Get bot connection status

**Response:**
```json
{
  "connected": true,
  "username": "my_bot",
  "firstName": "My Bot",
  "id": 123456789,
  "canJoinGroups": true,
  "canReadAllGroupMessages": false,
  "supportsInlineQueries": false
}
```

### GET `/api/telegram/bot/info`
Get full bot information and instructions

**Response:**
```json
{
  "bot": {
    "id": 123456789,
    "username": "my_bot",
    "first_name": "My Bot",
    "can_join_groups": true,
    "can_read_all_group_messages": false
  },
  "how_to_get_chat_id": {
    "step1": "Open Telegram and search for @my_bot",
    "step2": "Send the command: /start",
    "step3": "Send the command: /myid",
    "step4": "The bot will reply with your chat ID",
    "note": "For groups: Add the bot to your group and send /myid in the group"
  }
}
```

### GET `/api/telegram/chat/:chatId`
Get chat information (removed - use /myid command instead)

### POST `/api/telegram/test-message`
Send a test message

**Request:**
```json
{
  "chatId": "123456789",
  "text": "Hello from AREA!"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "message_id": 12345,
    "date": 1705320600,
    "chat": {
      "id": 123456789,
      "type": "private"
    }
  }
}
```

### POST `/api/telegram/validate-token`
Validate a bot token

**Request:**
```json
{
  "botToken": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
}
```

**Response:**
```json
{
  "valid": true
}
```

## Architecture

### Components

1. **TelegramModule** (`service.ts`)
   - Main module class extending BaseModule
   - Manages bot lifecycle and module initialization

2. **TelegramBotClient** (`TelegramBotClient.ts`)
   - Singleton managing bot connection
   - Handles long polling for incoming updates
   - Emits events to EventBus

3. **TelegramApiService** (`TelegramApiService.ts`)
   - Wrapper for Telegram Bot API calls
   - Handles API requests and responses

4. **OnMessageReceived** (`triggers/OnMessageReceived.ts`)
   - Trigger for incoming messages
   - Filters by chat, keyword, type, user, etc.

5. **SendMessage** (`actions/SendMessage.ts`)
   - Action to send messages
   - Supports variable replacement and formatting

### Event Flow

```
Telegram API → TelegramBotClient (long polling)
            ↓
        EventBus.emit('telegram.message.received')
            ↓
        OnMessageReceived (listens on EventBus)
            ↓
        Filters and validates
            ↓
        EventBus.emit('trigger.fired')
            ↓
        WorkflowExecutor
            ↓
        SendMessage.execute()
            ↓
        TelegramApiService.sendMessage()
            ↓
        Telegram API
```

## Configuration Schemas

### on_message_received Trigger

```json
{
  "chatId": "123456789",           // Required: Chat ID to monitor
  "keyword": "hello",              // Optional: Filter by keyword
  "messageType": "text",           // Optional: text, photo, video, etc.
  "fromUserId": "987654321",       // Optional: Filter by sender
  "ignoreBots": true               // Optional: Ignore bot messages
}
```

### send_message Action

```json
{
  "chatId": "{{chat.id}}",                    // Required: Destination chat
  "text": "Hello {{from.firstName}}!",        // Required: Message text
  "parseMode": "Markdown",                    // Optional: None, Markdown, HTML
  "replyToMessageId": "{{message.id}}",       // Optional: Reply to message
  "disableWebPagePreview": false,             // Optional: Disable link previews
  "disableNotification": false                // Optional: Silent message
}
```

## Variable System

All action configurations support variable replacement from trigger data:

```
{{message.text}}      - Message content
{{from.firstName}}    - Sender first name
{{from.username}}     - Sender username
{{chat.id}}          - Chat ID
{{chat.title}}       - Chat title
```

See [OUTPUT_SCHEMA.md](./OUTPUT_SCHEMA.md) for complete variable list.

## Limitations

- **Message Length:** Max 4096 characters per message
- **Rate Limits:** 30 messages/second to groups
- **File Size:** Max 50 MB for files (not yet implemented)
- **Long Polling:** Uses long polling instead of webhooks (may have slight latency)

## Future Features

- Send photos/videos/documents
- Edit/delete messages
- Pin/unpin messages
- Manage group members
- Handle inline queries
- Webhook support for production
- Media handling

## Troubleshooting

### Bot not connecting
- Check `TELEGRAM_BOT_TOKEN` in `.env`
- Verify token with BotFather
- Check logs for connection errors

### Messages not being received
- Ensure bot is added to the group (for groups)
- Check privacy settings with BotFather (`/setprivacy`)
- Verify chatId is correct

### Messages not being sent
- Check bot has permission to send messages
- Verify chatId format (negative for groups)
- Check message length (max 4096 chars)
- Review API error messages in logs

## Contributing

When adding new triggers or actions:
1. Create class in `triggers/` or `actions/`
2. Implement required methods
3. Add to config.ts
4. Register in service.ts
5. Update OUTPUT_SCHEMA.md
6. Restart backend (auto-syncs to database)

## Resources

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [BotFather](https://t.me/botfather)
- [Telegram Bot Features](https://core.telegram.org/bots/features)
