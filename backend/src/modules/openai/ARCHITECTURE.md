# OpenAI Module Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AREA Platform                            │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Module Registry                             │
│  (Initializes and manages all modules)                          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      OpenAI Module                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  config.ts                                                │  │
│  │  - Module metadata                                        │  │
│  │  - Actions definitions                                    │  │
│  │  - Config schemas                                         │  │
│  │  - Output schemas                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  service.ts (OpenAIModule)                               │  │
│  │  - Extends BaseModule                                     │  │
│  │  - Initializes actions                                    │  │
│  │  - Module lifecycle management                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│           │                                                      │
│           ├──── Registers ─────────────────┐                    │
│           │                                 │                    │
│           ▼                                 ▼                    │
│  ┌─────────────────┐            ┌─────────────────┐            │
│  │ Actions         │            │ OpenAIApiService│            │
│  │                 │            │                 │            │
│  │ • GenerateText  │◄───uses───│ • generateText()│            │
│  │ • AnalyzeSent.. │            │ • analyzeSent...│            │
│  │ • SummarizeText │            │ • summarize...  │            │
│  │ • TranslateText │            │ • translate...  │            │
│  │ • ExtractKeyw.. │            │ • extractKeyw...│            │
│  └─────────────────┘            │ • validateApiKey│            │
│                                  └─────────────────┘            │
│                                           │                      │
│                                           │ HTTP                 │
│                                           ▼                      │
│                                  ┌─────────────────┐            │
│                                  │  OpenAI API     │            │
│                                  │ (platform.ope..│            │
│                                  └─────────────────┘            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  controller.ts (OpenAIController)                        │  │
│  │  - API endpoint handlers                                  │  │
│  │  - User authentication                                    │  │
│  │  - API key management                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  routes.ts                                                │  │
│  │  - GET  /api/openai/status                               │  │
│  │  - POST /api/openai/connect                              │  │
│  │  - POST /api/openai/disconnect                           │  │
│  │  - GET  /api/openai/models                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer                              │
│                                                                  │
│  user_auth_providers table                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ id          | user_id | provider | provider_data         │  │
│  │─────────────┼─────────┼──────────┼──────────────────────│  │
│  │ uuid-1      | user-1  | openai   | {"apiKey":"sk-..."}  │  │
│  │ uuid-2      | user-2  | openai   | {"apiKey":"sk-..."}  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Workflow Execution Flow

```
┌─────────────┐
│   Trigger   │  (e.g., Discord message received)
│   Fired     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│      Workflow Engine                        │
│  - Loads AREA configuration                 │
│  - Validates actions                        │
│  - Prepares execution context               │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Action 1: analyze_sentiment                │
│                                             │
│  1. AnalyzeSentiment.execute() called       │
│  2. Gets user's OpenAI API key from DB      │
│  3. Replaces variables: {{message.content}} │
│  4. Calls OpenAIApiService.analyzeSentiment│
│  5. OpenAI API request sent                 │
│  6. Returns: { sentiment, score, explain.. }│
└──────┬──────────────────────────────────────┘
       │
       │ Output stored in context
       ▼
┌─────────────────────────────────────────────┐
│  Action 2: generate_text                    │
│  (conditional: {{sentiment}} === 'negative')│
│                                             │
│  1. Condition evaluated: true ✓             │
│  2. GenerateText.execute() called           │
│  3. Gets API key from DB                    │
│  4. Replaces variables from:                │
│     - Trigger data: {{message.content}}     │
│     - Previous action: {{sentiment}}        │
│  5. Calls OpenAIApiService.generateText     │
│  6. Returns: { generatedText, tokensUsed.. }│
└──────┬──────────────────────────────────────┘
       │
       │ Output stored in context
       ▼
┌─────────────────────────────────────────────┐
│  Action 3: send_message (Discord)           │
│                                             │
│  1. SendMessage.execute() called            │
│  2. Uses {{generatedText}} from Action 2    │
│  3. Sends message to Discord                │
│  4. Returns: { messageId, timestamp }       │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│  Workflow   │
│  Complete   │
└─────────────┘
```

---

## 📊 Data Flow Diagram

```
User Request
    │
    ▼
┌─────────────────────────────┐
│  POST /api/openai/connect   │
│  { "apiKey": "sk-..." }     │
└───────────┬─────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  OpenAIController.connect()              │
│  1. Validate API key format              │
│  2. Call OpenAIApiService.validateApiKey │
│  3. Store in UserAuthProvider            │
└───────────┬──────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  Database                                │
│  INSERT INTO user_auth_providers (       │
│    user_id: 'user-123',                  │
│    provider: 'openai',                   │
│    provider_data: {"apiKey": "sk-..."}   │
│  )                                       │
└───────────┬──────────────────────────────┘
            │
            ▼
      ✅ Success Response


Later: Action Execution
    │
    ▼
┌─────────────────────────────┐
│  Action: analyze_sentiment  │
│  config: {                  │
│    text: "{{message}}"      │
│  }                          │
└───────────┬─────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  AnalyzeSentiment.execute()              │
│  1. Get context (trigger data, user)     │
│  2. Replace variables                    │
│  3. Fetch API key from DB                │
└───────────┬──────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  UserAuthProvider.findByUserAndProvider  │
│  (user-123, 'openai')                    │
│  Returns: { provider_data: {...} }       │
└───────────┬──────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  OpenAIApiService.analyzeSentiment()     │
│  - Constructs prompt                     │
│  - Calls OpenAI API                      │
│  - Parses JSON response                  │
└───────────┬──────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  OpenAI API                              │
│  POST /v1/chat/completions               │
│  Authorization: Bearer sk-...            │
└───────────┬──────────────────────────────┘
            │
            ▼
    ✅ Response: { sentiment: "positive", ... }
            │
            ▼
┌──────────────────────────────────────────┐
│  Return to Workflow Engine               │
│  Output stored in context                │
│  Next action can access via:             │
│    {{sentiment}}                         │
│    {{score}}                             │
│    {{explanation}}                       │
└──────────────────────────────────────────┘
```

---

## 🗂️ Class Hierarchy

```
BaseModule (Abstract)
    │
    └─── OpenAIModule
            │
            ├─── Registers Actions:
            │       │
            │       ├─── BaseAction (Abstract)
            │       │       │
            │       │       ├─── GenerateText
            │       │       ├─── AnalyzeSentiment
            │       │       ├─── SummarizeText
            │       │       ├─── TranslateText
            │       │       └─── ExtractKeywords
            │       │
            │       └─── Each Action:
            │               ├─── getName()
            │               ├─── getConfigSchema()
            │               ├─── getOutputSchema()
            │               ├─── validate(config)
            │               └─── execute(config, context)
            │
            └─── Uses:
                    │
                    └─── OpenAIApiService (Singleton)
                            ├─── generateText()
                            ├─── analyzeSentiment()
                            ├─── summarizeText()
                            ├─── translateText()
                            └─── extractKeywords()
```

---

## 🔐 Authentication Flow

```
┌──────────────────────┐
│   User               │
│   (Frontend/Client)  │
└──────┬───────────────┘
       │ 1. Login to AREA
       ▼
┌──────────────────────┐
│   JWT Token          │
│   (Authorization)    │
└──────┬───────────────┘
       │ 2. POST /api/openai/connect
       ▼               with JWT + API key
┌──────────────────────────────────┐
│   requireAuth Middleware         │
│   - Validates JWT                │
│   - Extracts user ID             │
│   - Attaches to req.user         │
└──────┬───────────────────────────┘
       │ 3. Authenticated
       ▼
┌──────────────────────────────────┐
│   OpenAIController.connect()     │
│   - Validates API key format     │
│   - Tests key with OpenAI        │
│   - Stores in database           │
└──────┬───────────────────────────┘
       │ 4. Stored
       ▼
┌──────────────────────────────────┐
│   Database                       │
│   user_auth_providers            │
│   (user_id, provider, api_key)   │
└──────────────────────────────────┘

Later: Action Execution
┌──────────────────────┐
│   Workflow Triggered │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────┐
│   Action.execute(config, context)│
│   context.userId = "user-123"    │
└──────┬───────────────────────────┘
       │ 5. Fetch API key
       ▼
┌──────────────────────────────────┐
│   UserAuthProvider               │
│   .findByUserAndProvider(        │
│      user-123, 'openai'          │
│   )                              │
└──────┬───────────────────────────┘
       │ 6. Returns API key
       ▼
┌──────────────────────────────────┐
│   OpenAIApiService               │
│   Uses API key for request       │
└──────────────────────────────────┘
```

---

## 📦 Module Loading Sequence

```
1. Server Startup
   ├─ Load environment variables
   ├─ Connect to database
   └─ Initialize modules

2. Module Registry
   ├─ Import openaiModule
   ├─ Call openaiModule.initialize()
   │
   └─ OpenAIModule.initialize()
       ├─ Log: "Initializing OpenAI module..."
       ├─ Register GenerateText action
       ├─ Register AnalyzeSentiment action
       ├─ Register SummarizeText action
       ├─ Register TranslateText action
       ├─ Register ExtractKeywords action
       └─ Log: "✓ Module initialized successfully"

3. Express Router
   ├─ Import openai routes
   ├─ Mount at /api/openai
   └─ Routes available:
       ├─ GET  /api/openai/status
       ├─ POST /api/openai/connect
       ├─ POST /api/openai/disconnect
       └─ GET  /api/openai/models

4. Ready to Accept Requests ✅
```

---

## 🎯 Key Design Patterns

### 1. Singleton Pattern
```typescript
// OpenAIApiService uses singleton
private static instance: OpenAIApiService;

public static getInstance(): OpenAIApiService {
    if (!OpenAIApiService.instance) {
        OpenAIApiService.instance = new OpenAIApiService();
    }
    return OpenAIApiService.instance;
}
```

### 2. Template Method Pattern
```typescript
// BaseAction defines the structure
abstract class BaseAction {
    abstract getName(): string;
    abstract execute(config, context): Promise<Result>;
    
    // Template method
    public async run(config, context) {
        await this.onBeforeExecute();
        const result = await this.execute();
        await this.onAfterExecute();
        return result;
    }
}
```

### 3. Strategy Pattern
```typescript
// Different strategies for each action
class GenerateText extends BaseAction { ... }
class AnalyzeSentiment extends BaseAction { ... }
class TranslateText extends BaseAction { ... }

// Selected at runtime based on config
const action = module.getAction(config.actionName);
await action.execute(config, context);
```

---

This visual guide helps you understand the complete architecture of the OpenAI module! 🎨
