# Codebase Structure

**Analysis Date:** 2026-01-13

## Directory Layout

```
Bonded-Official/
├── app/                           # Expo Router screens (file-based routing)
│   ├── _layout.tsx               # ROOT LAYOUT (1,293 lines)
│   ├── auth/                     # Auth routes
│   ├── forum.jsx                 # Forum feed (5,928 lines)
│   ├── forum/                    # Forum sub-routes
│   ├── messages.jsx              # Direct messaging
│   ├── profile.jsx               # User profile
│   ├── calendar.jsx              # Class schedule + events
│   ├── events/                   # Event management
│   ├── clubs/                    # Club management
│   ├── yearbook.jsx              # Digital yearbook
│   ├── onboarding.jsx            # Signup flow
│   └── ...                       # Additional screens
├── components/                    # Reusable UI components (37 dirs/files)
│   ├── Forum/                    # Forum-specific components
│   ├── Events/                   # Event components
│   ├── Stories/                  # Story components (10 files)
│   ├── onboarding/               # Onboarding steps
│   ├── ui/                       # Base UI components
│   └── ...                       # Additional components
├── hooks/                        # Custom React hooks (25 files)
│   ├── useCurrentUserProfile.js  # Current user profile
│   ├── useForums.js              # Forums list
│   ├── usePosts.js               # Forum posts
│   ├── useMessages.js            # Real-time messaging
│   ├── events/                   # Event hooks (6 files)
│   └── ...                       # Additional hooks
├── stores/                       # Zustand state stores
│   ├── authStore.js              # Auth state (PERSISTED)
│   └── onboardingStore.js        # Onboarding state (PERSISTED)
├── contexts/                     # React Context providers
│   ├── MessagesContext.jsx       # Real-time messaging
│   ├── EventsContext.jsx         # Event subscriptions
│   ├── StoriesContext.jsx        # Story management
│   ├── ClubsContext.jsx          # Club membership
│   └── CirclesContext.jsx        # Group management
├── providers/                    # App-level providers
│   └── QueryProvider.jsx         # TanStack Query setup
├── services/                     # External API integrations
│   ├── linkAIConversation.js     # AI recommendations
│   ├── messageModeration.js      # Content filtering
│   ├── schoolEventsScraper.js    # Event scraping
│   ├── unsplashService.js        # Image search
│   └── ...                       # Additional services
├── lib/                          # Core libraries
│   ├── supabase.js               # Supabase client
│   └── auth.ts                   # Auth utilities
├── helpers/                      # Utility functions
│   ├── mediaStorage.js           # Upload to Supabase Storage
│   ├── common.js                 # Common utilities (hp, wp)
│   └── ...                       # Additional helpers
├── utils/                        # App utilities
│   ├── featureGates.js           # Feature flags
│   ├── logger.js                 # Logging utility
│   ├── ocr/                      # OCR utilities
│   └── schedule/                 # Schedule parsing
├── constants/                    # App-wide constants
│   ├── schools.js                # University list
│   ├── interests.js              # Interest categories
│   └── theme.js                  # Theme constants
├── database/                     # Database schemas (39 files)
│   └── *.sql                     # Migration files
├── api/                          # Backend API routes
│   └── events/createEvent.js     # Event creation
├── assets/                       # Static assets
│   └── images/                   # App images/icons
├── landing-page/                 # Next.js marketing site
│   ├── app/                      # Next.js app directory
│   ├── components/               # Landing page components
│   └── lib/                      # Utilities
└── .planning/                    # GSD project planning
    └── codebase/                 # Codebase documentation
```

## Directory Purposes

**app/**
- Purpose: Expo Router screens & pages
- Contains: Screen components (JSX/TSX)
- Key files: `_layout.tsx`, `forum.jsx`, `messages.jsx`
- Subdirectories: `auth/`, `events/`, `clubs/`, `forum/`, `theme/`

**components/**
- Purpose: Reusable UI components
- Contains: React Native components (37 directories/files)
- Key files: `AppTopBar.jsx`, `BottomNav.jsx`, `ShareModal.jsx`
- Subdirectories: `Forum/`, `Events/`, `Stories/`, `onboarding/`, `ui/`, `Circles/`

**hooks/**
- Purpose: Data fetching & state logic
- Contains: Custom React hooks (25 files)
- Key files: `usePosts.js`, `useMessages.js`, `useCurrentUserProfile.js`
- Subdirectories: `events/` (6 event-related hooks)

**stores/**
- Purpose: Global app state (Zustand)
- Contains: Zustand stores with persistence
- Key files: `authStore.js`, `onboardingStore.js`

**contexts/**
- Purpose: Business logic providers
- Contains: React Context providers (5 contexts)
- Key files: `MessagesContext.jsx`, `EventsContext.jsx`, `StoriesContext.jsx`

**services/**
- Purpose: External integrations
- Contains: API service modules (10 services)
- Key files: `linkAIConversation.js`, `messageModeration.js`, `unsplashService.js`

**lib/**
- Purpose: Core configuration
- Contains: Library initialization
- Key files: `supabase.js` (platform-aware storage), `auth.ts`

**helpers/**
- Purpose: Utility functions
- Contains: Helper modules
- Key files: `mediaStorage.js`, `common.js`

**utils/**
- Purpose: App utilities
- Contains: Utility modules
- Key files: `featureGates.js`, `logger.js`
- Subdirectories: `ocr/`, `schedule/`

**database/**
- Purpose: Schema migrations
- Contains: SQL migration files (39 files)
- Key files: `00-base-schema.sql`, `events-schema.sql`, `messaging-schema.sql`

**landing-page/**
- Purpose: Marketing site (Next.js)
- Contains: Separate Next.js application
- Key files: `app/page.tsx`, `app/api/waitlist/route.ts`

## Key File Locations

**Entry Points:**
- `app/_layout.tsx` - App initialization, auth check, providers
- `lib/supabase.js` - Supabase client configuration
- `stores/authStore.js` - Auth state management
- `providers/QueryProvider.jsx` - TanStack Query client setup

**Configuration:**
- `tsconfig.json` - TypeScript configuration
- `app.json` - Expo configuration
- `eas.json` - EAS build configuration
- `package.json` - Dependencies and scripts
- `jest.config.js` - Test configuration

**Core Logic:**
- `hooks/usePosts.js` - Forum post fetching
- `hooks/useMessages.js` - Message handling
- `contexts/MessagesContext.jsx` - Real-time messaging
- `helpers/mediaStorage.js` - Media upload/storage

**Testing:**
- `components/__tests__/` - Component tests
- `stores/__tests__/` - Store tests
- `utils/__tests__/` - Utility tests
- `helpers/__tests__/` - Helper tests

## Naming Conventions

**Files:**
- `PascalCase.jsx` - React components (e.g., `AppTopBar.jsx`)
- `camelCase.js` - Hooks with `use` prefix (e.g., `usePosts.js`)
- `camelCase.js` - Services (e.g., `messageModeration.js`)
- `camelCaseStore.js` - Zustand stores (e.g., `authStore.js`)
- `kebab-case.jsx` - Page components (e.g., `create-forum.jsx`)
- `kebab-case.sql` - Database migrations (e.g., `add-message-reactions.sql`)
- `UPPERCASE.md` - Important docs (e.g., `README.md`, `CLAUDE.md`)

**Directories:**
- `kebab-case` - All directories
- Plural for collections: `templates/`, `commands/`, `workflows/`

**Special Patterns:**
- `[id].jsx` - Dynamic route segments
- `_layout.tsx` - Layout files (Expo Router)
- `__tests__/` - Test directories

## Where to Add New Code

**New Feature:**
- Primary code: `app/feature-name.jsx` or `app/feature/`
- Components: `components/FeatureName/`
- Hooks: `hooks/useFeature.js`
- Context (if needed): `contexts/FeatureContext.jsx`

**New Component:**
- Implementation: `components/ComponentName.jsx`
- If complex: `components/ComponentName/` directory
- Tests: `components/__tests__/ComponentName.test.js`

**New Hook:**
- Implementation: `hooks/useHookName.js`
- If related to events: `hooks/events/useHookName.js`
- Tests: `hooks/__tests__/useHookName.test.js`

**New Service:**
- Implementation: `services/serviceName.js`
- Pure functions, no React dependencies

**Utilities:**
- Shared helpers: `helpers/helperName.js`
- App utilities: `utils/utilName.js`
- Constants: `constants/constantName.js`

## Special Directories

**.planning/**
- Purpose: GSD project planning documentation
- Source: Generated by GSD commands
- Committed: Yes

**database/**
- Purpose: SQL migration files
- Source: Manual creation for schema changes
- Committed: Yes

**landing-page/**
- Purpose: Separate Next.js marketing site
- Source: Independent development
- Committed: Yes (separate deployment)

---

*Structure analysis: 2026-01-13*
*Update when directory structure changes*
