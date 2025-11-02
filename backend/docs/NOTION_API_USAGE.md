# Notion API Usage Guide

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Available Triggers](#available-triggers)
- [Available Actions](#available-actions)
- [Variable System](#variable-system)
- [Workflow Examples](#workflow-examples)
- [API Reference](#api-reference)

---

## Overview

The Notion module provides comprehensive integration with Notion's API, allowing you to:
- **Monitor** database changes, page updates, property modifications, and comments
- **Create** new pages with structured content
- **Update** existing page properties
- **Delete** (archive) pages
- **Append** formatted content blocks to pages

**Base Configuration:**
- **Service ID**: `notion`
- **Auth Type**: OAuth 2.0
- **API Version**: `2022-06-28`
- **Polling Interval**: 60 seconds for all triggers

---

## Authentication

### OAuth 2.0 Flow

**Step 1: Initiate OAuth**
```http
GET /api/auth/notion
```

**Step 2: User authorizes on Notion**
- Redirected to Notion's authorization page
- User grants permissions to their workspace

**Step 3: Callback with access token**
```http
GET /api/auth/notion/callback?code=<auth_code>
```

**Required Scopes:**
The Notion integration automatically requests all necessary scopes when connecting.

### Testing Connection

**Get Notion debug info:**
```http
GET /api/notion/debug
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
  "connected": true,
  "user": {
    "id": "user-id",
    "name": "User Name",
    "type": "person"
  },
  "workspace": {
    "name": "Workspace Name",
    "id": "workspace-id"
  }
}
```

---

## Available Triggers

### 1. page.created

**Description:** Triggers when a new page is created in a specific Notion database

**Configuration Schema:**
```json
{
  "service": "notion",
  "action": "page.created",
  "config": {
    "databaseId": "29f0f550-e565-80eb-9812-e8df389d9705"
  }
}
```

**Output Variables:**
| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{pageId}}` | string | Unique ID of the created page | `29f0f550-e565-802f-...` |
| `{{pageUrl}}` | string | Direct URL to the page | `https://notion.so/...` |
| `{{title}}` | string | Title of the page | `New Task` |
| `{{createdTime}}` | string | ISO 8601 timestamp | `2025-11-02T10:30:00Z` |
| `{{createdBy}}` | string | User ID who created the page | `user-abc123` |
| `{{properties}}` | object | All page properties | `{ "Status": {...}, ... }` |

**Use Cases:**
- Send notifications when new tasks are added
- Automatically enrich new pages with template content
- Trigger workflows based on new database entries

---

### 2. page.updated

**Description:** Triggers when a page is modified in a database

**Configuration Schema:**
```json
{
  "service": "notion",
  "action": "page.updated",
  "config": {
    "databaseId": "29f0f550-e565-80eb-9812-e8df389d9705",
    "watchProperty": "Status"  // Optional: monitor specific property
  }
}
```

**Output Variables:**
| Variable | Type | Description |
|----------|------|-------------|
| `{{pageId}}` | string | ID of the updated page |
| `{{pageUrl}}` | string | URL to the page |
| `{{title}}` | string | Current page title |
| `{{lastEditedTime}}` | string | When the page was last edited |
| `{{lastEditedBy}}` | string | User ID who edited the page |
| `{{properties}}` | object | Current page properties |

**Use Cases:**
- Track modifications to important pages
- Sync changes to external systems
- Create audit logs

---

### 3. property.status_changed

**Description:** Triggers when a specific property value changes in a database

**Configuration Schema:**
```json
{
  "service": "notion",
  "action": "property.status_changed",
  "config": {
    "databaseId": "29f0f550-e565-80eb-9812-e8df389d9705",
    "propertyName": "Status",
    "fromValue": "To Do",      // Optional: filter by old value
    "toValue": "Done"          // Optional: filter by new value
  }
}
```

**Output Variables:**
| Variable | Type | Description |
|----------|------|-------------|
| `{{pageId}}` | string | ID of the page |
| `{{pageUrl}}` | string | URL to the page |
| `{{title}}` | string | Page title |
| `{{propertyName}}` | string | Name of the changed property |
| `{{oldValue}}` | string | Previous property value |
| `{{newValue}}` | string | New property value |
| `{{changedAt}}` | string | ISO timestamp of the change |

**Supported Property Types:**
- `select` - Single select dropdown
- `status` - Status property
- `multi_select` - Multiple select
- `checkbox` - Checkbox (true/false)
- `number` - Number
- `date` - Date property
- `rich_text` - Text property
- `title` - Title property

**Use Cases:**
- Notify team when task status changes to "Done"
- Trigger automation when priority becomes "High"
- Archive tasks when status becomes "Archived"

---

### 4. comment.added

**Description:** Triggers when a new comment is added to pages

**Configuration Schema:**

**Monitor specific page:**
```json
{
  "service": "notion",
  "action": "comment.added",
  "config": {
    "pageId": "29f0f550-e565-802f-..."
  }
}
```

**Monitor all pages in database:**
```json
{
  "service": "notion",
  "action": "comment.added",
  "config": {
    "databaseId": "29f0f550-e565-80eb-9812-e8df389d9705"
  }
}
```

**Output Variables:**
| Variable | Type | Description |
|----------|------|-------------|
| `{{commentId}}` | string | Unique ID of the comment |
| `{{pageId}}` | string | ID of the page commented on |
| `{{content}}` | string | Text content of the comment |
| `{{createdBy}}` | string | User ID who created the comment |
| `{{createdTime}}` | string | When the comment was created |

**Use Cases:**
- Send Discord/Slack notifications for new comments
- Log comment activity to external database
- Trigger reviews when comments are added to specific pages

---

## Available Actions

### 1. create_page

**Description:** Creates a new page in a Notion database

**Configuration Schema:**
```json
{
  "service": "notion",
  "action": "create_page",
  "config": {
    "databaseId": "29f0f550-e565-80eb-9812-e8df389d9705",
    "title": "New Task: {{title}}",
    "content": "Automatically created from trigger",
    "properties": {
      "Status": {
        "type": "status",
        "status": { "name": "To Do" }
      },
      "Priority": {
        "type": "select",
        "select": { "name": "High" }
      },
      "Due Date": {
        "type": "date",
        "date": { "start": "2025-11-10" }
      }
    }
  }
}
```

**Property Type Examples:**

**Status:**
```json
{
  "Status": {
    "type": "status",
    "status": { "name": "In Progress" }
  }
}
```

**Select:**
```json
{
  "Category": {
    "type": "select",
    "select": { "name": "Bug" }
  }
}
```

**Multi-Select:**
```json
{
  "Tags": {
    "type": "multi_select",
    "multi_select": [
      { "name": "urgent" },
      { "name": "backend" }
    ]
  }
}
```

**Checkbox:**
```json
{
  "Completed": {
    "type": "checkbox",
    "checkbox": true
  }
}
```

**Number:**
```json
{
  "Points": {
    "type": "number",
    "number": 5
  }
}
```

**Date:**
```json
{
  "Due Date": {
    "type": "date",
    "date": {
      "start": "2025-11-10",
      "end": "2025-11-15"  // Optional
    }
  }
}
```

**Rich Text:**
```json
{
  "Description": {
    "type": "rich_text",
    "rich_text": [
      {
        "text": { "content": "Task description here" }
      }
    ]
  }
}
```

**Returns:**
```json
{
  "success": true,
  "data": {
    "pageId": "29f0f550-e565-802f-...",
    "pageUrl": "https://notion.so/...",
    "createdAt": "2025-11-02T10:30:00Z"
  }
}
```

---

### 2. update_page

**Description:** Updates properties of an existing Notion page

**Configuration Schema:**
```json
{
  "service": "notion",
  "action": "update_page",
  "config": {
    "pageId": "{{pageId}}",
    "title": "Updated: {{title}}",  // Optional
    "properties": {
      "Status": {
        "type": "status",
        "status": { "name": "Done" }
      },
      "Completed": {
        "type": "checkbox",
        "checkbox": true
      }
    }
  }
}
```

**Returns:**
```json
{
  "success": true,
  "data": {
    "pageId": "29f0f550-e565-802f-...",
    "updatedAt": "2025-11-02T10:35:00Z"
  }
}
```

**Use Cases:**
- Update task status based on external events
- Mark items as complete when conditions are met
- Sync property changes from other systems

---

### 3. delete_page

**Description:** Archives (soft deletes) a Notion page

**Configuration Schema:**
```json
{
  "service": "notion",
  "action": "delete_page",
  "config": {
    "pageId": "{{pageId}}"
  }
}
```

**Returns:**
```json
{
  "success": true,
  "data": {
    "pageId": "29f0f550-e565-802f-...",
    "archived": true,
    "archivedAt": "2025-11-02T10:40:00Z"
  }
}
```

**Note:** This performs a soft delete (archive). The page can be restored manually in Notion.

**Use Cases:**
- Clean up completed tasks automatically
- Archive old pages based on date
- Remove pages when external conditions are met

---

### 4. append_content

**Description:** Adds content blocks to the end of a Notion page

**Configuration Schema:**
```json
{
  "service": "notion",
  "action": "append_content",
  "config": {
    "pageId": "{{pageId}}",
    "content": "Updated on {{changedAt}}",
    "blockType": "paragraph"
  }
}
```

**Supported Block Types:**

**Paragraph** (default):
```json
{
  "blockType": "paragraph",
  "content": "This is a regular paragraph with text."
}
```

**Heading 2:**
```json
{
  "blockType": "heading_2",
  "content": "Section Title"
}
```

**Heading 3:**
```json
{
  "blockType": "heading_3",
  "content": "Subsection Title"
}
```

**Bulleted List Item:**
```json
{
  "blockType": "bulleted_list_item",
  "content": "First item in list"
}
```

**Numbered List Item:**
```json
{
  "blockType": "numbered_list_item",
  "content": "Step 1"
}
```

**Code Block:**
```json
{
  "blockType": "code",
  "content": "console.log('Hello World');"
}
```

**Returns:**
```json
{
  "success": true,
  "data": {
    "pageId": "29f0f550-e565-802f-...",
    "blockType": "paragraph",
    "contentLength": 45
  }
}
```

**Use Cases:**
- Log activity updates to a page
- Add timestamped notes automatically
- Build dynamic documentation
- Create checklists from external data

---

## Variable System

### Using Variables

Variables use the `{{variableName}}` syntax and are replaced at runtime.

**Example:**
```json
{
  "content": "Page {{title}} was created on {{createdTime}}"
}
```

**Becomes:**
```
Page New Task was created on 2025-11-02T10:30:00Z
```

### Available Variable Sources

1. **Trigger Outputs** - Variables from the trigger that started the workflow
2. **Previous Action Outputs** - Variables from earlier actions in the chain
3. **System Variables** - Built-in variables like timestamps

### Variable Chaining

You can use outputs from one action as inputs to the next:

```
Trigger: page.created
  ↓ Outputs: {{pageId}}, {{title}}, {{createdTime}}
  
Action 1: create_page (creates backup)
  ↓ Uses: {{pageId}}, {{title}}
  ↓ Outputs: {{backupPageId}}, {{backupPageUrl}}
  
Action 2: append_content
  ↓ Uses: {{backupPageId}} (from Action 1)
  ↓ Content: "Backup of {{title}} created at {{createdTime}}"
```

---

## Workflow Examples

### Example 1: Task Completion Notification

**Trigger:** Property Status changes to "Done"
**Actions:** Send Discord notification + Append completion note

```json
{
  "name": "Task Completed Workflow",
  "trigger": {
    "service": "notion",
    "action": "property.status_changed",
    "config": {
      "databaseId": "29f0f550-e565-80eb-9812-e8df389d9705",
      "propertyName": "Status",
      "toValue": "Done"
    }
  },
  "reactions": [
    {
      "service": "discord",
      "action": "send_message",
      "config": {
        "channelId": "1428004550136168568",
        "message": "🎉 Task completed: {{title}}\n🔗 {{pageUrl}}"
      }
    },
    {
      "service": "notion",
      "action": "append_content",
      "config": {
        "pageId": "{{pageId}}",
        "content": "✅ Marked as complete on {{changedAt}}",
        "blockType": "paragraph"
      }
    }
  ]
}
```

---

### Example 2: Auto-Enrich New Pages

**Trigger:** New page created
**Actions:** Add template content (heading + bullets)

```json
{
  "name": "Auto-Enrich New Pages",
  "trigger": {
    "service": "notion",
    "action": "page.created",
    "config": {
      "databaseId": "29f0f550-e565-80eb-9812-e8df389d9705"
    }
  },
  "reactions": [
    {
      "service": "notion",
      "action": "append_content",
      "config": {
        "pageId": "{{pageId}}",
        "content": "📋 Checklist",
        "blockType": "heading_2"
      }
    },
    {
      "service": "notion",
      "action": "append_content",
      "config": {
        "pageId": "{{pageId}}",
        "content": "Define requirements",
        "blockType": "bulleted_list_item"
      }
    },
    {
      "service": "notion",
      "action": "append_content",
      "config": {
        "pageId": "{{pageId}}",
        "content": "Implement solution",
        "blockType": "bulleted_list_item"
      }
    },
    {
      "service": "notion",
      "action": "append_content",
      "config": {
        "pageId": "{{pageId}}",
        "content": "Test and validate",
        "blockType": "bulleted_list_item"
      }
    }
  ]
}
```

---

### Example 3: Comment Monitoring

**Trigger:** New comment added
**Actions:** Notify on Discord + Create follow-up task

```json
{
  "name": "Comment Alert System",
  "trigger": {
    "service": "notion",
    "action": "comment.added",
    "config": {
      "databaseId": "29f0f550-e565-80eb-9812-e8df389d9705"
    }
  },
  "reactions": [
    {
      "service": "discord",
      "action": "send_message",
      "config": {
        "channelId": "1428004550136168568",
        "message": "💬 New comment on page\n📝 {{content}}\n👤 By: {{createdBy}}"
      }
    },
    {
      "service": "notion",
      "action": "create_page",
      "config": {
        "databaseId": "29f0f550-e565-80eb-9812-e8df389d9705",
        "title": "Follow-up: Comment on page",
        "content": "Review comment: {{content}}",
        "properties": {
          "Status": {
            "type": "status",
            "status": { "name": "To Do" }
          },
          "Priority": {
            "type": "select",
            "select": { "name": "Medium" }
          }
        }
      }
    }
  ]
}
```

---

### Example 4: Automatic Archiving

**Trigger:** Status changes to "Archive"
**Actions:** Create backup + Delete original

```json
{
  "name": "Auto-Archive Completed Tasks",
  "trigger": {
    "service": "notion",
    "action": "property.status_changed",
    "config": {
      "databaseId": "29f0f550-e565-80eb-9812-e8df389d9705",
      "propertyName": "Status",
      "toValue": "Archive"
    }
  },
  "reactions": [
    {
      "service": "notion",
      "action": "create_page",
      "config": {
        "databaseId": "29f0f550-e565-80eb-9812-e8df389d9705",
        "title": "📦 Archived: {{title}}",
        "content": "Original page: {{pageUrl}}\nArchived on: {{changedAt}}",
        "properties": {
          "Status": {
            "type": "status",
            "status": { "name": "Archive" }
          }
        }
      }
    },
    {
      "service": "notion",
      "action": "delete_page",
      "config": {
        "pageId": "{{pageId}}"
      }
    },
    {
      "service": "discord",
      "action": "send_message",
      "config": {
        "channelId": "1428004550136168568",
        "message": "🗄️ Page archived: {{title}}\n✅ Backup created"
      }
    }
  ]
}
```

---

## API Reference

### NotionApiService Methods

The `NotionApiService` class provides low-level access to Notion's API:

```typescript
// Get database info
async getDatabase(databaseId: string): Promise<NotionDatabase>

// Query database with filters
async queryDatabase(
  databaseId: string,
  filter?: any,
  sorts?: any[],
  pageSize?: number
): Promise<NotionQueryResponse>

// Get page by ID
async getPage(pageId: string): Promise<NotionPage>

// Create new page
async createPage(
  databaseId: string,
  properties: Record<string, any>,
  content?: Array<any>
): Promise<NotionPage>

// Update page properties
async updatePage(
  pageId: string,
  properties: Record<string, any>
): Promise<NotionPage>

// Archive page
async archivePage(pageId: string): Promise<NotionPage>

// Restore archived page
async restorePage(pageId: string): Promise<NotionPage>

// Append content blocks
async appendBlocks(
  pageId: string,
  children: Array<any>
): Promise<any>

// Add comment
async addComment(
  pageId: string,
  commentText: string
): Promise<NotionComment>

// Get comments
async getComments(pageId: string): Promise<NotionComment[]>

// Search
async search(query?: string, filter?: any): Promise<any>

// Get current user
async getCurrentUser(): Promise<any>
```

### Helper Methods

```typescript
// Extract title from page properties
static extractTitle(properties: Record<string, any>): string

// Create paragraph block
static createParagraphBlock(text: string): any

// Create title property
static createTitleProperty(title: string): any
```

---

## Database ID Format

Notion database IDs must be formatted with hyphens:

**Correct Format:**
```
29f0f550-e565-80eb-9812-e8df389d9705
```

**From URL:**
```
https://www.notion.so/29f0f550e56580eb9812e8df389d9705?v=...
                      ↓ Convert to ↓
29f0f550-e565-80eb-9812-e8df389d9705
```

**Conversion Pattern:**
```
XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
8 chars  4    4    4    12 chars
```

---

## Error Handling

### Common Errors

**Database not found:**
```json
{
  "error": "Failed to query database: object_not_found",
  "message": "Database not shared with integration"
}
```
**Solution:** Share the database with your Notion integration

**Invalid page ID:**
```json
{
  "error": "Failed to get page: validation_error",
  "message": "Invalid page ID format"
}
```
**Solution:** Ensure page ID is properly formatted with hyphens

**Property type mismatch:**
```json
{
  "error": "Failed to update page: validation_error",
  "message": "Property type does not match"
}
```
**Solution:** Check property types match database schema

---

## Rate Limiting

Notion API has rate limits:
- **3 requests per second** per integration
- Automatically handled with exponential backoff

If you hit rate limits, you'll see:
```
[NotionApi] Rate limit hit, retrying in 2s...
```

---

## Best Practices

### 1. Database Sharing
Always ensure your database is shared with the Notion integration:
1. Open database in Notion
2. Click "..." menu → "Connections"
3. Add your AREA integration

### 2. Variable Naming
Use descriptive variable names in configs:
```json
// Good 
"title": "Task: {{title}} - Created {{createdTime}}"

// Bad 
"title": "{{x}} {{y}}"
```

### 3. Error Handling
Always test workflows with invalid data to ensure graceful failures.

### 4. Polling Efficiency
- Use specific `databaseId` rather than monitoring all pages
- Use `fromValue`/`toValue` filters to reduce unnecessary triggers
- Consider using `watchProperty` for page.updated to monitor specific fields

### 5. Content Formatting
When appending content, structure it logically:
```
 Good structure:
1. Heading (context)
2. Paragraph (details)
3. List items (action items)

 Poor structure:
Random mix of block types
```

---

## Support

For issues or questions:
1. Check the [Notion API documentation](https://developers.notion.com)
2. Review workflow execution logs
3. Test with minimal workflows first
4. Verify OAuth connection is active

---

**Last Updated:** November 2, 2025
**Module Version:** 1.0.0
**API Version:** 2022-06-28
