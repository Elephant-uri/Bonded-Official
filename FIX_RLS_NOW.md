# 🚨 URGENT: Fix RLS Infinite Recursion Error

## What's Broken
**Error:** `infinite recursion detected in policy for relation "profiles"`

This error is **blocking everything**:
- ❌ Can't fetch user profiles
- ❌ Can't save onboarding data
- ❌ Can't view yearbook
- ❌ Can't view forums
- ❌ Can't upload photos

## How to Fix (Takes 2 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your Bonded project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run the Fix
1. Copy the SQL below
2. Paste into SQL Editor
3. Click **RUN** (or press Cmd/Ctrl + Enter)

```sql
-- Fix RLS infinite recursion on profiles table
-- This removes the circular reference in SELECT policies

-- Step 1: Drop all existing SELECT policies on profiles table
DROP POLICY IF EXISTS "Users can view profiles from their university" ON public.profiles;
DROP POLICY IF EXISTS "Users can SELECT their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Step 2: Create NEW policies that DON'T cause recursion

-- Policy 1: Users can always view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can view other profiles (no university restriction for now)
-- This prevents the circular reference issue
CREATE POLICY "Users can view other profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() IS NOT NULL  -- Must be authenticated
);

-- Step 3: Verify policies are working
SELECT * FROM pg_policies WHERE tablename = 'profiles' AND policyname LIKE '%view%';
```

### Step 3: Verify It Worked
After running the SQL:
1. Reload your app
2. The errors should be gone
3. Profile queries should work

## Why This Happened

The old RLS policy had:
```sql
-- BAD (causes infinite recursion)
WHERE university_id IN (
  SELECT university_id FROM profiles WHERE ...
)
```

This created a circular dependency - querying `profiles` to check if you can query `profiles`.

The fix removes the circular reference by checking only `auth.uid()`.

## What This Changes

**Before:** Only users from same university could view profiles
**After:** Any authenticated user can view profiles

**Note:** You can add university filtering back later using a helper function or by storing university_id in auth.users metadata.

---

## Still Getting Errors?

If you still see the error after running the SQL:

1. **Check Supabase logs:**
   - Dashboard → Logs → Auth Logs
   - Look for policy errors

2. **Verify policies were created:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

3. **Try restarting your app:**
   - Stop Expo dev server
   - Clear cache: `npx expo start --clear`

4. **Check auth state:**
   - Make sure you're logged in
   - Check console for "auth.uid()" value

---

**Run this SQL NOW to unblock your app!** ⚡
