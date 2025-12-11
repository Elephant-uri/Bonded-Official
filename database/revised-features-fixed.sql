-- ============================================
-- BONDED APP - REVISED FEATURES (FIXED)
-- OCR Schedule Upload & Voice-First Dating System
-- ============================================

-- ============================================
-- SECTION 1: SCHEDULE UPLOAD VIA OCR
-- ============================================

-- Schedule upload tracking
CREATE TABLE IF NOT EXISTS public.schedule_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Image upload details
  image_url text NOT NULL,
  image_type text DEFAULT 'schedule_photo',
  upload_status text DEFAULT 'pending' CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed', 'needs_review')),
  
  -- OCR results
  ocr_raw_text text, -- Raw OCR output
  ocr_confidence float, -- Overall confidence score
  extracted_classes jsonb, -- Structured extraction: [{class_code, class_name, time, location, professor}, ...]
  
  -- Processing metadata
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  error_message text,
  manual_review_needed boolean DEFAULT false,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- User corrections
  user_corrections jsonb, -- Track what user manually fixed
  
  created_at timestamptz DEFAULT now(),
  semester text,
  academic_year text
);

CREATE INDEX IF NOT EXISTS idx_schedule_uploads_user ON public.schedule_uploads(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedule_uploads_status ON public.schedule_uploads(upload_status) WHERE upload_status IN ('pending', 'needs_review');
CREATE INDEX IF NOT EXISTS idx_schedule_uploads_processing ON public.schedule_uploads(upload_status, created_at)
  WHERE upload_status IN ('pending', 'processing');

-- OCR extraction patterns (for common schedule formats)
CREATE TABLE IF NOT EXISTS public.ocr_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE,
  pattern_name text NOT NULL,
  pattern_type text CHECK (pattern_type IN ('class_code', 'time_slot', 'location', 'professor')),
  regex_pattern text,
  example_match text,
  confidence_threshold float DEFAULT 0.7,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Class matching confidence scores
CREATE TABLE IF NOT EXISTS public.class_extraction_confidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid REFERENCES public.schedule_uploads(id) ON DELETE CASCADE,
  extracted_text text,
  matched_class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  confidence_score float,
  match_method text CHECK (match_method IN ('exact', 'fuzzy', 'partial', 'manual')),
  is_confirmed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- SECTION 2: REVISED BOND DATING SYSTEM
-- ============================================

-- User rating history (1-10 ratings before matching)
CREATE TABLE IF NOT EXISTS public.bond_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rated_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 10),
  rating_context text DEFAULT 'profile' CHECK (rating_context IN ('profile', 'photo', 'voice', 'video', 'personality')),
  
  -- What they saw when rating
  shown_content jsonb, -- {bio: true, voice: false, photo: false, etc.}
  
  created_at timestamptz DEFAULT now(),
  
  -- One rating per user pair per context
  UNIQUE(rater_id, rated_user_id, rating_context)
);

CREATE INDEX IF NOT EXISTS idx_bond_ratings_rater ON public.bond_ratings(rater_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bond_ratings_rated ON public.bond_ratings(rated_user_id, rating DESC);
CREATE INDEX IF NOT EXISTS idx_bond_ratings_mutual ON public.bond_ratings(rater_id, rated_user_id);

-- Personality quiz responses
CREATE TABLE IF NOT EXISTS public.bond_personality_quiz (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Quiz responses (your 20-30 questions)
  responses jsonb NOT NULL, -- {q1: 'answer', q2: 'answer', ...}
  
  -- Computed personality scores
  personality_type text, -- MBTI-style or custom type
  traits jsonb, -- {humor: 8, adventurous: 6, intellectual: 9, ...}
  
  -- Compatibility preferences derived from answers
  ideal_traits jsonb, -- What they're looking for
  deal_breakers jsonb, -- What they want to avoid
  
  completed_at timestamptz DEFAULT now(),
  quiz_version integer DEFAULT 1
);

-- Bond matches - ALTER existing table instead of dropping
-- Add new columns if they don't exist
DO $$
BEGIN
  -- Add new columns to existing bond_matches table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bond_matches') THEN
    -- Add new columns if they don't exist
    ALTER TABLE public.bond_matches 
      ADD COLUMN IF NOT EXISTS personality_compatibility float,
      ADD COLUMN IF NOT EXISTS mutual_rating_score float,
      ADD COLUMN IF NOT EXISTS final_match_score float,
      ADD COLUMN IF NOT EXISTS current_stage text DEFAULT 'matched' CHECK (current_stage IN (
        'matched', 'chatting', 'voice_revealed', 'photo_revealed', 'fully_revealed', 'connected', 'ended'
      )),
      ADD COLUMN IF NOT EXISTS chat_started_at timestamptz,
      ADD COLUMN IF NOT EXISTS voice_revealed_at timestamptz,
      ADD COLUMN IF NOT EXISTS photo_revealed_at timestamptz,
      ADD COLUMN IF NOT EXISTS fully_revealed_at timestamptz,
      ADD COLUMN IF NOT EXISTS connected_at timestamptz,
      ADD COLUMN IF NOT EXISTS ended_at timestamptz,
      ADD COLUMN IF NOT EXISTS user1_wants_voice boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS user2_wants_voice boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS user1_wants_photo boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS user2_wants_photo boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS user1_wants_full boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS user2_wants_full boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS message_count integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS voice_note_count integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS avg_response_time interval,
      ADD COLUMN IF NOT EXISTS conversation_sentiment float,
      ADD COLUMN IF NOT EXISTS match_reasons jsonb,
      ADD COLUMN IF NOT EXISTS personality_overlap jsonb;
    
    -- Update existing stage values to new current_stage
    UPDATE public.bond_matches 
    SET current_stage = stage 
    WHERE current_stage IS NULL AND stage IS NOT NULL;
    
    -- Add constraints
    ALTER TABLE public.bond_matches
      DROP CONSTRAINT IF EXISTS check_scores_valid;
    
    ALTER TABLE public.bond_matches
      ADD CONSTRAINT check_scores_valid CHECK (
        (personality_compatibility IS NULL OR personality_compatibility BETWEEN 0 AND 100) AND
        (mutual_rating_score IS NULL OR mutual_rating_score BETWEEN 0 AND 100) AND
        (final_match_score IS NULL OR final_match_score BETWEEN 0 AND 100)
      );
  ELSE
    -- Create table if it doesn't exist
    CREATE TABLE public.bond_matches (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user1_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      user2_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      
      -- Match scoring
      personality_compatibility float,
      mutual_rating_score float,
      final_match_score float,
      match_score float CHECK (match_score BETWEEN 0 AND 1),
      match_reasons jsonb,
      personality_score float,
      interests_score float,
      academic_score float,
      personality_overlap jsonb,
      
      -- Match stages (progressive reveal)
      current_stage text DEFAULT 'matched' CHECK (current_stage IN (
        'matched', 'chatting', 'voice_revealed', 'photo_revealed', 'fully_revealed', 'connected', 'ended'
      )),
      stage text DEFAULT 'initial' CHECK (stage IN ('initial', 'chatting', 'photo_revealed', 'full_reveal', 'met_irl')),
      
      -- Stage timestamps
      matched_at timestamptz DEFAULT now(),
      chat_started_at timestamptz,
      voice_revealed_at timestamptz,
      photo_revealed_at timestamptz,
      fully_revealed_at timestamptz,
      connected_at timestamptz,
      ended_at timestamptz,
      chatting_since timestamptz,
      photos_revealed_at timestamptz,
      met_irl_at timestamptz,
      
      -- Reveal decisions
      user1_wants_voice boolean DEFAULT false,
      user2_wants_voice boolean DEFAULT false,
      user1_wants_photo boolean DEFAULT false,
      user2_wants_photo boolean DEFAULT false,
      user1_wants_full boolean DEFAULT false,
      user2_wants_full boolean DEFAULT false,
      user1_revealed boolean DEFAULT false,
      user2_revealed boolean DEFAULT false,
      
      -- Match quality metrics
      message_count integer DEFAULT 0,
      voice_note_count integer DEFAULT 0,
      avg_response_time interval,
      conversation_sentiment float,
      conversation_quality_score float,
      
      -- Ratings
      user1_rating integer CHECK (user1_rating BETWEEN 1 AND 10),
      user2_rating integer CHECK (user2_rating BETWEEN 1 AND 10),
      
      -- Expiry
      expires_at timestamptz DEFAULT (now() + interval '7 days'),
      
      -- Ensure user1_id < user2_id for consistency
      CONSTRAINT bond_match_user_order CHECK (user1_id < user2_id),
      CONSTRAINT check_scores_valid CHECK (
        (personality_compatibility IS NULL OR personality_compatibility BETWEEN 0 AND 100) AND
        (mutual_rating_score IS NULL OR mutual_rating_score BETWEEN 0 AND 100) AND
        (final_match_score IS NULL OR final_match_score BETWEEN 0 AND 100)
      ),
      UNIQUE(user1_id, user2_id)
    );
  END IF;
END $$;

-- Indexes for bond matches
CREATE INDEX IF NOT EXISTS idx_bond_matches_user1 ON public.bond_matches(user1_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_bond_matches_user2 ON public.bond_matches(user2_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_bond_matches_stage ON public.bond_matches(current_stage) WHERE current_stage NOT IN ('ended');
CREATE INDEX IF NOT EXISTS idx_bond_matches_expiry ON public.bond_matches(expires_at) WHERE current_stage NOT IN ('connected', 'ended');
CREATE INDEX IF NOT EXISTS idx_bond_matches_active_stage ON public.bond_matches(user1_id, current_stage, expires_at)
  WHERE current_stage NOT IN ('ended') AND expires_at > now();

-- Bond messages table (CRITICAL - was missing!)
CREATE TABLE IF NOT EXISTS public.bond_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.bond_matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text text,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image', 'gif')),
  voice_note_id uuid REFERENCES public.bond_voice_notes(id) ON DELETE SET NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_bond_messages_match ON public.bond_messages(match_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bond_messages_unread ON public.bond_messages(match_id, sender_id, is_read)
  WHERE is_read = false;

-- Voice notes in Bond
CREATE TABLE IF NOT EXISTS public.bond_voice_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.bond_matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Voice note details
  audio_url text NOT NULL,
  duration_seconds integer,
  transcript text, -- Auto-transcribed for moderation
  
  -- Moderation
  is_flagged boolean DEFAULT false,
  flag_reason text,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_notes_match ON public.bond_voice_notes(match_id, created_at);

-- Rating queue (who to show users for rating)
CREATE TABLE IF NOT EXISTS public.bond_rating_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Why they're in queue
  queue_reason text DEFAULT 'algorithm' CHECK (queue_reason IN ('algorithm', 'personality_match', 'mutual_interests', 'random')),
  priority integer DEFAULT 50,
  
  -- Queue management
  shown_at timestamptz,
  rated_at timestamptz,
  skipped_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  
  UNIQUE(user_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_rating_queue_user ON public.bond_rating_queue(user_id, priority DESC, created_at) 
  WHERE shown_at IS NULL AND expires_at > now();
CREATE INDEX IF NOT EXISTS idx_rating_queue_priority ON public.bond_rating_queue(user_id, priority DESC, created_at)
  WHERE shown_at IS NULL AND expires_at > now();

-- ============================================
-- SECTION 3: MATCHING ALGORITHM TABLES
-- ============================================

-- Pre-computed compatibility scores
CREATE TABLE IF NOT EXISTS public.bond_compatibility_cache (
  user1_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Compatibility dimensions
  personality_score float, -- From quiz responses
  interest_score float,    -- Shared interests
  lifestyle_score float,   -- Living habits, schedule
  values_score float,      -- Core values alignment
  humor_score float,       -- Humor compatibility
  
  -- Combined score
  total_compatibility float,
  
  -- Context
  calculated_at timestamptz DEFAULT now(),
  algorithm_version integer DEFAULT 1,
  
  PRIMARY KEY (user1_id, user2_id),
  CONSTRAINT compatibility_user_order CHECK (user1_id < user2_id)
);

CREATE INDEX IF NOT EXISTS idx_compatibility_score ON public.bond_compatibility_cache(total_compatibility DESC);

-- ============================================
-- SECTION 4: HELPER FUNCTIONS
-- ============================================

-- Function to mark schedule as processed (called from application after OCR)
CREATE OR REPLACE FUNCTION mark_schedule_processed(
  upload_id_param uuid,
  extracted_classes_param jsonb,
  confidence_param float
)
RETURNS void AS $$
BEGIN
  UPDATE schedule_uploads
  SET 
    upload_status = 'completed',
    extracted_classes = extracted_classes_param,
    ocr_confidence = confidence_param,
    processing_completed_at = now()
  WHERE id = upload_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate Bond match score
CREATE OR REPLACE FUNCTION calculate_bond_match_score(user1 uuid, user2 uuid)
RETURNS float AS $$
DECLARE
  personality_score float;
  rating_score float;
  final_score float;
BEGIN
  -- SECURITY: User must be one of the two users
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

-- Function to find next Bond candidates for rating
CREATE OR REPLACE FUNCTION get_bond_rating_candidates(user_id_param uuid, limit_count integer DEFAULT 10)
RETURNS TABLE (
  candidate_id uuid,
  profile_data jsonb,
  compatibility_hint text
) AS $$
BEGIN
  -- SECURITY: User can only query their own candidates
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

-- Function to progress match stages
CREATE OR REPLACE FUNCTION progress_bond_stage(match_id_param uuid, requesting_user uuid, new_stage text)
RETURNS boolean AS $$
DECLARE
  match_record record;
  both_agree boolean;
BEGIN
  SELECT * INTO match_record
  FROM bond_matches
  WHERE id = match_id_param
    AND requesting_user IN (user1_id, user2_id);
    
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update the user's preference
  IF new_stage = 'voice_revealed' THEN
    IF requesting_user = match_record.user1_id THEN
      UPDATE bond_matches SET user1_wants_voice = true WHERE id = match_id_param;
    ELSE
      UPDATE bond_matches SET user2_wants_voice = true WHERE id = match_id_param;
    END IF;
    
    -- Check if both want voice
    SELECT user1_wants_voice AND user2_wants_voice INTO both_agree
    FROM bond_matches WHERE id = match_id_param;
    
    IF both_agree THEN
      UPDATE bond_matches 
      SET current_stage = 'voice_revealed', voice_revealed_at = now()
      WHERE id = match_id_param;
    END IF;
    
  ELSIF new_stage = 'photo_revealed' THEN
    -- Similar logic for photos
    IF requesting_user = match_record.user1_id THEN
      UPDATE bond_matches SET user1_wants_photo = true WHERE id = match_id_param;
    ELSE
      UPDATE bond_matches SET user2_wants_photo = true WHERE id = match_id_param;
    END IF;
    
    SELECT user1_wants_photo AND user2_wants_photo INTO both_agree
    FROM bond_matches WHERE id = match_id_param;
    
    IF both_agree THEN
      UPDATE bond_matches 
      SET current_stage = 'photo_revealed', photo_revealed_at = now()
      WHERE id = match_id_param;
    END IF;
  END IF;
  
  RETURN both_agree;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SECTION 5: TRIGGERS
-- ============================================

-- Auto-create classes from OCR extraction
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
    -- SECURITY: Validate input format
    IF jsonb_typeof(NEW.extracted_classes) != 'array' THEN
      RAISE EXCEPTION 'Invalid extracted_classes format: Expected array';
    END IF;
    
    -- Loop through extracted classes
    FOR class_obj IN SELECT * FROM jsonb_array_elements(NEW.extracted_classes)
    LOOP
      -- SECURITY: Validate and sanitize
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_classes_from_ocr ON schedule_uploads;
CREATE TRIGGER trigger_create_classes_from_ocr
  AFTER UPDATE OF extracted_classes ON schedule_uploads
  FOR EACH ROW
  WHEN (NEW.upload_status = 'completed' AND NEW.extracted_classes IS NOT NULL)
  EXECUTE FUNCTION create_classes_from_extraction();

-- Update match message count (FIXED - uses bond_messages table)
CREATE OR REPLACE FUNCTION update_bond_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bond_matches
  SET 
    message_count = message_count + 1,
    chat_started_at = COALESCE(chat_started_at, now())
  WHERE id = NEW.match_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bond_message_count ON public.bond_messages;
CREATE TRIGGER trigger_bond_message_count
  AFTER INSERT ON public.bond_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_bond_message_count();

-- Track voice note count
CREATE OR REPLACE FUNCTION update_voice_note_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bond_matches
  SET voice_note_count = voice_note_count + 1
  WHERE id = NEW.match_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_voice_note_count ON public.bond_voice_notes;
CREATE TRIGGER trigger_voice_note_count
  AFTER INSERT ON public.bond_voice_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_note_count();

-- ============================================
-- SECTION 6: ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.schedule_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_personality_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_rating_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_compatibility_cache ENABLE ROW LEVEL SECURITY;

-- Schedule uploads: users can only see their own
DROP POLICY IF EXISTS "Users can manage own schedule uploads" ON public.schedule_uploads;
CREATE POLICY "Users can manage own schedule uploads" ON public.schedule_uploads
  FOR ALL USING (auth.uid() = user_id);

-- Bond ratings: users can see their own ratings
DROP POLICY IF EXISTS "Users can manage own ratings" ON public.bond_ratings;
CREATE POLICY "Users can manage own ratings" ON public.bond_ratings
  FOR ALL USING (auth.uid() = rater_id);

-- Bond personality quiz: users can manage own
DROP POLICY IF EXISTS "Users can manage own quiz" ON public.bond_personality_quiz;
CREATE POLICY "Users can manage own quiz" ON public.bond_personality_quiz
  FOR ALL USING (auth.uid() = user_id);

-- Bond matches: users can see their matches (already exists, but ensure it's correct)
DROP POLICY IF EXISTS "Users can view own matches" ON public.bond_matches;
CREATE POLICY "Users can view own matches" ON public.bond_matches
  FOR SELECT USING (auth.uid() IN (user1_id, user2_id));

DROP POLICY IF EXISTS "Users can update own matches" ON public.bond_matches;
CREATE POLICY "Users can update own matches" ON public.bond_matches
  FOR UPDATE USING (auth.uid() IN (user1_id, user2_id));

-- Bond messages: users in match can see
DROP POLICY IF EXISTS "Match users can view messages" ON public.bond_messages;
CREATE POLICY "Match users can view messages" ON public.bond_messages
  FOR SELECT USING (
    match_id IN (
      SELECT id FROM bond_matches 
      WHERE auth.uid() IN (user1_id, user2_id)
    )
  );

DROP POLICY IF EXISTS "Users can create messages in matches" ON public.bond_messages;
CREATE POLICY "Users can create messages in matches" ON public.bond_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    match_id IN (
      SELECT id FROM bond_matches 
      WHERE auth.uid() IN (user1_id, user2_id)
    )
  );

DROP POLICY IF EXISTS "Users can update own messages" ON public.bond_messages;
CREATE POLICY "Users can update own messages" ON public.bond_messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Voice notes: users in match can see
DROP POLICY IF EXISTS "Match users can view voice notes" ON public.bond_voice_notes;
CREATE POLICY "Match users can view voice notes" ON public.bond_voice_notes
  FOR SELECT USING (
    match_id IN (
      SELECT id FROM bond_matches 
      WHERE auth.uid() IN (user1_id, user2_id)
    )
  );

DROP POLICY IF EXISTS "Users can create own voice notes" ON public.bond_voice_notes;
CREATE POLICY "Users can create own voice notes" ON public.bond_voice_notes
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Bond rating queue: users can view own queue
DROP POLICY IF EXISTS "Users can view own rating queue" ON public.bond_rating_queue;
CREATE POLICY "Users can view own rating queue" ON public.bond_rating_queue
  FOR SELECT USING (auth.uid() = user_id);

-- Bond compatibility cache: users can view scores involving them
DROP POLICY IF EXISTS "Users can view own compatibility scores" ON public.bond_compatibility_cache;
CREATE POLICY "Users can view own compatibility scores" ON public.bond_compatibility_cache
  FOR SELECT USING (auth.uid() IN (user1_id, user2_id));

-- ============================================
-- NOTES:
-- 1. Schedule upload uses OCR to extract classes (OCR processing done in application)
-- 2. Bond system has 4 stages: chat → voice → photo → full
-- 3. Matches based on personality quiz + user ratings
-- 4. Both users must agree to progress stages
-- 5. Voice notes added for audio dating stage
-- 6. Rating queue feeds users profiles to rate
-- 7. Compatibility pre-computed for performance
-- 8. bond_messages table is CRITICAL - was missing in original
-- 9. bond_matches table is ALTERED, not dropped, to preserve existing data
-- 10. All RLS policies added for security
-- ============================================

