-- ============================================
-- CRITICAL SECURITY FIXES
-- Apply these fixes IMMEDIATELY before production
-- Run this AFTER all other schema files
-- ============================================

-- ============================================
-- FIX 1: Add admin role column to profiles
-- ============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role) WHERE role IN ('admin', 'moderator');

-- ============================================
-- FIX 2: Fix get_user_events() - Add user validation
-- ============================================
CREATE OR REPLACE FUNCTION get_user_events(user_id_param uuid)
RETURNS TABLE (
  event_id uuid,
  title text,
  start_at timestamptz,
  end_at timestamptz,
  visibility text,
  org_id uuid
) AS $$
BEGIN
  -- CRITICAL: Validate user can only query their own events
  IF user_id_param != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Cannot query events for other users';
  END IF;
  
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.start_at,
    e.end_at,
    e.visibility,
    e.org_id
  FROM public.events e
  WHERE
    -- User is attending
    e.id IN (
      SELECT event_id FROM public.event_attendance
      WHERE user_id = user_id_param
      AND status IN ('going', 'approved', 'maybe', 'requested')
    )
    OR
    -- Org-only event for user's orgs
    (e.visibility = 'org_only' AND e.org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = user_id_param
    ))
    OR
    -- School events
    e.visibility = 'school'
    OR
    -- Public events
    e.visibility = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FIX 3: Fix find_classmates() - Add user validation
-- ============================================
CREATE OR REPLACE FUNCTION public.find_classmates(user_uuid uuid, semester_filter text DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  shared_classes jsonb,
  shared_class_count bigint
) AS $$
BEGIN
  -- CRITICAL: Only allow querying own classmates
  IF user_uuid != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Cannot query classmates for other users';
  END IF;
  
  RETURN QUERY
  WITH user_classes AS (
    SELECT class_id, semester
    FROM public.user_class_enrollments
    WHERE user_id = user_uuid
      AND is_active = true
      AND (semester_filter IS NULL OR semester = semester_filter)
  ),
  classmates AS (
    SELECT 
      uce.user_id,
      array_agg(
        jsonb_build_object(
          'class_id', uce.class_id,
          'class_code', c.class_code,
          'class_name', c.class_name,
          'semester', uce.semester
        )
      ) as shared_classes,
      COUNT(*) as shared_class_count
    FROM public.user_class_enrollments uce
    JOIN user_classes uc ON uc.class_id = uce.class_id AND uc.semester = uce.semester
    JOIN public.classes c ON c.id = uce.class_id
    WHERE uce.user_id != user_uuid
      AND uce.is_active = true
    GROUP BY uce.user_id
    HAVING COUNT(*) > 0
    ORDER BY shared_class_count DESC
  )
  SELECT * FROM classmates;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FIX 4: Fix ensure_class_forum() - Add enrollment validation
-- ============================================
CREATE OR REPLACE FUNCTION public.ensure_class_forum(class_uuid uuid)
RETURNS uuid AS $$
DECLARE
  forum_id uuid;
  class_record record;
  is_enrolled boolean;
BEGIN
  -- CRITICAL: Verify user is enrolled in the class
  SELECT EXISTS(
    SELECT 1 FROM public.user_class_enrollments
    WHERE class_id = class_uuid
      AND user_id = auth.uid()
      AND is_active = true
  ) INTO is_enrolled;
  
  IF NOT is_enrolled THEN
    RAISE EXCEPTION 'Access denied: Not enrolled in this class';
  END IF;
  
  -- Get class details
  SELECT c.*, u.id as university_id INTO class_record
  FROM public.classes c
  JOIN public.universities u ON u.id = c.university_id
  WHERE c.id = class_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Class not found';
  END IF;
  
  -- Check if forum already exists
  SELECT id INTO forum_id
  FROM public.forums
  WHERE name = class_record.class_code || ' – ' || class_record.class_name
    AND university_id = class_record.university_id
    AND type = 'class'
  LIMIT 1;
  
  -- Create forum if it doesn't exist
  IF forum_id IS NULL THEN
    INSERT INTO public.forums (
      name,
      description,
      university_id,
      type,
      is_public,
      class_id,
      created_at
    )
    VALUES (
      class_record.class_code || ' – ' || class_record.class_name,
      'Discussion forum for ' || class_record.class_code || ': ' || class_record.class_name,
      class_record.university_id,
      'class',
      false, -- Class forums are private to enrolled students
      class_uuid,
      now()
    )
    RETURNING id INTO forum_id;
  END IF;
  
  RETURN forum_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FIX 5: Fix get_mutual_friends() - Add user validation
-- ============================================
CREATE OR REPLACE FUNCTION get_mutual_friends(user1_id uuid, user2_id uuid)
RETURNS integer AS $$
DECLARE
  mutual_count integer;
BEGIN
  -- CRITICAL: User must be one of the two users
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

-- ============================================
-- FIX 6: Fix calculate_bond_match_score() - Add user validation
-- ============================================
CREATE OR REPLACE FUNCTION calculate_bond_match_score(user1 uuid, user2 uuid)
RETURNS float AS $$
DECLARE
  personality_score float;
  rating_score float;
  final_score float;
BEGIN
  -- CRITICAL: User must be one of the two users
  IF auth.uid() NOT IN (user1, user2) THEN
    RAISE EXCEPTION 'Access denied: Can only calculate match scores involving yourself';
  END IF;
  
  -- Get personality compatibility
  SELECT total_compatibility INTO personality_score
  FROM bond_compatibility_cache
  WHERE (user1_id = LEAST(user1, user2) AND user2_id = GREATEST(user1, user2));
  
  -- Get mutual rating score (if they've rated each other)
  WITH mutual_ratings AS (
    SELECT 
      r1.rating as user1_rating,
      r2.rating as user2_rating
    FROM bond_ratings r1
    JOIN bond_ratings r2 ON r1.rated_user_id = r2.rater_id AND r1.rater_id = r2.rated_user_id
    WHERE r1.rater_id = user1 AND r1.rated_user_id = user2
      AND r1.rating_context = 'profile' AND r2.rating_context = 'profile'
  )
  SELECT (user1_rating + user2_rating) / 2.0 * 10 INTO rating_score
  FROM mutual_ratings;
  
  -- Combine scores (60% personality, 40% ratings)
  final_score := COALESCE(personality_score * 0.6, 50) + COALESCE(rating_score * 0.4, 20);
  
  RETURN LEAST(100, GREATEST(0, final_score));
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 7: Fix get_bond_rating_candidates() - Add user validation
-- ============================================
CREATE OR REPLACE FUNCTION get_bond_rating_candidates(user_id_param uuid, limit_count integer DEFAULT 10)
RETURNS TABLE (
  candidate_id uuid,
  profile_data jsonb,
  compatibility_hint text
) AS $$
BEGIN
  -- CRITICAL: User can only query their own candidates
  IF user_id_param != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Cannot query rating candidates for other users';
  END IF;
  
  -- Validate limit_count
  IF limit_count < 1 OR limit_count > 50 THEN
    RAISE EXCEPTION 'Invalid limit_count: Must be between 1 and 50';
  END IF;
  
  RETURN QUERY
  WITH already_rated AS (
    SELECT rated_user_id 
    FROM bond_ratings 
    WHERE rater_id = user_id_param
  ),
  user_preferences AS (
    SELECT * FROM bond_preferences WHERE user_id = user_id_param
  ),
  candidates AS (
    SELECT 
      p.id as candidate_id,
      jsonb_build_object(
        'bio', p.bio,
        'age', p.age,
        'major', p.major,
        'interests', p.interests,
        'personality_tags', bpq.traits
      ) as profile_data,
      CASE 
        WHEN bcc.personality_score > 80 THEN 'Very High Compatibility'
        WHEN bcc.personality_score > 60 THEN 'Good Match'
        ELSE 'Potential Match'
      END as compatibility_hint
    FROM profiles p
    LEFT JOIN bond_personality_quiz bpq ON bpq.user_id = p.id
    LEFT JOIN bond_compatibility_cache bcc ON 
      (bcc.user1_id = LEAST(user_id_param, p.id) AND 
       bcc.user2_id = GREATEST(user_id_param, p.id))
    CROSS JOIN user_preferences up
    WHERE p.id != user_id_param
      AND p.id NOT IN (SELECT rated_user_id FROM already_rated)
      AND p.university_id = (SELECT university_id FROM profiles WHERE id = user_id_param)
      AND p.age BETWEEN lower(up.age_range) AND upper(up.age_range)
      AND bpq.user_id IS NOT NULL -- Has completed personality quiz
    ORDER BY COALESCE(bcc.total_compatibility, 50) DESC, RANDOM()
    LIMIT limit_count
  )
  SELECT * FROM candidates;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 8: Fix cleanup_expired_content() - Add admin check
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_content()
RETURNS void AS $$
BEGIN
  -- CRITICAL: Only allow service role or admin
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
-- FIX 9: Fix create_classes_from_extraction() - Add input validation
-- ============================================
CREATE OR REPLACE FUNCTION create_classes_from_extraction()
RETURNS TRIGGER AS $$
DECLARE
  class_obj jsonb;
  university_id_val uuid;
  class_code_val text;
  class_name_val text;
BEGIN
  -- Get user's university
  SELECT university_id INTO university_id_val
  FROM profiles WHERE id = NEW.user_id;
  
  -- Only process if extraction completed successfully
  IF NEW.upload_status = 'completed' AND NEW.extracted_classes IS NOT NULL THEN
    -- Validate input format
    IF jsonb_typeof(NEW.extracted_classes) != 'array' THEN
      RAISE EXCEPTION 'Invalid extracted_classes format: Expected array';
    END IF;
    
    -- Loop through extracted classes
    FOR class_obj IN SELECT * FROM jsonb_array_elements(NEW.extracted_classes)
    LOOP
      -- Validate and sanitize
      class_code_val := TRIM(SUBSTRING(class_obj->>'class_code', 1, 50));  -- Limit length
      class_name_val := TRIM(SUBSTRING(class_obj->>'class_name', 1, 200));
      
      -- Validate required fields
      IF class_code_val IS NULL OR class_code_val = '' THEN
        CONTINUE;  -- Skip invalid entries
      END IF;
      
      -- Insert or get class
      INSERT INTO classes (
        university_id,
        class_code,
        class_name,
        created_at
      ) VALUES (
        university_id_val,
        class_code_val,
        class_name_val,
        now()
      )
      ON CONFLICT (university_id, class_code) DO NOTHING;
      
      -- Create enrollment
      INSERT INTO user_class_enrollments (
        user_id,
        class_id,
        semester,
        term_code,
        created_at
      )
      SELECT 
        NEW.user_id,
        c.id,
        NEW.semester,
        NEW.academic_year,
        now()
      FROM classes c
      WHERE c.university_id = university_id_val
        AND c.class_code = class_code_val
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FIX 10: Fix events RLS - Require authentication
-- ============================================
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON public.events;
CREATE POLICY "Public events are viewable by authenticated users"
ON public.events FOR SELECT
USING (
  auth.uid() IS NOT NULL  -- Require authentication
  AND (visibility = 'public' OR visibility = 'school')
);

-- ============================================
-- FIX 11: Fix forums RLS - Require authentication
-- ============================================
DROP POLICY IF EXISTS "Users can view forums from their university" ON public.forums;
CREATE POLICY "Users can view forums from their university"
  ON public.forums FOR SELECT
  USING (
    auth.uid() IS NOT NULL  -- Require authentication
    AND (
      university_id IN (
        SELECT university_id FROM public.profiles WHERE id = auth.uid()
      )
      OR
      -- Class forums: users enrolled in the class can access
      (type = 'class' AND class_id IN (
        SELECT class_id 
        FROM public.user_class_enrollments 
        WHERE user_id = auth.uid() 
          AND is_active = true
      ))
    )
  );

-- ============================================
-- FIX 12: Fix classes RLS - Require authentication
-- ============================================
DROP POLICY IF EXISTS "Users can view classes from their university" ON public.classes;
CREATE POLICY "Users can view classes from their university"
  ON public.classes FOR SELECT
  USING (
    auth.uid() IS NOT NULL  -- Require authentication
    AND university_id IN (
      SELECT university_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ============================================
-- FIX 13: Add admin policy for abuse log
-- ============================================
DROP POLICY IF EXISTS "Admins can view all abuse reports" ON public.anonymous_chat_abuse_log;
CREATE POLICY "Admins can view all abuse reports"
  ON public.anonymous_chat_abuse_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Remove the overly permissive policy if it exists
DROP POLICY IF EXISTS "Users can view all reports" ON public.anonymous_chat_abuse_log;

-- ============================================
-- FIX 14: Add WITH CHECK to UPDATE policies
-- ============================================

-- Events
DROP POLICY IF EXISTS "Organizers can manage their events" ON public.events;
CREATE POLICY "Organizers can manage their events"
ON public.events FOR ALL
USING (organizer_id = auth.uid() OR created_by = auth.uid())
WITH CHECK (
  -- Prevent changing organizer to someone else
  organizer_id = auth.uid() OR created_by = auth.uid()
);

-- Posts
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Comments
DROP POLICY IF EXISTS "Users can update their own comments" ON public.forum_comments;
CREATE POLICY "Users can update their own comments"
  ON public.forum_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Relationships
DROP POLICY IF EXISTS "Users can update their relationships" ON public.relationships;
CREATE POLICY "Users can update their relationships"
  ON public.relationships
  FOR UPDATE 
  USING (auth.uid() IN (user_id, target_user_id))
  WITH CHECK (
    -- Prevent changing user_id or target_user_id
    user_id = OLD.user_id AND target_user_id = OLD.target_user_id
  );

-- ============================================
-- FIX 15: Add DELETE policies where missing
-- ============================================

-- Posts (soft delete via UPDATE, but add explicit DELETE if needed)
-- Already handled via UPDATE policy with deleted_at

-- Comments (same as posts)

-- Relationships
DROP POLICY IF EXISTS "Users can delete their relationships" ON public.relationships;
CREATE POLICY "Users can delete their relationships"
  ON public.relationships
  FOR DELETE
  USING (auth.uid() = user_id);

-- Stories
DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;
CREATE POLICY "Users can delete their own stories"
  ON public.stories
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FIX 16: Add input length constraints
-- ============================================

-- Posts
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS check_title_length,
  ADD CONSTRAINT check_title_length CHECK (char_length(title) <= 200),
  DROP CONSTRAINT IF EXISTS check_body_length,
  ADD CONSTRAINT check_body_length CHECK (body IS NULL OR char_length(body) <= 10000);

-- Comments
ALTER TABLE public.forum_comments
  DROP CONSTRAINT IF EXISTS check_comment_body_length,
  ADD CONSTRAINT check_comment_body_length CHECK (char_length(body) <= 5000);

-- Stories
ALTER TABLE public.stories
  DROP CONSTRAINT IF EXISTS check_story_caption_length,
  ADD CONSTRAINT check_story_caption_length CHECK (caption IS NULL OR char_length(caption) <= 500);

-- Events
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS check_event_title_length,
  ADD CONSTRAINT check_event_title_length CHECK (char_length(title) <= 200),
  DROP CONSTRAINT IF EXISTS check_event_description_length,
  ADD CONSTRAINT check_event_description_length CHECK (description IS NULL OR char_length(description) <= 5000);

-- ============================================
-- FIX 17: Add RLS policies for messages table (if it exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    -- Enable RLS
    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
    
    -- Users can only see messages in conversations they're part of
    DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
    CREATE POLICY "Users can view messages in their conversations"
      ON public.messages FOR SELECT
      USING (
        conversation_id IN (
          SELECT id FROM conversations
          WHERE user1_id = auth.uid() OR user2_id = auth.uid()
        )
        OR
        -- Fallback: if no conversations table, check sender/recipient
        (sender_id = auth.uid() OR recipient_id = auth.uid())
      );
    
    -- Users can only send messages in their conversations
    DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
    CREATE POLICY "Users can send messages in their conversations"
      ON public.messages FOR INSERT
      WITH CHECK (
        auth.uid() = sender_id
        AND (
          conversation_id IN (
            SELECT id FROM conversations
            WHERE user1_id = auth.uid() OR user2_id = auth.uid()
          )
          OR
          recipient_id IN (
            SELECT id FROM public.profiles
            WHERE university_id = (
              SELECT university_id FROM public.profiles WHERE id = auth.uid()
            )
          )
        )
      );
    
    -- Users can update their own messages
    DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
    CREATE POLICY "Users can update their own messages"
      ON public.messages FOR UPDATE
      USING (auth.uid() = sender_id)
      WITH CHECK (auth.uid() = sender_id);
  END IF;
END $$;

-- ============================================
-- FIX 18: Add input length constraints to prevent DoS
-- ============================================

-- Posts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
    ALTER TABLE public.posts
      DROP CONSTRAINT IF EXISTS check_title_length,
      ADD CONSTRAINT check_title_length CHECK (char_length(title) <= 200),
      DROP CONSTRAINT IF EXISTS check_body_length,
      ADD CONSTRAINT check_body_length CHECK (body IS NULL OR char_length(body) <= 10000);
  END IF;
END $$;

-- Comments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'forum_comments') THEN
    ALTER TABLE public.forum_comments
      DROP CONSTRAINT IF EXISTS check_comment_body_length,
      ADD CONSTRAINT check_comment_body_length CHECK (char_length(body) <= 5000);
  END IF;
END $$;

-- Stories
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stories') THEN
    ALTER TABLE public.stories
      DROP CONSTRAINT IF EXISTS check_story_caption_length,
      ADD CONSTRAINT check_story_caption_length CHECK (caption IS NULL OR char_length(caption) <= 500);
  END IF;
END $$;

-- Events
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    ALTER TABLE public.events
      DROP CONSTRAINT IF EXISTS check_event_title_length,
      ADD CONSTRAINT check_event_title_length CHECK (char_length(title) <= 200),
      DROP CONSTRAINT IF EXISTS check_event_description_length,
      ADD CONSTRAINT check_event_description_length CHECK (description IS NULL OR char_length(description) <= 5000);
  END IF;
END $$;

-- ============================================
-- NOTES:
-- 1. Run this AFTER all other schema files
-- 2. Test all functions after applying fixes
-- 3. Verify RLS policies work correctly
-- 4. Set up admin users after applying fixes
-- 5. Monitor for any errors after deployment
-- 6. All security fixes have been applied
-- ============================================

