# OpenAI Model Compatibility Guide

This guide explains the different OpenAI models available and their compatibility requirements.

## Model Categories

### 🚀 Flagship Models (GPT-5 Series)
The latest and most advanced models from OpenAI.

| Model | Description | Cost (per 1M tokens) | Special Requirements |
|-------|-------------|---------------------|---------------------|
| `gpt-5-pro` | Smartest and most precise | Input: $15.00, Output: $120.00 | Uses `max_completion_tokens` |
| `gpt-5` | Best for coding and agentic tasks | Input: $1.25, Output: $10.00 | Uses `max_completion_tokens` |
| `gpt-5-mini` | Faster, cheaper version | Input: $0.25, Output: $2.00 | Uses `max_completion_tokens` |
| `gpt-5-nano` | Fastest for classification | Input: $0.05, Output: $0.40 | Uses `max_completion_tokens` |

**Key Differences:**
- ❌ **Does NOT support** custom `temperature` (only default value 1)
- ✅ Supports `system` messages
- ⚠️ Uses `max_completion_tokens` instead of `max_tokens`

---

### 🔧 Advanced Models (GPT-4.1 Series)
Enhanced GPT-4 models with fine-tuning capabilities.

| Model | Description | Cost (per 1M tokens) |
|-------|-------------|---------------------|
| `gpt-4.1` | Advanced with fine-tuning support | Input: $3.00, Output: $12.00 |
| `gpt-4.1-mini` | Smaller, faster variant | Input: $0.80, Output: $3.20 |
| `gpt-4.1-nano` | Most efficient variant | Input: $0.20, Output: $0.80 |

**Key Features:**
- ✅ Supports all standard parameters
- ✅ Fine-tuning available
- ✅ Uses standard `max_tokens`

---

### 🎯 Standard Models (GPT-4o Series)
Reliable, multimodal models for production use.

| Model | Description | Cost (per 1M tokens) |
|-------|-------------|---------------------|
| `gpt-4o` | Multimodal flagship | Input: $2.50, Output: $10.00 |
| `gpt-4o-mini` | Fast, lightweight (default) | Input: $0.15, Output: $0.60 |

**Key Features:**
- ✅ Supports all standard parameters
- ✅ Multimodal capabilities
- ✅ Best price-performance ratio
- ✅ Uses standard `max_tokens`

---

### 🧠 Reasoning Models (o-series)
Advanced reasoning models for complex, multi-step problems.

| Model | Description | Cost (per 1M tokens) |
|-------|-------------|---------------------|
| `o1-preview` | Advanced reasoning | Input: $15.00, Output: $60.00 |
| `o1-mini` | Faster reasoning for STEM | Input: $3.00, Output: $12.00 |
| `o4-mini` | Latest reasoning model | Input: $4.00, Output: $16.00 |

**⚠️ Important Restrictions:**
- ❌ **Does NOT support** `temperature` parameter
- ❌ **Does NOT support** `system` messages
- ⚠️ Uses `max_completion_tokens` instead of `max_tokens`
- 🎯 Best for: Complex reasoning, math, coding challenges, multi-step problems

---

### 📦 Legacy Models
Older models for compatibility.

| Model | Description | Cost (per 1M tokens) |
|-------|-------------|---------------------|
| `gpt-4-turbo` | Faster GPT-4 | Input: $10.00, Output: $30.00 |
| `gpt-4` | Original GPT-4 | Input: $30.00, Output: $60.00 |

---

## Parameter Compatibility Matrix

| Parameter | GPT-5 | GPT-4.1 | GPT-4o | o-series | Legacy |
|-----------|-------|---------|--------|----------|--------|
| `temperature` | ❌ | ✅ | ✅ | ❌ | ✅ |
| `system message` | ✅ | ✅ | ✅ | ❌ | ✅ |
| `max_tokens` | ❌ | ✅ | ✅ | ❌ | ✅ |
| `max_completion_tokens` | ✅ | ❌ | ❌ | ✅ | ❌ |

---

## How Our Implementation Handles This

The `OpenAIApiService` automatically detects the model type and adjusts parameters accordingly:

```typescript
// Automatic detection
private isReasoningModel(model: string): boolean {
    return model.startsWith('o1-') || model.startsWith('o3-') || model.startsWith('o4-');
}

private usesCompletionTokens(model: string): boolean {
    return model.startsWith('gpt-5') || this.isReasoningModel(model);
}

private supportsTemperature(model: string): boolean {
    return !this.isReasoningModel(model) && !model.startsWith('gpt-5');
}

private supportsSystemMessage(model: string): boolean {
    return !this.isReasoningModel(model);
}
```

### What This Means for You

**You don't need to worry about compatibility!** Just configure your action with any parameters, and the system will:

1. ✅ Use `max_completion_tokens` for GPT-5 and o-series models
2. ✅ Use `max_tokens` for other models
3. ✅ Ignore `temperature` for GPT-5 and o-series models
4. ✅ Ignore `system` messages for o-series models

---

## Example Configurations

### Using GPT-5 (Flagship)
```json
{
  "apiKey": "sk-...",
  "prompt": "Write a Python function to calculate fibonacci",
  "model": "gpt-5",
  "maxTokens": 1000,
  "systemMessage": "You are a coding expert"
}
```
✅ Works! Uses `max_completion_tokens` internally.
⚠️ Note: `temperature` is not supported by GPT-5 (uses default value 1).

### Using o1-preview (Reasoning)
```json
{
  "apiKey": "sk-...",
  "prompt": "Solve this complex math problem: ...",
  "model": "o1-preview",
  "maxTokens": 2000
}
```
✅ Works! `temperature` and `systemMessage` are automatically ignored.
⚠️ Even if you set them, they won't cause errors—just won't be used.

### Using GPT-4o-mini (Standard - Default)
```json
{
  "apiKey": "sk-...",
  "prompt": "Summarize this text",
  "model": "gpt-4o-mini",
  "maxTokens": 500,
  "temperature": 0.5,
  "systemMessage": "You are a helpful assistant"
}
```
✅ All parameters work. Best price-performance ratio.

---

## Model Selection Guide

### Choose **GPT-5** when:
- You need the best performance
- Working on complex agentic tasks
- Coding assistance at the highest level
- Budget allows premium models
- **Note:** Cannot control creativity (temperature=1 fixed)

### Choose **GPT-4o-mini** when:
- General purpose tasks
- Good balance of cost and performance
- Default choice for most use cases
- Fast responses needed
- Need temperature control for creativity

### Choose **o-series** when:
- Complex reasoning required
- Multi-step mathematical problems
- Advanced coding challenges
- Deep analysis needed
- Don't need creative variations (no temperature)
- Don't need system messages

### Choose **GPT-4.1** when:
- Need fine-tuning capabilities
- Specific domain customization
- Between standard and flagship performance

---

## Cost Optimization Tips

1. **Start with `gpt-4o-mini`** - Best price-performance for most tasks
2. **Use `gpt-5-nano`** - For simple classification/summarization at lowest cost
3. **Reserve `gpt-5-pro`** - Only for mission-critical, complex tasks
4. **Use o-series** - For reasoning tasks that don't need multiple variations

---

## Token Limits

All modern models support up to **128,000 tokens** context window, except:
- `gpt-4` (legacy): 8,192 tokens

Our configuration allows up to **16,000 tokens** for `maxTokens` to be safe across all models.

---

## Need Help?

- Check the [OpenAI API Documentation](https://platform.openai.com/docs/models)
- See pricing at [OpenAI Pricing Page](https://openai.com/api/pricing/)
- Review our [OPENAI_MODULE_GUIDE.md](./OPENAI_MODULE_GUIDE.md)
