# 🤖 OpenAI Module

AI-powered text generation, analysis, and transformation using GPT models.

## 🚀 Quick Start

### 1. Add Your API Key

```bash
# Via API
curl -X POST http://localhost:8080/api/openai/connect \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "sk-your-openai-api-key"}'
```

### 2. Create Your First Automation

```json
{
  "trigger": {
    "module": "discord",
    "action": "on_message_created",
    "config": { "channelId": "123456789" }
  },
  "actions": [
    {
      "module": "openai",
      "action": "analyze_sentiment",
      "config": { "text": "{{message.content}}" }
    }
  ]
}
```

## 📚 Actions

| Action | Description | Inputs | Outputs |
|--------|-------------|--------|---------|
| `generate_text` | Generate text with GPT | prompt, model, maxTokens | generatedText, tokensUsed |
| `analyze_sentiment` | Detect sentiment | text | sentiment, score, explanation |
| `summarize_text` | Create summary | text, length | summary, compressionRatio |
| `translate_text` | Translate text | text, targetLanguage | translatedText |
| `extract_keywords` | Extract keywords | text, maxKeywords | keywords, topics |

## 📖 Documentation

- **[Complete Guide](./OPENAI_MODULE_GUIDE.md)** - Full documentation with examples
- **[Output Schemas](./OUTPUT_SCHEMA.md)** - Data returned by each action
- **[Config](./config.ts)** - Module configuration

## 🔧 API Endpoints

### Check Status
```bash
GET /api/openai/status
```

### Connect API Key
```bash
POST /api/openai/connect
Body: { "apiKey": "sk-..." }
```

### Get Available Models
```bash
GET /api/openai/models
```

## 💡 Example Use Cases

### Auto-Respond to Negative Feedback
```json
{
  "trigger": "on_message_created",
  "actions": [
    { "action": "analyze_sentiment", "config": { "text": "{{message}}" } },
    { 
      "action": "generate_text",
      "condition": "{{sentiment}} === 'negative'",
      "config": { "prompt": "Write an empathetic response" }
    }
  ]
}
```

### Multi-Language Newsletter
```json
{
  "actions": [
    { "action": "summarize_text", "config": { "text": "{{article}}" } },
    { "action": "translate_text", "config": { 
      "text": "{{summary}}", 
      "targetLanguage": "french" 
    }}
  ]
}
```

### Content Tagging
```json
{
  "actions": [
    { "action": "extract_keywords", "config": { "text": "{{content}}" } },
    { "action": "tag_article", "config": { "tags": "{{keywords}}" } }
  ]
}
```

## ⚙️ Configuration

### Supported Models
- `gpt-3.5-turbo` - Fast and efficient (default)
- `gpt-4` - Most capable
- `gpt-4-turbo` - Larger context window

### Temperature Settings
- `0.0-0.3` - Focused, deterministic
- `0.4-0.7` - Balanced (default: 0.7)
- `0.8-2.0` - Creative, diverse

### Token Limits
- Input: Up to 4000 tokens
- Output: 1-4000 tokens (configurable)

## 💰 Cost Management

| Model | Input (per 1K) | Output (per 1K) |
|-------|---------------|-----------------|
| GPT-3.5 Turbo | $0.0005 | $0.0015 |
| GPT-4 | $0.03 | $0.06 |
| GPT-4 Turbo | $0.01 | $0.03 |

**Tip:** Use GPT-3.5 for most tasks to reduce costs by 60x!

## 🔐 Security

- ✅ API keys stored encrypted in database
- ✅ Never logged or exposed
- ✅ Validated before use
- ❌ Never commit keys to git
- ❌ Don't expose in frontend

## 📊 Files Structure

```
openai/
├── config.ts                  # Module configuration
├── service.ts                 # Module initialization
├── controller.ts              # API endpoints
├── routes.ts                  # Route definitions
├── OpenAIApiService.ts        # API client
├── actions/
│   ├── GenerateText.ts
│   ├── AnalyzeSentiment.ts
│   ├── SummarizeText.ts
│   ├── TranslateText.ts
│   ├── ExtractKeywords.ts
│   └── _index.ts
├── OPENAI_MODULE_GUIDE.md     # Complete guide
├── OUTPUT_SCHEMA.md           # Output documentation
└── README.md                  # This file
```

## 🐛 Troubleshooting

### "API key not found"
→ Run `POST /api/openai/connect` with your API key

### "Rate limit exceeded"
→ Wait and retry, or upgrade your OpenAI plan

### Variables not replacing
→ Check trigger data structure and use correct paths

### Poor quality results
→ Improve prompt specificity, adjust temperature, or use GPT-4

## 🆘 Support

- 📧 Email: support@area-platform.com
- 💬 [OpenAI Community](https://community.openai.com)
- 📖 [OpenAI Docs](https://platform.openai.com/docs)

---

**Module Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** October 2025
