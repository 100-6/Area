# OAuth Integration Guide

**Version:** 1.0.0
**Last Updated:** 2025-01-02

---

## Table of Contents

1. [Overview](#overview)
2. [OAuth Flow Architecture](#oauth-flow-architecture)
3. [Supported Services](#supported-services)
4. [Implementation](#implementation)
5. [Deep Link Configuration](#deep-link-configuration)
6. [Testing OAuth Flows](#testing-oauth-flows)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Mirror Area mobile app supports OAuth 2.0 authentication for connecting to external services. The OAuth flow uses a combination of external browser authentication and deep linking for callback handling.

### OAuth Flow Summary

```
Mobile App → Browser → OAuth Provider → Backend → Deep Link → Mobile App
```

### Key Components

- **OAuthService**: Manages OAuth flow initiation
- **DeepLinkService**: Handles OAuth callbacks
- **ApiService**: Communicates with backend
- **StorageService**: Stores access tokens

---

## OAuth Flow Architecture

### Complete Flow Diagram

```
┌─────────────┐
│ Mobile App  │
│             │
│ User clicks │
│ "Connect    │
│  Discord"   │
└──────┬──────┘
       │
       │ 1. Open OAuth URL
       ▼
┌─────────────────────┐
│ External Browser    │
│                     │
│ User authenticates  │
│ with Discord        │
└──────┬──────────────┘
       │
       │ 2. User grants permissions
       ▼
┌─────────────────────┐
│ Backend API         │
│                     │
│ - Receives code     │
│ - Exchanges for     │
│   access token      │
│ - Stores in DB      │
└──────┬──────────────┘
       │
       │ 3. Redirects to deep link
       ▼
┌─────────────────────┐
│ Mobile App          │
│                     │
│ - Receives callback │
│ - Updates UI        │
│ - Shows success     │
└─────────────────────┘
```

### Detailed Flow Steps

#### 1. User Initiates OAuth

```dart
// User taps "Connect Discord"
await oauthService.connectService('discord', userToken: token);
```

#### 2. App Opens OAuth URL

```dart
// OAuthService opens browser
final url = 'https://api.mirrorarea.com/api/auth/discord?mobile=true&token=USER_JWT';
await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
```

#### 3. User Authenticates

User logs in to Discord and grants permissions in the browser.

#### 4. Backend Exchanges Code

Backend receives authorization code and exchanges it for access token:

```javascript
// Backend route
router.get('/api/auth/discord/callback', async (req, res) => {
  const { code } = req.query;

  // Exchange code for access token
  const token = await exchangeCodeForToken(code);

  // Store in database
  await saveUserToken(userId, 'discord', token);

  // Redirect to mobile app
  res.redirect('autoarea://oauth/service/success?service=discord');
});
```

#### 5. App Receives Deep Link

```dart
// DeepLinkService handles callback
void _handleOAuthCallback(Uri uri) {
  if (uri.path == '/service/success') {
    final serviceName = uri.queryParameters['service'];
    print('Service connected: $serviceName');
    onServiceConnected?.call(serviceName);
  }
}
```

---

## Supported Services

### OAuth 2.0 Services

Services that require user authentication via OAuth:

#### Core OAuth Services

| Service | Route | OAuth Provider |
|---------|-------|----------------|
| Discord | `/api/auth/discord` | Discord OAuth |
| GitHub | `/api/auth/github` | GitHub OAuth |
| GitLab | `/api/auth/gitlab` | GitLab OAuth |
| Google | `/api/auth/google` | Google OAuth |
| Dropbox | `/api/auth/dropbox` | Dropbox OAuth |
| Trello | `/api/auth/trello` | Trello OAuth |
| Twitch | `/api/auth/twitch` | Twitch OAuth |

#### Service-Specific Routes

| Service | Route | OAuth Provider |
|---------|-------|----------------|
| Gmail | `/api/gmail/connect` | Google OAuth (Gmail scope) |
| Outlook | `/api/outlook/connect` | Microsoft OAuth |
| Spotify | `/api/spotify/connect` | Spotify OAuth |
| Strava | `/api/strava/connect` | Strava OAuth |
| Reddit | `/api/reddit/connect` | Reddit OAuth |
| Slack | `/api/slack/connect` | Slack OAuth |
| Bitly | `/api/bitly/connect` | Bitly OAuth |

### API Key Services

Services that require manual API key configuration:

- **OpenAI**: API key in service config
- **Telegram**: Bot token + chat ID
- **Shodan**: API key

### No-Auth Services

Services that don't require authentication:

- **Timer**: Built-in trigger
- **Console**: Built-in action
- **RSS**: Public feeds
- **Webhook**: HTTP requests
- **Ntfy**: Public notifications
- **Weather**: Public API
- **Currency**: Public exchange rates
- **Crypto**: Public cryptocurrency data
- **Books**: Public book data
- **AppleMusic**: Public search

---

## Implementation

### OAuthService

**`lib/core/services/oauth_service.dart`:**

```dart
class OAuthService {
  static const String baseUrl = ApiConstants.baseUrl;

  /// Connect a service using OAuth
  Future<OAuthResult> connectService(
    String serviceName, {
    String? userToken,
  }) async {
    final authUrl = _getServiceAuthUrl(serviceName);

    // Build URL with parameters
    var url = '$authUrl?mobile=true';
    if (userToken != null) {
      url += '&token=$userToken';
    }

    // Open in external browser
    final uri = Uri.parse(url);
    final launched = await launchUrl(
      uri,
      mode: LaunchMode.externalApplication,
    );

    if (!launched) {
      return OAuthResult.error('Could not launch browser');
    }

    return OAuthResult.pending();
  }

  /// Get OAuth URL for service
  String _getServiceAuthUrl(String service) {
    // Services with dedicated routes
    if (service == 'gmail') return '$baseUrl/api/gmail/connect';
    if (service == 'outlook') return '$baseUrl/api/outlook/connect';
    if (service == 'spotify') return '$baseUrl/api/spotify/connect';
    if (service == 'strava') return '$baseUrl/api/strava/connect';
    if (service == 'reddit') return '$baseUrl/api/reddit/connect';
    if (service == 'slack') return '$baseUrl/api/slack/connect';
    if (service == 'bitly') return '$baseUrl/api/bitly/connect';

    // Generic auth route
    return '$baseUrl/api/auth/$service';
  }
}

class OAuthResult {
  final bool isSuccess;
  final String? error;

  OAuthResult.pending() : isSuccess = false, error = null;
  OAuthResult.error(this.error) : isSuccess = false;
}
```

### DeepLinkService

**`lib/core/services/deep_link_service.dart`:**

```dart
class DeepLinkService {
  final _appLinks = AppLinks();
  StreamSubscription<Uri>? _linkSubscription;

  Function(String serviceName)? onServiceConnected;
  Function(String error)? onOAuthError;
  Function(String token, String? refreshToken)? onAuthSuccess;

  AuthRepository? _authRepository;

  void initialize(
    AuthRepository authRepository, {
    Function(String)? onServiceConnected,
    Function(String)? onOAuthError,
  }) {
    _authRepository = authRepository;
    this.onServiceConnected = onServiceConnected;
    this.onOAuthError = onOAuthError;
  }

  void startListening() {
    _linkSubscription = _appLinks.uriLinkStream.listen(
      _handleDeepLink,
      onError: (err) {
        print('Deep link error: $err');
      },
    );
  }

  void stopListening() {
    _linkSubscription?.cancel();
  }

  Future<void> checkInitialLink() async {
    try {
      final uri = await _appLinks.getInitialLink();
      if (uri != null) {
        _handleDeepLink(uri);
      }
    } catch (e) {
      print('Error checking initial link: $e');
    }
  }

  void _handleDeepLink(Uri uri) {
    print('Deep link received: $uri');

    // Check for errors
    if (uri.queryParameters.containsKey('error')) {
      final error = uri.queryParameters['error']!;
      onOAuthError?.call(error);
      return;
    }

    // Authentication callback (has token)
    if (uri.queryParameters.containsKey('token')) {
      final token = uri.queryParameters['token']!;
      final refreshToken = uri.queryParameters['refresh'];
      _handleAuthSuccess(token, refreshToken);
      return;
    }

    // Service connection callback
    if (uri.path.contains('/service/success')) {
      final serviceName = uri.queryParameters['service'];
      if (serviceName != null) {
        onServiceConnected?.call(serviceName);
      }
      return;
    }

    // Legacy format
    if (uri.queryParameters.containsKey('success')) {
      final serviceName = uri.queryParameters['success']!;
      onServiceConnected?.call(serviceName);
      return;
    }
  }

  void _handleAuthSuccess(String token, String? refreshToken) {
    _authRepository?.saveTokensFromOAuth(token, refreshToken);
    onAuthSuccess?.call(token, refreshToken);
  }
}
```

---

## Deep Link Configuration

### Android Configuration

**`android/app/src/main/AndroidManifest.xml`:**

```xml
<manifest>
  <application>
    <activity android:name=".MainActivity">
      <!-- Regular intent filter -->
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>

      <!-- Deep link intent filter -->
      <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />

        <!-- OAuth deep links -->
        <data
          android:scheme="autoarea"
          android:host="oauth" />
      </intent-filter>
    </activity>
  </application>
</manifest>
```

### iOS Configuration

**`ios/Runner/Info.plist`:**

```xml
<dict>
  <!-- Existing keys... -->

  <!-- URL Types for deep linking -->
  <key>CFBundleURLTypes</key>
  <array>
    <dict>
      <key>CFBundleTypeRole</key>
      <string>Editor</string>
      <key>CFBundleURLName</key>
      <string>com.mirrorarea.app</string>
      <key>CFBundleURLSchemes</key>
      <array>
        <string>autoarea</string>
      </array>
    </dict>
  </array>
</dict>
```

### Deep Link Patterns

#### Authentication Success

```
autoarea://oauth/auth/success?token=JWT_TOKEN&refresh=REFRESH_TOKEN&provider=discord
```

#### Service Connection Success

```
autoarea://oauth/service/success?service=discord
```

#### Error Handling

```
autoarea://oauth/services?error=access_denied
```

---

## Testing OAuth Flows

### Testing Locally

#### 1. Start Backend

```bash
docker-compose up -d
```

#### 2. Configure OAuth Credentials

Create OAuth apps for each service and add credentials to backend `.env`:

```env
# Discord
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret

# GitHub
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# Configure callback URLs
FRONTEND_URL=http://localhost:8080
MOBILE_REDIRECT_SCHEME=autoarea
```

#### 3. Test on Device

**For physical device:**

Update API URL with your computer's IP:

```dart
static const String baseUrl = 'http://192.168.1.100:8080';
```

**For emulator:**

```dart
// Android emulator
static const String baseUrl = 'http://10.0.2.2:8080';

// iOS simulator
static const String baseUrl = 'http://localhost:8080';
```

#### 4. Execute OAuth Flow

1. Run mobile app
2. Navigate to Services screen
3. Tap "Connect" on a service
4. Complete authentication in browser
5. Verify app receives callback

### Testing Deep Links Manually

#### Android

```bash
# Test success callback
adb shell am start -W -a android.intent.action.VIEW \
  -d "autoarea://oauth/service/success?service=discord" \
  com.mirrorarea.app

# Test error callback
adb shell am start -W -a android.intent.action.VIEW \
  -d "autoarea://oauth/services?error=access_denied" \
  com.mirrorarea.app
```

#### iOS

```bash
# Using xcrun simctl (simulator only)
xcrun simctl openurl booted "autoarea://oauth/service/success?service=discord"

# Using Xcode URL scheme testing
# Edit scheme → Run → Arguments → Environment Variables
# Add: -FIRDebugEnabled
```

### Debugging OAuth

#### Enable Logging

```dart
// In OAuthService
Future<OAuthResult> connectService(String serviceName, {String? userToken}) async {
  final authUrl = _getServiceAuthUrl(serviceName);
  final url = '$authUrl?mobile=true${userToken != null ? '&token=$userToken' : ''}';

  print('🔐 OAuth: Opening URL: $url');

  final launched = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);

  print('🔐 OAuth: Browser launched: $launched');

  return launched ? OAuthResult.pending() : OAuthResult.error('Could not launch browser');
}

// In DeepLinkService
void _handleDeepLink(Uri uri) {
  print('🔗 Deep Link: Received URI: $uri');
  print('🔗 Deep Link: Path: ${uri.path}');
  print('🔗 Deep Link: Query params: ${uri.queryParameters}');

  // Rest of handling...
}
```

#### Check Backend Logs

```bash
# Check backend OAuth logs
docker-compose logs -f api | grep -i oauth
```

---

## Troubleshooting

### Issue: "Browser opens but no callback received"

**Possible Causes:**
1. Deep link not configured correctly
2. Backend not redirecting to correct URL
3. App not listening for deep links

**Solution:**

1. **Verify deep link configuration:**

```bash
# Android
adb shell dumpsys package com.mirrorarea.app | grep -A 10 "autoarea"

# Should show intent filter with autoarea scheme
```

2. **Check backend redirect URL:**

```javascript
// Backend should redirect to:
res.redirect(`autoarea://oauth/service/success?service=${serviceName}`);
```

3. **Ensure DeepLinkService is initialized:**

```dart
// In main.dart or app initialization
final deepLinkService = DeepLinkService();
deepLinkService.initialize(authRepository, onServiceConnected: (service) {
  print('Connected: $service');
});
deepLinkService.startListening();
```

### Issue: "OAuth flow works on iOS but not Android"

**Cause:** Android emulator uses different localhost address

**Solution:**

```dart
// For Android emulator
static const String baseUrl = 'http://10.0.2.2:8080';

// For iOS simulator
static const String baseUrl = 'http://localhost:8080';
```

### Issue: "Access denied error"

**Cause:** User denied permissions or OAuth credentials incorrect

**Solution:**

1. Check backend OAuth credentials are correct
2. Verify callback URLs match in OAuth provider settings
3. Ensure required scopes are requested

### Issue: "Token not saved after OAuth"

**Cause:** DeepLinkService not properly handling auth success

**Solution:**

```dart
// Ensure auth repository method exists
class AuthRepository {
  Future<void> saveTokensFromOAuth(String token, String? refreshToken) async {
    await _storageService.saveToken(token);
    if (refreshToken != null) {
      await _storageService.saveRefreshToken(refreshToken);
    }
    notifyListeners();
  }
}
```

### Issue: "Deep link opens app but wrong screen shown"

**Cause:** Navigation not handling deep link context

**Solution:**

Implement proper routing in deep link handler:

```dart
void _handleDeepLink(Uri uri) {
  // ... handle callback

  // Navigate to appropriate screen
  if (onServiceConnected != null) {
    // Already on services screen - just refresh
    onServiceConnected?.call(serviceName);
  } else {
    // Navigate to services screen
    Navigator.of(context).pushNamed('/services');
  }
}
```

---

## Best Practices

1. **Always use external browser** for OAuth (don't use WebView)
2. **Validate redirect URIs** in backend
3. **Handle errors gracefully** with user-friendly messages
4. **Test on real devices** not just simulators
5. **Log OAuth flows** for debugging
6. **Secure token storage** using FlutterSecureStorage
7. **Implement token refresh** for expired tokens
8. **Handle network errors** during OAuth flow

---

**See also:**
- [Area Integration Guide](AREA_INTEGRATION.md)
- [Quick Start Guide](QUICK_START_AREA_MOBILE.md)
- [Technical Documentation](TECHNICAL_DOCUMENTATION.md)
