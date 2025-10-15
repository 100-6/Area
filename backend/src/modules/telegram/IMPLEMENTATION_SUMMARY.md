# Telegram Module - Implementation Summary

## ✅ Implementation Complete

The Telegram module has been fully implemented following the Mirror-Area architecture patterns.

## 📁 File Structure

```
backend/src/modules/telegram/
├── config.ts                   # Module metadata and schemas
├── service.ts                  # TelegramModule (main module class)
├── TelegramBotClient.ts        # Singleton bot client with long polling
├── TelegramApiService.ts       # API wrapper for Telegram Bot API
├── controller.ts               # REST API controller
├── routes.ts                   # Express routes
├── README.md                   # Module documentation
├── OUTPUT_SCHEMA.md            # Output schemas documentation
├── triggers/
│   ├── OnMessageReceived.ts    # Message received trigger
│   └── _index.ts               # Trigger exports
└── actions/
    ├── SendMessage.ts          # Send message action
    └── _index.ts               # Action exports
```

## 🎯 Features Implemented

### Triggers
- ✅ **on_message_received**: Fires when a message is received
  - Filter by chat ID
  - Filter by keyword
  - Filter by message type (text, photo, video, etc.)
  - Filter by sender user ID
  - Option to ignore bots
  - Full output schema with message, sender, and chat data

### Actions
- ✅ **send_message**: Send a text message
  - Support for chat ID (with variable replacement)
  - Text with variable replacement (max 4096 chars)
  - Parse modes (None, Markdown, HTML)
  - Reply to message support
  - Disable web page preview option
  - Silent message option
  - Full output schema with sent message info

### Infrastructure
- ✅ **TelegramBotClient**: Singleton managing bot connection
  - Long polling for real-time updates
  - Event emission to EventBus
  - Trigger registry for active areas
  - Automatic reconnection handling

- ✅ **TelegramApiService**: API wrapper
  - sendMessage method
  - getMe method (bot info)
  - getChat method (chat info)
  - getUpdates method (polling)
  - Token validation
  - Error handling

- ✅ **REST API Endpoints**:
  - `GET /api/telegram/bot/status` - Bot connection status
  - `GET /api/telegram/bot/info` - Bot information
  - `GET /api/telegram/chat/:chatId` - Chat information
  - `POST /api/telegram/test-message` - Send test message
  - `POST /api/telegram/validate-token` - Validate bot token

## 🔧 Configuration Required

### Environment Variable
Add to `.env`:
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### Create Bot
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Use `/newbot` command
3. Copy the bot token
4. Add to `.env` file

## 🚀 Usage

### 1. Start the Backend
```bash
cd backend
npm install
npm run dev
```

The Telegram module will auto-initialize and connect the bot.

### 2. Create an Area
Use the frontend or API to create an area with:
- **Trigger**: `telegram.on_message_received`
- **Action**: `telegram.send_message` (or any other action)

### 3. Configure the Trigger
```json
{
  "chatId": "123456789",
  "keyword": "hello",
  "ignoreBots": true
}
```

### 4. Configure the Action
```json
{
  "chatId": "{{chat.id}}",
  "text": "You said: {{message.text}}",
  "replyToMessageId": "{{message.id}}"
}
```

## 🔄 Integration Points

### Registry
- ✅ Registered in `backend/src/modules/registry.ts`
- ✅ Auto-syncs to database on startup via ModuleSync

### Routes
- ✅ Added to `backend/src/core/routes/_index.ts`
- ✅ All routes protected by `requireAuth` middleware

### EventBus
- ✅ Emits `telegram.message.received` events
- ✅ Listens for `trigger.fired` events via WorkflowExecutor

## 📊 Event Flow

```
Telegram → TelegramBotClient → EventBus → Trigger → WorkflowExecutor → Action → TelegramApiService → Telegram
```

1. **Telegram API** sends update via long polling
2. **TelegramBotClient** receives update and emits `telegram.message.received`
3. **OnMessageReceived** trigger listens and filters
4. Trigger emits `trigger.fired` event
5. **WorkflowExecutor** catches and executes actions
6. **SendMessage** action receives context with variables
7. **TelegramApiService** sends message to Telegram

## 🎨 Variable System

The module supports full variable replacement:

```
{{message.id}}          - Message ID
{{message.text}}        - Message content
{{from.firstName}}      - Sender first name
{{from.username}}       - Sender username
{{chat.id}}            - Chat ID
{{chat.title}}         - Chat title
... and more (see OUTPUT_SCHEMA.md)
```

## 🧪 Testing

### Test Bot Connection
```bash
curl http://localhost:8080/api/telegram/bot/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Send Test Message
```bash
curl -X POST http://localhost:8080/api/telegram/test-message \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "123456789",
    "text": "Test message from AREA!"
  }'
```

### Get Chat Info
```bash
curl http://localhost:8080/api/telegram/chat/123456789 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📝 Architecture Highlights

### Following Project Patterns
✅ Extends `BaseModule` for consistency
✅ Extends `BaseTrigger` and `BaseAction`
✅ Uses EventBus for event-driven architecture
✅ Implements variable replacement system
✅ Auto-sync via ModuleSync (no manual DB work)
✅ JSDoc documentation on public methods
✅ Color-coded console logging
✅ asyncHandler for error handling

### Key Design Decisions

1. **Long Polling over Webhooks**
   - Simpler setup (no domain/SSL required)
   - Self-contained architecture
   - Future: Can add webhook support for production

2. **Bot Token Only (No OAuth)**
   - Simpler than Discord's OAuth2 flow
   - Bot operates on behalf of itself
   - Users don't need to authenticate with Telegram

3. **Negative Chat IDs**
   - Groups have negative IDs (standard Telegram format)
   - Validation regex accepts negative numbers: `^-?[0-9]+$`

4. **Message Type Filtering**
   - Supports text, photo, video, document, audio, voice, sticker
   - Future: Can add handlers for each type

## 🔮 Future Enhancements

Possible extensions (not implemented):
- [ ] Send photos/videos/documents
- [ ] Edit/delete messages
- [ ] Pin/unpin messages
- [ ] Inline keyboards
- [ ] Callback queries
- [ ] Inline mode
- [ ] Group member management
- [ ] Webhook support
- [ ] Media download

## ⚠️ Known Limitations

1. **Rate Limits**: Telegram limits to 30 messages/second to groups
2. **Message Length**: Max 4096 characters per message
3. **Long Polling Latency**: May have slight delay vs webhooks
4. **Text Only**: Currently only text messages (no media)

## 🎓 How It Differs from Discord

| Aspect | Discord | Telegram |
|--------|---------|----------|
| Auth | OAuth2 + Bot Token | Bot Token only |
| Connection | WebSocket Gateway | Long Polling |
| IDs | Snowflakes (18-19 digits) | Integers (can be negative) |
| Structure | Guilds → Channels | Chats (private/group/channel) |
| Permissions | Role-based | Admin-based |

## ✨ Ready to Use!

The Telegram module is fully functional and ready for production use. Simply:
1. Add `TELEGRAM_BOT_TOKEN` to `.env`
2. Restart backend
3. Create areas with Telegram triggers/actions
4. Enjoy automation! 🎉
