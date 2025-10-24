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

#### GPT-5 Series (Latest, Premium)
- `gpt-5-pro` - Highest capability, reasoning, and context
- `gpt-5` - Standard GPT-5 model
- `gpt-5-mini` - Faster, cost-effective version
- `gpt-5-nano` - Ultra-fast, lightweight version

#### GPT-4.1 Series (Enhanced)
- `gpt-4.1` - Improved GPT-4 with better reasoning
- `gpt-4.1-mini` - Faster, cheaper variant
- `gpt-4.1-nano` - Ultra-lightweight version

#### GPT-4 Series (Proven, Recommended)
- `gpt-4o` - Optimized multimodal GPT-4
- `gpt-4o-mini` - **Default model** (best price/performance) ⭐
- `gpt-4-turbo` - Faster GPT-4 with larger context
- `gpt-4` - Original GPT-4

#### O-Series Reasoning Models
- `o4-mini` - Latest mini reasoning model
- `o1-preview` - Preview of advanced reasoning
- `o1-mini` - Lightweight reasoning model

> **Note:** GPT-5 and O-series models have special parameter requirements that are handled automatically. See [MODEL_COMPATIBILITY_GUIDE.md](./MODEL_COMPATIBILITY_GUIDE.md) for details.

### Temperature Settings
- `0.0-0.3` - Focused, deterministic
- `0.4-0.7` - Balanced (default: 0.7)
- `0.8-2.0` - Creative, diverse

> **Note:** Temperature is not supported by GPT-5 and O-series models (automatically ignored)

### Token Limits
- Input: Up to 16,000 tokens
- Output: 1-16,000 tokens (configurable)
- Default: 500 tokens

## 💰 Cost Management

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Use Case |
|-------|----------------------|------------------------|----------|
| GPT-5 Pro | $30.00 | $120.00 | Critical, highest quality |
| GPT-5 | $15.00 | $60.00 | Premium quality |
| GPT-5 Mini | $3.00 | $12.00 | Balanced premium |
| GPT-4o-mini | $0.15 | $0.60 | **Default (recommended)** ⭐ |
| GPT-4o | $5.00 | $15.00 | High quality |
| GPT-4.1 | $10.00 | $30.00 | Enhanced reasoning |
| O1-mini | $15.00 | $60.00 | Complex reasoning |

**Tip:** Use `gpt-4o-mini` for most tasks (best price/performance)! Upgrade to GPT-5 only for critical quality needs.

## 🔐 Security

- ✅ API keys stored encrypted in database
- ✅ Never logged or exposed
- ✅ Validated before use
- ❌ Never commit keys to git
- ❌ Don't expose in frontend

## 📊 Files Structure

```
openai/
├── config.ts                     # Module configuration
├── service.ts                    # Module initialization
├── controller.ts                 # API endpoints
├── routes.ts                     # Route definitions
├── OpenAIApiService.ts           # API client with model compatibility
├── actions/
│   ├── GenerateText.ts           # Text generation
│   ├── AnalyzeSentiment.ts       # Sentiment analysis
│   ├── SummarizeText.ts          # Text summarization
│   ├── TranslateText.ts          # Translation
│   ├── ExtractKeywords.ts        # Keyword extraction
│   └── _index.ts
├── MODEL_COMPATIBILITY_GUIDE.md  # Model comparison & compatibility
├── UPGRADE_SUMMARY.md            # Upgrade changelog
├── OUTPUT_SCHEMA.md              # Output documentation
└── README.md                     # This file
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
**Version:** 2.0.0  
**Last Updated:** October 2025  
**New:** GPT-5, GPT-4.1, and O-series support with automatic compatibility handling
