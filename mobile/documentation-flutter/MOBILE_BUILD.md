# Mobile Build Guide

**Version:** 1.0.0
**Last Updated:** 2025-01-02

---

## Table of Contents

1. [Overview](#overview)
2. [Build Requirements](#build-requirements)
3. [Android Build](#android-build)
4. [iOS Build](#ios-build)
5. [Build Configuration](#build-configuration)
6. [Code Signing](#code-signing)
7. [Release Checklist](#release-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers building the Mirror Area mobile application for both Android and iOS platforms.

### Build Types

- **Debug**: Development build with debugging enabled
- **Profile**: Performance profiling build
- **Release**: Production-ready optimized build

---

## Build Requirements

### Flutter SDK

**Required version:** `^3.7.0`

```bash
# Check Flutter version
flutter --version

# Upgrade Flutter if needed
flutter upgrade
```

### Platform-Specific Requirements

#### Android

- **Android Studio**: Latest stable version
- **Android SDK**: API Level 21+ (Android 5.0)
- **Java JDK**: Version 11 or higher
- **Gradle**: Managed by Flutter

#### iOS

- **Xcode**: Version 14.0 or higher
- **CocoaPods**: Latest version
- **iOS Deployment Target**: 11.0 or higher
- **macOS**: Required for iOS builds

### Install Dependencies

```bash
cd mobile
flutter pub get
```

---

## Android Build

### Debug Build

#### APK (for testing)

```bash
flutter build apk --debug
```

**Output:** `build/app/outputs/flutter-apk/app-debug.apk`

#### Install on connected device

```bash
flutter install
```

### Release Build

#### APK (for distribution outside Play Store)

```bash
flutter build apk --release
```

**Output:** `build/app/outputs/flutter-apk/app-release.apk`

#### App Bundle (for Play Store)

```bash
flutter build appbundle --release
```

**Output:** `build/app/outputs/bundle/release/app-release.aab`

### Split APKs (for different architectures)

```bash
flutter build apk --split-per-abi --release
```

**Outputs:**
- `app-armeabi-v7a-release.apk` (32-bit ARM)
- `app-arm64-v8a-release.apk` (64-bit ARM)
- `app-x86_64-release.apk` (64-bit Intel)

### Build Configuration

**`android/app/build.gradle`:**

```gradle
android {
    compileSdkVersion 33
    ndkVersion flutter.ndkVersion

    defaultConfig {
        applicationId "com.mirrorarea.app"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode flutterVersionCode.toInteger()
        versionName flutterVersionName
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Version Management

**`pubspec.yaml`:**

```yaml
version: 1.0.0+1
# Format: MAJOR.MINOR.PATCH+BUILD_NUMBER
# Example: 1.2.3+42
#   - Version Name: 1.2.3
#   - Version Code: 42
```

**Update version:**

```bash
# In pubspec.yaml, increment version
version: 1.0.1+2

# Rebuild
flutter clean
flutter build apk --release
```

---

## iOS Build

### Prerequisites

#### Install CocoaPods

```bash
sudo gem install cocoapods
```

#### Install iOS dependencies

```bash
cd ios
pod install
cd ..
```

### Debug Build

```bash
flutter build ios --debug
```

### Release Build

#### Build for device

```bash
flutter build ios --release
```

#### Build IPA (for App Store)

```bash
flutter build ipa --release
```

**Output:** `build/ios/ipa/mirror_area.ipa`

#### Build for specific device

```bash
# Build and run on connected device
flutter run --release

# Build for specific device ID
flutter build ios --device-id <device-id>
```

### Build Configuration

**`ios/Runner/Info.plist`:**

```xml
<key>CFBundleVersion</key>
<string>$(FLUTTER_BUILD_NUMBER)</string>
<key>CFBundleShortVersionString</key>
<string>$(FLUTTER_BUILD_NAME)</string>

<!-- Deep linking -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>autoarea</string>
        </array>
    </dict>
</array>

<!-- Permissions -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
</dict>
```

### Xcode Configuration

1. Open workspace in Xcode:

```bash
open ios/Runner.xcworkspace
```

2. Configure signing:
   - Select `Runner` target
   - Go to "Signing & Capabilities"
   - Select your team
   - Choose provisioning profile

3. Build from Xcode:
   - Select target device or simulator
   - Product → Archive
   - Distribute App

---

## Build Configuration

### Environment-Specific Builds

#### Using dart-define

```bash
# Development build
flutter build apk --dart-define=API_BASE_URL=http://localhost:8080 --debug

# Staging build
flutter build apk --dart-define=API_BASE_URL=https://staging.mirrorarea.com --release

# Production build
flutter build apk --dart-define=API_BASE_URL=https://api.mirrorarea.com --release
```

#### In code

**`lib/core/constants/api_constants.dart`:**

```dart
class ApiConstants {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8080',
  );
}
```

### Build Flavors (Advanced)

#### Android Flavors

**`android/app/build.gradle`:**

```gradle
android {
    flavorDimensions "environment"

    productFlavors {
        dev {
            dimension "environment"
            applicationIdSuffix ".dev"
            versionNameSuffix "-dev"
            resValue "string", "app_name", "Mirror Area Dev"
        }

        prod {
            dimension "environment"
            resValue "string", "app_name", "Mirror Area"
        }
    }
}
```

**Build with flavor:**

```bash
flutter build apk --flavor dev
flutter build apk --flavor prod
```

#### iOS Flavors

Configure schemes in Xcode:
1. Product → Scheme → Manage Schemes
2. Duplicate `Runner` scheme
3. Rename to "Dev" or "Prod"
4. Configure build settings per scheme

---

## Code Signing

### Android Signing

#### 1. Generate Keystore

```bash
keytool -genkey -v -keystore ~/upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias upload
```

#### 2. Configure Signing

**`android/key.properties`:**

```properties
storePassword=your-store-password
keyPassword=your-key-password
keyAlias=upload
storeFile=/Users/username/upload-keystore.jks
```

**Add to `.gitignore`:**

```
android/key.properties
*.jks
```

#### 3. Update build.gradle

**`android/app/build.gradle`:**

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### iOS Signing

#### 1. Apple Developer Account

- Join Apple Developer Program
- Create App ID: `com.mirrorarea.app`
- Create provisioning profiles

#### 2. Xcode Automatic Signing

1. Open `ios/Runner.xcworkspace`
2. Select `Runner` target
3. Go to "Signing & Capabilities"
4. Enable "Automatically manage signing"
5. Select your team

#### 3. Manual Signing

1. Download provisioning profiles from Apple Developer
2. Import certificates to Keychain
3. In Xcode, disable automatic signing
4. Select provisioning profiles manually

---

## Release Checklist

### Pre-Build Checklist

- [ ] Update version in `pubspec.yaml`
- [ ] Update `CHANGELOG.md`
- [ ] Run `flutter analyze` - no errors
- [ ] Run `flutter test` - all tests pass
- [ ] Test on real devices (Android & iOS)
- [ ] Update API base URL to production
- [ ] Test OAuth flows
- [ ] Test deep linking
- [ ] Review app permissions
- [ ] Update app icons and splash screens

### Build Checklist

- [ ] Clean build artifacts: `flutter clean`
- [ ] Get dependencies: `flutter pub get`
- [ ] Build Android release: `flutter build appbundle --release`
- [ ] Build iOS release: `flutter build ipa --release`
- [ ] Verify build outputs exist
- [ ] Test release builds on devices

### Post-Build Checklist

- [ ] Sign Android app bundle
- [ ] Upload to Play Store (internal testing)
- [ ] Archive iOS build in Xcode
- [ ] Upload to App Store Connect (TestFlight)
- [ ] Test from TestFlight/Internal testing
- [ ] Update store listings
- [ ] Take screenshots for stores
- [ ] Submit for review

---

## Troubleshooting

### Android Issues

#### Issue: "Gradle build failed"

**Solution:**
```bash
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
flutter build apk
```

#### Issue: "SDK location not found"

**Solution:**

Create `android/local.properties`:

```properties
sdk.dir=/Users/username/Library/Android/sdk
```

#### Issue: "Execution failed for task ':app:lintVitalRelease'"

**Solution:**

**`android/app/build.gradle`:**

```gradle
android {
    lintOptions {
        checkReleaseBuilds false
        abortOnError false
    }
}
```

#### Issue: "Could not resolve all artifacts"

**Solution:**
```bash
cd android
./gradlew clean build --refresh-dependencies
```

### iOS Issues

#### Issue: "CocoaPods not installed"

**Solution:**
```bash
sudo gem install cocoapods
cd ios
pod install
```

#### Issue: "Pod install failed"

**Solution:**
```bash
cd ios
pod deintegrate
pod install --repo-update
```

#### Issue: "Code signing error"

**Solution:**
1. Open `ios/Runner.xcworkspace` in Xcode
2. Select Runner target
3. Signing & Capabilities → Select team
4. Clean build folder: `Product → Clean Build Folder`
5. Rebuild

#### Issue: "No profiles for 'com.mirrorarea.app'"

**Solution:**
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create App ID if not exists
3. Create provisioning profile
4. Download and import to Xcode

### General Issues

#### Issue: "Out of memory during build"

**Solution:**
```bash
# Increase Gradle memory
# android/gradle.properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
```

#### Issue: "Build takes too long"

**Solution:**
```bash
# Enable Gradle daemon
# android/gradle.properties
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
```

#### Issue: "Flutter doctor shows issues"

**Solution:**
```bash
flutter doctor -v
# Follow instructions to resolve each issue
```

---

## Build Optimization

### Reduce App Size

#### Android

**Enable ProGuard:**

```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
    }
}
```

#### iOS

**Enable BitCode:**

In Xcode Build Settings:
- Enable Bitcode → Yes

### Build Performance

**`android/gradle.properties`:**

```properties
org.gradle.jvmargs=-Xmx4096m
org.gradle.parallel=true
org.gradle.daemon=true
org.gradle.configureondemand=true
android.enableR8.fullMode=true
```

### Cache Dependencies

```bash
# Android
flutter build apk --build-number=1 --build-name=1.0.0

# Subsequent builds will be faster
```

---

## Continuous Integration

### GitHub Actions Example

**`.github/workflows/build.yml`:**

```yaml
name: Build Mobile App

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.7.0'

      - name: Install dependencies
        run: flutter pub get
        working-directory: mobile

      - name: Run tests
        run: flutter test
        working-directory: mobile

      - name: Build APK
        run: flutter build apk --release
        working-directory: mobile

      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: app-release.apk
          path: mobile/build/app/outputs/flutter-apk/app-release.apk

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.7.0'

      - name: Install dependencies
        run: flutter pub get
        working-directory: mobile

      - name: Build iOS
        run: flutter build ios --release --no-codesign
        working-directory: mobile
```

---

**See also:**
- [Quick Start Guide](QUICK_START_AREA_MOBILE.md)
- [Docker Guide](DOCKER.md)
- [Deployment Documentation](DEPLOYMENT.md)
