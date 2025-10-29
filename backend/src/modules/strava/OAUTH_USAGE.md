# Strava OAuth Usage Guide

## Configuration

### 1. Create a Strava Application

1. Go to https://www.strava.com/settings/api
2. Click on "Create & Manage Your App"
3. Fill in the application details:
   - **Application Name**: Mirror-Area (or your app name)
   - **Category**: Choose appropriate category
   - **Club**: Optional
   - **Website**: Your application website
   - **Authorization Callback Domain**: 
     - Development: `localhost`
     - Production: Your domain (e.g., `myapp.com`)
4. Click "Create"
5. Note your **Client ID** and **Client Secret**

### 2. Configure Callback URLs

In your Strava app settings:
- **Authorization Callback Domain**: `localhost` (dev) or your domain
- The full callback URL will be: `http://localhost:8080/api/strava/callback`

### 3. Environment Variables

Add to your `.env` file:

```env
STRAVA_CLIENT_ID=your_client_id_here
STRAVA_CLIENT_SECRET=your_client_secret_here
STRAVA_REDIRECT_URI=http://localhost:8080/api/strava/callback
```

**Production:**
```env
STRAVA_CLIENT_ID=your_client_id_here
STRAVA_CLIENT_SECRET=your_client_secret_here
STRAVA_REDIRECT_URI=https://yourdomain.com/api/strava/callback
```

## OAuth Flow

### 1. User Initiates Connection

Frontend redirects user to:
```
GET /api/strava/connect?token={jwt_token}
```

The `token` parameter is the user's JWT authentication token.

### 2. Authorization

User is redirected to Strava's authorization page where they can:
- Review the requested permissions
- Authorize or deny access

### 3. Callback

After authorization, Strava redirects back to:
```
GET /api/strava/callback?code={auth_code}&state={state}
```

The backend:
1. Exchanges the authorization code for access and refresh tokens
2. Retrieves the athlete's profile
3. Creates or updates the `UserAuthProvider` record
4. Redirects user back to frontend with success/error status

### 4. Token Storage

Tokens are stored securely in the `user_auth_providers` table:
- `access_token`: Used for API requests (expires after 6 hours)
- `refresh_token`: Used to get new access tokens
- `provider_data`: Athlete profile information

## Scopes

The module requests the following OAuth scopes:

| Scope | Description |
|-------|-------------|
| `read` | Read public data |
| `activity:read` | Read activity data |
| `activity:read_all` | Read all activities (including private) |
| `activity:write` | Create and update activities |
| `profile:read_all` | Read all profile information |

## Token Refresh

Strava access tokens expire after 6 hours. The module should implement automatic token refresh using the refresh token.

**Token Refresh Flow:**
```typescript
POST https://www.strava.com/oauth/token
Content-Type: application/json

{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "grant_type": "refresh_token",
  "refresh_token": "REFRESH_TOKEN"
}
```

**Response:**
```json
{
  "token_type": "Bearer",
  "access_token": "NEW_ACCESS_TOKEN",
  "expires_at": 1568775134,
  "expires_in": 21600,
  "refresh_token": "NEW_REFRESH_TOKEN"
}
```

## Mobile App Integration

For mobile apps, add `mobile=true` parameter:
```
GET /api/strava/connect?token={jwt_token}&mobile=true
```

The callback will use the deep link: `autoarea://oauth`

## Testing

### Test Connection

```bash
# Get JWT token first
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use token to connect Strava
# Open in browser:
http://localhost:8080/api/strava/connect?token=YOUR_JWT_TOKEN
```

### Test API Call

```bash
# After connecting Strava, test API:
curl http://localhost:8080/api/strava/athlete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `STRAVA_NOT_CONNECTED` | User hasn't connected Strava | Redirect to `/api/strava/connect` |
| `Invalid authorization code` | Code expired or already used | Restart OAuth flow |
| `Invalid access token` | Token expired | Implement token refresh |
| `Rate limit exceeded` | Too many API calls | Implement rate limiting (600/15min, 30000/day) |

## Rate Limits

Strava API rate limits:
- **Short term**: 600 requests per 15 minutes
- **Daily**: 30,000 requests per day

Monitor rate limits via response headers:
```
X-RateLimit-Limit: 600,30000
X-RateLimit-Usage: 10,250
```

## Security Best Practices

1. **Never expose tokens**: Tokens are stored server-side only
2. **Use HTTPS**: Always use HTTPS in production
3. **Validate state**: The state parameter prevents CSRF attacks
4. **Token expiration**: Implement automatic token refresh
5. **Scope minimization**: Only request necessary scopes

## Deauthorization

To disconnect Strava:
```sql
DELETE FROM user_auth_providers 
WHERE user_id = ? AND provider = 'strava';
```

Users can also revoke access from their Strava settings:
https://www.strava.com/settings/apps

## Resources

- [Strava API Documentation](https://developers.strava.com/docs/reference/)
- [OAuth 2.0 Guide](https://developers.strava.com/docs/authentication/)
- [API Playground](https://developers.strava.com/playground/)
- [Rate Limits](https://developers.strava.com/docs/rate-limits/)
