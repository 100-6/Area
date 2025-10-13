# OpenAI Module - Output Schemas

This documentation describes the output data returned by each action in the OpenAI module.

## 📤 Actions - Output Data

### GenerateText

**Action Name:** `generate_text`

**Description:** Generates text content using GPT models based on a provided prompt.

**Output Data:**

```typescript
{
  generatedText: string;    // The AI-generated text content
  tokensUsed: number;       // Total number of tokens consumed (input + output)
  model: string;            // The GPT model used (e.g., 'gpt-3.5-turbo', 'gpt-4')
  finishReason: string;     // Why generation stopped: 'stop' (natural end), 'length' (max tokens), 'content_filter'
}
```

**Usage in Subsequent Actions:**

```typescript
// In Discord SendMessage
content: "AI Response: {{generatedText}}"

// In Email action
body: "{{generatedText}}\n\nGenerated using {{model}} ({{tokensUsed}} tokens)"

// Conditional execution based on completion
condition: "{{finishReason}} === 'stop'"
```

**Example Output:**

```json
{
  "generatedText": "Dear valued customer,\n\nThank you for your recent purchase...",
  "tokensUsed": 156,
  "model": "gpt-3.5-turbo",
  "finishReason": "stop"
}
```

---

### AnalyzeSentiment

**Action Name:** `analyze_sentiment`

**Description:** Analyzes the emotional tone of text and classifies it as positive, negative, or neutral.

**Output Data:**

```typescript
{
  sentiment: 'positive' | 'negative' | 'neutral';  // Detected sentiment classification
  score: number;                                   // Confidence score between 0 and 1
  explanation?: string;                            // Brief explanation (if includeExplanation: true)
}
```

**Usage in Subsequent Actions:**

```typescript
// Conditional response based on sentiment
condition: "{{sentiment}} === 'negative' && {{score}} > 0.8"

// In notification
content: "Alert: {{sentiment}} sentiment detected (confidence: {{score}})"

// Use explanation in response
message: "Analysis: {{explanation}}"
```

**Example Output:**

```json
{
  "sentiment": "negative",
  "score": 0.87,
  "explanation": "The text expresses frustration and disappointment with multiple negative phrases like 'terrible experience' and 'waste of time'."
}
```

**Workflow Examples:**

```json
// Auto-escalate negative feedback
{
  "actions": [
    {
      "action": "analyze_sentiment",
      "config": { "text": "{{review.content}}" }
    },
    {
      "action": "send_alert",
      "condition": "{{sentiment}} === 'negative' && {{score}} > 0.75",
      "config": {
        "message": "⚠️ Negative review detected ({{score}} confidence)"
      }
    }
  ]
}
```

---

### SummarizeText

**Action Name:** `summarize_text`

**Description:** Creates a concise summary of longer text content.

**Output Data:**

```typescript
{
  summary: string;           // The generated summary text
  originalLength: number;    // Character count of original text
  summaryLength: number;     // Character count of summary
  compressionRatio: number;  // Ratio of summary/original length (0-1)
}
```

**Usage in Subsequent Actions:**

```typescript
// Use summary in message
content: "TL;DR: {{summary}}"

// Show compression stats
stats: "Compressed {{originalLength}} chars to {{summaryLength}} ({{compressionRatio}}% of original)"

// Chain with translation
translateText: "{{summary}}"
```

**Example Output:**

```json
{
  "summary": "The article discusses the benefits of AI automation in business:\n• Increased efficiency\n• Cost savings\n• Better decision making",
  "originalLength": 2847,
  "summaryLength": 142,
  "compressionRatio": 0.05
}
```

**Workflow Examples:**

```json
// Article digest workflow
{
  "actions": [
    {
      "action": "summarize_text",
      "config": {
        "text": "{{article.content}}",
        "length": "short",
        "bulletPoints": true
      }
    },
    {
      "action": "send_email",
      "config": {
        "subject": "Daily Digest",
        "body": "Summary ({{compressionRatio}}x compression):\n\n{{summary}}"
      }
    }
  ]
}
```

---

### TranslateText

**Action Name:** `translate_text`

**Description:** Translates text between languages using AI-powered translation.

**Output Data:**

```typescript
{
  translatedText: string;     // The translated text
  detectedLanguage: string;   // Detected source language (or specified source)
  targetLanguage: string;     // Target language used for translation
}
```

**Usage in Subsequent Actions:**

```typescript
// Use translation in message
content: "{{translatedText}}"

// Show language info
info: "Translated from {{detectedLanguage}} to {{targetLanguage}}"

// Multi-language broadcast
languages: ["french", "german", "spanish"]
```

**Example Output:**

```json
{
  "translatedText": "Bonjour, comment allez-vous aujourd'hui ?",
  "detectedLanguage": "english",
  "targetLanguage": "french"
}
```

**Workflow Examples:**

```json
// Multi-language support workflow
{
  "actions": [
    {
      "action": "translate_text",
      "config": {
        "text": "{{message.content}}",
        "targetLanguage": "french",
        "sourceLanguage": "auto"
      }
    },
    {
      "action": "send_message",
      "config": {
        "channelId": "french-channel-id",
        "content": "🇫🇷 {{translatedText}}\n\n(Original: {{detectedLanguage}})"
      }
    }
  ]
}
```

---

### ExtractKeywords

**Action Name:** `extract_keywords`

**Description:** Extracts key topics and keywords from text for analysis and categorization.

**Output Data:**

```typescript
{
  keywords: string[];      // Array of extracted keywords
  topics: string[];        // Array of main topics identified
  keywordCount: number;    // Total number of keywords extracted
}
```

**Usage in Subsequent Actions:**

```typescript
// Use keywords for tagging
tags: "{{keywords}}"

// Display topics
summary: "Main topics: {{topics}}"

// Conditional based on keyword count
condition: "{{keywordCount}} > 5"

// Join keywords for display
allKeywords: "{{keywords.join(', ')}}"
```

**Example Output:**

```json
{
  "keywords": [
    "artificial intelligence",
    "machine learning",
    "automation",
    "productivity",
    "business efficiency",
    "cost reduction"
  ],
  "topics": [
    "AI Technology",
    "Business Automation",
    "Productivity Tools"
  ],
  "keywordCount": 6
}
```

**Workflow Examples:**

```json
// Content categorization workflow
{
  "actions": [
    {
      "action": "extract_keywords",
      "config": {
        "text": "{{article.content}}",
        "maxKeywords": 10
      }
    },
    {
      "action": "categorize_article",
      "config": {
        "keywords": "{{keywords}}",
        "topics": "{{topics}}"
      }
    },
    {
      "action": "send_notification",
      "config": {
        "message": "New article tagged with: {{keywords.slice(0, 3).join(', ')}}"
      }
    }
  ]
}
```

---

## 🔗 Action Chaining Examples

### Example 1: Sentiment → Response Generation

**Workflow:** Analyze sentiment, then generate appropriate response.

```json
{
  "trigger": {
    "module": "discord",
    "action": "on_message_created",
    "config": { "channelId": "123" }
  },
  "actions": [
    {
      "id": "sentiment_check",
      "module": "openai",
      "action": "analyze_sentiment",
      "config": {
        "text": "{{message.content}}",
        "includeExplanation": true
      }
    },
    {
      "id": "generate_response",
      "module": "openai",
      "action": "generate_text",
      "config": {
        "prompt": "Write a {{sentiment_check.sentiment}} and empathetic response to: {{message.content}}",
        "systemMessage": "Match the tone appropriately"
      }
    },
    {
      "module": "discord",
      "action": "send_message",
      "config": {
        "channelId": "123",
        "content": "{{generate_response.generatedText}}"
      }
    }
  ]
}
```

**Data Flow:**
```
message.content → analyze_sentiment → sentiment: "negative", score: 0.85
                     ↓
           generate_text (uses sentiment) → generatedText: "I'm sorry to hear..."
                     ↓
           send_message (uses generatedText)
```

---

### Example 2: Summarize → Translate → Distribute

**Workflow:** Summarize article, translate to multiple languages, send to channels.

```json
{
  "actions": [
    {
      "id": "summarize",
      "module": "openai",
      "action": "summarize_text",
      "config": {
        "text": "{{article.content}}",
        "length": "medium",
        "bulletPoints": true
      }
    },
    {
      "id": "translate_fr",
      "module": "openai",
      "action": "translate_text",
      "config": {
        "text": "{{summarize.summary}}",
        "targetLanguage": "french"
      }
    },
    {
      "id": "translate_es",
      "module": "openai",
      "action": "translate_text",
      "config": {
        "text": "{{summarize.summary}}",
        "targetLanguage": "spanish"
      }
    },
    {
      "module": "discord",
      "action": "send_message",
      "config": {
        "channelId": "french-channel",
        "content": "📰 Summary:\n{{translate_fr.translatedText}}"
      }
    },
    {
      "module": "discord",
      "action": "send_message",
      "config": {
        "channelId": "spanish-channel",
        "content": "📰 Resumen:\n{{translate_es.translatedText}}"
      }
    }
  ]
}
```

---

### Example 3: Extract Keywords → Generate Content

**Workflow:** Extract keywords from source, generate new content based on topics.

```json
{
  "actions": [
    {
      "id": "extract",
      "module": "openai",
      "action": "extract_keywords",
      "config": {
        "text": "{{source.content}}",
        "maxKeywords": 15
      }
    },
    {
      "id": "generate",
      "module": "openai",
      "action": "generate_text",
      "config": {
        "prompt": "Write a tweet about these topics: {{extract.topics.join(', ')}}. Keywords: {{extract.keywords.slice(0, 5).join(', ')}}",
        "maxTokens": 280
      }
    },
    {
      "module": "twitter",
      "action": "post_tweet",
      "config": {
        "text": "{{generate.generatedText}}"
      }
    }
  ]
}
```

---

## 💡 Advanced Usage Patterns

### Conditional Execution Based on Outputs

```json
{
  "actions": [
    {
      "id": "sentiment",
      "action": "analyze_sentiment",
      "config": { "text": "{{input}}" }
    },
    {
      "action": "send_alert",
      "condition": "{{sentiment.sentiment}} === 'negative' && {{sentiment.score}} > 0.8",
      "config": { "message": "Urgent: High-confidence negative feedback" }
    },
    {
      "action": "generate_text",
      "condition": "{{sentiment.sentiment}} === 'positive'",
      "config": { "prompt": "Write a thank you message" }
    }
  ]
}
```

### Accessing Array Elements

```json
{
  "actions": [
    {
      "id": "keywords",
      "action": "extract_keywords",
      "config": { "text": "{{article}}" }
    },
    {
      "action": "log",
      "config": {
        "first_keyword": "{{keywords.keywords[0]}}",
        "second_keyword": "{{keywords.keywords[1]}}",
        "all_topics": "{{keywords.topics.join(' | ')}}"
      }
    }
  ]
}
```

### Error Handling

```json
{
  "actions": [
    {
      "id": "gen",
      "action": "generate_text",
      "config": { "prompt": "..." }
    },
    {
      "action": "send_notification",
      "condition": "{{gen.finishReason}} === 'length'",
      "config": {
        "message": "⚠️ Generation truncated due to token limit"
      }
    }
  ]
}
```

---

## 📊 Output Schema Reference

### Common Fields

All actions include these fields in their results:

```typescript
{
  success: boolean;         // Whether action executed successfully
  executionTime: number;    // Execution time in milliseconds
  error?: string;          // Error message if success = false
  data: {                  // Action-specific output data
    // ... action outputs
  }
}
```

### Token Usage Tracking

Only `generate_text` returns token usage:

```json
{
  "tokensUsed": 156,
  "model": "gpt-3.5-turbo"
}
```

**Cost Calculation:**
```javascript
// GPT-3.5-turbo pricing
const inputCost = (tokensUsed * 0.5) / 1000000;   // $0.50 per 1M tokens
const outputCost = (tokensUsed * 1.50) / 1000000; // $1.50 per 1M tokens
```

---

## 🔍 Debugging Output Data

### View Raw Output

```bash
# Check workflow execution logs
docker logs area-backend | grep OpenAI

# Expected log format:
# [GenerateText] ✓ Text generated successfully (156 tokens)
# [AnalyzeSentiment] ✓ Sentiment: negative (0.87)
# [SummarizeText] ✓ Summary created (5% compression)
```

### Test Actions Individually

Use the `/test-action` endpoint:

```bash
curl -X POST http://localhost:8080/api/test-action \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "openai",
    "action": "analyze_sentiment",
    "config": {
      "text": "This is amazing!"
    }
  }'
```

---

## 📚 See Also

- [OpenAI Module Guide](./OPENAI_MODULE_GUIDE.md) - Complete usage guide
- [BaseAction.ts](../_base/BaseAction.ts) - Action interface
- [Workflow Engine](../../workflow-engine/) - Execution engine

---

**Last Updated:** October 2025  
**Module Version:** 1.0.0
