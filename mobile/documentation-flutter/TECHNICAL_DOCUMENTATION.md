# Mirror Area - Technical Overview

**Version:** 1.0.0
**Last Updated:** 2025-01-02
**Flutter SDK:** ^3.7.0
**Target Platforms:** Android, iOS

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Core Concepts](#core-concepts)
4. [Development Guidelines](#development-guidelines)
5. [Known Issues and Limitations](#known-issues-and-limitations)

> **Note:** For detailed guides on specific topics:
> - OAuth integration → See [OAUTH_INTEGRATION.md](OAUTH_INTEGRATION.md)
> - Area workflows → See [AREA_INTEGRATION.md](AREA_INTEGRATION.md)
> - Schema system → See [SCHEMA_SYSTEM_DOCUMENTATION.md](SCHEMA_SYSTEM_DOCUMENTATION.md)
> - Testing → See [TESTING.md](TESTING.md)
> - Deployment → See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Architecture Overview

### Design Pattern

The application follows a **Feature-First Architecture** with **Repository Pattern** for data access and **Provider** for state management.

**Key Principles:**
1. **Feature-First Organization** - Each feature is self-contained with its own models, services, and screens
2. **Repository Pattern** - Data access is abstracted through repositories
3. **Provider for State** - Simple, performant state management using Provider package
4. **Separation of Concerns** - Business logic separated from UI
5. **Dependency Injection** - Services injected via constructors for testability

---

## Project Structure

### Directory Layout

```
mobile/lib/
├── core/                        # Shared application infrastructure
│   ├── constants/              # API endpoints, service metadata
│   ├── errors/                 # Failure classes
│   ├── models/                 # Result type
│   ├── services/               # API, OAuth, deep linking, storage
│   └── theme/                  # App theming
│
├── features/                    # Feature modules (feature-first)
│   ├── areas/                  # Area workflow management
│   ├── auth/                   # Authentication
│   ├── services/               # Service connections
│   └── navigation/             # App routing
│
├── shared/                      # Shared components
│   ├── models/                 # Shared data models
│   ├── widgets/                # Reusable UI components
│   └── transitions/            # Page transitions
│
└── main.dart                    # Application entry point
```

**Key Files:**
- `lib/core/services/oauth_service.dart` - OAuth flow management
- `lib/features/areas/screens/area_editor_screen.dart` - Workflow editor
- `lib/features/areas/services/area_service.dart` - Area API communication
- `lib/core/constants/service_constants.dart` - Service metadata (30+ services)

---

## Core Concepts

### Result Type Pattern

All asynchronous operations return a `Result<T>` type to handle success and failure states.

**Source:** `lib/core/models/result.dart`

**Usage Pattern:**
- Check `isSuccess` for operation outcome
- Access `data` on success, `failure` on error
- Return type enables clean error handling without exceptions

### Service Constants

All service metadata (colors, icons, logo URLs) is centralized in `lib/core/constants/service_constants.dart`.

**Methods:**
- `getServiceColor(serviceName)` - Returns color for UI
- `getServiceIcon(serviceName)` - Returns Flutter icon
- `getServiceIconUrl(serviceName)` - Returns logo URL

**Supported Services:** 30+ services including Discord, GitHub, Google, Spotify, Trello, Twitch, and more.

### State Management

The application uses **Provider** for state management.

**Patterns:**
1. **Repository Pattern with ChangeNotifier** - For data access layers
2. **Provider Setup** - Configured in `main.dart` with MultiProvider
3. **Consuming State** - Use `context.read()`, `context.watch()`, or `context.select()`

**State Scope:**
- **Global State:** Authentication, user data, app configuration
- **Feature State:** Feature-specific data (areas, services)
- **Local State:** UI state (form fields, loading indicators)

### Authentication

**Flow:**
1. Check stored token in SecureStorage
2. If valid → navigate to dashboard
3. If invalid/missing → show login screen
4. After auth → store tokens and navigate

**Token Storage:**
- Access/refresh tokens: `FlutterSecureStorage` (encrypted)
- User data: `SharedPreferences` (non-sensitive only)
- Auto-refresh on 401 responses via `ApiService`

**Methods:**
- Email/Password: Standard authentication
- OAuth: Via deep linking (see [OAUTH_INTEGRATION.md](OAUTH_INTEGRATION.md))

### API Communication

The `ApiService` class (`lib/core/services/api_service.dart`) is a centralized HTTP client wrapper.

**Features:**
- Request/response serialization
- Authentication headers
- Auto token refresh on 401
- Error handling with Failure types
- Request logging

**Error Types:**
- `NetworkFailure` - No internet connection
- `ServerFailure` - Server errors (400, 500, etc.)
- `AuthFailure` - Auth errors (401, 403)
- `CacheFailure` - Local storage errors

---

## Development Guidelines

### Code Style

**Dart Conventions:**
- `lowerCamelCase` for variables, functions, parameters
- `UpperCamelCase` for classes, enums, typedefs
- `lowercase_with_underscores` for file names
- Maximum line length: 120 characters

**Commands:**
- Format: `dart format lib/`
- Lint: `flutter analyze`

### File Naming

- Screens: `login_screen.dart`, `area_editor_screen.dart`
- Widgets: `oauth_button.dart`, `navbar_item.dart`
- Services: `auth_service.dart`, `area_service.dart`
- Models: `user_model.dart`, `area.dart`

### Import Organization

1. Dart imports (`dart:async`, `dart:convert`)
2. Flutter imports (`package:flutter/material.dart`)
3. Package imports (`package:provider/provider.dart`)
4. Project imports (`../models/user.dart`)

### Git Workflow

**Branch naming:**
- `feature/oauth-integration`
- `fix/area-deletion-bug`
- `refactor/state-management`

**Commit messages:**
- `feat: add OAuth integration for Slack`
- `fix: resolve node deletion persistence issue`
- `refactor: migrate to Provider from setState`
- `docs: update technical documentation`

### Pull Request Process

1. Create feature branch from `dev`
2. Implement feature with tests
3. Run `flutter analyze` - fix all issues
4. Run `flutter test` - ensure all pass
5. Create PR with detailed description
6. Request review from team
7. Address review comments
8. Merge to `dev` after approval

---

## Known Issues and Limitations

### Current Limitations

1. **No Offline Support**
   - All operations require internet connectivity
   - No local caching of areas or workflows
   - Future: Implement offline-first architecture

2. **Limited Error Recovery**
   - Token refresh failures require re-login
   - Network failures are not automatically retried
   - Future: Implement exponential backoff retry

3. **No Real-time Updates**
   - Areas must be manually refreshed
   - No WebSocket support for live updates
   - Future: Add WebSocket integration

4. **Node Configuration Complexity**
   - Schema conversion can be fragile
   - Limited validation on mobile side
   - Future: Enhance schema validation

5. **iOS Deep Linking**
   - May require additional configuration for production
   - Universal links not yet implemented
   - Future: Add universal links support

### Known Bugs

1. **Area Editor - Multiple Save Clicks**
   - Status: Fixed in v1.0.0 via loading flag

2. **OAuth Callback Race Condition**
   - Status: Mitigated via `checkInitialLink()` on app startup

### Performance Considerations

- **Large Workflows:** 50+ nodes may cause UI lag (recommendation: virtualize list)
- **Image Loading:** Service logos loaded from network (recommendation: implement caching)
- **API Response Size:** Large area lists may be slow (recommendation: implement pagination)

---

## Quick Reference

### Essential Commands

```bash
# Development
flutter run
flutter clean
flutter pub get

# Code Quality
flutter analyze
dart format lib/
flutter test

# Build
flutter build apk --release      # Android APK
flutter build appbundle          # Android App Bundle
flutter build ios --release      # iOS
```

### Key Dependencies

**Core:** `flutter`, `provider`, `go_router`, `http`
**Auth:** `flutter_secure_storage`, `app_links`
**UI:** `url_launcher`, `cupertino_icons`
**Dev:** `flutter_lints`, `mockito`

### Environment Configuration

```bash
# Run with custom API URL
flutter run --dart-define=API_BASE_URL=https://api.mirrorarea.com
```

**See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment guide.**

---

**Document Version:** 1.0.0
**Last Updated:** 2025-01-02
**Maintained By:** Development Team
