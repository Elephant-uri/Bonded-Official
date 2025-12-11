-- ============================================
-- BONDED APP - COMPLETE SCHEMA ADDITIONS (FIXED)
-- Addressing all missing features for a production-ready social app
-- Run this AFTER your existing schemas
-- ============================================

-- ============================================
-- SECTION 1: SOCIAL GRAPH & RELATIONSHIPS
-- ============================================

-- Friend/Follow relationships (hybrid model: friends + followers)
CREATE TABLE IF NOT EXISTS public.relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('friend', 'follow', 'block', 'restricted')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Can't have duplicate relationships
  UNIQUE(user_id, target_user_id, relationship_type),
  -- Can't follow/friend yourself
  CHECK (user_id != target_user_id)
);

-- Indexes for social graph queries
CREATE INDEX IF NOT EXISTS idx_relationships_user ON public.relationships(user_id, relationship_type, status);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON public.relationships(target_user_id, relationship_type, status);
CREATE INDEX IF NOT EXISTS idx_relationships_friends ON public.relationships(user_id, target_user_id) 
  WHERE relationship_type = 'friend' AND status = 'accepted';

-- Close friends list (Instagram-style)
CREATE TABLE IF NOT EXISTS public.close_friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX IF NOT EXISTS idx_close_friends_user ON public.close_friends(user_id);

-- ============================================
-- SECTION 2: STORIES SYSTEM (Snapchat/Instagram style)
-- ============================================

CREATE TABLE IF NOT EXISTS public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  forum_id uuid REFERENCES public.forums(id) ON DELETE CASCADE, -- Optional: forum-specific stories
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  caption text,
  visibility text DEFAULT 'all_friends' CHECK (visibility IN ('all_friends', 'close_friends', 'forum_only', 'custom')),
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  view_count integer DEFAULT 0,
  is_highlighted boolean DEFAULT false, -- For permanent highlights
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz -- Soft delete
);

-- Indexes for stories
CREATE INDEX IF NOT EXISTS idx_stories_user ON public.stories(user_id, expires_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stories_forum ON public.stories(forum_id, expires_at DESC) WHERE forum_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stories_active ON public.stories(expires_at) WHERE expires_at > now() AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stories_visibility ON public.stories(user_id, visibility, expires_at) WHERE deleted_at IS NULL;

-- Story views tracking
CREATE TABLE IF NOT EXISTS public.story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  
  -- One view per user per story
  UNIQUE(story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_story ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer ON public.story_views(viewer_id);

-- Story reactions (quick reactions like Instagram)
CREATE TABLE IF NOT EXISTS public.story_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL, -- '❤️', '🔥', '😂', etc.
  message text, -- Optional DM-style reply
  created_at timestamptz DEFAULT now(),
  
  -- One reaction per user per story
  UNIQUE(story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_reactions_story ON public.story_reactions(story_id);

-- Story highlights (permanent story collections)
CREATE TABLE IF NOT EXISTS public.story_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  highlight_name text,
  cover_image_url text,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, story_id)
);

CREATE INDEX IF NOT EXISTS idx_story_highlights_user ON public.story_highlights(user_id);

-- ============================================
-- SECTION 3: NOTIFICATION SYSTEM
-- ============================================

-- Notification types configuration
CREATE TABLE IF NOT EXISTS public.notification_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name text UNIQUE NOT NULL, -- 'new_follower', 'friend_request', 'post_like', etc.
  category text NOT NULL CHECK (category IN ('social', 'academic', 'events', 'dating', 'system')),
  default_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT false,
  in_app_enabled boolean DEFAULT true
);

-- Insert default notification types
INSERT INTO public.notification_types (type_name, category, default_enabled, push_enabled, email_enabled) VALUES
  ('friend_request', 'social', true, true, false),
  ('friend_accepted', 'social', true, true, false),
  ('new_follower', 'social', true, true, false),
  ('post_liked', 'social', true, false, false),
  ('post_comment', 'social', true, true, false),
  ('mentioned_in_post', 'social', true, true, true),
  ('story_reaction', 'social', true, false, false),
  ('anonymous_message', 'social', true, true, false),
  ('bond_match', 'dating', true, true, true),
  ('bond_message', 'dating', true, true, false),
  ('event_invite', 'events', true, true, true),
  ('event_reminder', 'events', true, true, false),
  ('class_forum_post', 'academic', true, false, false),
  ('assignment_reminder', 'academic', true, true, true),
  ('verification_reminder', 'system', true, false, true)
ON CONFLICT (type_name) DO NOTHING;

-- User notification preferences
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type_id uuid NOT NULL REFERENCES public.notification_types(id) ON DELETE CASCADE,
  enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT false,
  quiet_hours_start time,
  quiet_hours_end time,
  
  UNIQUE(user_id, notification_type_id)
);

CREATE INDEX IF NOT EXISTS idx_user_notif_prefs ON public.user_notification_preferences(user_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb, -- Flexible data for different notification types
  action_url text, -- Deep link or web URL
  image_url text, -- For rich notifications
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_read boolean DEFAULT false,
  is_seen boolean DEFAULT false,
  pushed_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days')
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_unseen ON public.notifications(user_id, is_seen) WHERE is_seen = false;
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_unread_count ON public.notifications(user_id, is_read, created_at DESC)
  WHERE is_read = false;

-- Push token management
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_id text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON public.push_tokens(user_id) WHERE is_active = true;

-- ============================================
-- SECTION 4: AI-POWERED MATCHING SYSTEM (Dating)
-- ============================================

-- User Bond preferences
CREATE TABLE IF NOT EXISTS public.bond_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  looking_for text[] DEFAULT ARRAY['friendship', 'dating'], -- Can be multiple
  gender_preference text[], -- ['male', 'female', 'non-binary', 'all']
  age_range int4range DEFAULT '[18,25]',
  distance_miles integer DEFAULT 10,
  shared_interests_weight float DEFAULT 0.3,
  personality_weight float DEFAULT 0.4,
  academic_weight float DEFAULT 0.3,
  is_active boolean DEFAULT true,
  show_me_to text DEFAULT 'everyone' CHECK (show_me_to IN ('everyone', 'matches_only', 'no_one')),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT check_age_range_valid CHECK (lower(age_range) >= 18 AND upper(age_range) <= 100)
);

-- Personality vectors for ML matching
CREATE TABLE IF NOT EXISTS public.personality_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Big 5 personality traits
  openness float CHECK (openness BETWEEN 0 AND 1),
  conscientiousness float CHECK (conscientiousness BETWEEN 0 AND 1),
  extraversion float CHECK (extraversion BETWEEN 0 AND 1),
  agreeableness float CHECK (agreeableness BETWEEN 0 AND 1),
  neuroticism float CHECK (neuroticism BETWEEN 0 AND 1),
  -- Custom traits
  humor_vector float[], -- Different humor styles as vector
  values_vector float[], -- Core values as vector
  lifestyle_vector float[], -- Lifestyle preferences
  -- Embeddings
  bio_embedding vector(1536), -- OpenAI embedding of bio text
  interests_embedding vector(1536), -- Embedding of interests
  personality_quiz_answers jsonb,
  last_calculated timestamptz DEFAULT now()
);

-- Create index for vector similarity search (requires pgvector extension)
-- Uncomment after installing pgvector:
-- CREATE INDEX IF NOT EXISTS idx_personality_bio_embedding ON personality_profiles USING ivfflat (bio_embedding vector_cosine_ops) WITH (lists = 100);
-- CREATE INDEX IF NOT EXISTS idx_personality_interests_embedding ON personality_profiles USING ivfflat (interests_embedding vector_cosine_ops) WITH (lists = 100);

-- Bond matches (initial version - will be extended in revised features)
CREATE TABLE IF NOT EXISTS public.bond_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_score float NOT NULL CHECK (match_score BETWEEN 0 AND 1),
  match_reasons jsonb, -- AI-generated compatibility explanation
  personality_score float,
  interests_score float,
  academic_score float,
  stage text DEFAULT 'initial' CHECK (stage IN ('initial', 'chatting', 'photo_revealed', 'full_reveal', 'met_irl')),
  conversation_quality_score float, -- Track engagement quality
  user1_revealed boolean DEFAULT false,
  user2_revealed boolean DEFAULT false,
  user1_rating integer CHECK (user1_rating BETWEEN 1 AND 10),
  user2_rating integer CHECK (user2_rating BETWEEN 1 AND 10),
  matched_at timestamptz DEFAULT now(),
  chatting_since timestamptz,
  photos_revealed_at timestamptz,
  fully_revealed_at timestamptz,
  met_irl_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '7 days'), -- Match expires if no interaction
  
  -- Ensure user1_id < user2_id for consistency
  CONSTRAINT bond_match_user_order CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id)
);

-- Indexes for matching
CREATE INDEX IF NOT EXISTS idx_bond_matches_user1 ON public.bond_matches(user1_id, stage);
CREATE INDEX IF NOT EXISTS idx_bond_matches_user2 ON public.bond_matches(user2_id, stage);
CREATE INDEX IF NOT EXISTS idx_bond_matches_active ON public.bond_matches(expires_at) WHERE expires_at > now();
CREATE INDEX IF NOT EXISTS idx_bond_matches_score ON public.bond_matches(match_score DESC);

-- Swipe/decision history
CREATE TABLE IF NOT EXISTS public.bond_swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('like', 'pass', 'super_like')),
  swiped_at timestamptz DEFAULT now(),
  
  UNIQUE(swiper_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_bond_swipes_swiper ON public.bond_swipes(swiper_id, swiped_at DESC);
CREATE INDEX IF NOT EXISTS idx_bond_swipes_mutual ON public.bond_swipes(swiper_id, target_id) WHERE direction = 'like';

-- ============================================
-- SECTION 5: BADGE/ACHIEVEMENT SYSTEM
-- ============================================

-- Badge definitions
CREATE TABLE IF NOT EXISTS public.badge_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('academic', 'social', 'event', 'org', 'special', 'verified')),
  icon_url text,
  points integer DEFAULT 10,
  rarity text DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  criteria jsonb, -- Automated criteria for earning
  is_automated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Insert some default badges
INSERT INTO public.badge_types (name, description, category, rarity, is_automated) VALUES
  ('Early Adopter', 'Joined during beta', 'special', 'epic', false),
  ('Social Butterfly', 'Made 50+ friends', 'social', 'uncommon', true),
  ('Event Master', 'Attended 20+ events', 'event', 'uncommon', true),
  ('Study Buddy', 'Active in 5+ class forums', 'academic', 'common', true),
  ('Night Owl', 'Posted after 2 AM', 'social', 'common', true),
  ('Org Leader', 'Officer in organization', 'org', 'rare', false),
  ('Dean''s List', 'Academic excellence', 'academic', 'rare', false),
  ('Campus Influencer', '1000+ followers', 'social', 'epic', true),
  ('Perfect Match', 'Rated 10/10 in Bond', 'social', 'legendary', true)
ON CONFLICT (name) DO NOTHING;

-- User badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type_id uuid NOT NULL REFERENCES public.badge_types(id) ON DELETE CASCADE,
  org_id uuid, -- Org-specific badges (references orgs/organizations/clubs - adjust as needed)
  earned_at timestamptz DEFAULT now(),
  earned_reason text,
  is_featured boolean DEFAULT false, -- Show on profile
  metadata jsonb, -- Additional badge-specific data
  
  -- Can't earn same badge twice (unless org-specific)
  UNIQUE(user_id, badge_type_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_featured ON public.user_badges(user_id, is_featured) WHERE is_featured = true;

-- Badge progress tracking
CREATE TABLE IF NOT EXISTS public.badge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type_id uuid NOT NULL REFERENCES public.badge_types(id) ON DELETE CASCADE,
  current_progress integer DEFAULT 0,
  target_progress integer NOT NULL,
  last_updated timestamptz DEFAULT now(),
  
  UNIQUE(user_id, badge_type_id)
);

CREATE INDEX IF NOT EXISTS idx_badge_progress_user ON public.badge_progress(user_id);

-- ============================================
-- SECTION 6: CONTENT MODERATION
-- ============================================

-- Moderation queue
CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('post', 'comment', 'message', 'profile', 'story', 'event')),
  content_id uuid NOT NULL, -- References the specific content
  reported_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate_speech', 'violence', 'sexual_content', 'misinformation', 'other')),
  details text,
  ai_flagged boolean DEFAULT false,
  ai_confidence float,
  ai_categories text[], -- AI-detected problem categories
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'removed', 'warning_issued', 'false_positive')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  action_taken text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for moderation
CREATE INDEX IF NOT EXISTS idx_moderation_pending ON public.moderation_queue(status, priority DESC, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_moderation_user ON public.moderation_queue(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_content ON public.moderation_queue(content_type, content_id);

-- User violations/strikes
CREATE TABLE IF NOT EXISTS public.user_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  violation_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe')),
  content_type text,
  content_id uuid,
  description text,
  action_taken text NOT NULL CHECK (action_taken IN ('warning', 'content_removed', 'temporary_ban', 'feature_restriction', 'permanent_ban')),
  expires_at timestamptz, -- For temporary bans
  issued_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  issued_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_violations_user ON public.user_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_violations_active ON public.user_violations(user_id, expires_at) WHERE expires_at > now();

-- Shadow ban tracking
CREATE TABLE IF NOT EXISTS public.shadow_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ban_type text NOT NULL CHECK (ban_type IN ('reduced_visibility', 'no_anonymous', 'no_dating', 'no_events')),
  reason text,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  UNIQUE(user_id, ban_type)
);

CREATE INDEX IF NOT EXISTS idx_shadow_bans_active ON public.shadow_bans(user_id) WHERE ends_at IS NULL OR ends_at > now();

-- Content filters (auto-moderation rules)
CREATE TABLE IF NOT EXISTS public.content_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filter_name text UNIQUE NOT NULL,
  filter_type text NOT NULL CHECK (filter_type IN ('keyword', 'regex', 'ai_category')),
  pattern text NOT NULL, -- Keyword, regex pattern, or AI category
  action text NOT NULL CHECK (action IN ('flag', 'hold', 'reject', 'shadow_hide')),
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  applies_to text[] DEFAULT ARRAY['post', 'comment', 'message'], -- Content types
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_filters_active ON public.content_filters(filter_type) WHERE is_active = true;

-- ============================================
-- SECTION 7: PERFORMANCE OPTIMIZATIONS
-- ============================================

-- Materialized view for user stats (refresh periodically)
-- NOTE: Create this AFTER event_attendance table exists
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_stats AS
SELECT 
  p.id as user_id,
  p.university_id,
  COUNT(DISTINCT r1.target_user_id) FILTER (WHERE r1.relationship_type = 'friend' AND r1.status = 'accepted') as friend_count,
  COUNT(DISTINCT r2.user_id) FILTER (WHERE r2.relationship_type = 'follow') as follower_count,
  COUNT(DISTINCT r3.target_user_id) FILTER (WHERE r3.relationship_type = 'follow') as following_count,
  COUNT(DISTINCT posts.id) FILTER (WHERE posts.deleted_at IS NULL) as post_count,
  COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'going') as events_attended,
  COUNT(DISTINCT ub.badge_type_id) as badge_count,
  COALESCE(SUM(posts.upvotes_count) FILTER (WHERE posts.deleted_at IS NULL), 0) as total_upvotes,
  MAX(posts.created_at) FILTER (WHERE posts.deleted_at IS NULL) as last_active_at
FROM public.profiles p
LEFT JOIN public.relationships r1 ON p.id = r1.user_id
LEFT JOIN public.relationships r2 ON p.id = r2.target_user_id  
LEFT JOIN public.relationships r3 ON p.id = r3.user_id
LEFT JOIN public.posts ON p.id = posts.user_id
LEFT JOIN public.event_attendance ea ON p.id = ea.user_id
LEFT JOIN public.user_badges ub ON p.id = ub.user_id
GROUP BY p.id, p.university_id;

-- Create indexes on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_stats_user ON public.user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_followers ON public.user_stats(follower_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_activity ON public.user_stats(last_active_at DESC NULLS LAST);

-- Function to refresh user stats (call periodically)
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SECTION 8: ANALYTICS & METRICS
-- ============================================

-- User activity tracking
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for activity log
CREATE TABLE IF NOT EXISTS public.user_activity_log_2024_01 PARTITION OF public.user_activity_log
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Index for activity queries
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.user_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON public.user_activity_log(activity_type, created_at DESC);

-- ============================================
-- SECTION 9: FEED ALGORITHM SUPPORT
-- ============================================

-- Feed preferences learning
CREATE TABLE IF NOT EXISTS public.feed_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  interaction_type text NOT NULL CHECK (interaction_type IN ('view', 'like', 'comment', 'share', 'hide', 'report')),
  dwell_time_seconds integer,
  viewport_percentage float, -- How much of post was visible
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_interactions_user ON public.feed_interactions(user_id, created_at DESC);

-- User feed preferences (learned)
CREATE TABLE IF NOT EXISTS public.user_feed_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_topics text[],
  preferred_posters uuid[],
  topic_weights jsonb, -- {"academic": 0.3, "social": 0.5, "events": 0.2}
  engagement_time_pattern jsonb, -- Peak activity hours
  last_calculated timestamptz DEFAULT now()
);

-- ============================================
-- SECTION 10: HELPER FUNCTIONS
-- ============================================

-- Function to calculate mutual friends
CREATE OR REPLACE FUNCTION get_mutual_friends(user1_id uuid, user2_id uuid)
RETURNS integer AS $$
DECLARE
  mutual_count integer;
BEGIN
  -- SECURITY: User must be one of the two users
  IF auth.uid() NOT IN (user1_id, user2_id) THEN
    RAISE EXCEPTION 'Access denied: Can only query mutual friends involving yourself';
  END IF;
  
  SELECT COUNT(DISTINCT friend_id) INTO mutual_count
  FROM (
    -- User1's friends
    SELECT target_user_id as friend_id
    FROM public.relationships
    WHERE user_id = user1_id 
      AND relationship_type = 'friend' 
      AND status = 'accepted'
    
    INTERSECT
    
    -- User2's friends
    SELECT target_user_id as friend_id
    FROM public.relationships  
    WHERE user_id = user2_id
      AND relationship_type = 'friend'
      AND status = 'accepted'
  ) mutual_friends;
  
  RETURN mutual_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's notification count
CREATE OR REPLACE FUNCTION get_unread_notifications(user_uuid uuid)
RETURNS integer AS $$
DECLARE
  unread_count integer;
BEGIN
  -- SECURITY: User can only query their own notifications
  IF user_uuid != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Cannot query notifications for other users';
  END IF;
  
  SELECT COUNT(*) INTO unread_count
  FROM public.notifications
  WHERE user_id = user_uuid
    AND is_read = false
    AND (expires_at IS NULL OR expires_at > now());
    
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired content
CREATE OR REPLACE FUNCTION cleanup_expired_content()
RETURNS void AS $$
BEGIN
  -- SECURITY: Only allow service role or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) AND current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Only admins or service role can run cleanup';
  END IF;
  
  -- Delete expired stories (not highlighted)
  DELETE FROM public.stories 
  WHERE expires_at < now() AND is_highlighted = false;
  
  -- Delete expired notifications
  DELETE FROM public.notifications 
  WHERE expires_at < now();
  
  -- Expire old matches
  UPDATE public.bond_matches
  SET stage = 'ended'
  WHERE expires_at < now() AND stage NOT IN ('met_irl');
  
  -- Clean up old activity logs (keep last 90 days)
  DELETE FROM public.user_activity_log
  WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SECTION 11: ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.close_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personality_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadow_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feed_preferences ENABLE ROW LEVEL SECURITY;

-- Relationships policies
DROP POLICY IF EXISTS "Users can view their relationships" ON public.relationships;
CREATE POLICY "Users can view their relationships" ON public.relationships
  FOR SELECT USING (auth.uid() IN (user_id, target_user_id));

DROP POLICY IF EXISTS "Users can create relationships" ON public.relationships;
CREATE POLICY "Users can create relationships" ON public.relationships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their relationships" ON public.relationships;
CREATE POLICY "Users can update their relationships" ON public.relationships
  FOR UPDATE 
  USING (auth.uid() IN (user_id, target_user_id))
  WITH CHECK (
    -- Prevent changing user_id or target_user_id
    user_id = OLD.user_id AND target_user_id = OLD.target_user_id
  );

DROP POLICY IF EXISTS "Users can delete their relationships" ON public.relationships;
CREATE POLICY "Users can delete their relationships"
  ON public.relationships
  FOR DELETE
  USING (auth.uid() = user_id);

-- Close friends policies
DROP POLICY IF EXISTS "Users can view own close friends" ON public.close_friends;
CREATE POLICY "Users can view own close friends" ON public.close_friends
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own close friends" ON public.close_friends;
CREATE POLICY "Users can manage own close friends" ON public.close_friends
  FOR ALL USING (auth.uid() = user_id);

-- Stories policies
DROP POLICY IF EXISTS "Users can view stories" ON public.stories;
CREATE POLICY "Users can view stories" ON public.stories
  FOR SELECT USING (
    -- Own stories
    user_id = auth.uid() OR
    -- Active stories from friends/followed users
    (expires_at > now() AND deleted_at IS NULL AND (
      visibility = 'all_friends' AND user_id IN (
        SELECT target_user_id FROM public.relationships
        WHERE user_id = auth.uid() 
          AND relationship_type IN ('friend', 'follow')
          AND status = 'accepted'
      ) OR
      visibility = 'close_friends' AND user_id IN (
        SELECT friend_id FROM public.close_friends
        WHERE user_id = auth.uid()
      )
    ))
  );

DROP POLICY IF EXISTS "Users can create their own stories" ON public.stories;
CREATE POLICY "Users can create their own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;
CREATE POLICY "Users can delete their own stories"
  ON public.stories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Story views policies
DROP POLICY IF EXISTS "Users can view story views" ON public.story_views;
CREATE POLICY "Users can view story views" ON public.story_views
  FOR SELECT USING (
    story_id IN (SELECT id FROM public.stories WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create story views" ON public.story_views;
CREATE POLICY "Users can create story views" ON public.story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Story reactions policies
DROP POLICY IF EXISTS "Users can view story reactions" ON public.story_reactions;
CREATE POLICY "Users can view story reactions" ON public.story_reactions
  FOR SELECT USING (
    story_id IN (
      SELECT id FROM public.stories 
      WHERE user_id = auth.uid() OR 
      (expires_at > now() AND visibility IN ('all_friends', 'close_friends'))
    )
  );

DROP POLICY IF EXISTS "Users can create story reactions" ON public.story_reactions;
CREATE POLICY "Users can create story reactions" ON public.story_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Story highlights policies
DROP POLICY IF EXISTS "Users can view story highlights" ON public.story_highlights;
CREATE POLICY "Users can view story highlights" ON public.story_highlights
  FOR SELECT USING (
    user_id = auth.uid() OR
    user_id IN (
      SELECT target_user_id FROM public.relationships
      WHERE user_id = auth.uid() 
        AND relationship_type IN ('friend', 'follow')
        AND status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Users can manage own story highlights" ON public.story_highlights;
CREATE POLICY "Users can manage own story highlights" ON public.story_highlights
  FOR ALL USING (auth.uid() = user_id);

-- Notifications policies  
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Push tokens policies
DROP POLICY IF EXISTS "Users can manage own push tokens" ON public.push_tokens;
CREATE POLICY "Users can manage own push tokens" ON public.push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Bond preferences policies
DROP POLICY IF EXISTS "Users can manage own bond preferences" ON public.bond_preferences;
CREATE POLICY "Users can manage own bond preferences" ON public.bond_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Personality profiles policies
DROP POLICY IF EXISTS "Users can manage own personality profile" ON public.personality_profiles;
CREATE POLICY "Users can manage own personality profile" ON public.personality_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Bond matches policies
DROP POLICY IF EXISTS "Users can view their matches" ON public.bond_matches;
CREATE POLICY "Users can view their matches" ON public.bond_matches
  FOR SELECT USING (auth.uid() IN (user1_id, user2_id));

DROP POLICY IF EXISTS "Users can update their matches" ON public.bond_matches;
CREATE POLICY "Users can update their matches" ON public.bond_matches
  FOR UPDATE USING (auth.uid() IN (user1_id, user2_id));

-- Bond swipes policies
DROP POLICY IF EXISTS "Users can manage own swipes" ON public.bond_swipes;
CREATE POLICY "Users can manage own swipes" ON public.bond_swipes
  FOR ALL USING (auth.uid() = swiper_id);

-- User badges policies
DROP POLICY IF EXISTS "Users can view badges" ON public.user_badges;
CREATE POLICY "Users can view badges" ON public.user_badges
  FOR SELECT USING (
    -- Can see own badges or featured badges of others from same university
    user_id = auth.uid() OR
    (is_featured = true AND user_id IN (
      SELECT id FROM public.profiles
      WHERE university_id = (
        SELECT university_id FROM public.profiles WHERE id = auth.uid()
      )
    ))
  );

-- Badge progress policies
DROP POLICY IF EXISTS "Users can view badge progress" ON public.badge_progress;
CREATE POLICY "Users can view badge progress" ON public.badge_progress
  FOR SELECT USING (
    user_id = auth.uid() OR
    user_id IN (
      SELECT id FROM public.profiles
      WHERE university_id = (
        SELECT university_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Moderation queue (admin only)
DROP POLICY IF EXISTS "Admins can view moderation queue" ON public.moderation_queue;
CREATE POLICY "Admins can view moderation queue" ON public.moderation_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can report content" ON public.moderation_queue;
CREATE POLICY "Users can report content" ON public.moderation_queue
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- User violations (admin + own)
DROP POLICY IF EXISTS "Users can view own violations" ON public.user_violations;
CREATE POLICY "Users can view own violations" ON public.user_violations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage violations" ON public.user_violations;
CREATE POLICY "Admins can manage violations" ON public.user_violations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Shadow bans (admin only)
DROP POLICY IF EXISTS "Admins can view shadow bans" ON public.shadow_bans;
CREATE POLICY "Admins can view shadow bans" ON public.shadow_bans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User notification preferences policies
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.user_notification_preferences;
CREATE POLICY "Users can manage own notification preferences" ON public.user_notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Feed interactions policies
DROP POLICY IF EXISTS "Users can manage own feed interactions" ON public.feed_interactions;
CREATE POLICY "Users can manage own feed interactions" ON public.feed_interactions
  FOR ALL USING (auth.uid() = user_id);

-- User feed preferences policies
DROP POLICY IF EXISTS "Users can manage own feed preferences" ON public.user_feed_preferences;
CREATE POLICY "Users can manage own feed preferences" ON public.user_feed_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- SECTION 12: TRIGGERS & AUTOMATION
-- ============================================

-- Auto-create notification for friend request
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.relationship_type = 'friend' AND NEW.status = 'pending' THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      body,
      sender_id,
      data,
      action_url
    ) VALUES (
      NEW.target_user_id,
      'friend_request',
      'New Friend Request',
      (SELECT full_name FROM public.profiles WHERE id = NEW.user_id) || ' wants to be friends',
      NEW.user_id,
      jsonb_build_object('relationship_id', NEW.id),
      '/friends/requests'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_friend_request_notification ON public.relationships;
CREATE TRIGGER trigger_friend_request_notification
  AFTER INSERT ON public.relationships
  FOR EACH ROW
  WHEN (NEW.relationship_type = 'friend')
  EXECUTE FUNCTION notify_friend_request();

-- Update story view count
CREATE OR REPLACE FUNCTION update_story_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.stories
  SET view_count = view_count + 1
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_story_view_count ON public.story_views;
CREATE TRIGGER trigger_story_view_count
  AFTER INSERT ON public.story_views
  FOR EACH ROW
  EXECUTE FUNCTION update_story_view_count();

-- Auto-award badges based on criteria
CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS void AS $$
DECLARE
  badge_record record;
  user_record record;
BEGIN
  -- Check each automated badge type
  FOR badge_record IN 
    SELECT * FROM public.badge_types WHERE is_automated = true
  LOOP
    -- Example: Social Butterfly (50+ friends)
    IF badge_record.name = 'Social Butterfly' THEN
      FOR user_record IN
        SELECT user_id, COUNT(*) as friend_count
        FROM public.relationships
        WHERE relationship_type = 'friend' AND status = 'accepted'
        GROUP BY user_id
        HAVING COUNT(*) >= 50
      LOOP
        INSERT INTO public.user_badges (user_id, badge_type_id)
        VALUES (user_record.user_id, badge_record.id)
        ON CONFLICT DO NOTHING;
        
        -- Update progress
        INSERT INTO public.badge_progress (user_id, badge_type_id, current_progress, target_progress)
        VALUES (user_record.user_id, badge_record.id, user_record.friend_count, 50)
        ON CONFLICT (user_id, badge_type_id) 
        DO UPDATE SET current_progress = user_record.friend_count;
      END LOOP;
    END IF;
    
    -- Event Master (20+ events)
    IF badge_record.name = 'Event Master' THEN
      FOR user_record IN
        SELECT user_id, COUNT(*) as event_count
        FROM public.event_attendance
        WHERE status = 'going'
        GROUP BY user_id
        HAVING COUNT(*) >= 20
      LOOP
        INSERT INTO public.user_badges (user_id, badge_type_id)
        VALUES (user_record.user_id, badge_record.id)
        ON CONFLICT DO NOTHING;
        
        INSERT INTO public.badge_progress (user_id, badge_type_id, current_progress, target_progress)
        VALUES (user_record.user_id, badge_record.id, user_record.event_count, 20)
        ON CONFLICT (user_id, badge_type_id) 
        DO UPDATE SET current_progress = user_record.event_count;
      END LOOP;
    END IF;
    
    -- Add more badge checks as needed
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- NOTES:
-- 1. This adds all missing core features
-- 2. Includes proper indexing for performance
-- 3. RLS policies ensure data isolation
-- 4. Notification system supports push/email/in-app
-- 5. Matching system ready for ML integration
-- 6. Moderation system includes AI flagging support
-- 7. Some features require extensions:
--    - pgvector for embedding similarity search
--    - pg_partman for automatic partition management
-- 8. Run this AFTER your existing schemas
-- 9. Adjust notification types and badge types as needed
-- 10. Materialized view requires event_attendance table
-- 11. Verify org_id references (might be organizations or clubs table)
-- ============================================

