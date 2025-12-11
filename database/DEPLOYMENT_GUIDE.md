# 🚀 Bonded Database - Supabase Deployment Guide

**Status**: ✅ **All Security Fixes Applied**  
**Ready for Production**: ✅ **YES** (after following this guide)

> 📚 **For detailed engineering documentation, architecture decisions, and scalability considerations, see [`ENGINEERING_DOCUMENTATION.md`](./ENGINEERING_DOCUMENTATION.md)**

---

## 📋 **DEPLOYMENT CHECKLIST**

Before starting:
- [ ] Supabase project created
- [ ] Supabase SQL Editor open
- [ ] Backup of any existing data (if updating)
- [ ] All files downloaded/accessible

---

## 📦 **FILES TO DEPLOY (IN ORDER)**

### **PHASE 0: Base Tables** (REQUIRED FIRST!)

0. ✅ **`00-base-schema.sql`** ⚠️ **RUN THIS FIRST!**
   - Creates `universities` table
   - Creates `profiles` table
   - Creates `messages` table (if needed)
   - Creates `conversations` table (if needed)
   - Creates `orgs` table (if doesn't exist)
   - Creates `org_members` table
   - Sets up base RLS policies

### **PHASE 1: Base Schema** (Required First)

1. ✅ **`setup.sql`**
   - Creates auth trigger
   - Sets up profiles RLS
   - **Adds admin role column** (security fix)

### **PHASE 2: Core Features** (Run in order)

2. ✅ **`onboarding-schema.sql`**
   - Adds onboarding fields to profiles

3. ✅ **`forum-features-schema.sql`** ⚠️ **Must run before class-schedule-schema.sql**
   - Forums, posts, comments, polls
   - **Security fixes applied** (auth required, WITH CHECK clauses)
   - Creates `forums` table (required by class-schedule-schema.sql)

4. ✅ **`class-schedule-schema.sql`**
   - Classes, sections, enrollments
   - **Security fixes applied** (user validation in functions)
   - References `forums` table (must exist first)

5. ✅ **`events-schema.sql`**
   - Events, attendance, invites
   - **Security fixes applied** (user validation, auth required)

### **PHASE 3: Extended Features** (Run after Phase 2)

6. ✅ **`complete-schema-additions-fixed.sql`**
   - Social graph, stories, notifications, badges, moderation
   - **Security fixes applied** (all functions validated)

7. ✅ **`revised-features-fixed.sql`**
   - OCR schedule upload, Bond dating enhancements
   - **Security fixes applied** (input validation, user checks)

### **PHASE 4: Security & Final Fixes** (Run last)

8. ✅ **`SECURITY_FIXES.sql`**
   - Additional security hardening
   - Admin role setup
   - Input constraints
   - Messages table RLS (if exists)

---

## 🔢 **EXACT DEPLOYMENT ORDER**

Copy and paste these files into Supabase SQL Editor **in this exact order**:

```
0. 00-base-schema.sql          ⚠️ RUN THIS FIRST!
1. setup.sql
2. onboarding-schema.sql
3. forum-features-schema.sql    ⚠️ Must run before class-schedule-schema.sql
4. class-schedule-schema.sql
5. events-schema.sql
6. complete-schema-additions-fixed.sql
7. revised-features-fixed.sql
8. SECURITY_FIXES.sql
```

---

## 📝 **STEP-BY-STEP INSTRUCTIONS**

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Click **New Query**

### Step 2: Run Each File
For each file in order:

1. **Copy the entire contents** of the file
2. **Paste into SQL Editor**
3. **Click "Run"** (or press Cmd/Ctrl + Enter)
4. **Wait for success** ✅
5. **Check for errors** (should be none)
6. **Move to next file**

### Step 3: Verify Installation

After all files are run, verify with:

```sql
-- Check all tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles', 'relationships', 'stories', 'notifications', 
  'bond_matches', 'events', 'forums', 'posts'
)
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('relationships', 'stories', 'notifications')
ORDER BY tablename;

-- Check admin role column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles' 
AND column_name = 'role';
```

### Step 4: Set Up First Admin User

```sql
-- Replace 'your-user-id' with your actual user UUID
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'your-user-id';

-- Verify
SELECT id, email, role 
FROM public.profiles 
WHERE role = 'admin';
```

**How to find your user ID:**
```sql
-- Get your user ID from auth.users
SELECT id, email 
FROM auth.users 
WHERE email = 'your-email@example.com';
```

### Step 5: Set Up Cron Jobs (Optional but Recommended)

In Supabase Dashboard → Database → Cron:

```sql
-- Daily cleanup (2 AM)
SELECT cron.schedule(
  'cleanup-expired-content',
  '0 2 * * *',
  $$SELECT cleanup_expired_content()$$
);

-- Hourly stats refresh
SELECT cron.schedule(
  'refresh-user-stats',
  '0 * * * *',
  $$SELECT refresh_user_stats()$$
);

-- Daily badge check (3 AM)
SELECT cron.schedule(
  'check-badges',
  '0 3 * * *',
  $$SELECT check_and_award_badges()$$
);
```

---

## ⚠️ **IMPORTANT NOTES**

### Before Running:

1. **Verify Base Tables Exist**:
   - If you already have `profiles`, `universities`, `forums` tables, that's fine
   - The scripts use `IF NOT EXISTS` so they won't break

2. **Table Name Variations**:
   - Scripts reference `orgs` table
   - If yours is named `organizations` or `clubs`, update references:
   ```sql
   -- Find and replace in files:
   -- public.orgs → public.organizations (or public.clubs)
   ```

3. **Extensions** (Optional):
   ```sql
   -- For vector embeddings (personality matching)
   CREATE EXTENSION IF NOT EXISTS vector;
   
   -- For partition management
   CREATE EXTENSION IF NOT EXISTS pg_partman;
   ```

### After Running:

1. **Test Security**:
   ```sql
   -- Try to query another user's events (should fail)
   SELECT * FROM get_user_events('some-other-user-id');
   -- Should return: "Access denied: Cannot query events for other users"
   ```

2. **Test RLS**:
   ```sql
   -- As a regular user, try to see admin-only data (should fail)
   SELECT * FROM moderation_queue;
   -- Should return: empty (no rows visible)
   ```

3. **Monitor Logs**:
   - Check Supabase logs for any errors
   - Monitor query performance

---

## 🐛 **TROUBLESHOOTING**

### Error: "relation does not exist"
**Cause**: Missing dependency table  
**Fix**: Run files in correct order (see order above)

### Error: "permission denied"
**Cause**: RLS blocking access  
**Fix**: Verify you're authenticated and policies are correct

### Error: "duplicate key value"
**Cause**: Data already exists  
**Fix**: Use `ON CONFLICT DO NOTHING` or delete existing data first

### Error: "function does not exist"
**Cause**: Function not created  
**Fix**: Re-run the file that creates the function

### Error: "column does not exist"
**Cause**: Missing column  
**Fix**: Run `setup.sql` first to add required columns

---

## ✅ **VERIFICATION CHECKLIST**

After deployment, verify:

- [ ] All 8 files run successfully
- [ ] No errors in Supabase logs
- [ ] Admin role column exists in profiles
- [ ] RLS enabled on all tables
- [ ] Functions validate user access
- [ ] Admin user set up
- [ ] Cron jobs configured (optional)
- [ ] Security tests pass

---

## 📊 **WHAT EACH FILE DOES**

| File | Purpose | Tables Created | Security Fixes |
|------|---------|---------------|----------------|
| `setup.sql` | Base setup, auth trigger | - | Admin role column |
| `onboarding-schema.sql` | Onboarding fields | - | - |
| `class-schedule-schema.sql` | Classes & enrollments | 3 | User validation |
| `forum-features-schema.sql` | Forums & posts | 9 | Auth required, WITH CHECK |
| `events-schema.sql` | Events system | 4 | User validation, auth required |
| `complete-schema-additions-fixed.sql` | Social features | 20+ | All functions validated |
| `revised-features-fixed.sql` | OCR & Bond | 6 | Input validation |
| `SECURITY_FIXES.sql` | Final hardening | - | Additional fixes |

---

## 🔐 **SECURITY FEATURES APPLIED**

✅ All SECURITY DEFINER functions validate `auth.uid()`  
✅ All helper functions check user access  
✅ All tables require authentication  
✅ Admin role properly secured  
✅ Input validation on all user data  
✅ Length constraints on text fields  
✅ WITH CHECK clauses on UPDATE policies  
✅ DELETE policies added where needed  

---

## 📞 **SUPPORT**

If you encounter issues:

1. Check error messages carefully
2. Verify file order
3. Check Supabase logs
4. Review `SECURITY_AUDIT_CRITICAL.md` for details
5. Test functions individually

---

## 🎯 **QUICK REFERENCE**

**Files to Deploy**: 8 files  
**Total Time**: ~10-15 minutes  
**Order**: Critical (must follow)  
**Status**: ✅ Production Ready

**Deployment Order**:
```
1. setup.sql
2. onboarding-schema.sql
3. class-schedule-schema.sql
4. forum-features-schema.sql
5. events-schema.sql
6. complete-schema-additions-fixed.sql
7. revised-features-fixed.sql
8. SECURITY_FIXES.sql
```

---

**Last Updated**: 2024  
**Status**: ✅ **READY FOR PRODUCTION**  
**Security**: ✅ **ALL FIXES APPLIED**

