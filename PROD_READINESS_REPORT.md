# Bonded Production Readiness Report

Date: 2026-01-29
Scope: Codebase (Expo app + landing page) and Supabase project (via MCP)

---

## Executive Summary (TL;DR)

**Critical blockers before production**
1) **RLS disabled on multiple public tables** (data exposure risk). Must enable RLS + policies.  
2) **`public.media` has policies but RLS is OFF** (security misconfig).  
3) **Permissive RLS policy** on `public.conversations` allows inserts with `WITH CHECK (true)`.  
4) **Auth OTP failures** observed (`otp_expired`) and potential onboarding flow issues.  
5) **Realtime connect errors** observed in logs (intermittent).  
6) **Free plan egress exceeded** (service restrictions; onboarding can break).

**High‑priority hardening**
- Lock down function `search_path` for many SQL functions.
- Remove duplicate indexes + add missing FK indexes.
- Ensure no client‑side secrets (Google Vision API key should not be public).

---

## Architecture Overview

**Apps**
- **Mobile app**: Expo Router / React Native (`app/`), uses Supabase for auth, data, and storage.
- **Landing page**: Next.js app under `landing-page/` with separate env vars.

**Supabase**
- Project URL: `https://ptilskwpvvltrvrusiva.supabase.co`
- Uses Supabase Auth, PostgREST, Storage, Realtime.
- No Edge Functions deployed.

---

## Database & Security (from MCP advisors)

### ✅ What’s good
- RLS enabled on many tables.
- Auth tables use RLS.

### ❌ Critical Security Findings
**RLS Disabled on Public Tables** (data exposure risk):
- `public.notification_types`
- `public.personality_profiles`
- `public.badge_types`
- `public.waitlist`
- `public.content_filters`
- `public.user_activity_log_2024_01`
- `public.schedule_uploads`
- `public.ocr_patterns`
- `public.class_extraction_confidence`
- `public.media`

**RLS Policies Exist but RLS Off**
- `public.media` has policies but **RLS is not enabled**.

**Overly Permissive RLS**
- `public.conversations` policy `participants_can_insert_conversations` uses `WITH CHECK (true)`.

### ⚠️ Function Search Path Risks
Multiple functions have **mutable `search_path`**, which is a known SQL injection vector. Examples:
- `public.user_is_conversation_participant`
- `public.handle_org_member_chat`
- `public.get_unread_notifications`
- `public.get_message_reaction_counts`
- `public.get_user_university_id`
- and many more

Recommendation: set `SET search_path = public, auth, extensions` explicitly in each function.

### ✅ Auth Hardening Recommended
- **Leaked password protection is disabled** in Supabase Auth.

---

## Performance & Indexing (from MCP advisors)

### Missing Indexes
Unindexed foreign keys found in multiple tables (e.g. `messages.reply_to_id`, `org_announcements.organization_id`, `user_badges.badge_type_id`, etc.).

### Duplicate Indexes
Duplicate indexes exist in:
- `public.conversation_participants`
- `public.messages`
- `public.org_members`
- `public.friendships`
- `public.message_reactions`
- `public.events` and others

Recommendation: remove duplicates + add missing FK indexes.

---

## Auth & Onboarding Readiness

### Observed Issues
- Auth logs show **`otp_expired`** errors (403). This aligns with the onboarding “Continue” button not activating if OTP is reused or delayed.
- Free plan egress exceeded (as seen in billing screenshot). This **can silently block onboarding requests** and cause UI to hang.

### Code Review Notes
- OTP is implemented using `supabase.auth.signInWithOtp` and `verifyOtp` (`hooks/useSendOTP.js`, `hooks/useVerifyOTP.js`).
- No explicit resend/backoff handling in UI logic (potential user‑side failures).

Recommendation:
- Surface OTP failures in UI and guide resending.
- Add client timeout + clear error state on resend.
- Block onboarding steps if session is missing or expired.

---

## Secrets & Environment Variables

### Mobile App
Uses public env variables:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_VISION_API_KEY` (dangerous if used in production)

⚠️ **Google Vision API key should not be exposed on client**. Use Supabase Edge Function instead.

### Landing Page
Requires:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

No server‑side secret handling is defined in landing‑page.

---

## Observability & Logging

### Implemented
- Sentry initialized in `app/_layout.tsx` (native only).
- Custom Logger utility in `utils/logger.js` (Sentry aware).

### Gaps
- No centralized request tracing or backend correlation IDs.
- Limited server-side logging across API operations.

---

## Realtime & Messaging

### Observed
- Realtime logs show **intermittent “UnableToConnectToProject”** events.
- Realtime connections frequently start/stop (no active users).

### Codebase
- Realtime subscriptions in `contexts/MessagesContext.jsx`.
- SQL files exist to enable realtime on messaging tables.

Recommendation:
- Ensure `supabase_realtime` publication contains `messages`, `conversations`, `conversation_participants`.
- Test reconnection handling in client.

---

## Storage & Egress

- Storage usage is likely driving egress overages.
- Many Storage downloads logged (signed URLs + public objects).

Recommendations:
- Use caching CDN and avoid repeated downloads.
- Consider image resizing or lower resolution uploads.
- Add lifecycle rules for old media.
- Upgrade plan before production.

---

## Codebase Gaps & TODOs

Open TODOs that block readiness:
- Multiple screens wired to mock data (`app/browse-schools.jsx`, `app/search-forums.jsx`, `app/rate-professor.jsx`).
- Several TODOs in Forums/Clubs flows (invites, reporting, anonymous posting).
- `StoriesContext` still references non‑canonical media flow.

Recommendation: audit TODOs and decide what is MVP vs cut from v1.

---

## Testing & CI

### Current Tests
- Unit tests: `helpers/__tests__`, `utils/__tests__`, `stores/__tests__`, `components/__tests__/App.test.js`.

### Gaps
- No E2E testing.
- No CI pipeline configured.
- No automated migration checks.

Recommendation:
- Add CI for lint + test + typecheck.
- Add at least one E2E flow: signup → onboarding → first post.

---

## Deployment & Release Process

Docs present:
- `DEPLOYMENT_GUIDE.md`, `PRE_BUILD_CHECKLIST.md`, `PRELAUNCH_CHECKLIST.md`, `FINAL_SETUP_STEPS.md`.

Gaps:
- No single canonical deployment pipeline for app + landing page.
- Missing automated verification for env config.

Recommendation:
- Consolidate into one “Release Checklist” and add a `preflight` script.

---

## Production Readiness Checklist (Actionable)

### P0 — Must Fix Before Launch
- [ ] Enable RLS on all public tables listed above.
- [ ] Fix `public.media` (enable RLS + verify policies).
- [ ] Tighten `public.conversations` insert policy.
- [ ] Enable leaked password protection in Supabase Auth.
- [ ] Remove client‑side Google Vision API key usage in prod.
- [ ] Resolve free plan egress limit (upgrade or reduce).
- [ ] Validate OTP expiry handling in onboarding UI.

### P1 — High Priority
- [ ] Lock down function `search_path` for all flagged SQL functions.
- [ ] Add missing FK indexes.
- [ ] Remove duplicate indexes.
- [ ] Test realtime messaging reconnections.
- [ ] Create/confirm Edge Function for OCR (if used).

### P2 — Medium Priority
- [ ] Add CI pipeline (lint/test/typecheck).
- [ ] Add E2E smoke test (signup → onboarding → feed).
- [ ] Remove or gate unfinished features.
- [ ] Add request tracing/logging strategy.

---

## Suggested Next Steps (Fast Path)

1) I can generate SQL migrations for all RLS + search_path fixes.
2) Add missing indexes + drop duplicates.
3) Add a `preflight` script that validates env + Supabase connection.
4) Create a single release checklist file.

---

If you want, tell me which items to implement first and I’ll start generating the migrations and code changes.
