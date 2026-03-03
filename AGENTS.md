# Bonded — Agent Conventions & Best Practices

> This document is the single source of truth for AI agents and human contributors
> working on the Bonded codebase. It should be kept up-to-date as the project evolves.

Last updated: **2026-03-03** (v4 — Inter font, dark mode theming)

---

## 1. Project Overview

| Key               | Value                                         |
| ----------------- | --------------------------------------------- |
| Framework         | React Native (Expo SDK 54) with Expo Router   |
| Backend           | Supabase (Auth, Postgres, Realtime, Storage)  |
| State Management  | Zustand (auth, onboarding) + React Context    |
| Data Fetching     | React Query (@tanstack/react-query v5)        |
| Navigation        | Expo Router (file-based, `app/` directory)    |
| Design System     | MergeFund tokens (`app/theme/index.js`)       |
| Language          | JavaScript (primary), TypeScript (incremental)|
| Package Manager   | npm                                           |

---

## 2. Directory Structure

```
Bonded-Official/
├── app/                # Screens & routes (Expo Router file-based)
│   ├── _layout.tsx     # Root layout, Sentry init, providers, drawer
│   ├── auth/           # Auth callback
│   ├── calendar/       # Calendar sub-routes
│   ├── clubs/          # Club detail & creation
│   ├── events/         # Event CRUD & management
│   ├── forum/          # Forum detail
│   └── theme/          # Theme provider
├── components/         # Reusable UI components (grouped by domain)
│   ├── Chat/           # Messaging UI
│   ├── Events/         # Event cards & modals
│   ├── Forum/          # Post detail, comments, polls
│   ├── Message/        # Message bubbles, previews
│   ├── Orgs/           # Organization modals
│   ├── Profile/        # Profile modals
│   ├── Stories/        # Stories CRUD
│   ├── onboarding/     # Multi-step onboarding flow
│   └── ui/             # Low-level primitives (Button, Card, Chip, etc.)
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks (data fetching, actions)
│   └── events/         # Event-specific hooks
├── stores/             # Zustand stores (authStore, onboardingStore)
├── lib/                # Client configuration (Supabase client)
├── utils/              # Pure utilities (logger, analytics, helpers)
│   └── ocr/            # OCR integrations
├── services/           # External service integrations
├── helpers/            # UI & media helpers
├── providers/          # React Query provider
├── assets/             # Images, fonts, static assets
├── scripts/            # One-off scripts (email, data)
├── legacy/             # Deprecated code (do not import)
└── landing-page/       # Separate Next.js marketing site
```

---

## 3. MergeFund Design System

All UI must follow the MergeFund token architecture. **Never hardcode** hex
colors, spacing values, or border radii into components. Reference tokens only.

### 3.0.1 Color Palette

| Token                  | Light           | Dark            |
| ---------------------- | --------------- | --------------- |
| `colors.background`    | `#FFFFFF`       | `#0A0A0A`       |
| `colors.foreground`    | `#171717`       | `#FAFAFA`        |
| `colors.brand`         | `#7C3AED`       | `#7C3AED`       |
| `colors.textPrimary`   | `#171717`       | `#FAFAFA`        |
| `colors.textSecondary` | `#525252`       | `#A3A3A3`       |
| `colors.destructive`   | `#EF4444`       | `#F87171`       |
| `colors.success`       | `#16A34A`       | `#4ADE80`       |
| `colors.warning`       | `#EAB308`       | `#FACC15`       |
| `colors.info`          | `#3B82F6`       | `#60A5FA`       |
| `colors.border`        | `rgba(0,0,0,.08)` | `rgba(255,255,255,.10)` |

### 3.0.2 Spacing (4pt / 8pt Grid)

All margins and padding must use these tokens: `spacing.xs` (4), `spacing.sm` (8),
`spacing.md` (16), `spacing.lg` (24), `spacing.xl` (32), `spacing.xxl` (48),
`spacing.xxxl` (64). **Never use arbitrary numbers like 10, 14, 18, 22.**

### 3.0.3 Border Radii

| Token        | Value | Use case                      |
| ------------ | ----- | ----------------------------- |
| `radius.sm`  | 8     | Chips, small tags             |
| `radius.md`  | 12    | Cards, modals                 |
| `radius.lg`  | 16    | Large surfaces                |
| `radius.pill`| 9999  | Buttons, inputs, badges       |

### 3.0.4 Typography — Inter Font Family

The app uses **Inter** (`@expo-google-fonts/inter`), loaded in `_layout.tsx`.

| Weight   | Font Family Name      | Theme Token                          | Use case                  |
| -------- | --------------------- | ------------------------------------ | ------------------------- |
| 400      | `Inter_400Regular`    | `typography.fontFamily.body`         | Body text, inputs         |
| 500      | `Inter_500Medium`     | `typography.fontFamily.medium`       | Captions, meta, nav labels|
| 600      | `Inter_600SemiBold`   | `typography.fontFamily.semibold`     | Buttons, titles, labels   |
| 700      | `Inter_700Bold`       | `typography.fontFamily.bold`         | Headings, emphasis        |
| 800      | `Inter_800ExtraBold`  | `typography.fontFamily.extrabold`    | Display text              |

**Critical rule**: On React Native, `fontWeight` does NOT automatically select
the correct custom font variant. You MUST use the specific `fontFamily` token
instead of combining `fontFamily` + `fontWeight`. Use the `fontForWeight()`
helper from `app/theme` when dynamically resolving weights.

```js
// ✅ Correct
{ fontFamily: theme.typography.fontFamily.semibold }

// ❌ Wrong — fontWeight is ignored for custom fonts
{ fontFamily: theme.typography.fontFamily.body, fontWeight: '600' }
```

- Tight letter spacing (`-0.5`) for display/heading text.
- Standard spacing for body text.
- Font sizes use `typography.sizes.*` tokens, never raw numbers.

### 3.0.5 Theme Mode (Light / Dark)

- **System default** applies across the app — `useColorScheme()` drives it.
- **Auth & onboarding screens** (`/`, `/welcome`, `/login`, `/otp`, `/onboarding`,
  `/auth/*`) are ALWAYS forced to **light mode** — they were designed for light only.
- The force-light logic lives in `ThemeProvider` via the `routePath` prop
  (passed from `_layout.tsx`). It's synchronous — no `useEffect` delay.
- Users can override system preference via `useThemeMode().setMode('dark'|'light'|null)`.
  `null` resets to system default.
- **Never** add `useLayoutEffect` or `useColorScheme` overrides in individual screens
  to force a theme. If a route needs light-only, add it to `FORCE_LIGHT_ROUTES` in
  `app/theme/index.js`.

### 3.0.6 Component Patterns

- **Buttons**: Pill-shaped, 98% scale-down on press, 120ms spring-back.
  Use `usePressScale()` from `utils/animations.js`.
- **Cards**: Flat with 1px low-opacity border. No heavy shadows. Use `AppCard`.
- **Inputs**: Pill-shaped, subtle background fill, 1px border, brand-color focus ring.
- **Depth**: Prefer flat + border over shadows. Max `shadowOpacity: 0.06`.

### 3.0.7 Micro-Animations

- All interactive elements must have press feedback via `usePressScale()`.
- Content loading should use `useFadeIn()` for smooth entrance.
- Transition duration: `motion.duration.fast` (120ms) for press,
  `motion.duration.normal` (200ms) for hover/focus, `motion.duration.slow`
  (350ms) for page transitions.

---

## 4. Coding Conventions

### 3.1 File Naming

- **Screens** in `app/`: lowercase with hyphens (`new-chat.jsx`, `message-requests.jsx`)
- **Components**: PascalCase (`ChatInputBar.jsx`, `EventCard.jsx`)
- **Hooks**: camelCase with `use` prefix (`useMessages.js`, `useCreateEvent.js`)
- **Contexts**: PascalCase with `Context` suffix (`ClubsContext.jsx`)
- **Stores**: camelCase with `Store` suffix (`authStore.js`)
- **Utils/Services**: camelCase (`logger.js`, `linkService.js`)

### 3.2 Language

- Default to **JavaScript** (`.jsx` / `.js`) for new files.
- Use **TypeScript** (`.tsx` / `.ts`) when the file benefits from strict types
  (complex data transforms, shared type definitions).
- Do not mix JS and TS in the same module.

### 3.3 Imports

- Group imports in this order, separated by blank lines:
  1. React / React Native core
  2. Third-party packages
  3. Internal modules (`lib/`, `utils/`, `services/`, `helpers/`)
  4. Components
  5. Contexts / Stores / Hooks
  6. Assets / constants
- Use relative paths; no path aliases are configured.

### 3.4 Logging

**Never use `console.log` / `console.warn` / `console.error` directly.**

Use the centralized Logger:

```js
import { Logger } from '../utils/logger';

Logger.debug('Only visible in dev');
Logger.info('General flow info');
Logger.warn('Something unexpected', detail);
Logger.error(err, 'Context about the error');
```

- **DEV**: All levels print to console.
- **PROD**: `debug` and `info` are silenced; `warn` sends a Sentry breadcrumb;
  `error` sends a Sentry exception.

### 3.5 Analytics

Track meaningful user actions with the analytics utility:

```js
import { track, trackScreen } from '../utils/analytics';

trackScreen('/events');
track('event_created', { org_id: orgId, type: 'social' });
```

Events are queued client-side and flushed to `public.analytics_events`
every 30 seconds or when the batch reaches 20 events.

### 3.6 Error Handling

- Always wrap Supabase calls in try/catch or check `{ error }`.
- Use `Logger.error(err)` — this reports to Sentry in production.
- For user-facing errors, use `Alert.alert()` with a human-readable message.
- Check for RLS policy recursion with `isPolicyRecursionError()` from `utils/rlsHelpers.js`.

### 3.7 State Management

| Scope              | Tool              | Example                        |
| ------------------- | ----------------- | ------------------------------ |
| Global auth state   | Zustand           | `useAuthStore()`               |
| Global onboarding   | Zustand           | `useOnboardingStore()`         |
| Domain data (clubs, forums, etc.) | React Context | `useClubsContext()` |
| Server data (lists, detail) | React Query | `useQuery()`, `useMutation()` |
| Local UI state      | `useState`        | Modal visibility, form inputs  |

### 3.8 Data Fetching

- Prefer **React Query hooks** in `hooks/` for all Supabase reads.
- Use `useMutation()` for writes; invalidate related queries in `onSuccess`.
- Keep query keys namespaced: `['conversations']`, `['events', eventId]`.
- Do not call Supabase directly from components — always go through a hook.

### 3.9 Caching

**Images** — use `CachedImage` (`components/CachedImage.jsx`) instead of
React Native `Image` for all remote images. It wraps `expo-image` with
`cachePolicy: 'memory-disk'` so images are cached to disk automatically.

```jsx
import CachedImage from '../components/CachedImage';

<CachedImage source={{ uri: avatarUrl }} style={styles.avatar} />
```

Do **not** use `CachedImage` for `ImageBackground`. Keep `ImageBackground`
from `react-native`.

**React Query** — the cache is persisted to AsyncStorage via
`@tanstack/react-query-persist-client`. Data survives app restarts for
up to 24 hours. The `gcTime` default is 24 hours to support persistence.

**Polling guidelines**:

| Data type         | staleTime   | refetchInterval | Notes                             |
| ----------------- | ----------- | --------------- | --------------------------------- |
| Messages (list)   | 30 s        | disabled        | Realtime subscription handles it  |
| Conversations     | 2 min       | 60 s            | Light poll as Realtime backup     |
| Notifications     | 60 s        | 120 s           |                                   |
| Posts / comments  | 2 min       | 120 s           |                                   |
| Events            | 5 min       | none            | Manual invalidation on write      |
| Profiles          | 5 min       | none            |                                   |
| Forums            | 5 min       | none            |                                   |
| Static data (universities, courses) | 10 min | none |                              |

**Never** poll at < 30 seconds. If you need real-time data, use Supabase
Realtime subscriptions instead. Never set `refetchIntervalInBackground: true`
— it drains battery for no visible benefit.

---

## 5. Supabase & Database

### 5.1 Client

The Supabase client lives at `lib/supabase.js`. It uses:
- `expo-secure-store` on native, `localStorage` on web.
- Environment variables: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### 5.2 Key Tables

| Table                         | Purpose                                     |
| ----------------------------- | ------------------------------------------- |
| `profiles`                    | User profiles (extends auth.users)          |
| `organizations`               | Clubs & orgs                                |
| `org_members`                 | Membership + roles (member, admin, owner)   |
| `forums`                      | Forum spaces (public, org-private)          |
| `conversations`               | Chat conversations (direct, group)          |
| `conversation_participants`   | Who is in a conversation                    |
| `messages`                    | Chat messages                               |
| `events`                      | Calendar events                             |
| `event_attendance`            | RSVP tracking                               |
| `notifications`               | In-app notification feed                    |
| `analytics_events`            | Client-side event tracking                  |

### 5.3 RLS Policies

- All tables use Row Level Security.
- Authenticated users can only access their own data or data
  they have explicit membership/participation in.
- Service role is used only in server-side scripts.
- Watch for policy recursion errors — see `utils/rlsHelpers.js`.

### 5.4 Migrations

- DDL changes go through Supabase MCP `apply_migration` tool or the SQL editor.
- Name migrations in `snake_case`: `create_analytics_events_table`.
- Always enable RLS on new tables.
- Always add appropriate indexes for query patterns.

---

## 6. Sentry & Monitoring

- Sentry SDK: `@sentry/react-native` with Expo plugin.
- Initialized in `app/_layout.tsx` (native only, skipped on web).
- DSN is read from `EXPO_PUBLIC_SENTRY_DSN` env var.
- User context is set automatically in `authStore.setUser()`.
- Production config: `tracesSampleRate: 0.2`, `enableAutoSessionTracking: true`.

---

## 7. Testing

- Framework: Jest + `jest-expo` + `@testing-library/react-native`.
- Tests live alongside code in `__tests__/` directories.
- Run: `npm test`, `npm run test:watch`, `npm run test:coverage`.
- Naming: `<module>.test.js` or `<module>.test.ts`.

---

## 8. Git & Workflow

- Main branch: `main`.
- Commit messages: imperative mood, concise (`Fix calendar event type mapping`).
- Do not commit `.env`, `node_modules/`, or build artifacts.
- Do not modify files in `node_modules/` — report upstream issues instead.
- The `legacy/` directory is archived; do not import from it.

---

## 9. Common Pitfalls

1. **Synthetic conversation IDs**: Never return client-side fake IDs
   (e.g., `local-conv-*`) from mutations. Always throw if the backend
   call fails so the UI can show an error state.

2. **Event type vs audience**: In calendar/event creation, `type` refers
   to the content kind (`'event'` or `'task'`), not the audience
   (`'personal'`, `'social'`, `'org'`).

3. **Image loading**: Always provide `onError` fallbacks for remote images.
   Use the pattern from `app/clubs.jsx` (failed ID sets + conditional rendering).

4. **RLS recursion**: Supabase policy recursion causes cryptic `42P17` errors.
   Always check with `isPolicyRecursionError()` before assuming a query failed.

5. **Realtime + polling overlap**: Don't subscribe to Supabase Realtime
   channels AND poll the same data at short intervals. Prefer Realtime
   with a long-interval poll (60s+) as a safety net.

6. **Forum membership**: Forum assignment relies on database triggers.
   Don't assume client-side creation of forum memberships will work.

7. **React Native Image**: Never use `Image` from `react-native` for
   remote URLs. Use `CachedImage` (wraps `expo-image` with disk caching).
   The only exception is `ImageBackground` which has no expo-image equivalent.

8. **Background polling**: Never set `refetchIntervalInBackground: true`.
   It keeps the app active and drains battery. Refetch on window focus instead.

9. **fontWeight with custom fonts**: `fontWeight` is silently ignored when
   using custom Inter fonts on React Native. Always use the specific
   `fontFamily` token (e.g., `typography.fontFamily.bold`) instead of
   combining `fontFamily` with `fontWeight`.

10. **Theme forcing**: Never add per-screen `useLayoutEffect` to force
    light/dark mode. Add the route to `FORCE_LIGHT_ROUTES` in the theme
    provider instead.

---

## 10. Environment Variables

| Variable                          | Required | Purpose                    |
| --------------------------------- | -------- | -------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`        | Yes      | Supabase project URL       |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`   | Yes      | Supabase anonymous key     |
| `EXPO_PUBLIC_SENTRY_DSN`          | Yes      | Sentry error reporting     |
| `EXPO_PUBLIC_APP_ENV`             | No       | Environment tag for Sentry |
| `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY` | No       | Unsplash cover photos      |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | No       | Location picker            |

---

## 11. Updating This Document

This file should be updated when:
- A new major module or directory is added.
- Conventions change (e.g., new state management approach).
- New common pitfalls are discovered.
- Infrastructure changes (new monitoring, CI, deployment pipeline).

When updating, change the "Last updated" date at the top.
