# Contribution Guide - AREA

This guide details how to extend the AREA platform functionalities by adding new services, triggers (actions), and reactions.

## Table of Contents

- [Module System Architecture](#module-system-architecture)
- [Adding a New Service](#adding-a-new-service)
- [Adding a New Trigger](#adding-a-new-trigger)
- [Adding a New Action (Reaction)](#adding-a-new-action-reaction)
- [Dynamic Schema System](#dynamic-schema-system)
- [OAuth2 Authentication](#oauth2-authentication)
- [Testing and Validation](#testing-and-validation)
- [Best Practices](#best-practices)

---

## Module System Architecture

### Basic Principle

AREA uses a **plugin-based architecture** where each external service (Discord, GitHub, Gmail, etc.) is encapsulated in an **autonomous module**.

Each module can provide:
- **Triggers**: Detect events (e.g., new Discord message)
- **Actions**: Perform operations (e.g., send an email)

### Base Classes

Three abstract classes form the foundation of the system:

#### 1. BaseModule

**File**: `backend/src/modules/_base/BaseModule.ts`

```typescript
export abstract class BaseModule {
  abstract name: string;              // Unique identifier (e.g., "discord")
  abstract displayName: string;       // Display name (e.g., "Discord")
  abstract description: string;
  abstract iconUrl: string;
  abstract color: string;
  abstract authType: AuthType;        // 'oauth2' | 'api_key' | 'none' | 'bot_token'
  abstract isActive: boolean;

  abstract getTriggers(): BaseTrigger[];
  abstract getActions(): BaseAction[];

  // Lifecycle hooks
  async initialize(): Promise<void> {}
  async cleanup(): Promise<void> {}
}
```

#### 2. BaseTrigger

**File**: `backend/src/modules/_base/BaseTrigger.ts`

```typescript
export abstract class BaseTrigger {
  abstract name: string;              // Identifier (e.g., "on_message_created")
  abstract description: string;
  abstract configSchema: ConfigSchema; // Required configuration
  abstract outputSchema: OutputSchema; // Emitted data

  // Start monitoring for a specific workflow
  abstract start(areaId: string, config: any): Promise<void>;

  // Stop monitoring
  abstract stop(areaId: string): Promise<void>;

  // Emit a trigger event
  protected emitTrigger(payload: TriggerPayload): void {
    this.eventBus.emit('trigger.fired', {
      areaId: payload.areaId,
      triggerName: this.name,
      data: payload.data,
      timestamp: Date.now()
    });
  }
}
```

#### 3. BaseAction

**File**: `backend/src/modules/_base/BaseAction.ts`

```typescript
export abstract class BaseAction {
  abstract name: string;              // Identifier (e.g., "send_message")
  abstract description: string;
  abstract configSchema: ConfigSchema; // Required configuration
  abstract outputSchema: OutputSchema; // Returned data

  // Execute the action
  abstract execute(config: any, context: ActionContext): Promise<ActionResult>;

  // Context contains:
  // - areaId: Workflow ID
  // - userId: User ID
  // - triggerData: Trigger data
  // - previousOutputs: Outputs from previous nodes
}
```

---

## Adding a New Service

### Step 1: Create the module structure

Create a new folder in `backend/src/modules/`:

```bash
mkdir backend/src/modules/your-service
cd backend/src/modules/your-service
```

### Step 2: Create the service configuration file

**File**: `backend/src/modules/your-service/service.ts`

```typescript
import { BaseModule } from '../_base/BaseModule';
import { BaseTrigger } from '../_base/BaseTrigger';
import { BaseAction } from '../_base/BaseAction';
import { AuthType } from '../_base/types';

// Import your triggers
import { OnNewItem } from './triggers/OnNewItem';

// Import your actions
import { CreateItem } from './actions/CreateItem';

export class YourServiceModule extends BaseModule {
  name = 'your-service';
  displayName = 'Your Service';
  description = 'Your service description';
  iconUrl = 'https://example.com/icon.png';
  color = '#FF5733'; // Brand color
  authType: AuthType = 'oauth2'; // or 'api_key', 'none', 'bot_token'
  isActive = true;

  // OAuth configuration (if applicable)
  oauthConfig = {
    clientId: process.env.YOUR_SERVICE_CLIENT_ID,
    clientSecret: process.env.YOUR_SERVICE_CLIENT_SECRET,
    redirectUri: process.env.YOUR_SERVICE_REDIRECT_URI,
    scopes: ['read', 'write'], // Required scopes
    authorizationUrl: 'https://api.your-service.com/oauth/authorize',
    tokenUrl: 'https://api.your-service.com/oauth/token'
  };

  private triggers: BaseTrigger[];
  private actions: BaseAction[];

  constructor() {
    super();

    // Initialize triggers
    this.triggers = [
      new OnNewItem(this.eventBus)
    ];

    // Initialize actions
    this.actions = [
      new CreateItem(this.connectionManager)
    ];
  }

  getTriggers(): BaseTrigger[] {
    return this.triggers;
  }

  getActions(): BaseAction[] {
    return this.actions;
  }

  async initialize(): Promise<void> {
    console.log(`Module ${this.displayName} initialized`);
    // Specific initialization (WebSocket connection, etc.)
  }

  async cleanup(): Promise<void> {
    console.log(`Module ${this.displayName} cleaned up`);
    // Cleanup (close connections, etc.)
  }
}
```

### Step 3: Register the module

**File**: `backend/src/modules/registry.ts`

Add your module to the list:

```typescript
import { YourServiceModule } from './your-service/service';

export class ModuleRegistry {
  private modules: Map<string, BaseModule> = new Map();

  constructor() {
    // Existing modules...
    this.registerModule(new DiscordModule());
    this.registerModule(new GitHubModule());

    // Add your module
    this.registerModule(new YourServiceModule());
  }
}
```

### Step 4: Add environment variables

**File**: `.env.example`

```env
# Your Service
YOUR_SERVICE_CLIENT_ID=
YOUR_SERVICE_CLIENT_SECRET=
YOUR_SERVICE_REDIRECT_URI=http://localhost:8080/api/auth/your-service/callback
YOUR_SERVICE_API_KEY=  # If using API Key instead of OAuth
```

**File**: `docker-compose.yml`

Add variables in backend-dev and backend-prod services:

```yaml
environment:
  - YOUR_SERVICE_CLIENT_ID=${YOUR_SERVICE_CLIENT_ID}
  - YOUR_SERVICE_CLIENT_SECRET=${YOUR_SERVICE_CLIENT_SECRET}
  - YOUR_SERVICE_REDIRECT_URI=${YOUR_SERVICE_REDIRECT_URI}
```

---

## Adding a New Trigger

### Example: Polling trigger (periodic verification)

**File**: `backend/src/modules/your-service/triggers/OnNewItem.ts`

```typescript
import { BaseTrigger } from '../../_base/BaseTrigger';
import { ConfigSchema, OutputSchema, TriggerType } from '../../_base/types';
import axios from 'axios';

export class OnNewItem extends BaseTrigger {
  name = 'on_new_item';
  description = 'Triggers when a new item is created';
  triggerType: TriggerType = 'polling'; // or 'webhook', 'schedule'

  // Required user configuration
  configSchema: ConfigSchema = {
    fields: [
      {
        key: 'category',
        type: 'text',
        label: 'Category',
        hint: 'The category to monitor',
        required: true,
        default: ''
      },
      {
        key: 'pollingInterval',
        type: 'number',
        label: 'Check interval (seconds)',
        hint: 'Verification frequency',
        required: false,
        default: 60,
        min: 30,
        max: 3600
      }
    ]
  };

  // Data emitted when trigger fires
  outputSchema: OutputSchema = {
    item: {
      type: 'object',
      description: 'The created item',
      properties: {
        id: { type: 'string', description: 'Item ID' },
        title: { type: 'string', description: 'Title' },
        createdAt: { type: 'string', description: 'Creation date' }
      }
    }
  };

  // Map to store each workflow's state
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private lastCheckedItems: Map<string, Set<string>> = new Map();

  async start(areaId: string, config: any): Promise<void> {
    const interval = (config.pollingInterval || 60) * 1000;

    // Initialize state
    this.lastCheckedItems.set(areaId, new Set());

    // Start polling
    const timer = setInterval(async () => {
      try {
        await this.checkForNewItems(areaId, config);
      } catch (error) {
        console.error(`Error checking new items for area ${areaId}:`, error);
      }
    }, interval);

    this.pollingIntervals.set(areaId, timer);
    console.log(`Started polling for area ${areaId} every ${interval}ms`);
  }

  async stop(areaId: string): Promise<void> {
    // Stop polling
    const timer = this.pollingIntervals.get(areaId);
    if (timer) {
      clearInterval(timer);
      this.pollingIntervals.delete(areaId);
    }

    // Clean up state
    this.lastCheckedItems.delete(areaId);
    console.log(`Stopped polling for area ${areaId}`);
  }

  private async checkForNewItems(areaId: string, config: any): Promise<void> {
    // Get user's OAuth token
    const connection = await this.connectionManager.getConnection(areaId, 'your-service');
    if (!connection) {
      console.error(`No connection found for area ${areaId}`);
      return;
    }

    // Call the service API
    const response = await axios.get('https://api.your-service.com/items', {
      headers: {
        Authorization: `Bearer ${connection.accessToken}`
      },
      params: {
        category: config.category,
        since: new Date(Date.now() - 5 * 60 * 1000).toISOString() // Last 5 minutes
      }
    });

    const items = response.data.items || [];
    const previousItems = this.lastCheckedItems.get(areaId) || new Set();

    // Detect new items
    for (const item of items) {
      if (!previousItems.has(item.id)) {
        // New item detected!
        this.emitTrigger({
          areaId,
          data: {
            item: {
              id: item.id,
              title: item.title,
              createdAt: item.createdAt
            }
          }
        });

        previousItems.add(item.id);
      }
    }

    // Update state
    this.lastCheckedItems.set(areaId, previousItems);
  }
}
```

### Example: Webhook trigger (real-time)

**File**: `backend/src/modules/your-service/triggers/OnWebhookEvent.ts`

```typescript
import { BaseTrigger } from '../../_base/BaseTrigger';

export class OnWebhookEvent extends BaseTrigger {
  name = 'on_webhook_event';
  description = 'Triggers on webhook event';
  triggerType = 'webhook';

  configSchema: ConfigSchema = {
    fields: [
      {
        key: 'eventType',
        type: 'dropdown',
        label: 'Event type',
        required: true,
        options: ['item.created', 'item.updated', 'item.deleted']
      }
    ]
  };

  outputSchema: OutputSchema = {
    event: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        data: { type: 'object' }
      }
    }
  };

  async start(areaId: string, config: any): Promise<void> {
    // Subscribe to webhooks via EventBus
    this.eventBus.on(`webhook.your-service.${config.eventType}`, (payload) => {
      // Filter by areaId if necessary
      this.emitTrigger({
        areaId,
        data: {
          event: payload
        }
      });
    });
  }

  async stop(areaId: string): Promise<void> {
    // Unsubscribe
    this.eventBus.off(`webhook.your-service.*`);
  }
}
```

**Webhook route**: `backend/src/modules/your-service/routes.ts`

```typescript
import express from 'express';

export const router = express.Router();

// Endpoint to receive webhooks
router.post('/webhook', async (req, res) => {
  const { type, data } = req.body;

  // Validate webhook (signature, etc.)
  // ...

  // Emit event
  eventBus.emit(`webhook.your-service.${type}`, data);

  res.status(200).json({ received: true });
});
```

### Example: Schedule trigger (scheduled)

**File**: `backend/src/modules/timer/triggers/DailyAtTime.ts`

```typescript
import { BaseTrigger } from '../../_base/BaseTrigger';
import { CronScheduler } from '../../../workflow-engine/scheduler/CronScheduler';

export class DailyAtTime extends BaseTrigger {
  name = 'daily_at_time';
  description = 'Triggers every day at a specific time';
  triggerType = 'schedule';

  configSchema: ConfigSchema = {
    fields: [
      {
        key: 'hour',
        type: 'number',
        label: 'Hour (0-23)',
        required: true,
        min: 0,
        max: 23
      },
      {
        key: 'minute',
        type: 'number',
        label: 'Minute (0-59)',
        required: true,
        min: 0,
        max: 59
      }
    ]
  };

  outputSchema: OutputSchema = {
    timestamp: {
      type: 'string',
      description: 'Trigger timestamp'
    }
  };

  async start(areaId: string, config: any): Promise<void> {
    const { hour, minute } = config;
    const cronExpression = `${minute} ${hour} * * *`; // Every day at HH:MM

    CronScheduler.schedule(areaId, cronExpression, () => {
      this.emitTrigger({
        areaId,
        data: {
          timestamp: new Date().toISOString()
        }
      });
    });
  }

  async stop(areaId: string): Promise<void> {
    CronScheduler.unschedule(areaId);
  }
}
```

---

## Adding a New Action (Reaction)

### Example: Simple action

**File**: `backend/src/modules/your-service/actions/CreateItem.ts`

```typescript
import { BaseAction } from '../../_base/BaseAction';
import { ConfigSchema, OutputSchema, ActionContext, ActionResult } from '../../_base/types';
import axios from 'axios';

export class CreateItem extends BaseAction {
  name = 'create_item';
  description = 'Creates a new item in Your Service';

  configSchema: ConfigSchema = {
    fields: [
      {
        key: 'title',
        type: 'text',
        label: 'Title',
        hint: 'The item title',
        required: true,
        maxLength: 200
      },
      {
        key: 'description',
        type: 'textarea',
        label: 'Description',
        hint: 'Detailed description (supports variables)',
        required: false,
        maxLength: 2000
      },
      {
        key: 'category',
        type: 'dropdown',
        label: 'Category',
        required: true,
        options: ['Work', 'Personal', 'Other']
      }
    ]
  };

  outputSchema: OutputSchema = {
    itemId: {
      type: 'string',
      description: 'Created item ID'
    },
    itemUrl: {
      type: 'string',
      description: 'Item URL'
    }
  };

  async execute(config: any, context: ActionContext): Promise<ActionResult> {
    // 1. Get user's OAuth token
    const connection = await this.connectionManager.getConnection(
      context.userId,
      'your-service'
    );

    if (!connection) {
      throw new Error('Your Service is not connected');
    }

    // 2. Replace variables in config
    const resolvedConfig = this.variableReplacer.replace(config, {
      ...context.triggerData,
      previousOutputs: context.previousOutputs
    });

    // 3. Call the service API
    try {
      const response = await axios.post(
        'https://api.your-service.com/items',
        {
          title: resolvedConfig.title,
          description: resolvedConfig.description,
          category: resolvedConfig.category
        },
        {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // 4. Return result
      return {
        success: true,
        data: {
          itemId: response.data.id,
          itemUrl: response.data.url
        }
      };
    } catch (error) {
      // Error handling
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token expired - attempt to refresh
        await this.refreshToken(connection);
        // Retry request...
      }

      return {
        success: false,
        error: {
          code: 'CREATE_ITEM_FAILED',
          message: error.message
        }
      };
    }
  }

  private async refreshToken(connection: any): Promise<void> {
    // Token refresh logic
    // ...
  }
}
```

### Example: Action with dynamic resources

**File**: `backend/src/modules/your-service/actions/SendToChannel.ts`

```typescript
export class SendToChannel extends BaseAction {
  name = 'send_to_channel';
  description = 'Sends a message to a channel';

  configSchema: ConfigSchema = {
    fields: [
      {
        key: 'channelId',
        type: 'your_service_channel', // Custom type
        label: 'Channel',
        hint: 'Select a channel',
        required: true,
        // This field requires an API call to fetch channel list
        resourceEndpoint: '/api/your-service/channels' // Frontend will call this endpoint
      },
      {
        key: 'message',
        type: 'textarea',
        label: 'Message',
        required: true
      }
    ]
  };

  // ... rest of implementation
}
```

**Route to fetch resources**: `backend/src/modules/your-service/routes.ts`

```typescript
// GET /api/your-service/channels
router.get('/channels', authenticateMiddleware, async (req, res) => {
  const userId = req.user.id;

  // Get user's connection
  const connection = await connectionManager.getConnection(userId, 'your-service');
  if (!connection) {
    return res.status(404).json({ error: 'Service not connected' });
  }

  // Call the service API
  const response = await axios.get('https://api.your-service.com/channels', {
    headers: { Authorization: `Bearer ${connection.accessToken}` }
  });

  // Return formatted list
  res.json({
    channels: response.data.channels.map(ch => ({
      id: ch.id,
      name: ch.name,
      description: ch.description
    }))
  });
});
```

---

## Dynamic Schema System

Configuration schemas define which fields the user must fill in and how they are displayed in the interface.

### Available field types

```typescript
type FieldType =
  | 'text'          // Simple text field
  | 'textarea'      // Multi-line text area
  | 'number'        // Number
  | 'time'          // Time selector
  | 'boolean'       // Checkbox
  | 'dropdown'      // Dropdown list
  | 'email'         // Email
  | 'url'           // URL
  // Special types requiring API calls
  | 'discord_guild'      // Discord server
  | 'discord_channel'    // Discord channel
  | 'discord_role'       // Discord role
  | 'github_repository'  // GitHub repository
  | 'github_branch'      // GitHub branch
  | 'gitlab_project'     // GitLab project
  // ... other custom types
```

### Complete schema example

```typescript
configSchema: ConfigSchema = {
  fields: [
    // Simple text field
    {
      key: 'username',
      type: 'text',
      label: 'Username',
      hint: 'Your username on the service',
      required: true,
      default: '',
      validation: {
        minLength: 3,
        maxLength: 50,
        pattern: '^[a-zA-Z0-9_]+$'
      }
    },

    // Number with limits
    {
      key: 'maxResults',
      type: 'number',
      label: 'Maximum number of results',
      required: false,
      default: 10,
      min: 1,
      max: 100
    },

    // Dropdown (fixed list)
    {
      key: 'priority',
      type: 'dropdown',
      label: 'Priority',
      required: true,
      options: ['low', 'medium', 'high'],
      default: 'medium'
    },

    // Conditional field (displayed only if another condition is met)
    {
      key: 'customMessage',
      type: 'textarea',
      label: 'Custom message',
      required: false,
      dependsOn: 'useCustomMessage', // Shown only if useCustomMessage is true
    },

    // Resource fetch (dynamic list)
    {
      key: 'channelId',
      type: 'discord_channel',
      label: 'Discord Channel',
      required: true,
      dependsOn: 'guildId', // Depends on another field
      hint: 'Select the destination channel'
    }
  ]
};
```

### Output Schema

Defines the data that the trigger/action produces. This data can be used by subsequent actions via the variable system.

```typescript
outputSchema: OutputSchema = {
  // Simple variable
  messageId: {
    type: 'string',
    description: 'Sent message ID'
  },

  // Object
  author: {
    type: 'object',
    description: 'Message author',
    properties: {
      id: { type: 'string', description: 'Author ID' },
      username: { type: 'string', description: 'Username' },
      avatar: { type: 'string', description: 'Avatar URL' }
    }
  },

  // Array
  attachments: {
    type: 'array',
    description: 'Attachments',
    items: {
      type: 'object',
      properties: {
        filename: { type: 'string' },
        url: { type: 'string' }
      }
    }
  }
};
```

### Using variables

In action configuration, the user can insert variables from previous outputs:

```typescript
// Action configuration with variables
{
  message: "New commit from {{author.username}} on {{branch}}",
  channelId: "{{previousOutputs.trigger.channelId}}"
}
```

The system automatically replaces variables before executing the action.

---

## OAuth2 Authentication

### Create an OAuth2 provider

**File**: `backend/src/shared/auth/oauth/providers/YourServiceProvider.ts`

```typescript
import { IOAuthProvider, OAuthConfig, OAuthTokens, OAuthUserInfo } from '../IOAuthProvider';
import axios from 'axios';

export class YourServiceProvider implements IOAuthProvider {
  name = 'your-service';

  config: OAuthConfig = {
    clientId: process.env.YOUR_SERVICE_CLIENT_ID!,
    clientSecret: process.env.YOUR_SERVICE_CLIENT_SECRET!,
    redirectUri: process.env.YOUR_SERVICE_REDIRECT_URI!,
    scopes: ['read', 'write'],
    authorizationUrl: 'https://api.your-service.com/oauth/authorize',
    tokenUrl: 'https://api.your-service.com/oauth/token',
    userInfoUrl: 'https://api.your-service.com/user/me'
  };

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      state
    });

    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const response = await axios.post(
      this.config.tokenUrl,
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      },
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      tokenType: response.data.token_type
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await axios.post(
      this.config.tokenUrl,
      {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token || refreshToken,
      expiresIn: response.data.expires_in,
      tokenType: response.data.token_type
    };
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await axios.get(this.config.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return {
      id: response.data.id.toString(),
      email: response.data.email,
      username: response.data.username,
      displayName: response.data.display_name,
      avatarUrl: response.data.avatar_url
    };
  }
}
```

### Register the provider

**File**: `backend/src/shared/auth/oauth/OAuthManager.ts`

```typescript
import { YourServiceProvider } from './providers/YourServiceProvider';

export class OAuthManager {
  private providers: Map<string, IOAuthProvider> = new Map();

  constructor() {
    // Existing providers...
    this.providers.set('google', new GoogleProvider());
    this.providers.set('github', new GitHubProvider());

    // Add your provider
    this.providers.set('your-service', new YourServiceProvider());
  }
}
```

### Create OAuth routes

**File**: `backend/src/modules/your-service/routes.ts`

```typescript
import express from 'express';
import { oauthManager } from '../../shared/auth/oauth/OAuthManager';

export const router = express.Router();

// OAuth initiation route
router.get('/connect', (req, res) => {
  const { token } = req.query; // Token of already logged-in user

  // Create state with token to know who's connecting
  const state = Buffer.from(JSON.stringify({ token, isMobile: false })).toString('base64');

  const authUrl = oauthManager.getAuthorizationUrl('your-service', state);
  res.redirect(authUrl);
});

// OAuth callback route
router.get('/callback', async (req, res) => {
  const { code, error, state } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/service/error?error=${error}`);
  }

  try {
    // Decode state
    const { token } = JSON.parse(Buffer.from(state as string, 'base64').toString());

    // Exchange code for access token
    const tokens = await oauthManager.exchangeCode('your-service', code as string);

    // Get user info
    const userInfo = await oauthManager.getUserInfo('your-service', tokens.accessToken);

    // Verify JWT token
    const userId = await jwtManager.verify(token);

    // Save connection to database
    await connectionManager.saveConnection({
      userId,
      serviceName: 'your-service',
      externalUserId: userInfo.id,
      externalUsername: userInfo.username,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + tokens.expiresIn * 1000)
    });

    // Redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/service/success?service=your-service`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/service/error?error=callback_failed`);
  }
});
```

---

## Testing and Validation

### 1. Test locally

#### Start server in development mode

```bash
docker compose --profile dev up --build
```

#### Test your module

```bash
# Verify module is registered
curl http://localhost:8080/api/modules

# Check module details
curl http://localhost:8080/api/modules/your-service

# Test about.json endpoint
curl http://localhost:8080/about.json | jq .
```

### 2. Test a trigger

1. Create a workflow via the web interface
2. Select your new trigger
3. Configure parameters
4. Activate the workflow
5. Check backend logs:

```bash
docker compose logs -f backend-dev
```

### 3. Test an action

1. Create a workflow with an existing trigger (e.g., Timer)
2. Add your new action
3. Configure parameters
4. Manually trigger the trigger
5. Verify the action executes correctly

### 4. Test OAuth

```bash
# Access the connection URL
open http://localhost:8080/api/your-service/connect?token=<your_jwt_token>
```

Verify:
- Redirect to the service's OAuth page
- Callback after authorization
- Database registration
- Redirect to frontend

### 5. Unit tests (recommended)

Create a test file for your action:

**File**: `backend/src/modules/your-service/__tests__/CreateItem.test.ts`

```typescript
import { CreateItem } from '../actions/CreateItem';
import { ActionContext } from '../../_base/types';

describe('CreateItem Action', () => {
  let action: CreateItem;

  beforeEach(() => {
    action = new CreateItem(mockConnectionManager);
  });

  it('should create an item successfully', async () => {
    const config = {
      title: 'Test Item',
      description: 'Test description',
      category: 'Work'
    };

    const context: ActionContext = {
      areaId: 'test-area',
      userId: 'test-user',
      triggerData: {},
      previousOutputs: {}
    };

    const result = await action.execute(config, context);

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('itemId');
  });

  it('should handle API errors gracefully', async () => {
    // ... test error handling
  });
});
```

Run tests:

```bash
cd backend
npm test -- CreateItem.test.ts
```

---

## Best Practices

### 1. Naming and conventions

#### Identifiers
- **Modules**: Kebab-case (e.g., `your-service`)
- **Triggers**: Snake_case with `on_` prefix (e.g., `on_new_item`)
- **Actions**: Snake_case (e.g., `create_item`, `send_message`)

#### Files and folders
```
your-service/
├── service.ts              # Module configuration
├── triggers/
│   ├── OnNewItem.ts        # PascalCase for classes
│   └── OnWebhookEvent.ts
├── actions/
│   ├── CreateItem.ts
│   └── UpdateItem.ts
├── routes.ts               # API routes
└── __tests__/              # Unit tests
```

### 2. Error handling

Always wrap API calls with try/catch:

```typescript
try {
  const response = await axios.get(url);
  return { success: true, data: response.data };
} catch (error) {
  if (axios.isAxiosError(error)) {
    // HTTP error
    if (error.response?.status === 401) {
      // Token expired
      await this.refreshToken();
    } else if (error.response?.status === 429) {
      // Rate limit reached
      throw new Error('Rate limit exceeded');
    }
  }

  return {
    success: false,
    error: {
      code: 'API_ERROR',
      message: error.message
    }
  };
}
```

### 3. OAuth token management

Always check token expiration and refresh if necessary:

```typescript
async getValidAccessToken(connection: Connection): Promise<string> {
  // Check if token is expired
  if (connection.expiresAt && connection.expiresAt < new Date()) {
    // Refresh token
    const tokens = await oauthManager.refreshToken('your-service', connection.refreshToken);

    // Update in database
    await connectionManager.updateConnection(connection.id, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + tokens.expiresIn * 1000)
    });

    return tokens.accessToken;
  }

  return connection.accessToken;
}
```

### 4. Logging

Use Winston logger for all logs:

```typescript
import { logger } from '../../shared/utils/logger';

logger.info(`Starting trigger ${this.name} for area ${areaId}`);
logger.warn(`Rate limit approaching for area ${areaId}`);
logger.error(`Failed to execute action: ${error.message}`, { areaId, error });
```

### 5. Rate limiting

Respect the service API's limits:

```typescript
private rateLimiter = new Map<string, { count: number; resetAt: Date }>();

async makeApiCall(userId: string, ...args): Promise<any> {
  const limit = this.rateLimiter.get(userId);

  if (limit && limit.count >= MAX_REQUESTS_PER_HOUR) {
    if (limit.resetAt > new Date()) {
      throw new Error('Rate limit exceeded');
    }
    this.rateLimiter.delete(userId);
  }

  // Make API call
  const result = await apiCall(...args);

  // Update counter
  const current = this.rateLimiter.get(userId) || { count: 0, resetAt: new Date(Date.now() + 3600000) };
  current.count++;
  this.rateLimiter.set(userId, current);

  return result;
}
```

### 6. Documentation

Always document:
- Module in `backend/docs/YOUR_SERVICE_API_USAGE.md`
- Configuration parameters in `configSchema`
- Output variables in `outputSchema`
- Possible errors in comments

### 7. Security

#### Never log tokens

```typescript
// Wrong
logger.info(`Access token: ${connection.accessToken}`);

// Right
logger.info(`Using access token for user ${userId}`);
```

#### Validate all inputs

```typescript
if (!config.title || config.title.length > 200) {
  throw new Error('Title is required and must be less than 200 characters');
}
```

#### Use minimal OAuth scopes

Only request strictly necessary permissions:

```typescript
// Wrong
scopes: ['admin', 'full_access']

// Right
scopes: ['read:items', 'write:items']
```

### 8. Performance

#### Use caching for resources

```typescript
private channelCache = new Map<string, any[]>();
private cacheExpiry = 5 * 60 * 1000; // 5 minutes

async getChannels(userId: string): Promise<any[]> {
  const cached = this.channelCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const channels = await this.fetchChannelsFromAPI(userId);
  this.channelCache.set(userId, {
    data: channels,
    expiresAt: Date.now() + this.cacheExpiry
  });

  return channels;
}
```

#### Use batch requests when possible

```typescript
// Wrong - One request per item
for (const item of items) {
  await api.updateItem(item.id, item.data);
}

// Right - Single batch request
await api.batchUpdateItems(items.map(i => ({ id: i.id, data: i.data })));
```

---

## Contribution Checklist

Before submitting your contribution, make sure that:

- [ ] Module is registered in `ModuleRegistry`
- [ ] Environment variables are in `.env.example`
- [ ] Variables are added in `docker-compose.yml`
- [ ] OAuth routes are created (if applicable)
- [ ] OAuth provider is implemented (if applicable)
- [ ] Triggers have complete `configSchema` and `outputSchema`
- [ ] Actions have complete `configSchema` and `outputSchema`
- [ ] Errors are handled correctly
- [ ] OAuth tokens are refreshed automatically
- [ ] Rate limiting is respected
- [ ] Logs are implemented
- [ ] API documentation is created in `backend/docs/`
- [ ] Unit tests are written
- [ ] Module appears in `/about.json`
- [ ] Module is accessible from frontend

---

## Useful Resources

### Internal documentation
- [API_MODULE_VARIABLES.md](backend/docs/API_MODULE_VARIABLES.md) - Variable system
- [GITHUB_API_USAGE.md](backend/docs/GITHUB_API_USAGE.md) - Complete integration example
- [DROPBOX_API_USAGE.md](backend/docs/DROPBOX_API_USAGE.md) - Example with OAuth2

### Module examples
- **Simple**: `backend/src/modules/console/` - Module without auth
- **OAuth2**: `backend/src/modules/github/` - OAuth2 + triggers
- **Bot**: `backend/src/modules/discord/` - Bot + OAuth2
- **Polling**: `backend/src/modules/rss/` - Polling trigger
- **Webhook**: `backend/src/modules/webhook/` - Webhook trigger
- **Schedule**: `backend/src/modules/timer/` - Scheduled trigger

### External documentation
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Axios Documentation](https://axios-http.com/docs/intro)

---

## Support

For any development questions:

- **GitHub Issues**: [github.com/100-6/Mirror-Area/issues](https://github.com/100-6/Mirror-Area/issues)
- **Documentation**: Check [backend/docs/](backend/docs/)
- **README**: Back to [README.md](README.md)

---

<div align="center">

Happy contributing!

[Back to top](#contribution-guide---area)

</div>
