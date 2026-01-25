# Technical Debt Analysis

**Last Updated:** January 9, 2026  
**Status:** Active - Update periodically as issues are addressed

---

## Table of Contents

1. [Critical Issues](#critical-issues)
2. [Recent Improvements](#recent-improvements)
3. [Code Quality](#code-quality)
4. [Missing Features & Placeholders](#missing-features--placeholders)
5. [Architecture & Design](#architecture--design)
6. [Performance](#performance)
7. [Security](#security)
8. [Testing & Quality Assurance](#testing--quality-assurance)
9. [Documentation](#documentation)
10. [Dependencies](#dependencies)
11. [Database & RLS](#database--rls)
12. [Build & Deployment](#build--deployment)

---

## Critical Issues

### 🔴 High Priority

#### 1. RLS Recursion Errors (42P17)
**Impact:** High - Causes data fetching failures, requires workarounds  
**Files Affected:** Multiple hooks and database policies  
**Status:** ✅ IMPROVED - Workarounds in place with UI feedback

**Details:**
- Multiple hooks have fallback logic for RLS recursion errors
- Error code `42P17` appears in: `useEventsForUser.js`, `useEvent.js`, `useCurrentUserProfile.js`, `useForums.js`
- Database has multiple fix scripts: `fix-profiles-rls-recursion.sql`, `fix-all-rls-recursion.sql`, etc.
- **NEW:** Added `rlsError` flag to return values for UI feedback
- **NEW:** Warning banner shows when RLS issues cause degraded mode

**Action Items:**
- [ ] Audit all RLS policies for circular dependencies
- [ ] Refactor policies to use helper functions instead of direct table references
- [x] Add UI feedback when RLS errors occur (warning banners)
- [ ] Remove workaround code once RLS is fixed
- [ ] Add monitoring for RLS errors in production

**Files to Review:**
- `database/fix-all-rls-recursion.sql`
- `hooks/events/useEventsForUser.js` (RLS fallback with rlsError flag)
- `hooks/events/useEvent.js` (RLS fallback handling)
- `hooks/useCurrentUserProfile.js` (RLS workarounds)
- `hooks/useForums.js` (RLS workarounds)
- `app/events/index.jsx` (hasRlsError warning banner)

---

#### 2. No Testing Infrastructure
**Impact:** Critical - No automated testing, high risk of regressions  
**Status:** 🔴 No test files found in codebase

**Action Items:**
- [ ] Set up Jest + React Native Testing Library
- [ ] Add unit tests for critical hooks (`useEventsForUser`, `useEvent`, auth hooks)
- [ ] Add integration tests for onboarding flow
- [ ] Add E2E tests for critical user flows (login, event creation)
- [ ] Set up CI/CD test pipeline

**Priority:** High - Should be addressed before production launch

---

#### 3. Missing Error Tracking
**Impact:** High - No visibility into production errors  
**Status:** 🔴 Mentioned in TECHNICAL_DOCUMENTATION.md as "needs Sentry"

**Action Items:**
- [ ] Integrate Sentry or similar error tracking service
- [ ] Add error boundaries to catch React errors
- [ ] Set up error reporting for Supabase errors
- [ ] Configure alerts for critical errors

---

#### 4. OCR Implementation Status
**Impact:** Medium - Feature works differently in dev vs production  
**File:** `utils/ocr/extractText.ts`  
**Status:** ✅ IMPROVED - Works in production builds, fallback in Expo Go

**Details:**
- Uses `@react-native-ml-kit/text-recognition` for OCR
- **Expo Go:** Returns empty result, shows fallback message
- **EAS Build (production):** Full ML Kit OCR works
- Dynamic import with try/catch handles missing native modules
- `isOCRAvailable()` function exposed for checking availability

**Current Behavior:**
```
Expo Go: Shows "OCR Not Available" → User uses manual entry or file import
Production: Full OCR extraction from schedule screenshots
```

**Action Items:**
- [x] Implement ML Kit OCR for production builds
- [x] Add graceful fallback for Expo Go
- [x] Add `isOCRAvailable()` helper function
- [ ] Add cloud OCR fallback for better Expo Go experience (optional)
- [ ] Test with various schedule image formats

---

## Recent Improvements

### ✅ Completed (January 2026)

#### 1. Error Handling Improvements
**Status:** Implemented

**Changes:**
- **Poll Creation:** `useCreatePost.js` now returns `{ post, pollError }` for UI feedback
- **Photo Upload:** `useSaveOnboarding.js` tracks `photoUploadError` for partial failures
- **RLS Errors:** Events page shows warning banner when in degraded mode
- **Onboarding:** Auto-save race condition fixed with `isSaving` checks

**Files Updated:**
- `hooks/useCreatePost.js` - Poll error tracking
- `hooks/useSaveOnboarding.js` - Photo upload error tracking
- `hooks/events/useEventsForUser.js` - rlsError flag
- `app/events/index.jsx` - RLS warning banner
- `app/onboarding.jsx` - Auto-save race condition fix
- `app/forum.jsx` - Poll error alert

---

#### 2. Feature Gates System
**Status:** Implemented

**Details:**
- Centralized feature gating in `utils/featureGates.js`
- Currently gated features:
  - `LINK_AI` - AI conversation assistant (disabled)
  - `RATE_MY_PROFESSOR` - Professor ratings (disabled)
  - `PAID_EVENTS` - Event ticketing (disabled)
  - `ONBOARDING_STUDY_HABITS` - Study habits step (disabled)
  - `ONBOARDING_LIVING_HABITS` - Living habits step (disabled)
  - `ONBOARDING_PERSONALITY` - Personality step (disabled)

**Files Using Feature Gates:**
- `utils/featureGates.js` - Main configuration
- `stores/onboardingStore.js` - Onboarding step filtering
- `app/_layout.tsx` - Navigation drawer items
- `app/link-ai.jsx` - Page redirect
- `app/rate-professor.jsx` - Page redirect
- `app/chat.jsx` - Link AI button visibility
- `components/Events/EventCard.jsx` - Paid events button
- `app/events/[id].jsx` - Buy ticket button

---

#### 3. Onboarding Simplification
**Status:** Implemented

**Changes:**
- Reduced to 4 steps: Basic Info → Photos → Interests → Schedule
- Study Habits, Living Habits, Personality steps gated for future
- Step indicators moved to top (below back button)
- Skip button removed (only 4 required steps)
- Completion percentage adjusted (25% per step)

---

#### 4. UI/UX Improvements
**Status:** Implemented

**Changes:**
- Schedule steps restyled (modern card design, pill-shaped chips)
- Photo album "Add" button redesigned (pill style, better layout)
- Post options modal redesigned (bottom sheet style)
- Forum username display fixed (shows username, not full name)
- Image preview in post creation (adaptive grid layout)
- Keyboard avoiding for location picker modals

---

#### 5. Build Configuration
**Status:** Implemented

**Changes:**
- `eas.json` created with build profiles:
  - `development` - Dev client builds (simulator)
  - `preview` - Internal testing (TestFlight)
  - `production` - App Store/Play Store

---

## Code Quality

### ✅ Recent Improvements (January 2026)

#### 1. Redundancy Elimination
**Status:** ✅ COMPLETED - Major redundancy fixes applied

**Changes:**
- **Date/Time Formatters:** Consolidated 15+ duplicate implementations into `utils/dateFormatters.js`
  - All files now use centralized `formatDate`, `formatTime`, `formatTimeAgo`, `formatTimestamp`, `getTimeAgo`
  - Files updated: `app/events/[id].jsx`, `app/messages.jsx`, `app/notifications.jsx`, `app/yearbook.jsx`, `components/Events/*.jsx`, `hooks/useComments.js`, `hooks/usePosts.js`, and more
- **RLS Error Helpers:** Consolidated duplicate RLS error handling into `utils/rlsHelpers.js`
  - Centralized `isRlsRecursionError()`, `logRlsFixHint()`, and `isNetworkError()` functions
  - Files updated: `hooks/useForums.js`, `hooks/useCurrentUserProfile.js`, `hooks/events/useEvent.js`, `hooks/events/useEventsForUser.js`, `hooks/useMessages.js`, `hooks/useNotificationCount.js`
- **Code Reduction:** ~500-600 lines of duplicate code eliminated

**Impact:**
- Single source of truth for date formatting and error handling
- Easier maintenance and bug fixes
- More consistent UX across the app

---

### 🟡 Medium Priority

#### 1. Excessive Console Logging
**Impact:** Medium - Performance overhead, potential security risk  
**Count:** 390 console.log/warn/error statements across 72 files (up from 351)

**Details:**
- Debug logging left in production code
- Some logs may expose sensitive information
- Performance impact from excessive logging

**Action Items:**
- [ ] Create logging utility with log levels (debug, info, warn, error)
- [ ] Replace console.log with utility that respects environment
- [ ] Remove debug logs from production builds
- [ ] Keep only essential error logging

**Files with Most Logging:**
- `app/forum.jsx` (32 instances)
- `hooks/events/useEventsForUser.js` (25 instances)
- `hooks/useForums.js` (21 instances)
- `services/uriInvolvedScraper.js` (18 instances)
- `app/_layout.tsx` (13 instances)

---

#### 2. TypeScript `any` Types
**Impact:** Medium - Loss of type safety, potential runtime errors  
**Count:** 29 instances of `any` type (down from 77)

**Details:**
- Reduces benefits of TypeScript
- Makes refactoring harder
- Hides potential bugs

**Action Items:**
- [ ] Replace `any` with proper types or `unknown`
- [ ] Add strict TypeScript configuration
- [ ] Use type guards where necessary

**Files with `any` Types:**
- `components/onboarding/steps/ScheduleUploadStep.tsx` (6 instances)
- `app/messages.jsx` (4 instances)
- `landing-page/components/WaitlistForm.tsx` (3 instances)
- `app/rate-professor.jsx` (2 instances)
- `components/onboarding/steps/ScheduleEditStep.tsx` (2 instances)
- `components/onboarding/steps/ScheduleConfirmStep.tsx` (2 instances)

---

#### 3. TODO/FIXME Comments
**Impact:** Low-Medium - Incomplete features, unclear priorities  
**Count:** 55 TODO/FIXME comments across 22 files (down from 189)

**Categories:**
- Feature implementations (voting, reposts, etc.)
- UI improvements (meme picker, GIF picker)
- Integration work (Supabase wiring)

**Action Items:**
- [ ] Prioritize TODOs by impact and effort
- [ ] Create GitHub issues for high-priority TODOs
- [ ] Remove resolved TODOs

**High-Priority TODOs:**
- `app/forum.jsx:499,524` - Implement vote mutation to Supabase
- `app/forum.jsx:1871` - Save repost to Supabase
- `app/events/create.jsx:221` - Store media path instead of signed URL
- `hooks/useForums.js:313` - Calculate unread posts for user

---

## Missing Features & Placeholders

### 🟡 Medium Priority

#### 1. Mock Data Still Present
**Impact:** Medium - Confusion, potential bugs  
**Files:** `contexts/EventsContext.jsx`, `contexts/ClubsContext.jsx`

**Action Items:**
- [ ] Remove all mock data generation functions
- [ ] Clean up unused mock data imports
- [ ] Verify all features use real Supabase data

---

#### 2. Incomplete Feature Implementations

**Forum Features (app/forum.jsx):**
- [ ] Vote mutation to Supabase (lines 499, 524)
- [ ] Reply to reply functionality (line 963)
- [ ] Anonymous message sending (line 1238)
- [ ] Meme picker (gated for V2)
- [ ] GIF picker (gated for V2)
- [ ] Posting as org (line 1687)
- [ ] Repost to Supabase (line 1871)
- [ ] Tag filtering (gated for V2)

**Profile Features (app/profile.jsx):**
- [ ] Social links navigation (Instagram, Spotify, Apple Music)
- [ ] Navigate to friend's profile
- [ ] Add friend functionality

**Event Features:**
- [ ] Store media path instead of signed URL

**Club Features (app/clubs/create.jsx):**
- [ ] Upload org avatar/cover to bonded-media

**Calendar Features (app/calendar.jsx):**
- [ ] Fetch connections from Supabase
- [ ] Academics page to edit schedule, semester dates, and auto-manage class forum/chat enrollment

---

## Architecture & Design

### 🟡 Medium Priority

#### 1. Hardcoded Values
**Impact:** Low-Medium - Makes configuration difficult

**Examples:**
- `EVENTS_PER_PAGE = 20` in `useEventsForUser.js`
- `POSTS_PER_PAGE = 20` in `usePosts.js`
- Theme spacing values used directly

**Action Items:**
- [ ] Create constants file for configuration values
- [ ] Make pagination sizes configurable
- [ ] Extract magic numbers to named constants

---

#### 2. Missing Error Boundaries
**Impact:** Medium - App crashes instead of graceful error handling

**Action Items:**
- [ ] Add React Error Boundaries around major features
- [ ] Implement fallback UI for errors
- [ ] Add error recovery mechanisms

---

#### 3. Inconsistent Return Formats
**Impact:** Medium - Some hooks return different shapes
**Status:** ✅ IMPROVED - standardized to `{ data, hasMore, rlsError? }`

**Details:**
- Event hooks now consistently return `{ events, hasMore, rlsError? }`
- Post hooks return `{ posts, hasMore }`
- Poll creation returns `{ post, pollError }`

---

## Performance

### 🟡 Medium Priority

#### 1. Console Logging Overhead
**Impact:** Medium - Performance impact from 390 console statements

**Action Items:**
- [ ] Remove debug logs (see Code Quality section)
- [ ] Use conditional logging based on environment

---

#### 2. Pagination Implemented
**Status:** ✅ COMPLETE

**Details:**
- Events: `useInfiniteQuery` with 20 per page
- Posts: `useInfiniteQuery` with 20 per page
- Infinite scroll implemented in FlatLists

---

#### 3. Caching Strategy
**Status:** ✅ IMPLEMENTED

**Details:**
- `staleTime: 30 seconds` - Data considered fresh
- `gcTime: 5 minutes` - Cache retention
- `refetchOnMount: true` - Fresh data on navigation
- `refetchOnWindowFocus: true` - Fresh data on app focus
- `refetchOnReconnect: true` - Fresh data on reconnect

---

## Security

### 🟡 Medium Priority

#### 1. Missing Rate Limiting
**Impact:** Medium - Vulnerable to abuse

**Areas:**
- Auth endpoints (OTP requests)
- API endpoints
- File uploads

**Action Items:**
- [ ] Implement rate limiting on auth endpoints
- [ ] Add rate limiting to Supabase Edge Functions
- [ ] Monitor for abuse patterns

---

#### 2. Input Validation
**Impact:** Medium - Potential for injection attacks

**Action Items:**
- [ ] Add input validation to all user inputs
- [ ] Sanitize user-generated content
- [ ] Validate file uploads (type, size, content)

---

## Testing & Quality Assurance

### 🔴 High Priority

#### 1. No Test Coverage
**Impact:** Critical - High risk of regressions

**Current State:**
- No test files found
- No testing framework configured
- No CI/CD test pipeline

**Action Items:**
- [ ] Set up Jest + React Native Testing Library
- [ ] Add unit tests for critical hooks
- [ ] Add integration tests for key flows
- [ ] Set up E2E testing (Detox or similar)
- [ ] Add test coverage reporting
- [ ] Set up CI/CD to run tests

**Priority Tests:**
- Authentication flow
- Event creation and fetching
- Onboarding flow
- Profile updates
- Forum post creation

---

## Documentation

### 🟢 Low Priority

#### 1. Documentation Status
**Impact:** Low - Makes onboarding harder

**Existing Documentation:**
- `TECHNICAL_DOCUMENTATION.md` - Comprehensive technical docs
- `TECHDEBT.md` - This file
- `FINAL_SETUP_STEPS.md` - Setup guide
- `PHOTO_FEATURES_SUMMARY.md` - Photo feature docs
- Various database SQL scripts with comments

**Action Items:**
- [ ] Add JSDoc comments to hooks
- [ ] Create API reference guide
- [ ] Document RLS workarounds better

---

## Dependencies

### 🟡 Medium Priority

#### 1. Key Dependencies
**Status:** Up to date as of January 2026

**Core:**
- `expo` SDK 54
- `react` 19.1.0
- `react-native` 0.81.5
- `@supabase/supabase-js` 2.88.0
- `@tanstack/react-query` 5.90.11

**New Dependencies:**
- `@react-native-ml-kit/text-recognition` - OCR for schedule photos
- `expo-document-picker` - iCal/CSV file import

**Action Items:**
- [ ] Run `npm audit` for security vulnerabilities
- [ ] Review breaking changes before updating

---

## Database & RLS

### 🔴 High Priority

#### 1. RLS Recursion Issues
**Impact:** High - See Critical Issues section

**Database Fix Scripts:**
- `database/fix-all-rls-recursion.sql`
- `database/fix-profiles-rls-recursion.sql`
- `database/fix-storage-rls-policies.sql`
- `database/fix-user-class-enrollments-rls.sql`
- `database/reset-profiles-rls.sql`

---

#### 2. Missing Indexes
**Impact:** Medium - Query performance

**Action Items:**
- [ ] Audit slow queries
- [ ] Add indexes for frequently queried columns
- [ ] Review query execution plans

---

## Build & Deployment

### 🟢 Low Priority

#### 1. EAS Build Configuration
**Status:** ✅ CONFIGURED

**File:** `eas.json`

**Profiles:**
```json
{
  "development": { "developmentClient": true, "distribution": "internal" },
  "preview": { "distribution": "internal" },
  "production": { "autoIncrement": true }
}
```

**Build Commands:**
```bash
# Development (Expo Go alternative with native modules)
eas build --platform ios --profile development

# Preview (TestFlight / Internal testing)
eas build --platform ios --profile preview

# Production (App Store / Play Store)
eas build --platform all --profile production
```

**Action Items:**
- [ ] Set up CI/CD for automated builds
- [ ] Configure environment variables in EAS
- [ ] Set up submission workflows

---

## Priority Matrix

### 🔴 Critical (Address Before Production)
1. Testing Infrastructure
2. Error Tracking (Sentry)
3. RLS Policy Audit (root cause fix)

### 🟡 High Priority (Address Soon)
1. Console Logging Cleanup
2. Missing Error Boundaries
3. Rate Limiting
4. Input Validation

### 🟢 Medium Priority (Address When Possible)
1. TypeScript `any` Types
2. TODO/FIXME Cleanup
3. Mock Data Removal
4. Performance Monitoring

### ⚪ Low Priority (Nice to Have)
1. Documentation Improvements
2. Dependency Updates
3. CI/CD Enhancements

---

## Tracking & Updates

**How to Use This Document:**
- Update status as issues are addressed
- Add new issues as they're discovered
- Mark items as complete with date
- Prioritize based on impact and effort

**Review Schedule:**
- Weekly: Review critical issues
- Monthly: Review high-priority items
- Quarterly: Full audit and update

**Last Full Audit:** January 9, 2026  
**Next Scheduled Review:** February 9, 2026

---

## Changelog

### January 9, 2026
- Updated console.log count: 390 (was 351)
- Updated TypeScript any count: 29 (was 77)
- Updated TODO count: 55 (was 189)
- Added "Recent Improvements" section
- Added OCR implementation status (ML Kit + fallback)
- Added Feature Gates documentation
- Added Build & Deployment section
- Added error handling improvements (poll, photo, RLS)
- Marked pagination/caching as complete
- Marked onboarding simplification as complete

### January 6, 2026
- Initial document creation
- Full codebase audit

---

## Notes

- This document should be updated periodically as technical debt is addressed
- When fixing issues, update the status and add completion date
- Add new issues as they're discovered during development
- Use this document to plan refactoring sprints
