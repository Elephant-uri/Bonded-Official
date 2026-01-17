-- Fix infinite recursion in profiles RLS policy
-- Error: "infinite recursion detected in policy for relation \"profiles\""
-- 
-- This happens when an RLS policy references the profiles table itself
-- in a subquery, causing a recursive loop.
--
-- IMPORTANT: Run this in your Supabase SQL Editor to fix the issue

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "users can view profiles from their university" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles from their university" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_university" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view other profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "Users can SELECT their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Step 2: Create a SECURITY DEFINER function to bypass RLS when getting university_id
-- This function can read the profiles table without triggering RLS recursion
CREATE OR REPLACE FUNCTION get_user_university_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- SECURITY DEFINER allows this to bypass RLS
  SELECT university_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Step 3: Create simple, non-recursive policies

-- Policy 1: Users can always read their own profile (no subquery needed)
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Allow users to read profiles from their university
-- This uses the SECURITY DEFINER function to avoid recursion
CREATE POLICY "profiles_select_university"
ON public.profiles
FOR SELECT
USING (
  -- Own profile always accessible
  auth.uid() = id
  OR
  -- Or same university (using function to avoid recursion)
  (university_id IS NOT NULL AND university_id = get_user_university_id())
);

-- Step 4: Ensure insert/update policies are simple
DROP POLICY IF EXISTS "users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Step 5: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_university_id() TO authenticated;

-- Verification query (run this to test):
-- SELECT id, email, university_id FROM public.profiles WHERE id = auth.uid();
-- Should work without recursion error

-- NOTES:
-- - The old policy likely had: university_id IN (SELECT university_id FROM profiles WHERE ...)
-- - This creates infinite recursion because the policy references the same table
-- - The fix: Use a SECURITY DEFINER function that bypasses RLS
-- - This allows university filtering while avoiding recursion
-- - The function runs with elevated privileges but only returns the current user's university_id
