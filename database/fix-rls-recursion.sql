-- Fix RLS infinite recursion on profiles table
-- Error: "infinite recursion detected in policy for relation 'profiles'"
--
-- IMPORTANT: Run this in your Supabase SQL Editor to fix the issue

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
-- TODO: Add university filtering later using a helper function
CREATE POLICY "Users can view other profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() IS NOT NULL  -- Must be authenticated
);

-- Step 3: Verify policies are working
-- SELECT * FROM pg_policies WHERE tablename = 'profiles' AND policyname LIKE '%view%';

-- NOTES:
-- - The old policy likely had: university_id IN (SELECT university_id FROM profiles WHERE ...)
-- - This creates infinite recursion because the policy references the same table
-- - The fix: Remove the circular reference
-- - University filtering should be done at the application level OR with a helper function
-- - Alternative: Store university_id in auth.users metadata and check that instead
