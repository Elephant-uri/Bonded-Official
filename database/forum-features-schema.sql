-- ============================================
-- Forum Features Database Schema
-- Comprehensive schema for forum posts, tags, polls, comments, reposts, and anonymous messaging
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- Step 1: Create base tables (if they don't exist)
-- ============================================

-- Forums table (campus forums, class forums, etc.)
CREATE TABLE IF NOT EXISTS public.forums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE,
  type text DEFAULT 'campus' CHECK (type IN ('campus', 'class', 'org', 'club')),
  is_public boolean DEFAULT true,
  -- Note: class_id column is added by class-schedule-schema.sql AFTER classes table exists
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, university_id) -- Prevent duplicate forum names per university
);

-- Posts table (forum posts)
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id uuid NOT NULL REFERENCES public.forums(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  tags text[] DEFAULT '{}', -- Array of tag strings (e.g., ['Housing', 'Events'])
  is_anonymous boolean DEFAULT false,
  media_urls text[], -- Array of image/video URLs
  upvotes_count integer DEFAULT 0,
  downvotes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  reposts_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz -- Soft delete
);

-- Indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_forum ON public.posts(forum_id);
CREATE INDEX IF NOT EXISTS idx_posts_user ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN(tags); -- GIN index for array searches
CREATE INDEX IF NOT EXISTS idx_posts_forum_created ON public.posts(forum_id, created_at DESC);

-- ============================================
-- Step 2: Polls Tables
-- ============================================

-- Polls table (polls attached to posts)
CREATE TABLE IF NOT EXISTS public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  question text NOT NULL,
  options text[] NOT NULL, -- Array of poll option strings (e.g., ['Option 1', 'Option 2'])
  expires_at timestamptz, -- Optional expiration
  hide_results_until_vote boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_poll_options CHECK (array_length(options, 1) >= 2 AND array_length(options, 1) <= 6)
);

-- Poll votes table
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  option_index integer NOT NULL, -- Index into the options array (0-based)
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  
  -- One vote per user per poll
  UNIQUE(poll_id, user_id),
  CONSTRAINT valid_option_index CHECK (option_index >= 0)
);

-- Indexes for polls
CREATE INDEX IF NOT EXISTS idx_polls_post ON public.polls(post_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON public.poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON public.poll_votes(user_id);

-- ============================================
-- Step 3: Comments Table (with threading support)
-- ============================================

CREATE TABLE IF NOT EXISTS public.forum_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.forum_comments(id) ON DELETE CASCADE, -- For threading/replies
  body text NOT NULL,
  is_anonymous boolean DEFAULT false,
  upvotes_count integer DEFAULT 0,
  downvotes_count integer DEFAULT 0,
  likes_count integer DEFAULT 0, -- For Facebook-style likes
  reports_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz -- Soft delete
);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.forum_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.forum_comments(post_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON public.forum_comments(post_id, created_at DESC);

-- ============================================
-- Step 4: Post Reactions (likes, upvotes, downvotes)
-- ============================================

CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'upvote', 'downvote')),
  created_at timestamptz DEFAULT now(),
  
  -- One reaction per user per post (user can change reaction type)
  UNIQUE(post_id, user_id)
);

-- Indexes for reactions
CREATE INDEX IF NOT EXISTS idx_reactions_post ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON public.post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON public.post_reactions(post_id, reaction_type);

-- ============================================
-- Step 5: Reposts Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.forum_reposts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reposted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  repost_type text NOT NULL CHECK (repost_type IN ('raw', 'quote')), -- 'raw' = simple repost, 'quote' = with caption
  caption_text text, -- For quote reposts
  reposted_to_forum_id uuid REFERENCES public.forums(id) ON DELETE SET NULL, -- If reposted to different forum
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate reposts (same user reposting same post)
  UNIQUE(post_id, reposted_by)
);

-- Indexes for reposts
CREATE INDEX IF NOT EXISTS idx_reposts_post ON public.forum_reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_user ON public.forum_reposts(reposted_by);
CREATE INDEX IF NOT EXISTS idx_reposts_forum ON public.forum_reposts(reposted_to_forum_id);

-- ============================================
-- Step 6: Update Messages Table for Anonymous Messaging
-- ============================================

-- Add columns to messages table if they don't exist
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_revealed boolean DEFAULT false; -- If sender reveals identity

-- ============================================
-- Step 7: Anonymous Chat Abuse Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS public.anonymous_chat_abuse_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  reported_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- The anonymous sender (if revealed)
  abuse_type text NOT NULL CHECK (abuse_type IN ('harassment', 'spam', 'inappropriate', 'threat', 'other')),
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes for abuse log
CREATE INDEX IF NOT EXISTS idx_abuse_log_message ON public.anonymous_chat_abuse_log(message_id);
CREATE INDEX IF NOT EXISTS idx_abuse_log_reported_user ON public.anonymous_chat_abuse_log(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_abuse_log_status ON public.anonymous_chat_abuse_log(status);

-- User anonymous privileges (track abuse to revoke privileges)
CREATE TABLE IF NOT EXISTS public.user_anonymous_privileges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  can_send_anonymous boolean DEFAULT true,
  abuse_count integer DEFAULT 0,
  last_abuse_at timestamptz,
  revoked_until timestamptz, -- Temporary ban
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Indexes for privileges
CREATE INDEX IF NOT EXISTS idx_anonymous_privileges_user ON public.user_anonymous_privileges(user_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_privileges_revoked ON public.user_anonymous_privileges(revoked_until) WHERE revoked_until IS NOT NULL;

-- ============================================
-- Step 8: Update Triggers
-- ============================================

-- Trigger to update posts.updated_at
CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_posts_updated_at ON public.posts;
CREATE TRIGGER trigger_update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION update_posts_updated_at();

-- Trigger to update comments.updated_at
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comments_updated_at ON public.forum_comments;
CREATE TRIGGER trigger_update_comments_updated_at
  BEFORE UPDATE ON public.forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();

-- Trigger to update comment count on posts
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON public.forum_comments;
CREATE TRIGGER trigger_update_post_comment_count
  AFTER INSERT OR DELETE ON public.forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- Trigger to update repost count on posts
CREATE OR REPLACE FUNCTION update_post_repost_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET reposts_count = reposts_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET reposts_count = GREATEST(0, reposts_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_repost_count ON public.forum_reposts;
CREATE TRIGGER trigger_update_post_repost_count
  AFTER INSERT OR DELETE ON public.forum_reposts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_repost_count();

-- ============================================
-- Step 9: Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_chat_abuse_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_anonymous_privileges ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Forums Policies
-- ============================================

-- Users can view forums from their university
DROP POLICY IF EXISTS "Users can view forums from their university" ON public.forums;
CREATE POLICY "Users can view forums from their university"
  ON public.forums FOR SELECT
  USING (
    auth.uid() IS NOT NULL  -- Require authentication
    AND university_id IN (
      SELECT university_id FROM public.profiles WHERE id = auth.uid()
    )
    -- Note: Class forum access (type = 'class') is added by class-schedule-schema.sql
    -- after class_id column and user_class_enrollments table exist
  );

-- Users can create forums (admins only in future, for now allow)
DROP POLICY IF EXISTS "Users can create forums" ON public.forums;
CREATE POLICY "Users can create forums"
  ON public.forums FOR INSERT
  WITH CHECK (
    university_id IN (
      SELECT university_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ============================================
-- Posts Policies
-- ============================================

-- Users can view posts from forums they can access
DROP POLICY IF EXISTS "Users can view posts from accessible forums" ON public.posts;
CREATE POLICY "Users can view posts from accessible forums"
  ON public.posts FOR SELECT
  USING (
    forum_id IN (
      SELECT id FROM public.forums
      WHERE university_id IN (
        SELECT university_id FROM public.profiles WHERE id = auth.uid()
      )
      -- Note: Class forum access is added by class-schedule-schema.sql
      -- after class_id column and user_class_enrollments table exist
    )
    AND deleted_at IS NULL
  );

-- Users can create posts in forums they can access
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND forum_id IN (
      SELECT id FROM public.forums
      WHERE university_id IN (
        SELECT university_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Users can update/delete their own posts
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id); -- Soft delete via deleted_at

-- ============================================
-- Polls Policies
-- ============================================

-- Users can view polls for posts they can view
DROP POLICY IF EXISTS "Users can view polls for accessible posts" ON public.polls;
CREATE POLICY "Users can view polls for accessible posts"
  ON public.polls FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM public.posts
      WHERE forum_id IN (
        SELECT id FROM public.forums
        WHERE university_id IN (
          SELECT university_id FROM public.profiles WHERE id = auth.uid()
        )
      )
    )
  );

-- Post creators can create polls
DROP POLICY IF EXISTS "Post creators can create polls" ON public.polls;
CREATE POLICY "Post creators can create polls"
  ON public.polls FOR INSERT
  WITH CHECK (
    post_id IN (
      SELECT id FROM public.posts WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- Poll Votes Policies
-- ============================================

-- Users can view poll votes for polls they can view
DROP POLICY IF EXISTS "Users can view poll votes" ON public.poll_votes;
CREATE POLICY "Users can view poll votes"
  ON public.poll_votes FOR SELECT
  USING (
    poll_id IN (
      SELECT id FROM public.polls
      WHERE post_id IN (
        SELECT id FROM public.posts
        WHERE forum_id IN (
          SELECT id FROM public.forums
          WHERE university_id IN (
            SELECT university_id FROM public.profiles WHERE id = auth.uid()
          )
        )
      )
    )
  );

-- Users can vote on polls
DROP POLICY IF EXISTS "Users can vote on polls" ON public.poll_votes;
CREATE POLICY "Users can vote on polls"
  ON public.poll_votes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Comments Policies
-- ============================================

-- Users can view comments for posts they can view
DROP POLICY IF EXISTS "Users can view comments for accessible posts" ON public.forum_comments;
CREATE POLICY "Users can view comments for accessible posts"
  ON public.forum_comments FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM public.posts
      WHERE forum_id IN (
        SELECT id FROM public.forums
        WHERE university_id IN (
          SELECT university_id FROM public.profiles WHERE id = auth.uid()
        )
      )
    )
    AND deleted_at IS NULL
  );

-- Users can create comments
DROP POLICY IF EXISTS "Users can create comments" ON public.forum_comments;
CREATE POLICY "Users can create comments"
  ON public.forum_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update/delete their own comments
DROP POLICY IF EXISTS "Users can update their own comments" ON public.forum_comments;
CREATE POLICY "Users can update their own comments"
  ON public.forum_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.forum_comments;
CREATE POLICY "Users can delete their own comments"
  ON public.forum_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id); -- Soft delete

-- ============================================
-- Post Reactions Policies
-- ============================================

-- Users can view reactions for posts they can view
DROP POLICY IF EXISTS "Users can view reactions" ON public.post_reactions;
CREATE POLICY "Users can view reactions"
  ON public.post_reactions FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM public.posts
      WHERE forum_id IN (
        SELECT id FROM public.forums
        WHERE university_id IN (
          SELECT university_id FROM public.profiles WHERE id = auth.uid()
        )
      )
    )
  );

-- Users can react to posts
DROP POLICY IF EXISTS "Users can react to posts" ON public.post_reactions;
CREATE POLICY "Users can react to posts"
  ON public.post_reactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Reposts Policies
-- ============================================

-- Users can view reposts for posts they can view
DROP POLICY IF EXISTS "Users can view reposts" ON public.forum_reposts;
CREATE POLICY "Users can view reposts"
  ON public.forum_reposts FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM public.posts
      WHERE forum_id IN (
        SELECT id FROM public.forums
        WHERE university_id IN (
          SELECT university_id FROM public.profiles WHERE id = auth.uid()
        )
      )
    )
  );

-- Users can create reposts
DROP POLICY IF EXISTS "Users can create reposts" ON public.forum_reposts;
CREATE POLICY "Users can create reposts"
  ON public.forum_reposts FOR INSERT
  WITH CHECK (auth.uid() = reposted_by);

-- Users can delete their own reposts
DROP POLICY IF EXISTS "Users can delete their own reposts" ON public.forum_reposts;
CREATE POLICY "Users can delete their own reposts"
  ON public.forum_reposts FOR DELETE
  USING (auth.uid() = reposted_by);

-- ============================================
-- Anonymous Chat Abuse Log Policies
-- ============================================

-- Users can report abuse
DROP POLICY IF EXISTS "Users can report anonymous chat abuse" ON public.anonymous_chat_abuse_log;
CREATE POLICY "Users can report anonymous chat abuse"
  ON public.anonymous_chat_abuse_log FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

-- Users can view their own reports
DROP POLICY IF EXISTS "Users can view their own reports" ON public.anonymous_chat_abuse_log;
CREATE POLICY "Users can view their own reports"
  ON public.anonymous_chat_abuse_log FOR SELECT
  USING (auth.uid() = reported_by);

-- Admins can view all reports
DROP POLICY IF EXISTS "Admins can view all abuse reports" ON public.anonymous_chat_abuse_log;
CREATE POLICY "Admins can view all abuse reports"
  ON public.anonymous_chat_abuse_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- User Anonymous Privileges Policies
-- ============================================

-- Users can view their own privileges
DROP POLICY IF EXISTS "Users can view their own anonymous privileges" ON public.user_anonymous_privileges;
CREATE POLICY "Users can view their own anonymous privileges"
  ON public.user_anonymous_privileges FOR SELECT
  USING (auth.uid() = user_id);

-- System can update privileges (via service role, not user)
-- No user-accessible INSERT/UPDATE policies for security

-- ============================================
-- Notes:
-- 1. Run this script AFTER creating universities and profiles tables
-- 2. Run class-schedule-schema.sql AFTER this to add class_id column and class forum support
-- 3. All tables use UUID primary keys
-- 4. Soft deletes are used (deleted_at) instead of hard deletes
-- 5. RLS policies ensure campus isolation
-- 6. Indexes are optimized for common queries
-- 7. Triggers maintain count fields automatically
-- 8. Anonymous messaging requires additional moderation setup
-- 9. class_id column is NOT created here - it's added by class-schedule-schema.sql
-- ============================================

