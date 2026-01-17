-- Super admin support for cross-campus testing and moderation.
-- Run in Supabase SQL editor.

-- 1) Flag super admins
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

UPDATE profiles
SET is_super_admin = TRUE
WHERE LOWER(email) = 'isaac@mergefund.org';

-- 2) Helper function for RLS checks
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND is_super_admin = TRUE
  );
$$;

-- 3) Super admin policies (bypass campus scoping)

-- Profiles (needed for joins on posts/comments)
CREATE POLICY "super admin read profiles"
ON profiles FOR SELECT
USING (public.is_super_admin());

-- Forums
CREATE POLICY "super admin read forums"
ON forums FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "super admin write forums"
ON forums FOR INSERT
WITH CHECK (public.is_super_admin());

CREATE POLICY "super admin update forums"
ON forums FOR UPDATE
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "super admin delete forums"
ON forums FOR DELETE
USING (public.is_super_admin());

-- Posts
CREATE POLICY "super admin read posts"
ON posts FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "super admin write posts"
ON posts FOR INSERT
WITH CHECK (public.is_super_admin());

CREATE POLICY "super admin update posts"
ON posts FOR UPDATE
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "super admin delete posts"
ON posts FOR DELETE
USING (public.is_super_admin());

-- Comments
CREATE POLICY "super admin read comments"
ON forum_comments FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "super admin write comments"
ON forum_comments FOR INSERT
WITH CHECK (public.is_super_admin());

CREATE POLICY "super admin update comments"
ON forum_comments FOR UPDATE
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "super admin delete comments"
ON forum_comments FOR DELETE
USING (public.is_super_admin());

-- Reactions
CREATE POLICY "super admin read post reactions"
ON post_reactions FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "super admin write post reactions"
ON post_reactions FOR INSERT
WITH CHECK (public.is_super_admin());

CREATE POLICY "super admin update post reactions"
ON post_reactions FOR UPDATE
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "super admin delete post reactions"
ON post_reactions FOR DELETE
USING (public.is_super_admin());

-- Reposts
CREATE POLICY "super admin read reposts"
ON forum_reposts FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "super admin write reposts"
ON forum_reposts FOR INSERT
WITH CHECK (public.is_super_admin());

CREATE POLICY "super admin update reposts"
ON forum_reposts FOR UPDATE
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "super admin delete reposts"
ON forum_reposts FOR DELETE
USING (public.is_super_admin());

-- Polls
CREATE POLICY "super admin read polls"
ON polls FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "super admin write polls"
ON polls FOR INSERT
WITH CHECK (public.is_super_admin());

CREATE POLICY "super admin update polls"
ON polls FOR UPDATE
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "super admin delete polls"
ON polls FOR DELETE
USING (public.is_super_admin());

CREATE POLICY "super admin read poll votes"
ON poll_votes FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "super admin write poll votes"
ON poll_votes FOR INSERT
WITH CHECK (public.is_super_admin());

CREATE POLICY "super admin update poll votes"
ON poll_votes FOR UPDATE
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "super admin delete poll votes"
ON poll_votes FOR DELETE
USING (public.is_super_admin());

-- Stories
DO $$
BEGIN
  IF to_regclass('public.stories') IS NOT NULL THEN
    CREATE POLICY "super admin read stories"
    ON stories FOR SELECT
    USING (public.is_super_admin());

    CREATE POLICY "super admin write stories"
    ON stories FOR INSERT
    WITH CHECK (public.is_super_admin());

    CREATE POLICY "super admin update stories"
    ON stories FOR UPDATE
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

    CREATE POLICY "super admin delete stories"
    ON stories FOR DELETE
    USING (public.is_super_admin());
  END IF;

  IF to_regclass('public.stories_viewers') IS NOT NULL THEN
    CREATE POLICY "super admin read story viewers"
    ON stories_viewers FOR SELECT
    USING (public.is_super_admin());

    CREATE POLICY "super admin write story viewers"
    ON stories_viewers FOR INSERT
    WITH CHECK (public.is_super_admin());

    CREATE POLICY "super admin update story viewers"
    ON stories_viewers FOR UPDATE
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

    CREATE POLICY "super admin delete story viewers"
    ON stories_viewers FOR DELETE
    USING (public.is_super_admin());
  END IF;
END $$;
