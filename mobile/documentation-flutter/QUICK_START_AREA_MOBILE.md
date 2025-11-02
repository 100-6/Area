# Quick Start Guide - Mirror Area Mobile

**Version:** 1.0.0
**Last Updated:** 2025-01-02

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running the App](#running-the-app)
4. [First Steps](#first-steps)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

#### 1. Flutter SDK

**Install Flutter:**

```bash
# macOS (using Homebrew)
brew install flutter

# Or download from:
# https://docs.flutter.dev/get-started/install
```

**Verify installation:**

```bash
flutter doctor
```

Expected output should show all checks passing (✓).

#### 2. Development Environment

**For Android:**
- Android Studio or VS Code
- Android SDK (API 21+)
- Java JDK 11+

**For iOS:**
- Xcode 14.0+
- CocoaPods
- macOS required

#### 3. Backend Services

The mobile app requires a running backend. See [Docker Guide](DOCKER.md) for setup.

### Verify Everything Works

```bash
# Check Flutter
flutter doctor -v

# Check devices
flutter devices

# Should show connected devices or simulators
```

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-org/mirror-area.git
cd mirror-area/mobile
```

### 2. Install Dependencies

```bash
flutter pub get
```

### 3. Configure Backend URL

**`lib/core/constants/api_constants.dart`:**

```dart
class ApiConstants {
  // Development - Local backend
  static const String baseUrl = 'http://localhost:8080';

  // Or use your backend IP for physical devices
  // static const String baseUrl = 'http://192.168.1.100:8080';
}
```

**Important:**
- iOS Simulator: Use `http://localhost:8080`
- Android Emulator: Use `http://10.0.2.2:8080`
- Physical Device: Use your computer's IP (e.g., `http://192.168.1.100:8080`)

### 4. Start Backend Services

```bash
# In project root directory
cd ..
docker-compose up -d

# Verify backend is running
curl http://localhost:8080/health
# Should return: {"status": "ok"}
```

---

## Running the App

### Run on iOS Simulator

```bash
# Open iOS Simulator
open -a Simulator

# Run app
flutter run
```

### Run on Android Emulator

```bash
# List available emulators
flutter emulators

# Launch emulator
flutter emulators --launch <emulator_id>

# Or open from Android Studio: AVD Manager

# Run app
flutter run
```

### Run on Physical Device

#### Android

1. Enable Developer Options on device
2. Enable USB Debugging
3. Connect device via USB
4. Accept debugging prompt on device

```bash
# Verify device is connected
flutter devices

# Run app
flutter run
```

#### iOS

1. Open `ios/Runner.xcworkspace` in Xcode
2. Select your device
3. Configure signing (Xcode → Signing & Capabilities)
4. Product → Run

Or from command line:

```bash
flutter run
```

### Hot Reload

While app is running:

- Press `r` - Hot reload
- Press `R` - Hot restart
- Press `q` - Quit

---

## First Steps

### 1. Create Account

1. Launch app
2. Tap "S'inscrire" (Register)
3. Enter email and password
4. Tap "S'inscrire" button
5. You'll be logged in automatically

### 2. Connect Services

1. Tap "Services" in bottom navigation
2. Browse available services
3. Tap "Connect" on desired service
4. Complete OAuth flow in browser
5. Return to app to see connected service

**Example: Connect Discord**

1. Navigate to Services screen
2. Find "Discord" card
3. Tap "Connecter" button
4. Browser opens with Discord login
5. Log in and authorize
6. Automatically returns to app
7. Discord shown as connected

### 3. Create Your First Area

1. Tap "Areas" in bottom navigation
2. Tap "+" button (bottom right)
3. Enter area name and description
4. Tap "Select Trigger"
5. Choose a service and trigger
6. Configure trigger settings
7. Tap "Add Action"
8. Choose a service and action
9. Configure action settings
10. Tap "Enregistrer" (Save)

**Example: Discord to Webhook**

```
Trigger: Discord → New Message
- Channel: #general
- Keywords: "urgent"

Action: Webhook → Send POST
- URL: https://example.com/webhook
- Body: {"message": "{{trigger.content}}"}
```

---

## Common Tasks

### Task 1: Edit an Existing Area

```bash
1. Go to Areas screen
2. Tap on the area card
3. Make your changes:
   - Update name/description
   - Add more actions
   - Change configurations
4. Tap "Enregistrer"
```

### Task 2: Toggle Area On/Off

```bash
1. Go to Areas screen
2. Find the area
3. Tap the switch toggle
   - Green = Active
   - Gray = Inactive
```

### Task 3: Delete an Area

```bash
1. Go to Areas screen
2. Swipe left on area card
3. Tap "Delete" button
4. Confirm deletion
```

### Task 4: View Service Configuration

```bash
1. Go to Services screen
2. Connected services show "Connected" badge
3. Tap on service card for details
4. Use "Disconnect" if needed
```

### Task 5: Update Profile

```bash
1. Tap profile icon (top right)
2. View your email
3. Tap "Se déconnecter" to logout
```

---

## Development Workflow

### Making Changes

```bash
# 1. Edit code in your IDE
vim lib/features/areas/screens/area_list_screen.dart

# 2. Save file
# 3. Press 'r' in terminal for hot reload
# Changes appear instantly!

# For major changes (new files, dependencies):
# Press 'R' for hot restart
```

### Adding Dependencies

```bash
# 1. Add to pubspec.yaml
dependencies:
  new_package: ^1.0.0

# 2. Install
flutter pub get

# 3. Import in code
import 'package:new_package/new_package.dart';

# 4. Hot restart (R)
```

### Running Tests

```bash
# Run all tests
flutter test

# Run specific test file
flutter test test/unit/auth_test.dart

# Run with coverage
flutter test --coverage
```

### Checking Code Quality

```bash
# Analyze code
flutter analyze

# Format code
dart format lib/

# Check for unused dependencies
flutter pub outdated
```

---

## Troubleshooting

### Issue: "Cannot connect to backend"

**Check backend is running:**

```bash
curl http://localhost:8080/health
```

**Check API URL in code:**

```dart
// For Android emulator
static const String baseUrl = 'http://10.0.2.2:8080';

// For iOS simulator
static const String baseUrl = 'http://localhost:8080';

// For physical device
static const String baseUrl = 'http://YOUR_IP:8080';
```

**Find your IP:**

```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

### Issue: "Flutter doctor shows issues"

**Fix SDK licenses:**

```bash
flutter doctor --android-licenses
# Accept all
```

**Install Xcode Command Line Tools:**

```bash
xcode-select --install
```

**Install CocoaPods:**

```bash
sudo gem install cocoapods
```

### Issue: "App crashes on launch"

**Clean and rebuild:**

```bash
flutter clean
flutter pub get
flutter run
```

**Check logs:**

```bash
# View logs while app is running
flutter logs

# Or check device logs
# iOS: Xcode → Window → Devices and Simulators
# Android: Android Studio → Logcat
```

### Issue: "OAuth callback not working"

**Check deep link configuration:**

**Android:** Verify `AndroidManifest.xml` has deep link intent filter

**iOS:** Verify `Info.plist` has `CFBundleURLTypes`

**Test deep link manually:**

```bash
# Android
adb shell am start -W -a android.intent.action.VIEW \
  -d "autoarea://oauth/service/success?service=discord" \
  com.mirrorarea.app

# iOS (simulator)
xcrun simctl openurl booted "autoarea://oauth/service/success?service=discord"
```

### Issue: "Build failed"

**Update dependencies:**

```bash
flutter pub upgrade
```

**Clear build cache:**

```bash
flutter clean
rm -rf ios/Pods
rm ios/Podfile.lock
cd ios && pod install && cd ..
flutter run
```

### Issue: "Simulator not appearing"

**List devices:**

```bash
flutter devices
```

**Create new simulator (iOS):**

```bash
# In Xcode: Window → Devices and Simulators → Simulators → +
```

**Create new emulator (Android):**

```bash
# In Android Studio: Tools → AVD Manager → Create Virtual Device
```

---

## Useful Commands Reference

### Flutter Commands

```bash
# Check Flutter installation
flutter doctor -v

# List connected devices
flutter devices

# Run app
flutter run

# Run in release mode
flutter run --release

# Build APK
flutter build apk

# Install dependencies
flutter pub get

# Update dependencies
flutter pub upgrade

# Run tests
flutter test

# Analyze code
flutter analyze

# Format code
dart format lib/

# Clean build artifacts
flutter clean
```

### Device Commands

```bash
# Android - List devices
adb devices

# Android - View logs
adb logcat

# Android - Install APK
adb install build/app/outputs/flutter-apk/app-release.apk

# iOS - List simulators
xcrun simctl list devices

# iOS - Boot simulator
xcrun simctl boot <device-id>
```

### Backend Commands

```bash
# Start backend
docker-compose up -d

# Stop backend
docker-compose down

# View backend logs
docker-compose logs -f api

# Check backend health
curl http://localhost:8080/health
```

---

## Next Steps

Now that you have the app running:

1. **Explore Features**
   - Create multiple areas
   - Connect different services
   - Test various triggers and actions

2. **Read Documentation**
   - [Area Integration](AREA_INTEGRATION.md) - Deep dive into areas
   - [OAuth Integration](OAUTH_INTEGRATION.md) - OAuth details
   - [Technical Documentation](TECHNICAL_DOCUMENTATION.md) - Full architecture

3. **Start Development**
   - Pick an issue from GitHub
   - Create a feature branch
   - Make changes and test
   - Submit pull request

4. **Join Community**
   - Ask questions in Discord
   - Report bugs on GitHub
   - Contribute improvements

---

## Getting Help

### Documentation

- [Technical Documentation](TECHNICAL_DOCUMENTATION.md)
- [Area Integration](AREA_INTEGRATION.md)
- [OAuth Integration](OAUTH_INTEGRATION.md)
- [Mobile Build Guide](MOBILE_BUILD.md)
- [Docker Guide](DOCKER.md)

### Community

- **GitHub Issues**: Report bugs or request features
- **Discord**: Ask questions and get help
- **Email**: support@mirrorarea.com

### Resources

- [Flutter Documentation](https://docs.flutter.dev/)
- [Dart Language Tour](https://dart.dev/guides/language/language-tour)
- [Flutter Cookbook](https://docs.flutter.dev/cookbook)

---

**Happy coding! 🚀**
