-- Fix infinite recursion in user_class_enrollments RLS policy
-- Error: "infinite recursion detected in policy for relation \"user_class_enrollments\""
--
-- IMPORTANT: Run this in your Supabase SQL Editor to fix the issue

DO $$
BEGIN
  IF to_regclass('public.user_class_enrollments') IS NULL THEN
    RAISE NOTICE 'Table public.user_class_enrollments does not exist. Skipping.';
    RETURN;
  END IF;
END $$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "user_class_enrollments_select" ON public.user_class_enrollments;
DROP POLICY IF EXISTS "user_class_enrollments_insert" ON public.user_class_enrollments;
DROP POLICY IF EXISTS "user_class_enrollments_update" ON public.user_class_enrollments;
DROP POLICY IF EXISTS "user_class_enrollments_delete" ON public.user_class_enrollments;
DROP POLICY IF EXISTS "user_class_enrollments_select_own" ON public.user_class_enrollments;
DROP POLICY IF EXISTS "user_class_enrollments_insert_own" ON public.user_class_enrollments;
DROP POLICY IF EXISTS "user_class_enrollments_update_own" ON public.user_class_enrollments;
DROP POLICY IF EXISTS "user_class_enrollments_delete_own" ON public.user_class_enrollments;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.user_class_enrollments;
DROP POLICY IF EXISTS "Users can view enrollments" ON public.user_class_enrollments;
DROP POLICY IF EXISTS "Users can view their enrollments" ON public.user_class_enrollments;
DROP POLICY IF EXISTS "user_class_enrollments_select" ON public.user_class_enrollments;
DROP POLICY IF EXISTS "user_class_enrollments_insert" ON public.user_class_enrollments;
DROP POLICY IF EXISTS "user_class_enrollments_update" ON public.user_class_enrollments;
DROP POLICY IF EXISTS "user_class_enrollments_delete" ON public.user_class_enrollments;

-- Create simple, non-recursive policies
CREATE POLICY "user_class_enrollments_select_own"
ON public.user_class_enrollments
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_super_admin()
);

CREATE POLICY "user_class_enrollments_insert_own"
ON public.user_class_enrollments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR public.is_super_admin()
);

CREATE POLICY "user_class_enrollments_update_own"
ON public.user_class_enrollments
FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.is_super_admin()
)
WITH CHECK (
  auth.uid() = user_id
  OR public.is_super_admin()
);

CREATE POLICY "user_class_enrollments_delete_own"
ON public.user_class_enrollments
FOR DELETE
USING (
  auth.uid() = user_id
  OR public.is_super_admin()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_class_enrollments TO authenticated;
