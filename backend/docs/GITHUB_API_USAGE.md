# GitHub API Routes - Usage Guide

This guide explains how to use the GitHub API routes to fetch repositories, organizations, and branches.

## Authentication

All routes require:
- Valid JWT token in `Authorization: Bearer <token>` header
- Active GitHub connection (OAuth authenticated with scopes: `repo read:org user:email`)

## Available Routes

### 1. **Get User Organizations**

```http
GET /api/github/organizations
```

**Example:**

```bash
curl -X GET "http://localhost:8080/api/github/organizations" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "count": 3,
  "organizations": [
    {
      "login": "my-org",
      "id": 12345678,
      "node_id": "MDEyOk9yZ2FuaXphdGlvbjEyMzQ1Njc4",
      "url": "https://api.github.com/orgs/my-org",
      "repos_url": "https://api.github.com/orgs/my-org/repos",
      "events_url": "https://api.github.com/orgs/my-org/events",
      "hooks_url": "https://api.github.com/orgs/my-org/hooks",
      "issues_url": "https://api.github.com/orgs/my-org/issues",
      "members_url": "https://api.github.com/orgs/my-org/members{/member}",
      "public_members_url": "https://api.github.com/orgs/my-org/public_members{/member}",
      "avatar_url": "https://avatars.githubusercontent.com/u/12345678?v=4",
      "description": "My Organization"
    }
  ]
}
```

---

### 2. **Get All Repositories**

```http
GET /api/github/repositories
```

**Query Parameters:**
- `affiliation` (optional): Filter by affiliation
  - `owner` - Repositories owned by the authenticated user
  - `collaborator` - Repositories where the user is a collaborator
  - `organization_member` - Repositories owned by organizations the user is a member of
  - `all` - All repositories (default)
  
- `sort` (optional): Sort by
  - `created` - Creation date
  - `updated` - Last update date (default)
  - `pushed` - Last push date
  - `full_name` - Repository name

- `per_page` (optional): Results per page (default: 30, max: 100)

**Examples:**

```bash
# Get all repositories
curl -X GET "http://localhost:8080/api/github/repositories" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get only owned repositories
curl -X GET "http://localhost:8080/api/github/repositories?affiliation=owner" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get repositories sorted by creation date
curl -X GET "http://localhost:8080/api/github/repositories?sort=created&per_page=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "count": 25,
  "repositories": [
    {
      "id": 123456789,
      "node_id": "MDEwOlJlcG9zaXRvcnkxMjM0NTY3ODk=",
      "name": "my-repo",
      "full_name": "username/my-repo",
      "private": false,
      "owner": {
        "login": "username",
        "id": 12345,
        "avatar_url": "https://avatars.githubusercontent.com/u/12345?v=4",
        "type": "User"
      },
      "html_url": "https://github.com/username/my-repo",
      "description": "My awesome repository",
      "fork": false,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-10-28T12:00:00Z",
      "pushed_at": "2025-10-28T10:30:00Z",
      "size": 1024,
      "stargazers_count": 42,
      "watchers_count": 42,
      "language": "TypeScript",
      "forks_count": 5,
      "open_issues_count": 3,
      "default_branch": "main",
      "visibility": "public"
    }
  ]
}
```

---

### 3. **Get Repository Branches**

```http
GET /api/github/repositories/:owner/:repo/branches
```

**Path Parameters:**
- `owner` (required): Repository owner (username or organization)
- `repo` (required): Repository name

**Query Parameters:**
- `per_page` (optional): Results per page (default: 30, max: 100)

**Examples:**

```bash
# Get branches for a repository
curl -X GET "http://localhost:8080/api/github/repositories/username/my-repo/branches" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get more branches per page
curl -X GET "http://localhost:8080/api/github/repositories/username/my-repo/branches?per_page=100" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "count": 5,
  "owner": "username",
  "repo": "my-repo",
  "branches": [
    {
      "name": "main",
      "commit": {
        "sha": "abc123def456...",
        "url": "https://api.github.com/repos/username/my-repo/commits/abc123..."
      },
      "protected": true,
      "protection": {
        "enabled": true,
        "required_status_checks": {
          "enforcement_level": "non_admins",
          "contexts": ["ci/build"]
        }
      }
    },
    {
      "name": "develop",
      "commit": {
        "sha": "def456ghi789...",
        "url": "https://api.github.com/repos/username/my-repo/commits/def456..."
      },
      "protected": false
    }
  ]
}
```

---

### 4. **Debug Connection**

```http
GET /api/github/debug
```

**Example:**

```bash
curl -X GET "http://localhost:8080/api/github/debug" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
  "connected": true,
  "user": {
    "login": "username",
    "id": 12345,
    "avatar_url": "https://avatars.githubusercontent.com/u/12345?v=4",
    "name": "John Doe",
    "email": "john@example.com",
    "bio": "Software Developer",
    "public_repos": 25,
    "followers": 100,
    "following": 50,
    "created_at": "2020-01-01T00:00:00Z"
  }
}
```

---

## Error Handling

### GitHub Not Connected (404)

```json
{
  "error": "GitHub not connected",
  "message": "Please connect your GitHub account first"
}
```

### Invalid Parameters (400)

```json
{
  "error": "Invalid parameters",
  "message": "Owner and repo parameters are required"
}
```

### GitHub API Error (500)

```json
{
  "error": "Failed to fetch repositories",
  "message": "GitHub API error details..."
}
```

---

## Frontend Integration Examples

### React/TypeScript Example

```typescript
interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string;
  html_url: string;
  default_branch: string;
  stargazers_count: number;
}

async function fetchGitHubRepos(): Promise<Repository[]> {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch(
    'http://localhost:8080/api/github/repositories?sort=updated&per_page=100',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch repositories');
  }

  const data = await response.json();
  return data.repositories;
}

async function fetchBranches(owner: string, repo: string) {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch(
    `http://localhost:8080/api/github/repositories/${owner}/${repo}/branches`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await response.json();
  return data.branches;
}
```

### Vue.js Example

```javascript
export default {
  data() {
    return {
      repositories: [],
      organizations: [],
      selectedRepo: null,
      branches: []
    }
  },
  methods: {
    async loadRepositories() {
      const token = localStorage.getItem('jwt_token');
      
      try {
        const response = await fetch(
          'http://localhost:8080/api/github/repositories?affiliation=owner&sort=updated',
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        const data = await response.json();
        this.repositories = data.repositories;
      } catch (error) {
        console.error('Error:', error);
      }
    },
    
    async loadBranches(owner, repo) {
      const token = localStorage.getItem('jwt_token');
      
      try {
        const response = await fetch(
          `http://localhost:8080/api/github/repositories/${owner}/${repo}/branches`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        const data = await response.json();
        this.branches = data.branches;
      } catch (error) {
        console.error('Error:', error);
      }
    }
  },
  mounted() {
    this.loadRepositories();
  }
}
```

---

## Testing with cURL

```bash
# Save your JWT token
export JWT_TOKEN="your_jwt_token_here"

# Test connection
curl -X GET "http://localhost:8080/api/github/debug" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq

# Get organizations
curl -X GET "http://localhost:8080/api/github/organizations" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq

# Get all repositories
curl -X GET "http://localhost:8080/api/github/repositories" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq

# Get only owned repos, sorted by created date
curl -X GET "http://localhost:8080/api/github/repositories?affiliation=owner&sort=created" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq

# Get branches
curl -X GET "http://localhost:8080/api/github/repositories/username/repo-name/branches" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq
```

---

## Object Structures

### Organization Object

```typescript
{
  login: string;              // Organization login name
  id: number;                 // GitHub organization ID
  node_id: string;            // GraphQL node ID
  url: string;                // API URL
  repos_url: string;          // Repositories API URL
  avatar_url: string;         // Organization avatar
  description: string | null; // Organization description
}
```

### Repository Object

```typescript
{
  id: number;                 // Repository ID
  name: string;               // Repository name
  full_name: string;          // Full name (owner/repo)
  private: boolean;           // Is private repo
  owner: {
    login: string;
    id: number;
    avatar_url: string;
    type: string;             // "User" or "Organization"
  };
  html_url: string;           // GitHub web URL
  description: string | null; // Repository description
  fork: boolean;              // Is forked repo
  created_at: string;         // ISO 8601 date
  updated_at: string;         // ISO 8601 date
  pushed_at: string;          // ISO 8601 date
  size: number;               // Size in KB
  stargazers_count: number;   // Number of stars
  watchers_count: number;     // Number of watchers
  language: string | null;    // Primary language
  forks_count: number;        // Number of forks
  open_issues_count: number;  // Number of open issues
  default_branch: string;     // Default branch name
  visibility: string;         // "public" or "private"
}
```

### Branch Object

```typescript
{
  name: string;               // Branch name
  commit: {
    sha: string;              // Commit SHA
    url: string;              // Commit API URL
  };
  protected: boolean;         // Is protected branch
}
```

---

## Best Practices

1. **Use proper affiliation filters:**
   ```javascript
   // For user's own repos
   const url = '/api/github/repositories?affiliation=owner';
   
   // For all accessible repos
   const url = '/api/github/repositories?affiliation=all';
   ```

2. **Handle pagination:**
   - GitHub API returns max 100 items per page
   - Use `per_page` parameter to control page size
   - For large result sets, consider implementing pagination in frontend

3. **Cache repository data:**
   - Repository lists don't change frequently
   - Implement caching to reduce API calls
   - Consider cache invalidation strategy

4. **Show loading states:**
   - API calls can take time
   - Display spinners/skeletons during fetch
   - Provide feedback to users

5. **Error handling:**
   - Check if GitHub is connected before fetching
   - Handle token expiration gracefully
   - Show user-friendly error messages
   - Implement retry logic for network errors

6. **Sorting and filtering:**
   - Use `sort` parameter to show most relevant repos first
   - Consider client-side filtering for better UX
   - Allow users to customize their view

7. **Security:**
   - Never expose JWT tokens in logs or error messages
   - Use HTTPS in production
   - Validate all user inputs
