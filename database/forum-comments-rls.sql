-- ============================================================================
-- Forum Comments RLS (Temporary permissive update for votes)
-- ============================================================================
-- Allows authenticated users to insert comments and update vote counts.
-- Run this in Supabase SQL Editor.
-- ============================================================================

ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "forum_comments_select" ON public.forum_comments;
DROP POLICY IF EXISTS "forum_comments_insert" ON public.forum_comments;
DROP POLICY IF EXISTS "forum_comments_update" ON public.forum_comments;
DROP POLICY IF EXISTS "forum_comments_delete_own" ON public.forum_comments;

CREATE POLICY "forum_comments_select"
ON public.forum_comments FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "forum_comments_insert"
ON public.forum_comments FOR INSERT
WITH CHECK (user_id = auth.uid());

-- NOTE: This allows vote count updates by any authenticated user.
CREATE POLICY "forum_comments_update"
ON public.forum_comments FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "forum_comments_delete_own"
ON public.forum_comments FOR DELETE
USING (user_id = auth.uid());
