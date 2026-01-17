-- Fix potential RLS recursion on org_members table
-- Error seen: "infinite recursion detected in policy for relation \"org_members\""
-- Run this in Supabase SQL Editor.

-- 1) Drop existing SELECT/INSERT/UPDATE policies that might reference org_members in a subquery
DROP POLICY IF EXISTS "org_members_select_policy" ON public.org_members;
DROP POLICY IF EXISTS "org_members_select" ON public.org_members;
DROP POLICY IF EXISTS "org_members_select_same_org" ON public.org_members;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.org_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.org_members;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.org_members;

-- 2) Simple, non-recursive policies

-- Allow a user to read their own memberships
CREATE POLICY "org_members_select_own"
ON public.org_members
FOR SELECT
USING (auth.uid() = user_id);

-- Allow inserts only for yourself
CREATE POLICY "org_members_insert_own"
ON public.org_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow updates only to your own row (if updates are needed)
CREATE POLICY "org_members_update_own"
ON public.org_members
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- (Optional) Uncomment to allow deletion of your own memberships
-- CREATE POLICY "org_members_delete_own"
-- ON public.org_members
-- FOR DELETE
-- USING (auth.uid() = user_id);

-- 3) Grant table access to authenticated role (still enforced by RLS)
GRANT SELECT, INSERT, UPDATE ON public.org_members TO authenticated;

-- 4) Verify
-- SELECT * FROM pg_policies WHERE tablename = 'org_members';
