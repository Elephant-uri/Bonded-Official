# Development Build Guide - Test OCR & Native Features (No Developer Account Needed)

## 🎯 Goal
Test OCR and other native features without buying an Apple Developer account.

---

## ✅ What You Already Have
- ✅ `expo-dev-client` installed
- ✅ `@react-native-ml-kit/text-recognition` installed
- ✅ `expo-document-picker` installed
- ✅ EAS account (free)

---

## 🚀 Option 1: Local Development Build (Recommended - Fastest)

### For iOS (Mac Required)

```bash
# 1. Install iOS dependencies
npx pod-install

# 2. Build and run on iOS Simulator (FREE, no Apple account needed)
npx expo run:ios

# Or build for your physical iPhone (requires free Apple ID)
npx expo run:ios --device
```

**Pros:**
- ✅ Fastest (builds locally)
- ✅ No Apple Developer account needed
- ✅ Works on simulator (free)
- ✅ Works on physical device with free Apple ID

**Cons:**
- ❌ Requires Mac for iOS
- ❌ First build takes 10-15 minutes

---

### For Android (Any OS)

```bash
# 1. Make sure Android Studio is installed
# 2. Start an Android emulator or connect a device

# 3. Build and run
npx expo run:android
```

**Pros:**
- ✅ Works on Windows/Mac/Linux
- ✅ No developer account needed
- ✅ Free Android emulator

---

## 🌐 Option 2: EAS Development Build (Cloud Build - Free Tier)

### Step 1: Login to EAS (Free)

```bash
npm install -g eas-cli
eas login
# Create free Expo account if needed
```

### Step 2: Build Development Client

**For iOS Simulator (FREE):**
```bash
eas build --platform ios --profile development
```

**For Android (FREE):**
```bash
eas build --platform android --profile development
```

**Pros:**
- ✅ No Mac needed for iOS builds
- ✅ Cloud builds (faster on slow machines)
- ✅ Can share build with team
- ✅ Free tier available

**Cons:**
- ❌ Requires internet connection
- ❌ First build takes 15-20 minutes

---

## 📱 After Building: How to Use

### 1. Install the Development Build
- **iOS Simulator:** Automatically installed
- **Physical Device:** Download from EAS build page or install via Xcode
- **Android:** Download APK from EAS or install via ADB

### 2. Start Development Server
```bash
npx expo start --dev-client
```

### 3. Connect Your Device
- Scan QR code with camera (iOS) or Expo Go (Android)
- Or press `i` for iOS simulator, `a` for Android

---

## 🧪 Testing OCR

Once your development build is running:

1. **Go to Onboarding → Schedule Step**
2. **Tap "Upload Schedule Screenshot"**
3. **Select a schedule image**
4. **OCR should extract text** (check console logs)

**Expected Behavior:**
- ✅ ML Kit recognizes text from image
- ✅ Console shows: `✅ ML Kit recognized X text blocks`
- ✅ Schedule gets parsed into courses

**If OCR doesn't work:**
- Check console for ML Kit errors
- Verify `@react-native-ml-kit/text-recognition` is in `package.json`
- Rebuild: `npx expo run:ios` or `npx expo run:android`

---

## 🔍 Testing Other Native Features

### Document Picker (iCal/CSV Import)
1. Go to Schedule step
2. Tap "Import File (iCal / CSV)"
3. Should open file picker
4. Select `.ics` or `.csv` file

### Camera & Photo Library
- Already works in Expo Go
- Should work the same in dev build

---

## 🐛 Troubleshooting

### "ML Kit not available" Error
**Cause:** Native module not linked  
**Fix:**
```bash
# Rebuild the app
npx expo run:ios --clean
# or
npx expo run:android --clean
```

### Build Fails
**Check:**
- Xcode installed (iOS)
- Android Studio installed (Android)
- Pods installed: `npx pod-install` (iOS)

### Can't Connect to Dev Server
**Fix:**
```bash
# Make sure you're on the same WiFi
# Or use tunnel mode
npx expo start --dev-client --tunnel
```

---

## 📊 Comparison: Development Build vs Expo Go

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| **OCR (ML Kit)** | ❌ Not available | ✅ Works |
| **Native Modules** | ❌ Limited | ✅ Full support |
| **Build Time** | Instant | 10-15 min first time |
| **Hot Reload** | ✅ Yes | ✅ Yes |
| **Cost** | Free | Free |

---

## 🎯 Quick Start (Choose One)

### Fastest Path (Mac + iPhone):
```bash
npx expo run:ios --device
```

### Fastest Path (Any OS + Android):
```bash
npx expo run:android
```

### Cloud Build (No Local Setup):
```bash
eas build --platform ios --profile development
# Wait for build, then download and install
```

---

## ✅ Next Steps After Testing

Once OCR works in dev build:
1. ✅ OCR is ready for production
2. ✅ Build production version when ready
3. ✅ Submit to TestFlight (requires Apple Developer account)

---

## 📝 Notes

- **Development builds** are like Expo Go but with native modules
- You can still use **hot reload** and **fast refresh**
- **No Apple Developer account** needed for development builds
- **Free EAS tier** includes development builds

---

## 🆘 Need Help?

- Check Expo docs: https://docs.expo.dev/development/introduction/
- EAS Build docs: https://docs.expo.dev/build/introduction/
- ML Kit docs: https://docs.expo.dev/versions/latest/sdk/vision-camera/


## 🎯 Goal
Test OCR and other native features without buying an Apple Developer account.

---

## ✅ What You Already Have
- ✅ `expo-dev-client` installed
- ✅ `@react-native-ml-kit/text-recognition` installed
- ✅ `expo-document-picker` installed
- ✅ EAS account (free)

---

## 🚀 Option 1: Local Development Build (Recommended - Fastest)

### For iOS (Mac Required)

```bash
# 1. Install iOS dependencies
npx pod-install

# 2. Build and run on iOS Simulator (FREE, no Apple account needed)
npx expo run:ios

# Or build for your physical iPhone (requires free Apple ID)
npx expo run:ios --device
```

**Pros:**
- ✅ Fastest (builds locally)
- ✅ No Apple Developer account needed
- ✅ Works on simulator (free)
- ✅ Works on physical device with free Apple ID

**Cons:**
- ❌ Requires Mac for iOS
- ❌ First build takes 10-15 minutes

---

### For Android (Any OS)

```bash
# 1. Make sure Android Studio is installed
# 2. Start an Android emulator or connect a device

# 3. Build and run
npx expo run:android
```

**Pros:**
- ✅ Works on Windows/Mac/Linux
- ✅ No developer account needed
- ✅ Free Android emulator

---

## 🌐 Option 2: EAS Development Build (Cloud Build - Free Tier)

### Step 1: Login to EAS (Free)

```bash
npm install -g eas-cli
eas login
# Create free Expo account if needed
```

### Step 2: Build Development Client

**For iOS Simulator (FREE):**
```bash
eas build --platform ios --profile development
```

**For Android (FREE):**
```bash
eas build --platform android --profile development
```

**Pros:**
- ✅ No Mac needed for iOS builds
- ✅ Cloud builds (faster on slow machines)
- ✅ Can share build with team
- ✅ Free tier available

**Cons:**
- ❌ Requires internet connection
- ❌ First build takes 15-20 minutes

---

## 📱 After Building: How to Use

### 1. Install the Development Build
- **iOS Simulator:** Automatically installed
- **Physical Device:** Download from EAS build page or install via Xcode
- **Android:** Download APK from EAS or install via ADB

### 2. Start Development Server
```bash
npx expo start --dev-client
```

### 3. Connect Your Device
- Scan QR code with camera (iOS) or Expo Go (Android)
- Or press `i` for iOS simulator, `a` for Android

---

## 🧪 Testing OCR

Once your development build is running:

1. **Go to Onboarding → Schedule Step**
2. **Tap "Upload Schedule Screenshot"**
3. **Select a schedule image**
4. **OCR should extract text** (check console logs)

**Expected Behavior:**
- ✅ ML Kit recognizes text from image
- ✅ Console shows: `✅ ML Kit recognized X text blocks`
- ✅ Schedule gets parsed into courses

**If OCR doesn't work:**
- Check console for ML Kit errors
- Verify `@react-native-ml-kit/text-recognition` is in `package.json`
- Rebuild: `npx expo run:ios` or `npx expo run:android`

---

## 🔍 Testing Other Native Features

### Document Picker (iCal/CSV Import)
1. Go to Schedule step
2. Tap "Import File (iCal / CSV)"
3. Should open file picker
4. Select `.ics` or `.csv` file

### Camera & Photo Library
- Already works in Expo Go
- Should work the same in dev build

---

## 🐛 Troubleshooting

### "ML Kit not available" Error
**Cause:** Native module not linked  
**Fix:**
```bash
# Rebuild the app
npx expo run:ios --clean
# or
npx expo run:android --clean
```

### Build Fails
**Check:**
- Xcode installed (iOS)
- Android Studio installed (Android)
- Pods installed: `npx pod-install` (iOS)

### Can't Connect to Dev Server
**Fix:**
```bash
# Make sure you're on the same WiFi
# Or use tunnel mode
npx expo start --dev-client --tunnel
```

---

## 📊 Comparison: Development Build vs Expo Go

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| **OCR (ML Kit)** | ❌ Not available | ✅ Works |
| **Native Modules** | ❌ Limited | ✅ Full support |
| **Build Time** | Instant | 10-15 min first time |
| **Hot Reload** | ✅ Yes | ✅ Yes |
| **Cost** | Free | Free |

---

## 🎯 Quick Start (Choose One)

### Fastest Path (Mac + iPhone):
```bash
npx expo run:ios --device
```

### Fastest Path (Any OS + Android):
```bash
npx expo run:android
```

### Cloud Build (No Local Setup):
```bash
eas build --platform ios --profile development
# Wait for build, then download and install
```

---

## ✅ Next Steps After Testing

Once OCR works in dev build:
1. ✅ OCR is ready for production
2. ✅ Build production version when ready
3. ✅ Submit to TestFlight (requires Apple Developer account)

---

## 📝 Notes

- **Development builds** are like Expo Go but with native modules
- You can still use **hot reload** and **fast refresh**
- **No Apple Developer account** needed for development builds
- **Free EAS tier** includes development builds

---

## 🆘 Need Help?

- Check Expo docs: https://docs.expo.dev/development/introduction/
- EAS Build docs: https://docs.expo.dev/build/introduction/
- ML Kit docs: https://docs.expo.dev/versions/latest/sdk/vision-camera/



