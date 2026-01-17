# Pre-Build Checklist - Features That Need Fixing

**Last Updated:** January 9, 2026  
**Priority:** Fix before TestFlight build

---

## 🔴 Critical Database Issues (BLOCKING - Must Fix First)

### 0. Database Schema Not Up to Date
**Files:** `database/enable-profile-media.sql`  
**Issue:** SQL script hasn't been run - causes photo upload failures  
**Impact:** CRITICAL - Profile photos won't upload

**Errors:**
- `column profiles.banner_url does not exist` ✅ FIXED
- `new row for relation "media" violates check constraint "media_media_type_check"` - Need to run SQL

**Fix Needed:**
1. Go to Supabase SQL Editor
2. Run `database/enable-profile-media.sql`
3. This adds `profile_photo`, `profile_avatar`, `profile_banner` to `media_type` enum
4. Creates RLS policies for profile media uploads

**Estimated Time:** 5 minutes

---

## 🔴 Critical - Must Fix (Users Will Notice)

### 1. Forum Voting - UI Works But Doesn't Save
**File:** `app/forum.jsx` (lines 499-527)  
**Issue:** Vote buttons work in UI, but votes aren't saved to Supabase  
**Impact:** High - Users will vote but votes disappear on refresh

**Current Code:**
```javascript
onVote={(optionIndex) => {
  // Only updates local state, doesn't save to DB
  setPollVotes((prev) => ({ ...prev, [pollId]: { [currentUser.id]: optionIndex } }))
}}
```

**Fix Needed:**
- [ ] Create `useVotePoll` mutation hook
- [ ] Save vote to `poll_votes` table in Supabase
- [ ] Update poll results from database, not local state
- [ ] Handle vote updates (changing vote)

**Estimated Time:** 2-3 hours

---

### 2. Repost Functionality - Not Implemented
**File:** `app/forum.jsx` (line 1871)  
**Issue:** Repost button exists but doesn't save to database  
**Impact:** Medium - Feature appears broken

**Fix Needed:**
- [ ] Create `useRepost` mutation hook
- [ ] Save repost to `reposts` table
- [ ] Update repost count on post
- [ ] Show repost indicator in UI

**Estimated Time:** 2-3 hours

---

### 3. Comments - May Not Persist Properly
**File:** `app/forum.jsx`  
**Issue:** Comments UI exists but may not be fully wired to database  
**Impact:** High - Core feature broken

**Fix Needed:**
- [ ] Verify comment creation saves to `comments` table
- [ ] Verify comment counts update correctly
- [ ] Test nested replies (if implemented)
- [ ] Ensure RLS policies allow comment reads/writes

**Estimated Time:** 3-4 hours

---

## 🟡 High Priority - Should Fix (Confusing UX)

### 4. Event Media Storage - Using Signed URLs Instead of Paths
**File:** `app/events/create.jsx` (line 221)  
**Issue:** TODO comment says "Store media path instead of signed URL"  
**Impact:** Medium - May cause issues with expired URLs

**Fix Needed:**
- [ ] Store canonical paths in `media_urls` array
- [ ] Generate signed URLs on-demand when displaying
- [ ] Update event detail page to use paths

**Estimated Time:** 2-3 hours

---

### 5. Social Links Navigation - Not Implemented
**File:** `app/profile.jsx` (lines 230, 242, 254)  
**Issue:** Instagram, Spotify, Apple Music links don't navigate  
**Impact:** Low-Medium - Links appear clickable but don't work

**Fix Needed:**
- [ ] Add `Linking.openURL()` for social links
- [ ] Handle missing URLs gracefully
- [ ] Add loading state for external links

**Estimated Time:** 1 hour

---

### 6. Profile Friend Navigation - Not Implemented
**File:** `app/profile.jsx` (line 308)  
**Issue:** Can't navigate to friend's profile  
**Impact:** Medium - Core social feature broken

**Fix Needed:**
- [ ] Implement navigation to friend profile
- [ ] Pass user ID to profile route
- [ ] Handle "viewing own profile" vs "viewing friend profile"

**Estimated Time:** 2 hours

---

## 🟢 Medium Priority - Nice to Have

### 7. Anonymous Message Sending
**File:** `app/forum.jsx` (line 1238)  
**Issue:** Anonymous messaging UI exists but may not work  
**Impact:** Low - Feature may be gated

**Fix Needed:**
- [ ] Verify anonymous messages save correctly
- [ ] Ensure `is_anonymous` flag is respected
- [ ] Test message delivery

**Estimated Time:** 1-2 hours

---

### 8. Posting as Organization
**File:** `app/forum.jsx` (line 1687)  
**Issue:** "Post as org" option exists but may not work  
**Impact:** Low - Feature may be gated

**Fix Needed:**
- [ ] Verify org posts save with correct `organization_id`
- [ ] Show org name/avatar in post
- [ ] Handle org permissions

**Estimated Time:** 2-3 hours

---

### 9. Reply to Reply Functionality
**File:** `app/forum.jsx` (line 963)  
**Issue:** Nested replies may not be fully implemented  
**Impact:** Medium - Users expect to reply to replies

**Fix Needed:**
- [ ] Verify nested comment structure in database
- [ ] Test reply-to-reply UI
- [ ] Ensure comment threading works

**Estimated Time:** 2-3 hours

---

## ✅ Already Gated (No Fix Needed)

These features are properly gated and won't confuse users:

- ✅ **Link AI** - Redirects to home (gated)
- ✅ **Rate My Professor** - Redirects to home (gated)
- ✅ **Paid Events** - Shows "Coming Soon" (gated)
- ✅ **Meme/GIF Picker** - Removed from UI (gated)
- ✅ **Tag Filtering** - Removed from UI (gated)

---

## 🧪 Testing Checklist

Before building, test these flows:

### Forum Flow
- [ ] Create text post → Verify saves to database
- [ ] Create image post → Verify images upload and display
- [ ] Vote on poll → Verify vote persists after refresh
- [ ] Comment on post → Verify comment saves and displays
- [ ] Reply to comment → Verify nested reply works
- [ ] Repost → Verify repost saves (if implementing)
- [ ] Delete own post → Verify soft delete works

### Events Flow
- [ ] Create event → Verify saves to database
- [ ] Upload event image → Verify image displays
- [ ] RSVP to event → Verify attendance saves
- [ ] View event details → Verify all data loads

### Profile Flow
- [ ] Edit profile name → Verify saves
- [ ] View friend profile → Verify navigation works
- [ ] Click social links → Verify opens external app/browser

### Onboarding Flow
- [ ] Complete all 4 steps → Verify data saves
- [ ] Upload photos → Verify photos upload
- [ ] Upload schedule → Verify OCR works (in dev build)
- [ ] Skip schedule → Verify can continue

---

## 🚨 Known Issues That Are OK for Beta

These are acceptable for TestFlight beta:

- ✅ **RLS Errors** - Warning banner shows, fallback works
- ✅ **OCR in Expo Go** - Manual entry works as fallback
- ✅ **Stories using mock data** - Feature gated/not critical
- ✅ **No real-time updates** - Polling works for beta

---

## 📋 Quick Fix Priority

### Before First Build (Must Have):
1. **Forum Voting** - 2-3 hours
2. **Comments Persistence** - 3-4 hours
3. **Event Media Paths** - 2-3 hours

**Total:** ~8-10 hours

### Before Public Beta (Should Have):
4. **Repost Functionality** - 2-3 hours
5. **Profile Friend Navigation** - 2 hours
6. **Social Links** - 1 hour

**Total:** ~5-6 hours

---

## 🎯 Recommendation

**For TestFlight Beta:**
- ✅ Fix voting (critical - users will notice)
- ✅ Fix comments (critical - core feature)
- ⏳ Can wait: Reposts, social links, friend navigation

**Minimum Viable Beta:**
- Posts create/display ✅
- Comments work ✅
- Voting works ✅
- Events create/display ✅
- Onboarding works ✅

---

## 📝 Notes

- Most features are **80-90% complete**
- Main issues are **database persistence** (not saving votes/reposts)
- UI is mostly complete, just needs backend wiring
- Error handling is good (shows alerts, doesn't crash)

---

**Next Steps:**
1. Fix voting persistence (highest priority)
2. Verify comments work end-to-end
3. Test full user flow before building
4. Build and test on device

