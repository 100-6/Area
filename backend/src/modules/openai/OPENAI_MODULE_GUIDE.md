# 🤖 OpenAI Module - Complete Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Setup & Configuration](#setup--configuration)
- [Available Actions](#available-actions)
- [Usage Examples](#usage-examples)
- [Variable Interpolation](#variable-interpolation)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## 🌟 Overview

The OpenAI module integrates OpenAI's GPT models into your AREA automation platform, enabling AI-powered text generation, analysis, translation, and more.

### Key Features
- ✍️ **Text Generation** - Create content with GPT-4/3.5-turbo
- 😊 **Sentiment Analysis** - Detect positive/negative/neutral sentiment
- 📝 **Text Summarization** - Condense long text into summaries
- 🌐 **Translation** - Multi-language AI translation
- 🏷️ **Keyword Extraction** - Extract key topics and keywords

### Module Information
- **Name:** `openai`
- **Display Name:** OpenAI
- **Auth Type:** API Key
- **Icon:** OpenAI Logo
- **Color:** `#10A37F`

---

## 🔧 Setup & Configuration

### 1. Get Your OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **"Create new secret key"**
5. Copy your API key (starts with `sk-...`)

⚠️ **Important:** Keep your API key secure! Never share it publicly.

### 2. Add API Key to AREA

#### Option A: Via Frontend (Recommended)
1. Log in to your AREA account
2. Go to **Settings** → **Connected Services**
3. Find **OpenAI** in the list
4. Click **Connect**
5. Paste your API key
6. Click **Save**

#### Option B: Direct Database Insert
```sql
INSERT INTO user_auth_providers 
(user_id, provider, provider_user_id, provider_data)
VALUES 
('your-user-id', 'openai', 'openai', '{"apiKey": "sk-your-api-key"}');
```

### 3. Verify Installation

Check that the module is loaded:
```bash
# Check backend logs
docker logs area-backend | grep OpenAI

# Expected output:
# [OpenAI] Initializing OpenAI module...
# [OpenAI] Registered action: generate_text
# [OpenAI] Registered action: analyze_sentiment
# [OpenAI] Registered action: summarize_text
# [OpenAI] Registered action: translate_text
# [OpenAI] Registered action: extract_keywords
# [OpenAI] ✓ Module initialized successfully
```

---

## 🎯 Available Actions

### 1. Generate Text

**Action Name:** `generate_text`

Generate creative text content using GPT models.

**Configuration:**
```typescript
{
  prompt: string;           // Required: The text prompt (1-4000 chars)
  model?: string;           // Optional: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo'
  maxTokens?: number;       // Optional: Max response tokens (1-4000, default: 500)
  temperature?: number;     // Optional: Creativity (0-2, default: 0.7)
  systemMessage?: string;   // Optional: System context (max 1000 chars)
}
```

**Output:**
```typescript
{
  generatedText: string;    // The generated content
  tokensUsed: number;       // Total tokens consumed
  model: string;            // Model used
  finishReason: string;     // 'stop' | 'length' | 'content_filter'
}
```

**Example:**
```json
{
  "action": "generate_text",
  "config": {
    "prompt": "Write a professional email thanking a client for their business",
    "model": "gpt-3.5-turbo",
    "maxTokens": 300,
    "temperature": 0.7,
    "systemMessage": "You are a professional business writer"
  }
}
```

---

### 2. Analyze Sentiment

**Action Name:** `analyze_sentiment`

Detect the emotional tone of text (positive, negative, or neutral).

**Configuration:**
```typescript
{
  text: string;                  // Required: Text to analyze (1-2000 chars)
  includeExplanation?: boolean;  // Optional: Include explanation (default: true)
}
```

**Output:**
```typescript
{
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;           // Confidence score (0-1)
  explanation?: string;    // Brief explanation (if enabled)
}
```

**Example:**
```json
{
  "action": "analyze_sentiment",
  "config": {
    "text": "{{message.content}}",
    "includeExplanation": true
  }
}
```

**Use Cases:**
- Monitor customer feedback sentiment
- Auto-respond to negative reviews
- Filter toxic comments
- Analyze survey responses

---

### 3. Summarize Text

**Action Name:** `summarize_text`

Create concise summaries of longer text content.

**Configuration:**
```typescript
{
  text: string;              // Required: Text to summarize (100-10000 chars)
  length?: string;           // Optional: 'short' | 'medium' | 'long' (default: 'medium')
  bulletPoints?: boolean;    // Optional: Format as bullets (default: false)
}
```

**Output:**
```typescript
{
  summary: string;           // The generated summary
  originalLength: number;    // Original text length
  summaryLength: number;     // Summary length
  compressionRatio: number;  // Ratio (0-1)
}
```

**Example:**
```json
{
  "action": "summarize_text",
  "config": {
    "text": "{{article.content}}",
    "length": "short",
    "bulletPoints": true
  }
}
```

**Length Guidelines:**
- **short:** 2-3 sentences
- **medium:** 1 paragraph (4-6 sentences)
- **long:** 2-3 paragraphs

---

### 4. Translate Text

**Action Name:** `translate_text`

Translate text between multiple languages using AI.

**Configuration:**
```typescript
{
  text: string;              // Required: Text to translate (1-3000 chars)
  targetLanguage: string;    // Required: Target language
  sourceLanguage?: string;   // Optional: Source language (default: 'auto')
  formalTone?: boolean;      // Optional: Use formal tone (default: false)
}
```

**Supported Languages:**
- english, spanish, french, german, italian
- portuguese, chinese, japanese, korean, russian

**Output:**
```typescript
{
  translatedText: string;    // The translated text
  detectedLanguage: string;  // Detected source language
  targetLanguage: string;    // Target language used
}
```

**Example:**
```json
{
  "action": "translate_text",
  "config": {
    "text": "{{message.content}}",
    "targetLanguage": "french",
    "sourceLanguage": "auto",
    "formalTone": true
  }
}
```

---

### 5. Extract Keywords

**Action Name:** `extract_keywords`

Extract key topics and keywords from text for analysis and categorization.

**Configuration:**
```typescript
{
  text: string;           // Required: Text to analyze (50-5000 chars)
  maxKeywords?: number;   // Optional: Max keywords (1-50, default: 10)
}
```

**Output:**
```typescript
{
  keywords: string[];     // Array of extracted keywords
  topics: string[];       // Main topics identified
  keywordCount: number;   // Number of keywords found
}
```

**Example:**
```json
{
  "action": "extract_keywords",
  "config": {
    "text": "{{article.content}}",
    "maxKeywords": 15
  }
}
```

---

## 💡 Usage Examples

### Example 1: Auto-Respond to Negative Feedback

**Scenario:** Monitor Discord messages and auto-respond to negative sentiment.

```json
{
  "trigger": {
    "module": "discord",
    "action": "on_message_created",
    "config": {
      "channelId": "123456789012345678"
    }
  },
  "actions": [
    {
      "module": "openai",
      "action": "analyze_sentiment",
      "config": {
        "text": "{{message.content}}",
        "includeExplanation": true
      }
    },
    {
      "module": "openai",
      "action": "generate_text",
      "condition": "{{sentiment}} === 'negative' && {{score}} > 0.7",
      "config": {
        "prompt": "Write a professional, empathetic response to this negative feedback: {{message.content}}",
        "model": "gpt-3.5-turbo",
        "maxTokens": 200,
        "systemMessage": "You are a helpful customer support agent"
      }
    },
    {
      "module": "discord",
      "action": "send_message",
      "config": {
        "channelId": "123456789012345678",
        "content": "{{generatedText}}",
        "replyToMessageId": "{{message.id}}"
      }
    }
  ]
}
```

---

### Example 2: Multi-Language Newsletter Summarizer

**Scenario:** Summarize articles and translate to multiple languages.

```json
{
  "trigger": {
    "module": "timer",
    "action": "daily_at_time",
    "config": {
      "time": "09:00"
    }
  },
  "actions": [
    {
      "module": "openai",
      "action": "summarize_text",
      "config": {
        "text": "{{fetchedArticle.content}}",
        "length": "medium",
        "bulletPoints": true
      }
    },
    {
      "module": "openai",
      "action": "translate_text",
      "config": {
        "text": "{{summary}}",
        "targetLanguage": "french",
        "sourceLanguage": "english"
      }
    },
    {
      "module": "discord",
      "action": "send_message",
      "config": {
        "channelId": "987654321098765432",
        "content": "📰 Daily Summary (FR):\n\n{{translatedText}}"
      }
    }
  ]
}
```

---

### Example 3: Content Categorization

**Scenario:** Extract keywords from articles and tag them automatically.

```json
{
  "trigger": {
    "module": "webhook",
    "action": "on_webhook_received",
    "config": {
      "path": "/article-published"
    }
  },
  "actions": [
    {
      "module": "openai",
      "action": "extract_keywords",
      "config": {
        "text": "{{article.content}}",
        "maxKeywords": 10
      }
    },
    {
      "module": "openai",
      "action": "generate_text",
      "config": {
        "prompt": "Based on these keywords: {{keywords}}, suggest 3 appropriate categories for this article",
        "model": "gpt-3.5-turbo",
        "maxTokens": 100
      }
    }
  ]
}
```

---

### Example 4: Smart Email Assistant

**Scenario:** Generate professional email responses.

```json
{
  "trigger": {
    "module": "gmail",
    "action": "on_email_received",
    "config": {
      "label": "Support"
    }
  },
  "actions": [
    {
      "module": "openai",
      "action": "analyze_sentiment",
      "config": {
        "text": "{{email.body}}"
      }
    },
    {
      "module": "openai",
      "action": "generate_text",
      "config": {
        "prompt": "Draft a professional response to this {{sentiment}} email:\n\n{{email.body}}",
        "model": "gpt-4",
        "maxTokens": 400,
        "systemMessage": "You are a professional customer support representative. Be helpful and empathetic."
      }
    }
  ]
}
```

---

## 🔗 Variable Interpolation

All OpenAI actions support variable interpolation using `{{variable}}` syntax.

### Trigger Data Variables

Access data from the trigger event:

```typescript
// Discord message trigger
{{message.content}}
{{message.id}}
{{author.username}}
{{author.id}}

// Timer trigger
{{timestamp}}
{{time}}

// Webhook trigger
{{body.field}}
{{query.param}}
```

### Previous Action Outputs

Access outputs from previous actions in the workflow:

```typescript
// From sentiment analysis
{{sentiment}}
{{score}}
{{explanation}}

// From text generation
{{generatedText}}
{{tokensUsed}}

// From translation
{{translatedText}}
{{detectedLanguage}}
```

### Nested Objects

Access nested properties using dot notation:

```typescript
{{user.profile.name}}
{{article.metadata.author}}
{{response.data.items[0]}}
```

---

## ✅ Best Practices

### 1. **Optimize Token Usage**

- Use `gpt-3.5-turbo` for simple tasks (faster, cheaper)
- Reserve `gpt-4` for complex reasoning
- Set appropriate `maxTokens` limits
- Monitor usage via the output's `tokensUsed` field

```json
{
  "model": "gpt-3.5-turbo",  // Good for most tasks
  "maxTokens": 300,          // Reasonable limit
  "temperature": 0.7         // Balanced creativity
}
```

### 2. **Write Clear Prompts**

**❌ Bad:**
```json
{ "prompt": "write email" }
```

**✅ Good:**
```json
{
  "prompt": "Write a professional thank-you email to a client who just completed a purchase. Include appreciation for their business and mention we're here for support.",
  "systemMessage": "You are a professional business communications expert"
}
```

### 3. **Handle Rate Limits**

- OpenAI has rate limits based on your plan
- Implement retry logic for failed requests
- Consider caching repeated requests
- Monitor the `finishReason` in outputs

### 4. **Validate Input Length**

Always check text length before processing:

```typescript
// Summarization minimum: 100 chars
if (text.length < 100) {
  throw new Error('Text too short for summarization');
}

// Translation maximum: 3000 chars
if (text.length > 3000) {
  text = text.substring(0, 3000);
}
```

### 5. **Chain Actions Intelligently**

Leverage outputs from previous actions:

```json
[
  {
    "action": "analyze_sentiment",
    "config": { "text": "{{message}}" }
  },
  {
    "action": "generate_text",
    "config": {
      "prompt": "Respond to this {{sentiment}} message: {{message}}",
      "systemMessage": "Match the tone appropriately"
    }
  }
]
```

### 6. **Use Conditional Execution**

Only run actions when needed:

```json
{
  "action": "generate_text",
  "condition": "{{sentiment}} === 'negative' && {{score}} > 0.8",
  "config": {
    "prompt": "Draft an apology for this complaint: {{message}}"
  }
}
```

---

## 🐛 Troubleshooting

### Error: "OpenAI API key not found"

**Solution:**
1. Verify API key is saved: `SELECT * FROM user_auth_providers WHERE provider = 'openai';`
2. Check the key format in `provider_data`: `{"apiKey": "sk-..."}`
3. Ensure the user is authenticated

### Error: "Rate limit exceeded"

**Solution:**
- Wait and retry (exponential backoff)
- Upgrade your OpenAI plan
- Reduce request frequency
- Cache common requests

### Error: "Invalid response format"

**Solution:**
- The AI sometimes returns malformed JSON
- Enable `includeExplanation: false` to simplify parsing
- Add error handling in your workflow
- Use lower `temperature` for more consistent output

### Action Takes Too Long

**Solution:**
- Reduce `maxTokens`
- Use `gpt-3.5-turbo` instead of `gpt-4`
- Shorten input text
- Check OpenAI API status: [status.openai.com](https://status.openai.com)

### Poor Quality Results

**Solution:**
- Improve your prompt specificity
- Add a detailed `systemMessage`
- Adjust `temperature` (lower = more focused, higher = more creative)
- Use a more powerful model (`gpt-4`)

### Variables Not Replacing

**Solution:**
1. Verify trigger data structure: `console.log(context.triggerData)`
2. Check variable spelling: `{{message.content}}` not `{{message.text}}`
3. Ensure previous actions completed successfully
4. Use correct dot notation for nested objects

---

## 📊 Cost Management

### Token Pricing (as of 2024)

| Model | Input (per 1K tokens) | Output (per 1K tokens) |
|-------|----------------------|------------------------|
| GPT-3.5-turbo | $0.0005 | $0.0015 |
| GPT-4 | $0.03 | $0.06 |
| GPT-4-turbo | $0.01 | $0.03 |

### Cost-Saving Tips

1. **Use GPT-3.5 when possible** - 60x cheaper than GPT-4
2. **Set appropriate token limits** - Don't request 4000 tokens for a summary
3. **Cache results** - Store frequently requested responses
4. **Batch requests** - Combine multiple small tasks
5. **Monitor usage** - Track `tokensUsed` in action outputs

---

## 🔐 Security Considerations

### API Key Security

- ✅ **Store in database encrypted**
- ✅ **Never log API keys**
- ✅ **Use environment variables for server keys**
- ❌ **Never expose keys in frontend**
- ❌ **Don't commit keys to git**

### Content Safety

- Monitor generated content for inappropriate material
- Use OpenAI's moderation API for user-generated prompts
- Implement content filters for sensitive applications
- Log and review AI outputs in production

### Privacy

- Don't send sensitive personal information to OpenAI
- Be aware of data retention policies
- Consider on-premise alternatives for highly sensitive data
- Review OpenAI's privacy policy

---

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Playground](https://platform.openai.com/playground)
- [Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [OpenAI Community Forum](https://community.openai.com)
- [Rate Limits](https://platform.openai.com/docs/guides/rate-limits)

---

## 🆘 Support

Need help? Contact the AREA team:
- 📧 Email: support@area-platform.com
- 💬 Discord: [Join our server](#)
- 📖 Docs: [Full Documentation](#)

---

**Version:** 1.0.0  
**Last Updated:** October 2025  
**Module Status:** ✅ Production Ready
