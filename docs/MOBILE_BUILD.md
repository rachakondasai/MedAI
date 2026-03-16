# MedAI — Mobile App Build Guide

## Overview

MedAI uses **Capacitor** to wrap the React web app into native Android and iOS apps. The mobile app connects to your **Render.com backend** (always-on), so no local server is needed.

---

## Architecture

```
┌──────────────────────────────────┐
│  Mobile App (Android / iOS)      │
│  ┌───────────────────────────┐   │
│  │  Capacitor WebView        │   │
│  │  (loads React UI)         │   │
│  └───────────┬───────────────┘   │
│              │                   │
│  Native Plugins:                 │
│  • StatusBar • SplashScreen      │
│  • Keyboard  • Haptics           │
└──────────────┬───────────────────┘
               │ HTTPS
               ▼
┌──────────────────────────────────┐
│  Render.com (Always-On Cloud)    │
│  https://medai-ivom.onrender.com │
│  ┌──────────┐  ┌──────────────┐  │
│  │  Nginx   │──│  FastAPI      │  │
│  │  (React) │  │  (AI Backend) │  │
│  └──────────┘  └──────────────┘  │
└──────────────────────────────────┘
```

---

## Prerequisites

### For Android
- **Android Studio** — [Download](https://developer.android.com/studio)
- Java 17+ (bundled with Android Studio)
- Android SDK (installed via Android Studio)

### For iOS (macOS only)
- **Xcode 15+** — [Download from Mac App Store](https://apps.apple.com/us/app/xcode/id497799835)
- CocoaPods: `sudo gem install cocoapods`
- Apple Developer Account (free for testing, $99/year for App Store)

---

## Quick Start

### Android

```bash
# Build web app + open Android Studio
npm run mobile:android

# Or run directly on a connected device/emulator
npm run mobile:android:run
```

### iOS

```bash
# Build web app + open Xcode
npm run mobile:ios

# Or run directly on a connected device/simulator
npm run mobile:ios:run
```

---

## Step-by-Step: Android APK

### 1. Build the web app
```bash
npm run build
npx cap sync android
```

### 2. Open in Android Studio
```bash
npx cap open android
```

### 3. Generate a signed APK
1. In Android Studio: **Build → Generate Signed Bundle/APK**
2. Choose **APK**
3. Create a new keystore (first time) or use existing
4. Select **release** build variant
5. Click **Create**
6. APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### 4. Share the APK
- Send the `.apk` file to anyone — they can install it directly on Android
- Or upload to Google Play Store (requires $25 developer account)

---

## Step-by-Step: iOS IPA

### 1. Build the web app
```bash
npm run build
npx cap sync ios
```

### 2. Install CocoaPods dependencies
```bash
cd ios/App
pod install
cd ../..
```

### 3. Open in Xcode
```bash
npx cap open ios
```

### 4. Configure signing
1. In Xcode, select the **App** target
2. Go to **Signing & Capabilities**
3. Select your **Team** (Apple Developer account)
4. Xcode will auto-create provisioning profiles

### 5. Build and run
- Connect your iPhone via USB, or select a simulator
- Click the **Play** button (▶) in Xcode
- For App Store: **Product → Archive → Distribute App**

---

## Customizing the App

### Change App Name & Icon

**Android:**
- App name: `android/app/src/main/res/values/strings.xml`
- App icon: Replace files in `android/app/src/main/res/mipmap-*` folders
- Use [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html) to generate icons

**iOS:**
- App name: Edit in Xcode → General → Display Name
- App icon: Replace in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Use [App Icon Generator](https://www.appicon.co/) to generate all sizes

### Change Splash Screen

Edit `capacitor.config.ts`:
```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 2000,
    backgroundColor: '#0f172a',  // Dark medical theme
    showSpinner: true,
    spinnerColor: '#10b981',     // Emerald green
  }
}
```

### Change Backend URL

Edit `capacitor.config.ts`:
```typescript
server: {
  url: 'https://your-new-url.onrender.com',
}
```

Then rebuild:
```bash
npm run build && npx cap sync
```

---

## Development Mode (Live Reload)

For faster development with hot-reload:

```bash
# 1. Start the dev server
npm run dev

# 2. Find your local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# 3. Edit capacitor.config.ts — uncomment the dev server URL:
#    url: 'http://192.168.1.YOUR_IP:5173',
#    cleartext: true,

# 4. Sync and run
npx cap sync android && npx cap run android
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to server" | Check Render URL in `capacitor.config.ts` |
| White screen on app start | Run `npm run build && npx cap sync` |
| Android build fails | Open Android Studio → File → Sync Project with Gradle |
| iOS build fails | Run `cd ios/App && pod install` |
| App crashes on startup | Check `npx cap doctor` for issues |
| Slow first load | Render free tier takes ~30s to wake up |

---

## Publishing

### Google Play Store
1. Generate signed APK/AAB (see above)
2. Create [Google Play Developer Account](https://play.google.com/console) ($25 one-time)
3. Upload AAB → fill store listing → submit for review

### Apple App Store
1. Archive in Xcode (see above)
2. Requires [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
3. Upload via Xcode → fill App Store Connect listing → submit for review

### Alternative: Direct APK Distribution
- Share the `.apk` file via link, email, or messaging
- Users enable "Install from unknown sources" on Android
- No store account needed!

---

## File Structure

```
MedAI/
├── capacitor.config.ts       # Capacitor configuration
├── android/                  # Android native project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/public/  # Web app (auto-synced)
│   │   │   └── res/            # Icons, splash, strings
│   │   └── build.gradle
│   └── build.gradle
├── ios/                      # iOS native project
│   └── App/
│       ├── App/
│       │   ├── public/         # Web app (auto-synced)
│       │   └── Assets.xcassets # Icons
│       └── App.xcworkspace
└── dist/                     # Built web app (source for sync)
```
