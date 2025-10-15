# 🚀 Quick Start - Telegram Module

## ✅ Implementation Complete

The Telegram module has been fully implemented and is ready to use!

## 📋 Checklist

- [x] Module structure created
- [x] Configuration schemas defined
- [x] TelegramApiService implemented
- [x] TelegramBotClient with long polling
- [x] OnMessageReceived trigger
- [x] SendMessage action
- [x] TelegramModule service
- [x] REST API controller and routes
- [x] Module registered in registry
- [x] Routes added to main router
- [x] Documentation complete

## 🔧 Setup Instructions

### Step 1: Create Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Choose a name for your bot (e.g., "My AREA Bot")
4. Choose a username for your bot (must end in `bot`, e.g., "myarea_bot")
5. Copy the **bot token** (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Configure Environment

Add your bot token to `.env` file:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### Step 3: Start Backend

```bash
cd backend
npm install  # If not already done
npm run dev
```

You should see:
```
[Telegram] Connecting bot to Telegram...
[Telegram Bot] ✓ Ready! Logged in as @your_bot_username
[Telegram Bot] Bot ID: 123456789
[Telegram Bot] Starting long polling...
[Telegram Bot] ✓ Long polling started
[Telegram] ✓ Module initialized successfully
```

### Step 4: Test the Bot

#### Option A: Using curl

```bash
# Get bot status
curl http://localhost:8080/api/telegram/bot/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Send test message
curl -X POST http://localhost:8080/api/telegram/test-message \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "YOUR_CHAT_ID",
    "text": "Hello from AREA!"
  }'
```

#### Option B: Using Telegram

1. Start a chat with your bot on Telegram
2. Send any message (e.g., "Hello")
3. Check backend logs - you should see:
   ```
   [Telegram Bot] Message received: "Hello..." from YourName
   ```

## 💡 Create Your First Automation

### Example 1: Echo Bot

**Trigger Configuration:**
```json
{
  "chatId": "123456789",
  "ignoreBots": true
}
```

**Action Configuration:**
```json
{
  "chatId": "{{chat.id}}",
  "text": "You said: {{message.text}}",
  "replyToMessageId": "{{message.id}}"
}
```

### Example 2: Keyword Auto-Response

**Trigger Configuration:**
```json
{
  "chatId": "123456789",
  "keyword": "help",
  "ignoreBots": true
}
```

**Action Configuration:**
```json
{
  "chatId": "{{chat.id}}",
  "text": "Hello {{from.firstName}}! Need help? Contact support@example.com",
  "parseMode": "Markdown"
}
```

### Example 3: Forward to Another Chat

**Trigger Configuration:**
```json
{
  "chatId": "-1001234567890",
  "messageType": "text"
}
```

**Action Configuration:**
```json
{
  "chatId": "987654321",
  "text": "📨 New message in {{chat.title}}\nFrom: {{from.firstName}}\nMessage: {{message.text}}"
}
```

## 🔍 Finding Chat IDs

### Method 1: Use Bot Commands (Recommended ⭐)
1. Open Telegram and search for your bot (e.g., `@your_bot_username`)
2. Start a conversation and send: `/start`
3. Send the command: `/myid`
4. The bot will reply with your chat ID!

**For groups:**
1. Add your bot to the group
2. Send `/myid` in the group chat
3. The bot will reply with the group chat ID (negative number)

### Method 2: Check Backend Logs
1. Send any message to your bot
2. Check backend logs for:
   ```
   [Telegram Bot] Message received: "hello..." from YourName
   ```
3. The chat.id will appear in the event data

### Method 3: Use API Endpoint
```bash
curl http://localhost:8080/api/telegram/bot/info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This will show you the bot username and instructions.

## 📊 Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/telegram/bot/status` | Bot connection status |
| GET | `/api/telegram/bot/info` | Bot info + how to get chat ID |
| POST | `/api/telegram/test-message` | Send test message |
| POST | `/api/telegram/validate-token` | Validate bot token |

## 🎯 Available Variables

Use these in action configurations:

### Message Variables
- `{{message.id}}` - Message ID
- `{{message.text}}` - Message content
- `{{message.date}}` - Message timestamp
- `{{message.type}}` - Message type (text, photo, etc.)

### Sender Variables
- `{{from.id}}` - Sender user ID
- `{{from.firstName}}` - Sender first name
- `{{from.lastName}}` - Sender last name
- `{{from.username}}` - Sender username

### Chat Variables
- `{{chat.id}}` - Chat ID
- `{{chat.type}}` - Chat type (private, group, etc.)
- `{{chat.title}}` - Chat title (for groups)
- `{{chat.username}}` - Chat username

See [OUTPUT_SCHEMA.md](./OUTPUT_SCHEMA.md) for complete list.

## 🐛 Troubleshooting

### Bot Not Connecting

**Problem:** `TELEGRAM_BOT_TOKEN not configured`

**Solution:**
1. Check `.env` file exists in backend directory
2. Verify `TELEGRAM_BOT_TOKEN` is set correctly
3. Restart backend server

---

**Problem:** `Invalid Telegram bot token`

**Solution:**
1. Verify token format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
2. Get new token from @BotFather if needed
3. Check for extra spaces or quotes in `.env`

### Messages Not Being Received

**Problem:** No trigger fired event

**Solution:**
1. Verify bot is running: Check `/api/telegram/bot/status`
2. Ensure chatId in trigger config is correct
3. Check privacy settings with @BotFather (`/setprivacy`)
4. For groups: Add bot to group first

### Messages Not Being Sent

**Problem:** `Telegram API Error: chat not found`

**Solution:**
1. Start conversation with bot first (for private chats)
2. Add bot to group (for group chats)
3. Verify chatId is correct (negative for groups)

---

**Problem:** `Invalid chat ID after variable replacement`

**Solution:**
1. Check variable name is correct: `{{chat.id}}`
2. Verify trigger data contains chat.id
3. Check logs for actual variable values

## 📚 Documentation

- [README.md](./README.md) - Full module documentation
- [OUTPUT_SCHEMA.md](./OUTPUT_SCHEMA.md) - Data structures and variables
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical details

## 🎉 You're Ready!

The Telegram module is fully operational. Create your first area and start automating!

For questions or issues, check the logs or refer to the documentation files.
