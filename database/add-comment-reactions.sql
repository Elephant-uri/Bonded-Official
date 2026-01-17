-- ============================================================================
-- Add Forum Comment Reactions Table
-- ============================================================================
-- This script creates a table for per-user comment upvotes/downvotes.
-- Each user can cast exactly one reaction per comment.
--
-- Run this in Supabase SQL Editor.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.forum_comment_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('upvote', 'downvote')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT forum_comment_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT forum_comment_reactions_unique UNIQUE (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_comment_reactions_comment_id
ON public.forum_comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_forum_comment_reactions_user_id
ON public.forum_comment_reactions(user_id);

ALTER TABLE public.forum_comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view forum comment reactions"
ON public.forum_comment_reactions FOR SELECT
TO authenticated
USING (
  comment_id IN (SELECT id FROM forum_comments)
);

CREATE POLICY "Users can add forum comment reactions"
ON public.forum_comment_reactions FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND comment_id IN (SELECT id FROM forum_comments)
);

CREATE POLICY "Users can update own forum comment reactions"
ON public.forum_comment_reactions FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own forum comment reactions"
ON public.forum_comment_reactions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

SELECT
  'forum_comment_reactions table created successfully! ✅' AS status,
  COUNT(*) as total_reactions
FROM forum_comment_reactions;
