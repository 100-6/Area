# Dropbox API Routes - Usage Guide

This guide explains how to use the Dropbox API routes to fetch files and folders.

## Authentication

All routes require:
- Valid JWT token in `Authorization: Bearer <token>` header
- Active Dropbox connection (OAuth authenticated)

## Available Routes

### 1. **List Files and Folders**

```http
GET /api/dropbox/files
```

**Query Parameters:**
- `path` (optional): Folder path to list (default: root `""`)
- `recursive` (optional): List recursively through subfolders (default: `false`)

**Examples:**

```bash
# List root folder
curl -X GET "http://localhost:8080/api/dropbox/files" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# List specific folder
curl -X GET "http://localhost:8080/api/dropbox/files?path=/Documents" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# List recursively
curl -X GET "http://localhost:8080/api/dropbox/files?path=/Photos&recursive=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "path": "/Documents",
  "total": 15,
  "filesCount": 10,
  "foldersCount": 5,
  "files": [
    {
      ".tag": "file",
      "name": "report.pdf",
      "path_display": "/Documents/report.pdf",
      "path_lower": "/documents/report.pdf",
      "id": "id:abc123",
      "size": 102400,
      "client_modified": "2025-10-28T12:00:00Z",
      "server_modified": "2025-10-28T12:00:00Z",
      "is_downloadable": true
    }
  ],
  "folders": [
    {
      ".tag": "folder",
      "name": "Archives",
      "path_display": "/Documents/Archives",
      "path_lower": "/documents/archives",
      "id": "id:def456"
    }
  ],
  "entries": [
    // All entries (files + folders combined)
  ]
}
```

---

### 2. **List Only Folders**

```http
GET /api/dropbox/folders
```

**Query Parameters:**
- `path` (optional): Folder path to list (default: root `""`)

**Examples:**

```bash
# List folders in root
curl -X GET "http://localhost:8080/api/dropbox/folders" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# List folders in specific path
curl -X GET "http://localhost:8080/api/dropbox/folders?path=/Projects" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "path": "/",
  "count": 5,
  "folders": [
    {
      ".tag": "folder",
      "name": "Documents",
      "path_display": "/Documents",
      "path_lower": "/documents",
      "id": "id:abc123"
    },
    {
      ".tag": "folder",
      "name": "Photos",
      "path_display": "/Photos",
      "path_lower": "/photos",
      "id": "id:def456"
    }
  ]
}
```

---

### 3. **Debug Connection**

```http
GET /api/dropbox/debug
```

**Example:**

```bash
curl -X GET "http://localhost:8080/api/dropbox/debug" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "connected": true,
  "tokenValid": true,
  "tokenPrefix": "sl.u.AGE86..."
}
```

---

## Error Handling

### Path Not Found (404)

```json
{
  "error": "Path not found",
  "message": "Le dossier \"/InvalidFolder\" n'existe pas dans votre Dropbox",
  "path": "/InvalidFolder"
}
```

### Invalid Token (401)

```json
{
  "error": "Invalid token",
  "message": "Votre token Dropbox est invalide. Veuillez vous reconnecter."
}
```

### Dropbox Not Connected (404)

```json
{
  "error": "Dropbox not connected",
  "message": "Please connect your Dropbox account first"
}
```

### Server Error (500)

```json
{
  "error": "Failed to fetch files",
  "message": "Error details..."
}
```

---

## Path Format

Dropbox paths must follow these rules:

  **Valid paths:**
- `""` or `/` → Root folder
- `/Documents` → Folder at root
- `/Documents/2024` → Subfolder
- `/Photos/Vacation` → Nested folder

  **Invalid paths:**
- `Documents` (missing `/` at start)
- `/Documents/` (trailing `/` not allowed)

---

## Frontend Integration Examples

### React/TypeScript Example

```typescript
async function fetchDropboxFiles(path: string = '') {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch(
    `http://localhost:8080/api/dropbox/files?path=${encodeURIComponent(path)}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch files');
  }

  return response.json();
}

// Usage
try {
  const data = await fetchDropboxFiles('/Documents');
  console.log('Files:', data.files);
  console.log('Folders:', data.folders);
} catch (error) {
  console.error('Error:', error);
}
```

### Vue.js Example

```javascript
export default {
  data() {
    return {
      files: [],
      folders: [],
      currentPath: ''
    }
  },
  methods: {
    async loadFolder(path = '') {
      const token = localStorage.getItem('jwt_token');
      
      try {
        const response = await fetch(
          `http://localhost:8080/api/dropbox/files?path=${encodeURIComponent(path)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        const data = await response.json();
        
        if (data.success) {
          this.files = data.files;
          this.folders = data.folders;
          this.currentPath = path;
        }
      } catch (error) {
        console.error('Error loading folder:', error);
      }
    }
  },
  mounted() {
    this.loadFolder(); // Load root
  }
}
```

---

## 🔧 Testing with cURL

```bash
# Save your JWT token
export JWT_TOKEN="your_jwt_token_here"

# Test connection
curl -X GET "http://localhost:8080/api/dropbox/debug" \
  -H "Authorization: Bearer $JWT_TOKEN"

# List root
curl -X GET "http://localhost:8080/api/dropbox/files" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq

# List specific folder
curl -X GET "http://localhost:8080/api/dropbox/files?path=/Documents" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq

# List only folders
curl -X GET "http://localhost:8080/api/dropbox/folders" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq
```

---

## File/Folder Object Structure

### File Object

```typescript
{
  ".tag": "file",
  "name": string,              // File name
  "path_display": string,      // Display path (original case)
  "path_lower": string,        // Lowercase path
  "id": string,                // Dropbox file ID
  "size": number,              // Size in bytes
  "client_modified": string,   // ISO 8601 date
  "server_modified": string,   // ISO 8601 date
  "is_downloadable": boolean,
  "content_hash": string       // File content hash
}
```

### Folder Object

```typescript
{
  ".tag": "folder",
  "name": string,              // Folder name
  "path_display": string,      // Display path (original case)
  "path_lower": string,        // Lowercase path
  "id": string                 // Dropbox folder ID
}
```

---

## Best Practices

1. **Always encode path parameters:**
   ```javascript
   const url = `/api/dropbox/files?path=${encodeURIComponent(path)}`;
   ```

2. **Handle errors gracefully:**
   - Check for 404 (path not found)
   - Check for 401 (need to reconnect)
   - Show user-friendly messages

3. **Cache folder listings:**
   - Don't re-fetch the same folder multiple times
   - Use state management (Redux, Vuex, etc.)

4. **Show loading states:**
   - Fetching can take time for large folders
   - Display spinners/skeletons

5. **Implement breadcrumbs:**
   - Use `path_display` to show current location
   - Allow users to navigate up the folder tree

6. **Handle empty folders:**
   - Check if `total === 0`
   - Display appropriate message to users
