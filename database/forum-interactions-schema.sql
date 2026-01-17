-- ============================================================================
-- Forum Interactions Schema (Post Reactions + RLS)
-- ============================================================================
-- Ensures post reactions table exists and is writable by authenticated users.
-- Run this in Supabase SQL Editor.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('upvote', 'downvote')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT post_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT post_reactions_unique UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS post_reactions_post_idx ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS post_reactions_user_idx ON public.post_reactions(user_id);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read post reactions" ON public.post_reactions;
DROP POLICY IF EXISTS "Users can create post reactions" ON public.post_reactions;
DROP POLICY IF EXISTS "Users can update post reactions" ON public.post_reactions;
DROP POLICY IF EXISTS "Users can delete post reactions" ON public.post_reactions;

CREATE POLICY "Users can read post reactions"
ON public.post_reactions FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create post reactions"
ON public.post_reactions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update post reactions"
ON public.post_reactions FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete post reactions"
ON public.post_reactions FOR DELETE
USING (user_id = auth.uid());
