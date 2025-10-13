# 🚀 OpenAI Module - Quick Start

## 5-Minute Setup Guide

### Step 1: Get OpenAI API Key (2 min)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **Create new secret key**
5. Copy the key (starts with `sk-`)

### Step 2: Connect to AREA (1 min)
```bash
curl -X POST http://localhost:8080/api/openai/connect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "sk-your-openai-key"}'
```

### Step 3: Test It (2 min)
```json
{
  "trigger": {
    "module": "discord",
    "action": "on_message_created",
    "config": { "channelId": "YOUR_CHANNEL_ID" }
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

---

## 🎯 Top 5 Use Cases

### 1. Auto-Respond to Negative Feedback
```json
{
  "actions": [
    { "action": "analyze_sentiment", "config": { "text": "{{message}}" } },
    { 
      "action": "generate_text", 
      "condition": "{{sentiment}} === 'negative'",
      "config": { "prompt": "Write empathetic response" }
    }
  ]
}
```

### 2. Daily News Summary
```json
{
  "trigger": { "action": "daily_at_time", "config": { "time": "09:00" } },
  "actions": [
    { "action": "summarize_text", "config": { "text": "{{article}}" } },
    { "action": "send_email", "config": { "body": "{{summary}}" } }
  ]
}
```

### 3. Multi-Language Support
```json
{
  "actions": [
    { "action": "translate_text", "config": { 
      "text": "{{message}}", 
      "targetLanguage": "french" 
    }},
    { "action": "send_message", "config": { "content": "{{translatedText}}" } }
  ]
}
```

### 4. Content Tagging
```json
{
  "actions": [
    { "action": "extract_keywords", "config": { "text": "{{article}}" } },
    { "action": "tag_content", "config": { "tags": "{{keywords}}" } }
  ]
}
```

### 5. Smart Email Assistant
```json
{
  "trigger": { "action": "on_email_received" },
  "actions": [
    { "action": "analyze_sentiment", "config": { "text": "{{email.body}}" } },
    { "action": "generate_text", "config": { 
      "prompt": "Draft {{sentiment}} response to: {{email.body}}" 
    }}
  ]
}
```

---

## 📚 Available Actions

| Action | Input | Output |
|--------|-------|--------|
| `generate_text` | prompt | generatedText, tokensUsed |
| `analyze_sentiment` | text | sentiment, score, explanation |
| `summarize_text` | text | summary, compressionRatio |
| `translate_text` | text, targetLanguage | translatedText |
| `extract_keywords` | text | keywords, topics |

---

## 🔗 Useful Links

- **[Complete Guide](./OPENAI_MODULE_GUIDE.md)** - Full documentation
- **[Output Schemas](./OUTPUT_SCHEMA.md)** - Data structures
- **[Architecture](./ARCHITECTURE.md)** - Visual diagrams
- **[Implementation](./IMPLEMENTATION_SUMMARY.md)** - Technical details

---

## 💡 Pro Tips

1. **Use GPT-3.5 for simple tasks** - 60x cheaper than GPT-4
2. **Set maxTokens appropriately** - Save costs
3. **Chain actions** - Use outputs from previous actions
4. **Add conditions** - Only run actions when needed
5. **Monitor usage** - Check `tokensUsed` in outputs

---

## 🐛 Quick Troubleshooting

**Error: "API key not found"**
→ Run `/api/openai/connect` first

**Error: "Rate limit exceeded"**
→ Wait and retry, or upgrade OpenAI plan

**Variables not working?**
→ Use correct syntax: `{{message.content}}`

**Poor results?**
→ Improve prompt, adjust temperature, or use GPT-4

---

## 💰 Cost Example

**100 sentiment analyses per day:**
- Input: 100 tokens × 100 = 10,000 tokens
- Output: 50 tokens × 100 = 5,000 tokens
- **Cost:** $0.0125/day ≈ **$0.38/month** 🎉

---

## ✅ Checklist

- [ ] Get OpenAI API key
- [ ] Connect via `/api/openai/connect`
- [ ] Create first automation
- [ ] Test with simple prompt
- [ ] Monitor token usage
- [ ] Read full documentation

---

**Ready to automate with AI?** Start with the examples above! 🚀
