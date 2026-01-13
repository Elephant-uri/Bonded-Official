# External Integrations

**Analysis Date:** 2026-01-13

## Authentication

**Supabase Auth:**
- Provider: Email Magic Link (OTP)
- Configuration: `lib/supabase.js`, `lib/auth.ts`
- Callback: `bonded://auth/callback`
- Session storage: AsyncStorage (native) / localStorage (web)
- Environment: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Database

**Supabase PostgreSQL:**
- Primary data store for all application data
- URL: `https://ptilskwpvvltrvrusiva.supabase.co`
- Real-time subscriptions via Postgres Changes
- Tables: profiles, forums, posts, messages, events, clubs, conversations, etc.

**Key Tables:**
- `profiles` - User profiles with onboarding data
- `posts` - Forum posts with reactions
- `messages` - Direct messages
- `conversations` - Message conversations
- `events` - User-created events
- `forums` - Forum definitions
- `forum_members` - Forum membership

## Storage

**Supabase Storage:**
- Media uploads for profiles, posts, events, clubs
- Bucket: `bonded-media`
- Signed URL generation: `helpers/mediaStorage.js`
- Storage paths: `users/{userId}/profile_photos`, `posts/{postId}/media`

## External APIs

### Mapping & Location

**Google Maps API:**
- Purpose: Location services, event locations
- API Key: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- Usage: `app/events/[id].jsx`
- Features:
  - Event location display
  - Opening native maps app
  - Autocomplete via `react-native-google-places-autocomplete`
- Platform-aware: Apple Maps on iOS, Google Maps on Android

### Image Services

**Unsplash API:**
- Purpose: Stock photos for yearbook profiles
- API Key: `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY`
- Service: `services/unsplashService.js`
- Features:
  - Random photo fetching with diverse search terms
  - Batch photo fetching (caching up to 200+ photos)
  - Fallback to Picsum Photos when API unavailable
  - Optimized for college-aged student photos
  - Rate limiting with 200ms delays between batches

### OCR & Computer Vision

**ML Kit Text Recognition:**
- Purpose: Schedule/syllabus text extraction
- Library: `@react-native-ml-kit/text-recognition`
- Usage: `utils/ocr/extractText.ts`
- Features:
  - Extracts course info from schedule images
  - Works in development builds and EAS production
  - Graceful fallback in Expo Go

**Google Cloud Vision API:**
- Purpose: Fallback OCR for Expo Go
- Configuration: `utils/ocr/cloudOCR.ts`
- Status: Available as fallback

## Third-Party Services

### Error Tracking

**Sentry:**
- Purpose: Application error tracking and monitoring
- Setup: `app.json` plugins, `app/_layout.tsx`
- Organization: "bonded-official"
- Project: "bonded"
- Note: Only initialized on native platforms (iOS/Android)

### Academic Systems

**Brightspace Integration:**
- Service: `services/brightspaceService.js`
- Purpose: LMS assignment/syllabus parsing
- Status: In development - awaiting API access
- Features: Parses syllabi for assignments, deadlines, course info

### Event Scraping

**School Events Scraper:**
- Service: `services/schoolEventsScraper.js`, `services/schoolEventsService.js`
- Purpose: University event syncing
- Features:
  - Generic scraper for university event platforms
  - Deduplication
  - Organization matching
  - Weekly sync capability

## Internal Services

### Message Moderation

**Moderation Service:**
- Service: `services/messageModeration.js`
- Purpose: Content safety filtering
- Features:
  - Hate speech detection (pattern-based)
  - Threat detection
  - Harassment detection
  - Explicit content filtering
  - Red flag detection
- Note: Basic pattern matching - ready for AI service integration

### AI Conversation

**Link AI Service:**
- Service: `services/linkAIConversation.js`
- Purpose: AI-powered messaging suggestions
- Features:
  - Conversation quality scoring
  - AI-powered conversation starters
  - Message suggestions based on conversation stage
  - Tone detection and recommendations
- Status: Mock implementation - ready for real AI integration

## Real-time Features

**Supabase Realtime:**
- Configuration: `contexts/MessagesContext.jsx`
- Features:
  - Postgres Changes - Message updates
  - Broadcast - Typing indicators
  - Presence - Online status
- Channels: Per-conversation subscriptions

## Data Fetching

**TanStack React Query:**
- Configuration: `providers/QueryProvider.jsx`
- Cache: 5 minutes stale time, 10 minutes garbage collection
- Retry: 1 attempt on failure
- Usage: All data hooks in `hooks/` directory

## Feature Flags

**Feature Gates:**
- Utility: `utils/featureGates.js`
- Flags:
  - `RATE_MY_PROFESSOR` - Professor rating feature
  - `LINK_AI` - AI conversation assistance
  - Additional flags for feature rollout

## Deployment

**EAS (Expo Application Services):**
- Configuration: `eas.json`
- Profiles:
  - Development - Local testing
  - Preview - Internal distribution
  - Production - App store builds
- Features: Auto-increment for production versions

**Landing Page (Vercel):**
- Framework: Next.js
- API: Waitlist submission (`landing-page/app/api/waitlist/route.ts`)
- Storage: Supabase waitlist table

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=<supabase-project-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<google-maps-key>
EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=<unsplash-key>
```

---

*Integrations analysis: 2026-01-13*
*Update when external services change*
