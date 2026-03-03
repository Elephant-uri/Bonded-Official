# Production Readiness Audit

**Generated:** January 29, 2026

This audit summarizes high‑risk areas before production launch, with concrete next steps.

## 🔴 Release Blockers (must fix before store)

### 1) Mock / placeholder data in user‑facing flows
- **Circles** still uses mock rooms and participants.
  - Files: `contexts/CirclesContext.jsx`, `components/Circles/CircleRoom.jsx`
  - Risk: users see fake activity; mismatched analytics.
  - Fix: wire to real rooms or hide feature behind a gate until backend exists.

- **Browse Schools** and **Search Forums** are placeholders.
  - Files: `app/browse-schools.jsx`, `app/search-forums.jsx`
  - Risk: broken discovery flow; poor onboarding.
  - Fix: connect to Supabase universities and forums search, or remove from nav.

- **Rate Professor** is not wired and review submission is TODO.
  - File: `app/rate-professor.jsx`
  - Risk: users submit but nothing persists; trust issues.
  
  - Fix: ship only after backend is ready or hide behind feature gate.

### 2) Events pipeline has placeholder scrapers
- Files: `services/schoolEventsScraper.js`, `services/schoolEventsService.js`
- Risk: empty events feed; unpredictable scraping failures.
- Fix: implement per‑school scrapers or disable auto‑scrape in production.

### 3) Forum TODOs in critical workflows
- Votes on post detail + anonymous message/report are TODO.
  - Files: `app/forum/[id].jsx`, `app/forum.jsx`
- Risk: broken UX for core engagement actions.
- Fix: complete or hide the UI affordances until backend exists.

---

## 🟠 High‑priority fixes (should address before scale)

### 4) Excessive console logging in production paths
- Chat / forum / messaging / share paths have many logs.
- Risk: data leakage, noisy logs, performance cost.
- Fix: route through `utils/logger` (dev‑only for debug, warn/error to Sentry).

### 5) RLS fallbacks likely masking policy bugs
- `useNotificationCount`, `ClubsContext`, `useForums` log "table missing / RLS blocked" warnings.
- MCP shows tables exist, so most failures are RLS/policy issues.
- Fix: audit policies for `notifications`, `org_members`, `forums`, `message_requests`, `friend_requests`.

### 6) Health Check needs regular use
- Admin Health Check exists in Settings but only runs when invoked.
- Fix: add a once‑per‑session auto‑check and a visible warning if fail states occur.

---

## 🟡 Medium‑priority improvements

### 7) Dynamic campus strings
- Fixed in `app/yearbook.jsx` and `app/calendar.jsx`, but review remaining UI for hardcoded campus labels.

### 8) Legacy routes / debug files
- `chat_legacy` and `auth/debug` moved out of `app/`.
- Keep all legacy screens outside `app/` to avoid route exposure.

### 9) Migration history gaps
- Supabase migration list contains only recent 2026 migrations.
- Create a baseline migration or schema snapshot to avoid drift.

---

## ✅ Quick checklist before release
- Run admin **System Health Check** and resolve all failures.
- Validate RLS for all user‑facing tables (notifications, messages, forums, orgs).
- Ensure all mock/placeholder features are hidden or wired.
- Remove debug/dev routes from `app/`.
- Verify Sentry DSN + environment/release tagging.
- Confirm iOS permission strings.
- Build with production profile (no dev client).

---

## Future maintenance watchlist
- New screens under `app/` become public routes automatically.
- Any new feature needs a real backend or must be gated.
- Keep `docs/MIGRATION_HISTORY.md` updated after every DB change.
- Add pre‑release script that runs the health checks + basic smoke tests.
