-- Run this in Supabase SQL Editor to check waitlist RLS setup
-- If you see no policies for "anon" on INSERT, that's why signups fail.

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'waitlist';

-- If no "Allow anonymous insert" policy exists, run:
-- CREATE POLICY "Allow anonymous insert" ON public.waitlist
--   FOR INSERT TO anon WITH CHECK (true);
