# Technology Stack

**Analysis Date:** 2026-01-13

## Languages

**Primary:**
- TypeScript 5.9.2 - All application code (`package.json`, `tsconfig.json`)
- JavaScript/JSX - Primary for app components
- TSX - React Native components with TypeScript

**Secondary:**
- CSS/PostCSS/Tailwind CSS - Landing page styling (`landing-page/postcss.config.js`, `landing-page/tailwind.config.ts`)
- SQL - Database migrations (`database/*.sql`)

## Runtime Environment

**Mobile/App:**
- Expo SDK 54.0.27 - React Native development platform (`package.json`, `app.json`)
- React Native 0.81.5 - Mobile app framework (`package.json`)
- React 19.1.0 - UI framework (`package.json`)

**Landing Page:**
- Next.js 14.2.0 - Server-side rendering (`landing-page/package.json`)
- Node.js - Runtime for backend/tooling

## Package Manager

- **npm** - Primary package manager
- Lockfiles: `package-lock.json`, `landing-page/package-lock.json`

## Frameworks

**Mobile Framework:**
- Expo Router 6.0.15 - File-based routing (`package.json`, `app.json`)
- Metro - React Native bundler (Expo default)

**Web Framework:**
- Next.js 14.2.0 - Landing page (`landing-page/package.json`)

**Styling:**
- React Native StyleSheet - Mobile styling
- Tailwind CSS 3.4.0 - Landing page (`landing-page/package.json`)

**Animation:**
- Framer Motion 11.0.0 - Landing page animations (`landing-page/package.json`)
- React Native Reanimated 4.1.1 - Mobile animations (`package.json`)

## Key Dependencies

### State Management
- Zustand 5.0.8 - Global state management (`stores/authStore.js`, `stores/onboardingStore.js`)
- @tanstack/react-query 5.90.11 - Server state management (`providers/QueryProvider.jsx`)
- @react-native-async-storage/async-storage 2.2.0 - Persistent state storage

### Backend & Database
- @supabase/supabase-js 2.88.0 - Backend database and auth (`lib/supabase.js`)

### Navigation
- @react-navigation/native 7.1.8 - Navigation core
- @react-navigation/bottom-tabs 7.4.0 - Tab navigation
- @react-navigation/elements 2.6.3 - Navigation elements
- expo-router 6.0.15 - File-based routing

### UI Components
- @expo/vector-icons 15.0.3 - Icon library (`app/_layout.tsx`)
- lucide-react-native 0.555.0 - Additional icons
- react-native-svg 15.15.1 - SVG rendering
- expo-blur 15.0.8 - Blur effects
- expo-linear-gradient 15.0.7 - Gradient backgrounds

### Media & Camera
- expo-camera 17.0.9 - Camera access
- expo-image-picker 17.0.8 - Photo library access
- expo-image 3.0.10 - Image display and optimization
- expo-image-manipulator 14.0.7 - Image editing
- expo-av 16.0.7 - Audio/video playback
- @react-native-camera-roll/camera-roll 7.10.2 - Camera roll management
- react-native-vision-camera 4.7.3 - Advanced camera features

### OCR & ML
- @react-native-ml-kit/text-recognition 2.0.0 - Schedule OCR (`utils/ocr/extractText.ts`)

### Graphics & Animation
- @shopify/react-native-skia 2.4.6 - High-performance graphics
- react-native-reanimated 4.1.1 - Smooth animations

### Gesture Handling
- react-native-gesture-handler 2.28.0 - Touch and gesture support
- react-native-screens 4.16.0 - Screen performance optimization

### Security & Storage
- expo-secure-store 15.0.8 - Secure credential storage (native)
- dotenv 17.2.3 - Environment variable management

### Error Tracking
- @sentry/react-native 7.2.0 - Error monitoring (`app/_layout.tsx`)

### Forms & Input
- @react-native-community/datetimepicker 8.4.4 - Date/time picker
- @react-native-community/slider 5.1.1 - Slider component
- react-native-google-places-autocomplete 2.6.3 - Location autocomplete
- react-native-permissions 5.4.4 - Permission management

## Build Tools

**Mobile:**
- EAS (Expo Application Services) - App building and submission (`eas.json`)
- Metro Bundler - JavaScript bundler

**Landing Page:**
- Next.js - Build and bundling
- PostCSS - CSS processing
- Tailwind CSS - Utility-first CSS

## Configuration

**TypeScript:**
- `tsconfig.json` - TypeScript configuration with path alias `@/*`
- Extends: `expo/tsconfig.base`
- Strict mode enabled

**Expo:**
- `app.json` - Expo app configuration with Sentry setup
- `eas.json` - EAS build configuration

**Project:**
- `package.json` - Dependencies and scripts
- `metro.config.js` - Metro bundler configuration
- `jest.config.js` - Testing configuration

**Environment:**
- `.env` - Environment variables (Supabase, Google Maps, Unsplash)
- Variables prefixed with `EXPO_PUBLIC_` for build-time availability

## Platform Support

**Targets:**
- iOS - Native via Expo
- Android - Native via Expo
- Web - Via react-native-web (partial support)

**EAS Build Profiles:**
- Development - Local testing
- Preview - Internal distribution
- Production - App store builds

---

*Stack analysis: 2026-01-13*
*Update when dependencies change*
