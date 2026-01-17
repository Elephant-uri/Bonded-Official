-- Hard reset for user_class_enrollments RLS policies (drops all policies, recreates safe ones).
-- Run in Supabase SQL editor.

DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_class_enrollments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_class_enrollments;', policy_record.policyname);
  END LOOP;
END $$;

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
