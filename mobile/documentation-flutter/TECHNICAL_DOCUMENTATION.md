# Mirror Area - Mobile Application Technical Documentation

**Version:** 1.0.0
**Last Updated:** 2025-01-02
**Flutter SDK:** ^3.7.0
**Target Platforms:** Android, iOS

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Core Concepts](#core-concepts)
4. [State Management](#state-management)
5. [Authentication System](#authentication-system)
6. [OAuth Integration](#oauth-integration)
7. [API Communication](#api-communication)
8. [Area Workflow System](#area-workflow-system)
9. [Deep Linking](#deep-linking)
10. [Error Handling](#error-handling)
11. [Development Guidelines](#development-guidelines)
12. [Testing Strategy](#testing-strategy)
13. [Known Issues and Limitations](#known-issues-and-limitations)

---

## Architecture Overview

### Design Pattern

The application follows a **Feature-First Architecture** with **Repository Pattern** for data access and **Provider** for state management.

```
lib/
├── core/               # Shared application-wide code
├── features/           # Feature modules (areas, auth, services)
└── shared/             # Shared UI components and utilities
```

### Key Architectural Decisions

1. **Feature-First Organization**: Each feature is self-contained with its own models, services, and screens
2. **Repository Pattern**: Data access is abstracted through repositories
3. **Provider for State**: Simple, performant state management using Provider package
4. **Separation of Concerns**: Business logic separated from UI
5. **Dependency Injection**: Services injected via constructors for testability

---

## Project Structure

### Directory Layout

```
mobile/
├── lib/
│   ├── core/                           # Core application infrastructure
│   │   ├── constants/                  # Application-wide constants
│   │   │   ├── api_constants.dart      # API endpoints and configuration
│   │   │   └── service_constants.dart  # Service metadata (colors, icons, URLs)
│   │   ├── errors/                     # Error definitions
│   │   │   └── failures.dart           # Failure classes for error handling
│   │   ├── models/                     # Core data models
│   │   │   └── result.dart             # Result type for operation outcomes
│   │   ├── services/                   # Core services
│   │   │   ├── api_service.dart        # HTTP client wrapper
│   │   │   ├── oauth_service.dart      # OAuth flow management
│   │   │   ├── deep_link_service.dart  # Deep link handling
│   │   │   └── storage_service.dart    # Secure local storage
│   │   └── theme/                      # Application theming
│   │       └── app_theme.dart          # Theme definitions
│   │
│   ├── features/                       # Feature modules
│   │   ├── areas/                      # Area workflow management
│   │   │   ├── models/                 # Area-specific models
│   │   │   │   ├── area.dart           # Area entity
│   │   │   │   ├── workflow_node.dart  # Workflow node entity
│   │   │   │   └── service_info.dart   # Service metadata
│   │   │   ├── screens/                # Area UI screens
│   │   │   │   ├── area_list_screen.dart
│   │   │   │   ├── area_editor_screen.dart
│   │   │   │   └── service_selector_screen.dart
│   │   │   ├── services/               # Area business logic
│   │   │   │   ├── area_service.dart   # Area API communication
│   │   │   │   └── module_config_service.dart
│   │   │   └── utils/                  # Area utilities
│   │   │       └── node_config_helper.dart
│   │   │
│   │   ├── auth/                       # Authentication feature
│   │   │   ├── data/                   # Data layer
│   │   │   │   ├── auth_repository.dart # Auth data access
│   │   │   │   └── user_model.dart     # User entity
│   │   │   ├── presentation/           # Presentation layer
│   │   │   │   ├── screens/            # Auth screens
│   │   │   │   └── providers/          # Auth state providers
│   │   │   └── domain/                 # Domain layer (business logic)
│   │   │
│   │   ├── services/                   # Service connection management
│   │   │   ├── models/                 # Service models
│   │   │   └── screens/
│   │   │       └── services_screen.dart
│   │   │
│   │   └── navigation/                 # App navigation
│   │       └── app_router.dart         # GoRouter configuration
│   │
│   ├── shared/                         # Shared components
│   │   ├── models/                     # Shared data models
│   │   ├── widgets/                    # Reusable UI components
│   │   │   ├── navbar/                 # Navigation bar components
│   │   │   └── oauth_button.dart       # OAuth login button
│   │   └── transitions/                # Page transitions
│   │
│   └── main.dart                       # Application entry point
│
├── documentation-flutter/              # Documentation
│   ├── TECHNICAL_DOCUMENTATION.md      # This file
│   └── SCHEMA_SYSTEM_DOCUMENTATION.md  # Schema conversion system
│
└── pubspec.yaml                        # Project dependencies
```

---

## Core Concepts

### Result Type Pattern

All asynchronous operations return a `Result<T>` type to handle success and failure states:

```dart
class Result<T> {
  final T? data;
  final Failure? failure;
  final bool isSuccess;

  Result.success(this.data) : isSuccess = true, failure = null;
  Result.failure(this.failure) : isSuccess = false, data = null;
}
```

**Usage:**

```dart
final result = await authRepository.signIn(email, password);

if (result.isSuccess) {
  final user = result.data;
  // Handle success
} else {
  final error = result.failure?.message;
  // Handle error
}
```

### Service Constants

All service metadata (colors, icons, logo URLs) is centralized in `service_constants.dart`:

```dart
ServiceConstants.getServiceColor('discord');    // Returns Color(0xFF5865F2)
ServiceConstants.getServiceIcon('discord');     // Returns Icons.discord
ServiceConstants.getServiceIconUrl('discord');  // Returns logo URL
```

**Supported Services:**
- OAuth2: Discord, GitHub, GitLab, Google, Gmail, Dropbox, Spotify, Strava, Reddit, Slack, Trello, Twitch, Bitly, Outlook
- API Key: OpenAI, Shodan, Telegram
- No Auth: Timer, Console, RSS, Webhook, Ntfy, Weather, Currency, Crypto, Books, AppleMusic

---

## State Management

### Provider Architecture

The application uses **Provider** for state management with the following patterns:

#### 1. Repository Pattern with ChangeNotifier

```dart
class AuthRepository extends ChangeNotifier {
  User? _currentUser;

  User? get currentUser => _currentUser;

  Future<Result<User>> signIn(String email, String password) async {
    // Authentication logic
    _currentUser = user;
    notifyListeners();  // Notify widgets of state change
    return Result.success(user);
  }
}
```

#### 2. Provider Setup (main.dart)

```dart
MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (_) => AuthRepository()),
    ChangeNotifierProvider(create: (_) => ServiceProvider()),
  ],
  child: MyApp(),
)
```

#### 3. Consuming State

```dart
// Reading state
final authRepo = context.read<AuthRepository>();

// Watching state changes
final user = context.watch<AuthRepository>().currentUser;

// Selecting specific properties
final email = context.select<AuthRepository, String?>(
  (repo) => repo.currentUser?.email,
);
```

### State Scope Guidelines

- **Global State**: Authentication, user data, app configuration
- **Feature State**: Feature-specific data (areas, services)
- **Local State**: UI state (form fields, loading indicators)

---

## Authentication System

### Authentication Flow

```
1. User opens app
2. Check stored token in SecureStorage
3. If token exists → validate with backend → navigate to dashboard
4. If no token → show login/register screen
5. User authenticates (email/password or OAuth)
6. Store token and refresh token
7. Navigate to dashboard
```

### Authentication Methods

#### 1. Email/Password Authentication

```dart
final result = await authRepository.signIn(
  email: 'user@example.com',
  password: 'password123',
);
```

#### 2. OAuth Authentication

```dart
final result = await oauthService.signInWithProvider(
  OAuthProvider.google,
);
// Handled via deep linking callback
```

### Token Management

**Storage:**
- Access tokens: Stored in `FlutterSecureStorage`
- Refresh tokens: Stored in `FlutterSecureStorage`
- User data: Stored in `SharedPreferences` (non-sensitive only)

**Token Refresh:**

```dart
Future<Result<String>> refreshAccessToken() async {
  final refreshToken = await _storageService.getRefreshToken();

  final response = await _apiService.post(
    '/api/auth/refresh',
    body: {'refreshToken': refreshToken},
  );

  final newToken = response['token'];
  await _storageService.saveToken(newToken);

  return Result.success(newToken);
}
```

**Auto-Refresh on 401:**

The `ApiService` automatically refreshes tokens on 401 responses:

```dart
if (response.statusCode == 401) {
  final refreshed = await _refreshToken();
  if (refreshed) {
    // Retry original request
    return await _retryRequest(request);
  }
}
```

---

## OAuth Integration

### OAuth Flow Architecture

```
Mobile App → Browser → OAuth Provider → Backend Callback → Deep Link → Mobile App
```

### Implementation Details

#### 1. Initiating OAuth Flow

```dart
Future<OAuthResult> connectService(String serviceName, {String? userToken}) async {
  final authUrl = _getServiceAuthUrl(serviceName);

  var url = '$authUrl?mobile=true';
  if (userToken != null) {
    url += '&token=$userToken';  // Pass JWT for service connection
  }

  await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  return OAuthResult.pending();
}
```

#### 2. Service Route Mapping

**Services with dedicated routes:**

```dart
if (service == 'gmail') return '$baseUrl/api/gmail/connect';
if (service == 'outlook') return '$baseUrl/api/outlook/connect';
if (service == 'spotify') return '$baseUrl/api/spotify/connect';
if (service == 'strava') return '$baseUrl/api/strava/connect';
if (service == 'reddit') return '$baseUrl/api/reddit/connect';
if (service == 'slack') return '$baseUrl/api/slack/connect';
if (service == 'bitly') return '$baseUrl/api/bitly/connect';
```

**Services using generic auth routes:**

```dart
// Discord, GitHub, GitLab, Dropbox, Google, Telegram, Trello, Twitch
return '$baseUrl/api/auth/$service';
```

#### 3. OAuth Callback Handling

The backend redirects to the app via deep links:

**For authentication (login/register):**
```
autoarea://oauth/auth/success?token=<JWT>&refresh=<REFRESH>&provider=<PROVIDER>
```

**For service connection:**
```
autoarea://oauth/service/success?service=<SERVICE_NAME>
```

**For errors:**
```
autoarea://oauth/services?error=<ERROR_MESSAGE>
```

#### 4. Deep Link Processing

```dart
void _handleOAuthCallback(Uri uri) {
  final queryParams = uri.queryParameters;

  // Check for errors
  if (queryParams.containsKey('error')) {
    _handleOAuthError(queryParams['error']);
    return;
  }

  // Authentication callback (has token)
  if (queryParams.containsKey('token')) {
    final token = queryParams['token'];
    final refreshToken = queryParams['refresh'];
    _handleOAuthSuccess(token, refreshToken);
    return;
  }

  // Service connection callback (has service name)
  final serviceName = queryParams['service'] ?? queryParams['success'];
  if (serviceName != null) {
    _handleServiceConnected(serviceName);
    return;
  }
}
```

### Mobile Detection

The backend detects mobile requests via:

```dart
// Mobile parameter
?mobile=true

// User-Agent header
/Mobile|Android|iPhone|iPad|iPod|Windows Phone/i
```

---

## API Communication

### ApiService Architecture

The `ApiService` is a centralized HTTP client wrapper that handles:

- Request/response serialization
- Authentication headers
- Token refresh on 401
- Error handling
- Request logging

#### Core Methods

```dart
class ApiService {
  Future<Map<String, dynamic>> get(String path, {Map<String, String>? headers});
  Future<Map<String, dynamic>> post(String path, {dynamic body, Map<String, String>? headers});
  Future<Map<String, dynamic>> patch(String path, {dynamic body, Map<String, String>? headers});
  Future<Map<String, dynamic>> delete(String path, {Map<String, String>? headers});
}
```

#### Usage Example

```dart
final apiService = ApiService();

// GET request
final response = await apiService.get(
  '/api/areas',
  headers: {'Authorization': 'Bearer $token'},
);

// POST request
final response = await apiService.post(
  '/api/areas',
  body: {'name': 'My Area', 'description': 'Test'},
  headers: {'Authorization': 'Bearer $token'},
);
```

#### Error Handling

All API errors are converted to `Failure` objects:

```dart
try {
  final response = await apiService.get('/api/areas');
} on NetworkFailure catch (e) {
  // Handle network errors
} on ServerFailure catch (e) {
  // Handle server errors (400, 500, etc.)
} on AuthFailure catch (e) {
  // Handle auth errors (401, 403)
}
```

### API Endpoints Reference

#### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify` - Verify token validity

#### OAuth

- `GET /api/auth/:provider` - Initiate OAuth flow (Discord, GitHub, etc.)
- `GET /api/auth/:provider/callback` - OAuth callback handler
- `GET /api/:service/connect` - Service-specific OAuth (Gmail, Spotify, etc.)
- `GET /api/:service/callback` - Service callback handler

#### Areas

- `GET /api/areas` - Get all user areas
- `GET /api/areas/:id` - Get specific area
- `POST /api/areas` - Create new area
- `PATCH /api/areas/:id` - Update area
- `DELETE /api/areas/:id` - Delete area
- `PATCH /api/areas/:id/toggle` - Toggle area active/inactive

#### Workflows

- `GET /api/workflows/:areaId` - Get workflow nodes
- `POST /api/workflows/:areaId/nodes` - Create workflow node
- `PATCH /api/workflows/nodes/:nodeId` - Update node configuration
- `DELETE /api/workflows/nodes/:nodeId` - Delete node
- `POST /api/workflows/:areaId/connections` - Create connection
- `DELETE /api/workflows/connections/:connectionId` - Delete connection

#### Services

- `GET /api/services/connected` - Get user's connected services
- `GET /api/services/available` - Get all available services
- `GET /api/modules/:identifier` - Get module variables/schema

---

## Area Workflow System

### Workflow Architecture

An **Area** is a workflow composed of:
- **1 Trigger**: Event that initiates the workflow
- **N Actions**: Sequential operations executed when triggered

```
[Trigger] → [Action 1] → [Action 2] → [Action N]
```

### Data Models

#### Area

```dart
class Area {
  final String id;
  final String userId;
  final String name;
  final String? description;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? updatedAt;
}
```

#### WorkflowNode

```dart
class WorkflowNode {
  final String id;              // Node UUID (or temp_action_N for new nodes)
  final String areaId;
  final String nodeType;        // 'trigger' or 'action'
  final String? serviceId;      // Service name (discord, github, etc.)
  final String? actionId;       // Trigger name (for triggers)
  final String? reactionId;     // Action name (for actions)
  final Map<String, dynamic> config;  // Node configuration
  final double positionX;       // UI position
  final double positionY;
  final String? label;
  final DateTime createdAt;
  final DateTime? updatedAt;
}
```

### Area Creation Flow

#### 1. Creating a New Area

```dart
// Step 1: Create Area entity
final area = await areaService.createArea(
  name: 'My Workflow',
  description: 'Description',
  token: token,
);

// Step 2: Create Trigger node
final trigger = await areaService.createWorkflowNode(
  areaId: area.id,
  nodeType: 'trigger',
  serviceId: 'discord',
  actionId: 'new_message',
  config: {'channel_id': '123'},
  positionX: 100,
  positionY: 100,
  token: token,
);

// Step 3: Create Action nodes
final action1 = await areaService.createWorkflowNode(
  areaId: area.id,
  nodeType: 'action',
  serviceId: 'github',
  reactionId: 'create_issue',
  config: {'title': 'New issue'},
  positionX: 300,
  positionY: 100,
  token: token,
);

// Step 4: Create Connections
await areaService.createWorkflowConnection(
  areaId: area.id,
  sourceNodeId: trigger.id,
  targetNodeId: action1.id,
  token: token,
);
```

#### 2. Updating an Existing Area

When updating an existing area, the system:

1. Updates area name/description
2. Identifies new nodes (nodes with `temp_*` IDs)
3. Creates new nodes in the backend
4. Connects new nodes to the workflow chain

```dart
// Detect new nodes
final newNodes = _actionNodes.where((node) => node.id.startsWith('temp_')).toList();

// Get existing nodes to find last node
final existingNodes = await areaService.getWorkflowNodes(areaId: areaId, token: token);
String? lastNodeId = existingNodes.last.id;

// Create each new node and connect it
for (final newNode in newNodes) {
  final created = await areaService.createWorkflowNode(...);
  await areaService.createWorkflowConnection(
    sourceNodeId: lastNodeId,
    targetNodeId: created.id,
    ...
  );
  lastNodeId = created.id;
}
```

#### 3. Deleting Nodes

Node deletion is handled differently based on node state:

- **Temporary nodes** (`temp_*`): Removed locally only
- **Existing nodes**: Deleted from backend, then removed locally

```dart
onPressed: () async {
  // If existing node, delete from backend first
  if (widget.areaId != null && !node.id.startsWith('temp_')) {
    await areaService.deleteWorkflowNode(nodeId: node.id, token: token);
  }

  // Remove from local state
  setState(() {
    _actionNodes.remove(node);
  });
}
```

### Node Configuration System

Node configurations are managed through a schema conversion system. See `SCHEMA_SYSTEM_DOCUMENTATION.md` for details.

**Key Concepts:**

1. **Backend Schema**: Defines expected configuration structure
2. **Mobile Schema**: Simplified schema for mobile UI generation
3. **Schema Converter**: Converts between backend and mobile formats
4. **Variable Resolution**: Handles dynamic variables from previous nodes

**Example Flow:**

```dart
// 1. Fetch schema from backend
final schema = await moduleConfigService.getOutputSchemaByName(
  moduleName: 'discord',
  actionOrTriggerName: 'send_message',
  type: 'action',
  token: token,
);

// 2. Convert to mobile schema
final mobileSchema = SchemaConverter.convertToMobileSchema(schema);

// 3. Display configuration UI
final config = await NodeConfigHelper.openConfigScreen(
  context: context,
  nodeType: 'action',
  serviceName: 'discord',
  actionName: 'send_message',
  serviceReaction: reactionData,
  previousNodeOutputSchema: previousOutputs,
);

// 4. Convert mobile config back to backend format
final backendConfig = SchemaConverter.convertMobileConfigToBackend(
  config,
  'discord',
);

// 5. Save to backend
await areaService.updateWorkflowNode(
  nodeId: nodeId,
  config: backendConfig,
  token: token,
);
```

---

## Deep Linking

### Configuration

**Android (android/app/src/main/AndroidManifest.xml):**

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="autoarea" android:host="oauth" />
</intent-filter>
```

**iOS (ios/Runner/Info.plist):**

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>autoarea</string>
        </array>
    </dict>
</array>
```

### Deep Link Patterns

```
autoarea://oauth/auth/success?token=<JWT>&refresh=<REFRESH>&provider=<PROVIDER>
autoarea://oauth/service/success?service=<SERVICE>
autoarea://oauth/services?success=<SERVICE>
autoarea://oauth/services?error=<ERROR>
```

### DeepLinkService

```dart
class DeepLinkService {
  void initialize(AuthRepository authRepository, {
    Function(String)? onServiceConnected,
    Function(String)? onOAuthError,
  });

  void startListening();  // Start listening for deep links
  void stopListening();   // Stop listening
  Future<void> checkInitialLink();  // Check for app launch via deep link
}
```

**Usage:**

```dart
final deepLinkService = DeepLinkService();

deepLinkService.initialize(
  authRepository,
  onServiceConnected: (serviceName) {
    print('Service $serviceName connected');
    // Refresh services list
  },
  onOAuthError: (error) {
    print('OAuth error: $error');
    // Show error message
  },
);

deepLinkService.startListening();
```

---

## Error Handling

### Failure Hierarchy

```dart
abstract class Failure {
  final String message;
  final int? statusCode;

  const Failure(this.message, {this.statusCode});
}

class NetworkFailure extends Failure {
  const NetworkFailure(String message) : super(message);
}

class ServerFailure extends Failure {
  const ServerFailure(String message, {int? statusCode})
      : super(message, statusCode: statusCode);
}

class AuthFailure extends Failure {
  const AuthFailure(String message) : super(message);
}

class CacheFailure extends Failure {
  const CacheFailure(String message) : super(message);
}
```

### Error Handling Pattern

```dart
Future<Result<T>> performOperation() async {
  try {
    final response = await apiService.get('/endpoint');
    return Result.success(parseResponse(response));
  } on NetworkFailure catch (e) {
    return Result.failure(NetworkFailure('No internet connection'));
  } on ServerFailure catch (e) {
    return Result.failure(ServerFailure('Server error: ${e.message}'));
  } on AuthFailure catch (e) {
    // Auto-logout user
    await authRepository.logout();
    return Result.failure(e);
  } catch (e) {
    return Result.failure(ServerFailure('Unexpected error: $e'));
  }
}
```

### User Feedback

**SnackBar for transient errors:**

```dart
ScaffoldMessenger.of(context).showSnackBar(
  SnackBar(
    content: Text(error.message),
    backgroundColor: Colors.red,
    behavior: SnackBarBehavior.floating,
  ),
);
```

**Dialog for critical errors:**

```dart
showDialog(
  context: context,
  builder: (context) => AlertDialog(
    title: Text('Error'),
    content: Text(error.message),
    actions: [
      TextButton(
        onPressed: () => Navigator.pop(context),
        child: Text('OK'),
      ),
    ],
  ),
);
```

---

## Development Guidelines

### Code Style

**Follow Dart conventions:**

- Use `lowerCamelCase` for variables, functions, parameters
- Use `UpperCamelCase` for classes, enums, typedefs
- Use `lowercase_with_underscores` for file names
- Maximum line length: 120 characters

**Formatting:**

```bash
dart format lib/
```

**Linting:**

```bash
flutter analyze
```

### File Naming

```
// Screens
login_screen.dart
area_editor_screen.dart

// Widgets
oauth_button.dart
navbar_item.dart

// Services
auth_service.dart
area_service.dart

// Models
user_model.dart
area.dart
```

### Import Organization

```dart
// 1. Dart imports
import 'dart:async';
import 'dart:convert';

// 2. Flutter imports
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

// 3. Package imports
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

// 4. Project imports
import '../models/user.dart';
import '../services/auth_service.dart';
```

### Documentation

**Document all public APIs:**

```dart
/// Authenticates a user with email and password.
///
/// Returns a [Result] containing the authenticated [User] on success,
/// or a [Failure] on error.
///
/// Throws [NetworkFailure] if there is no internet connection.
/// Throws [AuthFailure] if credentials are invalid.
Future<Result<User>> signIn({
  required String email,
  required String password,
}) async {
  // Implementation
}
```

### Git Workflow

**Branch naming:**

```
feature/oauth-integration
fix/area-deletion-bug
refactor/state-management
```

**Commit messages:**

```
feat: add OAuth integration for Slack
fix: resolve node deletion persistence issue
refactor: migrate to Provider from setState
docs: update technical documentation
```

### Pull Request Process

1. Create feature branch from `dev`
2. Implement feature with tests
3. Run `flutter analyze` and fix all issues
4. Run `flutter test` and ensure all tests pass
5. Create PR with detailed description
6. Request review from team
7. Address review comments
8. Merge to `dev` after approval

---

## Testing Strategy

### Test Structure

```
test/
├── unit/               # Unit tests for business logic
│   ├── services/
│   └── repositories/
├── widget/             # Widget tests for UI components
│   ├── screens/
│   └── widgets/
└── integration/        # Integration tests
    └── flows/
```

### Unit Testing

**Test services and repositories:**

```dart
void main() {
  group('AuthRepository', () {
    late AuthRepository authRepository;
    late MockApiService mockApiService;

    setUp(() {
      mockApiService = MockApiService();
      authRepository = AuthRepository(apiService: mockApiService);
    });

    test('signIn returns user on success', () async {
      // Arrange
      when(mockApiService.post(any, body: any))
          .thenAnswer((_) async => {'user': {...}, 'token': '...'});

      // Act
      final result = await authRepository.signIn(
        email: 'test@example.com',
        password: 'password',
      );

      // Assert
      expect(result.isSuccess, true);
      expect(result.data, isA<User>());
    });

    test('signIn returns failure on invalid credentials', () async {
      // Arrange
      when(mockApiService.post(any, body: any))
          .thenThrow(ServerFailure('Invalid credentials', statusCode: 401));

      // Act
      final result = await authRepository.signIn(
        email: 'test@example.com',
        password: 'wrong',
      );

      // Assert
      expect(result.isSuccess, false);
      expect(result.failure, isA<AuthFailure>());
    });
  });
}
```

### Widget Testing

**Test UI components:**

```dart
void main() {
  testWidgets('LoginScreen displays error on invalid credentials', (tester) async {
    // Arrange
    await tester.pumpWidget(
      MaterialApp(
        home: LoginScreen(),
      ),
    );

    // Act
    await tester.enterText(find.byKey(Key('email')), 'test@example.com');
    await tester.enterText(find.byKey(Key('password')), 'wrong');
    await tester.tap(find.byKey(Key('login-button')));
    await tester.pumpAndSettle();

    // Assert
    expect(find.text('Invalid credentials'), findsOneWidget);
  });
}
```

### Integration Testing

**Test complete user flows:**

```dart
void main() {
  testWidgets('User can create and save an area', (tester) async {
    // Arrange
    await tester.pumpWidget(MyApp());
    await loginUser(tester);

    // Act - Navigate to area creation
    await tester.tap(find.byIcon(Icons.add));
    await tester.pumpAndSettle();

    // Enter area details
    await tester.enterText(find.byKey(Key('area-name')), 'Test Area');

    // Select trigger
    await tester.tap(find.text('Select Trigger'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Discord: New Message'));
    await tester.pumpAndSettle();

    // Select action
    await tester.tap(find.text('Add Action'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('GitHub: Create Issue'));
    await tester.pumpAndSettle();

    // Save area
    await tester.tap(find.text('Enregistrer'));
    await tester.pumpAndSettle();

    // Assert - Area appears in list
    expect(find.text('Test Area'), findsOneWidget);
  });
}
```

### Running Tests

```bash
# Run all tests
flutter test

# Run specific test file
flutter test test/unit/services/auth_service_test.dart

# Run with coverage
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
```

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
   - Issue: Clicking save multiple times creates duplicate nodes
   - Workaround: Loading flag prevents duplicate saves
   - Status: Fixed in v1.0.0

2. **OAuth Callback Race Condition**
   - Issue: Sometimes deep link not captured if app is killed
   - Workaround: `checkInitialLink()` on app startup
   - Status: Mitigated

### Performance Considerations

1. **Large Workflows**
   - Loading 50+ nodes may cause UI lag
   - Recommendation: Paginate or virtualize node list

2. **Image Loading**
   - Service logos loaded from network
   - Recommendation: Implement image caching

3. **API Response Size**
   - Large area lists may be slow to load
   - Recommendation: Implement pagination

---

## Deployment

### Build Commands

**Android:**

```bash
# Debug
flutter build apk --debug

# Release
flutter build apk --release
flutter build appbundle --release
```

**iOS:**

```bash
# Debug
flutter build ios --debug

# Release
flutter build ios --release
flutter build ipa --release
```

### Environment Configuration

**Development:**

```dart
// lib/core/constants/api_constants.dart
static const String baseUrl = 'http://localhost:8080';
```

**Production:**

```dart
// lib/core/constants/api_constants.dart
static const String baseUrl = 'https://api.mirrorarea.com';
```

### Release Checklist

- [ ] Update version in `pubspec.yaml`
- [ ] Run `flutter analyze` - no errors
- [ ] Run `flutter test` - all tests pass
- [ ] Update API base URL to production
- [ ] Test OAuth flows on real devices
- [ ] Test deep linking on iOS and Android
- [ ] Build release APK/IPA
- [ ] Test release build on devices
- [ ] Update CHANGELOG.md
- [ ] Tag release in Git
- [ ] Deploy to App Store / Play Store

---

## Appendix

### Dependencies

**Core:**
- `flutter`: SDK
- `provider`: State management
- `go_router`: Navigation
- `http`: HTTP client

**Authentication:**
- `flutter_secure_storage`: Secure token storage
- `shared_preferences`: Local preferences
- `app_links`: Deep linking

**UI:**
- `cupertino_icons`: iOS-style icons
- `url_launcher`: External URL opening

**Utilities:**
- `formz`: Form validation
- `equatable`: Value equality

**Development:**
- `flutter_lints`: Linting rules
- `mockito`: Mocking for tests
- `build_runner`: Code generation

### API Base URL Configuration

```dart
class ApiConstants {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8080',
  );
}
```

**Run with custom URL:**

```bash
flutter run --dart-define=API_BASE_URL=https://api.mirrorarea.com
```

### Useful Commands

```bash
# Clean build artifacts
flutter clean

# Get dependencies
flutter pub get

# Upgrade dependencies
flutter pub upgrade

# Analyze code
flutter analyze

# Format code
dart format lib/

# Run tests
flutter test

# Run specific test
flutter test test/unit/auth_test.dart

# Generate code
flutter pub run build_runner build

# Check outdated packages
flutter pub outdated

# Doctor - check setup
flutter doctor -v
```

---

**Document Version:** 1.0.0
**Last Updated:** 2025-01-02
**Maintained By:** Development Team
**Next Review:** 2025-02-01
