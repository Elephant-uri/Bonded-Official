# Technical Concerns

**Analysis Date:** 2026-01-13

## Critical Issues

### 1. Exposed Credentials in Version Control

**Severity:** CRITICAL

**Location:** `.env` file committed to git

**Issue:**
- `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY` - Unsplash API key exposed
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - JWT token exposed
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps key exposed

**Action Required:**
- Add `.env` to `.gitignore`
- Create `.env.example` with placeholder values
- Rotate all exposed keys immediately

### 2. Placeholder Sentry Configuration

**Severity:** HIGH

**Location:** `app/_layout.tsx:26`
```typescript
dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
```

**Issue:** Sentry configured with placeholder DSN. Error tracking won't function.

**Action Required:** Configure real Sentry DSN or disable initialization.

### 3. Missing .env.example

**Severity:** HIGH

**Issue:** No template for environment variables. New developers cannot set up project.

**Action Required:** Create `.env.example`:
```
EXPO_PUBLIC_SUPABASE_URL=your_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=your_key_here
```

## Technical Debt

### 1. Excessive Console Logging (390+ instances)

**Severity:** MEDIUM-HIGH

**Files with Most Logging:**
- `app/forum.jsx` - ~32 console statements
- `hooks/events/useEventsForUser.js` - ~25 statements
- `hooks/useForums.js` - ~21 statements
- `app/_layout.tsx` - ~13 statements
- `services/unsplashService.js` - ~18 statements

**Impact:** Performance degradation, potential security risk (user data in logs)

**Action Required:** Implement logging utility with environment-aware levels.

### 2. Large Component Files

**Severity:** MEDIUM

**Files Over 1000 Lines:**
- `app/forum.jsx` - 5,928 lines
- `app/calendar.jsx` - 3,221 lines
- `app/chat.jsx` - 2,460 lines
- `app/yearbook.jsx` - 2,171 lines
- `app/clubs/[id].jsx` - 1,642 lines
- `app/messages.jsx` - 1,548 lines
- `app/_layout.tsx` - 1,292 lines

**Impact:** Difficult to maintain, test, and reason about.

**Action Required:** Break into smaller, focused components.

### 3. Incomplete Feature Implementations (55+ TODOs)

**Severity:** MEDIUM

**Forum Features (`app/forum.jsx`):**
- Line 499: TODO - Vote mutation to Supabase not implemented
- Line 963: TODO - Reply to reply functionality incomplete
- Line 1871: TODO - Repost to Supabase not implemented

**Other TODOs:**
- `app/events/create.jsx:221` - Store media path instead of signed URL
- `services/scheduleParser.js:270` - TODO: Implement OCR
- `services/schoolEventsService.js:20` - TODO: Implement actual scraping

### 4. RLS Policy Recursion Issues

**Severity:** HIGH

**Files Affected:**
- `hooks/events/useEventsForUser.js` - Catches `42P17` recursion error
- `hooks/useForums.js` - RLS error handling
- `contexts/MessagesContext.jsx` - Detects RLS recursion

**Issue:** Multiple workarounds indicate deeper database policy issues.

### 5. Direct Database Queries in Components (30+ files)

**Severity:** MEDIUM

**Examples:**
- `app/forum.jsx` - Direct `.from('posts').select()` calls
- `app/calendar.jsx` - Direct queries
- `app/profile.jsx` - Direct profile fetches

**Issue:** Queries should be centralized in hooks for caching and optimization.

## Security Concerns

### 1. File Upload Security

**Location:** `helpers/mediaStorage.js`

**Issues:**
- No file type validation
- No file size limits on client
- Predictable media IDs: `Date.now()` + weak random
- No virus/malware scanning

### 2. Missing Rate Limiting

**Vulnerable Operations:**
- OTP requests (brute force risk)
- Event creation
- Message sending
- Post creation

### 3. Weak Message Moderation

**Location:** `services/messageModeration.js`

**Issues:**
- Basic regex keyword matching
- No AI-powered moderation
- High false positive rate likely
- No integration with real moderation API

### 4. Missing Input Validation

**Examples:**
- `api/events/createEvent.js:36-42` - Only validates field existence
- `hooks/useCreatePost.js:14-28` - Basic presence checks only

**Missing Validation:**
- Email addresses
- URLs in posts/bios
- File uploads (type, size, content)
- User-generated text (injection risk)

## Performance Concerns

### 1. N+1 Query Patterns

**Location:** `contexts/MessagesContext.jsx:98-120`

```javascript
const conversationsWithDetails = await Promise.all(
  (data || []).map(async (item) => {
    // Separate queries per conversation
    const { data: lastMsg } = await supabase.from('messages')...
    const { data: participants } = await supabase.from('conversation_participants')...
  })
)
```

**Issue:** Makes separate queries per conversation instead of batching.

### 2. Unoptimized Image Handling

**Issues:**
- No image lazy loading in yearbook
- No image caching strategy in story viewer
- Large images loaded without optimization

### 3. Polling Without Debouncing

**Location:** `contexts/MessagesContext.jsx`

**Issue:** Polling mechanism without debounce/throttle visible.

## Documentation Gaps

### 1. Complex Code Without Comments

**Files:**
- `components/onboarding/steps/ScheduleEditStep.tsx` - 936 lines, schedule parsing unclear
- `app/calendar.jsx` - 3,221 lines with minimal documentation

### 2. Missing API Documentation

- `api/events/createEvent.js` - Input validation rules not documented
- `services/messageModeration.js` - Moderation criteria unclear

### 3. Database Schema Not Documented

No documentation of:
- Table relationships
- RLS policy logic
- Required fields and constraints

## Testing Gaps

### Inadequate Test Coverage

**Current State:**
- Only 5 test files found
- Minimal component coverage
- No integration tests
- No E2E tests

**Missing Tests:**
- Critical hooks: `useCreatePost`, `useFriends`, `useMessages`
- API functions: `createEvent`
- Authentication flows
- Onboarding process

## Incomplete Implementations

### Mock/Placeholder Services

**Files:**
- `services/linkAIConversation.js` - Mock AI responses, not actual AI
- `services/messageModeration.js` - Keyword-based, not real moderation
- `services/brightspaceService.js` - Syllabus parsing stubs
- `services/schoolEventsService.js` - No actual event scraping

**Issue:** Features exposed in UI but not fully functional.

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| Console.log statements | 390+ | Medium-High |
| TODO/FIXME comments | 55+ | Medium |
| Large files (>1000 LOC) | 7 | Medium |
| Direct DB in components | 30+ | Medium |
| RLS workarounds | 4+ | High |
| Test files | 5 | High (insufficient) |
| Input validation | Partial | High |
| Error boundaries | 0 | High |
| Rate limiting | 0 | High |
| `.env.example` | Missing | High |

## Recommended Priority

**Immediate:**
1. Remove `.env` from git, add `.gitignore`, create `.env.example`
2. Rotate exposed API keys
3. Configure real Sentry DSN

**Short Term:**
1. Add environment-aware logging utility
2. Remove debug console.log statements
3. Add input validation library
4. Create error boundary components

**Medium Term:**
1. Refactor large components
2. Implement file upload validation
3. Add rate limiting
4. Set up comprehensive test coverage

**Long Term:**
1. Replace mock services with real implementations
2. Fix RLS policy root causes
3. Complete all TODO items
4. Add full documentation

---

*Concerns analysis: 2026-01-13*
*Update when issues are resolved*
