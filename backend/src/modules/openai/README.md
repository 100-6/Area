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
- **[Model Compatibility Guide](./MODEL_COMPATIBILITY_GUIDE.md)** - Model differences and requirements
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

#### 🚀 Flagship Models (Recommended)
- `gpt-5-pro` - Smartest and most precise
- `gpt-5` - Best for coding and agentic tasks
- `gpt-5-mini` - Faster, cheaper version
- `gpt-5-nano` - Fastest for classification

#### 🔧 Advanced Models
- `gpt-4.1` - Advanced with fine-tuning
- `gpt-4.1-mini` - Smaller, faster variant
- `gpt-4.1-nano` - Most efficient variant

#### 🎯 Standard Models
- `gpt-4o` - Multimodal flagship
- `gpt-4o-mini` - **Default** - Best price-performance

#### 🧠 Reasoning Models
- `o1-preview` - Advanced reasoning
- `o1-mini` - Faster reasoning for STEM
- `o4-mini` - Latest reasoning model

#### 📦 Legacy Models
- `gpt-4-turbo` - Faster GPT-4
- `gpt-4` - Original GPT-4

> **Note:** Reasoning models (o-series) don't support `temperature` or `system` messages. See [Model Compatibility Guide](./MODEL_COMPATIBILITY_GUIDE.md) for details.

### Temperature Settings
- `0.0-0.3` - Focused, deterministic
- `0.4-0.7` - Balanced (default: 0.7)
- `0.8-2.0` - Creative, diverse
- ⚠️ Not applicable for o-series reasoning models

### Token Limits
- Input: Up to 16,000 tokens (configurable)
- Context Window: 128,000 tokens (most models)

## 💰 Cost Management

| Model | Input (per 1M) | Output (per 1M) | Best For |
|-------|---------------|-----------------|----------|
| **GPT-5 Pro** | $15.00 | $120.00 | Critical tasks requiring highest precision |
| **GPT-5** | $1.25 | $10.00 | Complex coding and agentic tasks |
| **GPT-5 Mini** | $0.25 | $2.00 | Well-defined tasks, good balance |
| **GPT-5 Nano** | $0.05 | $0.40 | Classification, summarization |
| **GPT-4.1** | $3.00 | $12.00 | Advanced tasks with fine-tuning |
| **GPT-4.1 Mini** | $0.80 | $3.20 | Efficient advanced tasks |
| **GPT-4.1 Nano** | $0.20 | $0.80 | Most efficient variant |
| **GPT-4o** | $2.50 | $10.00 | Multimodal flagship |
| **GPT-4o Mini** ⭐ | $0.15 | $0.60 | **Default - Best value** |
| **o4-mini** | $4.00 | $16.00 | Complex reasoning |
| **o1-preview** | $15.00 | $60.00 | Advanced reasoning |
| **o1-mini** | $3.00 | $12.00 | STEM reasoning |

**Tips:**
- 🎯 Use `gpt-4o-mini` as default - best price-performance
- 💰 Use `gpt-5-nano` for simple tasks - cheapest option
- 🧠 Use o-series only for complex reasoning tasks
- 🚀 Reserve `gpt-5-pro` for mission-critical work

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
