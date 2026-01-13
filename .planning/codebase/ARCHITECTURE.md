# System Architecture

**Analysis Date:** 2026-01-13

## Pattern Overview

**Architecture Type:** Layered (N-tier) + Context-based Component Architecture

The codebase follows a modern React Native architecture combining:
- **Expo Router** for file-based routing (`app/*.jsx`)
- **Context API + Zustand** for global state management
- **TanStack Query** for server state and data fetching
- **Supabase** as the backend-as-a-service layer

This is a **client-heavy monolith** where most business logic runs on mobile clients, with Supabase handling persistence, auth, and real-time updates.

## Layers

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (UI & Navigation)                       │
│  - app/_layout.tsx (Root layout, drawer, providers)         │
│  - app/*.jsx (Screen components)                            │
│  - components/ (Reusable UI components)                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  BUSINESS LOGIC LAYER (Hooks & Services)                    │
│  - hooks/*.js (React Query hooks for data fetching)         │
│  - services/*.js (External integrations)                    │
│  - contexts/*.jsx (Contextual business logic)               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STATE MANAGEMENT LAYER (Application State)                 │
│  - stores/*.js (Zustand stores - auth, onboarding)          │
│  - contexts/*.jsx (React Context providers)                 │
│  - providers/*.jsx (Query & theme providers)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  DATA & UTILITY LAYER                                       │
│  - lib/supabase.js (Supabase client config)                 │
│  - helpers/*.js (Utility functions)                         │
│  - utils/*.js (Feature gates, logging, OCR)                 │
│  - constants/*.js (App-wide constants & config)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL LAYER (Backend)                                   │
│  - Supabase PostgreSQL Database                             │
│  - Supabase Auth (Email OTP)                                │
│  - Supabase Storage (Media files)                           │
│  - Supabase Realtime (Postgres Changes, Broadcast)          │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

**Example: Forum Post Feed Request**

```
1. USER INITIATES
   app/forum.jsx (component mounts)
        ↓
2. INVOKE HOOK
   usePosts(forumId) from hooks/usePosts.js
        ↓
3. QUERY CLIENT
   TanStack Query with Supabase client
   - queryKey: ['posts', forumId, filters, userId]
   - Caches for 30 seconds
        ↓
4. FETCH DATA
   supabase.from('posts').select(...).eq('forum_id', forumId)
        ↓
5. NORMALIZE & TRANSFORM
   - Resolve media URLs: helpers/mediaStorage.js
   - Format author info from profiles relationship
   - Calculate time ago formatting
        ↓
6. RENDER COMPONENT
   app/forum.jsx receives { posts, isLoading, fetchNextPage }
   - Uses FlatList for pagination
   - Shows skeleton loader while loading
        ↓
7. REAL-TIME UPDATES
   Supabase Postgres Changes subscription
   - New posts trigger automatic cache invalidation
   - useInfiniteQuery refetches with refetchInterval: 15000ms
```

**Key Caching Strategy:**
- `staleTime: 30s` - Fresh data kept for 30 seconds
- `gcTime: 5m` - Unused data cached for 5 minutes
- `refetchOnMount: true` - Always check for new data on mount
- `refetchInterval: 15s` - Auto-poll for real-time feeds

## Key Abstractions

### Custom Hooks (Data & State)

**Location:** `hooks/*.js` - 25+ hooks following TanStack Query patterns

Key hooks:
- `usePosts(forumId)` - Infinite query for forum feed (pagination)
- `useCurrentUserProfile()` - Current user's profile with fallback for incomplete onboarding
- `useMessages(conversationId)` - Real-time messaging with typing indicators
- `useForums()` - List of forums user has access to
- `useComments(postId)` - Comments on a post with nested replies
- `useCreatePost()` - Mutation hook for creating forum posts
- `useFriends()` - User relationships/connections

### Context Providers (Business Logic)

**Location:** `contexts/*.jsx`

- `MessagesContext` - Real-time conversations, typing indicators, online status
- `EventsContext` - Event state & subscriptions
- `ClubsContext` - Club membership & admin status
- `StoriesContext` - Story viewing & creation
- `CirclesContext` - Close-knit group management

**Pattern:** Each context handles subscriptions, loading states, error handling, and provides methods like:
- `loadConversations()`
- `sendMessage(conversationId, content)`
- `subscribeToTyping(conversationId)`

### State Management (Zustand)

**Location:** `stores/*.js`

- `authStore` - Auth state (user, session, email, isNewUser, verificationStatus)
  - Persisted to AsyncStorage via Zustand middleware
  - Actions: `setUser()`, `setSession()`, `logout()`
- `onboardingStore` - Onboarding flow state
  - Tracks: userId, completedSteps, currentStep, userAnswers
  - Persisted to AsyncStorage

**Pattern:** Zustand with persistence middleware for hydration on app restart

### Service Layer

**Location:** `services/*.js` - 10 services for external integrations

- `linkAIConversation.js` - AI recommendations for courses/connections
- `messageModeration.js` - Content filtering for messages
- `schoolEventsScraper.js` - Third-party event aggregation
- `unsplashService.js` - Image search integration
- `scheduleParser.js` - Class schedule parsing from PDF/image OCR

## Entry Points

**Primary Entry Points:**

1. **`app/_layout.tsx`** (Main Root Layout - 1,293 lines)
   - Initializes Sentry error reporting
   - Checks Supabase session on startup
   - Renders DrawerLayout + Stack for authenticated users
   - Drawer navigation with 15+ menu items
   - Providers: Theme, Query, Contexts (Stories, Events, Clubs, Messages)

2. **`package.json` main entry**
   ```json
   "main": "expo-router/entry"
   ```
   - Expo Router auto-discovers routes from `app/` directory
   - File-based routing: `app/forum.jsx` → `/forum`

3. **Authentication Flow Entry**
   - `app/login.jsx` - Email input
   - `app/otp.jsx` - OTP verification
   - `app/onboarding.jsx` - Multi-step profile completion
   - `app/auth/callback.tsx` - OAuth redirect handler

4. **Landing Page** (Separate Next.js app)
   - `landing-page/app/page.tsx` - Marketing site
   - Hosted separately from mobile app

## Key Data Models

**User Model:**
```
profiles {
  id, email, full_name, username, bio, avatar_url, university_id,
  age, grade, gender, major, graduation_year,
  interests[], personality_tags[],
  onboarding_complete, onboarding_step, class_schedule
}
```

**Forum Model:**
```
forums {
  id, name, type (class|campus|public|private), description, image
}
forum_members { user_id, forum_id, role, joined_at }
```

**Post Model:**
```
posts {
  id, forum_id, user_id, title, body, tags[], media_urls[],
  is_anonymous, upvotes_count, downvotes_count, comments_count,
  created_at
}
post_reactions { post_id, user_id, reaction_type }
```

**Message Model:**
```
conversations { id, name, type (dm|group), created_at }
conversation_participants { conversation_id, user_id, joined_at }
messages { id, conversation_id, sender_id, content, created_at }
```

**Event Model:**
```
events { id, title, description, location, start_time, end_time, user_id }
event_attendees { event_id, user_id, status (attending|interested) }
```

## Module Boundaries

**Strict Imports (one-directional):**

```
Presentation Layer (app/, components/)
    ↓ imports from
Business Logic Layer (hooks/, services/)
    ↓ imports from
State Layer (stores/, contexts/, providers/)
    ↓ imports from
Data Layer (lib/, helpers/, utils/)
```

**Key Import Patterns:**
- Screens import hooks: `import { usePosts } from '../hooks/usePosts'`
- Hooks import Supabase: `import { supabase } from '../lib/supabase'`
- Stores import AsyncStorage: `import AsyncStorage from '@react-native-async-storage/async-storage'`
- Services don't import hooks/stores (pure functions)

---

*Architecture analysis: 2026-01-13*
*Update when patterns change*
