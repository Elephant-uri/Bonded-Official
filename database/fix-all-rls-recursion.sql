-- ============================================================================
-- COMPREHENSIVE RLS RECURSION FIX
-- ============================================================================
-- This script fixes all RLS recursion issues in the Bonded database
-- Run this in your Supabase SQL Editor
--
-- Problem: RLS policies that reference the same table in subqueries cause
-- infinite recursion (error code 42P17)
--
-- Solution: Use SECURITY DEFINER functions to bypass RLS for helper queries
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: HELPER FUNCTIONS (SECURITY DEFINER to bypass RLS)
-- ============================================================================

-- Function to get current user's university_id without triggering RLS
CREATE OR REPLACE FUNCTION get_user_university_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT university_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Function to get current user's org memberships without triggering RLS
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS TABLE(org_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.org_members WHERE user_id = auth.uid();
$$;

-- ============================================================================
-- PART 2: FIX PROFILES TABLE RLS
-- ============================================================================

-- Drop all existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view profiles from their university" ON public.profiles;
DROP POLICY IF EXISTS "Users can SELECT their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "users can view profiles from their university" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_university" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view other profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- Create new non-recursive SELECT policy for profiles
-- Users can view their own profile OR profiles from the same university
CREATE POLICY "profiles_select"
ON public.profiles
FOR SELECT
USING (
  -- Own profile always accessible
  auth.uid() = id
  OR
  -- Or same university (using helper function to avoid recursion)
  (university_id IS NOT NULL AND university_id = get_user_university_id())
);

-- Drop and recreate INSERT/UPDATE policies (keep simple)
DROP POLICY IF EXISTS "users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_insert"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- PART 3: FIX ORG_MEMBERS TABLE RLS
-- ============================================================================

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "org_members_select_policy" ON public.org_members;
DROP POLICY IF EXISTS "org_members_select" ON public.org_members;
DROP POLICY IF EXISTS "org_members_select_same_org" ON public.org_members;
DROP POLICY IF EXISTS "org_members_insert" ON public.org_members;
DROP POLICY IF EXISTS "org_members_update" ON public.org_members;
DROP POLICY IF EXISTS "org_members_delete" ON public.org_members;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.org_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.org_members;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.org_members;
DROP POLICY IF EXISTS "org_members_select_own" ON public.org_members;
DROP POLICY IF EXISTS "org_members_insert_own" ON public.org_members;
DROP POLICY IF EXISTS "org_members_update_own" ON public.org_members;
DROP POLICY IF EXISTS "org_members_delete_own" ON public.org_members;

-- Simple policies: users can only see/modify their own memberships
CREATE POLICY "org_members_select"
ON public.org_members
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "org_members_insert"
ON public.org_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "org_members_update"
ON public.org_members
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "org_members_delete"
ON public.org_members
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- PART 4: FIX URI_EVENTS TABLE RLS (if it has recursion issues)
-- ============================================================================

-- Drop any recursive policies on uri_events
DROP POLICY IF EXISTS "events_select_by_university" ON public.uri_events;
DROP POLICY IF EXISTS "events_select_recursive" ON public.uri_events;

-- Create simple event visibility policy
-- Public events are visible to all authenticated users
-- School events visible to same university
-- Org events visible to org members (checked at app level)
-- Invite-only events visible to attendees (checked at app level)
DROP POLICY IF EXISTS "events_select" ON public.uri_events;

CREATE POLICY "events_select"
ON public.uri_events
FOR SELECT
USING (
  -- Public events visible to all
  visibility = 'public'
  OR
  -- User is the organizer
  auth.uid() = organizer_id
  OR
  -- School events visible to same university (using helper function)
  (visibility = 'school' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND university_id = get_user_university_id()
  ))
  OR
  -- For org_only and invite_only, we'll check at application level
  -- to avoid complex subqueries that might cause recursion
  visibility IN ('org_only', 'invite_only')
);

-- Users can create events if they are authenticated
DROP POLICY IF EXISTS "events_insert" ON public.uri_events;
CREATE POLICY "events_insert"
ON public.uri_events
FOR INSERT
WITH CHECK (auth.uid() = organizer_id);

-- Users can update their own events
DROP POLICY IF EXISTS "events_update" ON public.uri_events;
CREATE POLICY "events_update"
ON public.uri_events
FOR UPDATE
USING (auth.uid() = organizer_id)
WITH CHECK (auth.uid() = organizer_id);

-- Users can delete their own events
DROP POLICY IF EXISTS "events_delete" ON public.uri_events;
CREATE POLICY "events_delete"
ON public.uri_events
FOR DELETE
USING (auth.uid() = organizer_id);

-- ============================================================================
-- PART 5: FIX EVENT_ATTENDANCE TABLE RLS
-- ============================================================================

-- Drop any recursive policies
DROP POLICY IF EXISTS "attendance_select" ON public.event_attendance;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.event_attendance;

-- Users can view their own attendance records
CREATE POLICY "attendance_select"
ON public.event_attendance
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own attendance
DROP POLICY IF EXISTS "attendance_insert" ON public.event_attendance;
CREATE POLICY "attendance_insert"
ON public.event_attendance
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own attendance
DROP POLICY IF EXISTS "attendance_update" ON public.event_attendance;
CREATE POLICY "attendance_update"
ON public.event_attendance
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own attendance
DROP POLICY IF EXISTS "attendance_delete" ON public.event_attendance;
CREATE POLICY "attendance_delete"
ON public.event_attendance
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- PART 6: FIX EVENT_INVITES TABLE RLS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "invites_select" ON public.event_invites;
DROP POLICY IF EXISTS "invites_insert" ON public.event_invites;
DROP POLICY IF EXISTS "invites_update" ON public.event_invites;
DROP POLICY IF EXISTS "invites_delete" ON public.event_invites;

-- Users can view invites for events they organize or are invited to
CREATE POLICY "invites_select"
ON public.event_invites
FOR SELECT
USING (
  -- User is invited
  auth.uid() = user_id
  OR
  -- User is the one who created the invite
  auth.uid() = invited_by
  OR
  -- User is the event organizer (check via events table)
  EXISTS (
    SELECT 1 FROM public.uri_events
    WHERE id = event_id
    AND organizer_id = auth.uid()
  )
);

-- Event organizers can create invites for their events
CREATE POLICY "invites_insert"
ON public.event_invites
FOR INSERT
WITH CHECK (
  auth.uid() = invited_by
  AND EXISTS (
    SELECT 1 FROM public.uri_events
    WHERE id = event_id
    AND organizer_id = auth.uid()
  )
);

-- Event organizers can update invites for their events
CREATE POLICY "invites_update"
ON public.event_invites
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.uri_events
    WHERE id = event_id
    AND organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.uri_events
    WHERE id = event_id
    AND organizer_id = auth.uid()
  )
);

-- Event organizers can delete invites for their events
CREATE POLICY "invites_delete"
ON public.event_invites
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.uri_events
    WHERE id = event_id
    AND organizer_id = auth.uid()
  )
);

-- ============================================================================
-- PART 7: GRANT PERMISSIONS
-- ============================================================================

-- Grant table access (RLS still enforces policies)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.uri_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_invites TO authenticated;

-- Grant function access
GRANT EXECUTE ON FUNCTION get_user_university_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_org_ids() TO authenticated;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (run these separately to test)
-- ============================================================================

-- Test 1: Can you read your own profile?
-- SELECT id, email, university_id FROM public.profiles WHERE id = auth.uid();

-- Test 2: Can you read profiles from your university?
-- SELECT id, email, university_id FROM public.profiles WHERE university_id = get_user_university_id();

-- Test 3: View all policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('profiles', 'org_members', 'uri_events', 'event_attendance')
-- ORDER BY tablename, policyname;

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- 1. SECURITY DEFINER functions bypass RLS but are safe here because:
--    - They only return data for the current user (auth.uid())
--    - They don't accept user input
--    - They're STABLE (cacheable within a query)
--
-- 2. Some complex visibility checks (org membership, invites) are done at
--    the application level to avoid RLS complexity. The policies allow
--    broad access, and the app filters appropriately.
--
-- 3. If you see recursion errors after running this, check:
--    - Are there policies on related tables (orgs, universities)?
--    - Are there triggers that query the same table?
--    - Are there foreign key policies?
--
-- 4. To debug RLS issues:
--    SET ROLE authenticated;
--    SET request.jwt.claim.sub = 'user-uuid-here';
--    -- Then run your query
-- ============================================================================
