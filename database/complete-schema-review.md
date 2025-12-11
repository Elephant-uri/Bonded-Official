# Complete Schema Review - Bonded App

**Date**: Current Review  
**Status**: ✅ **Excellent Foundation** - Production-ready with improvements needed

---

## 📋 **OVERVIEW**

Two comprehensive schema files:
1. **Complete Schema Additions** - Core social features (relationships, stories, notifications, badges, moderation)
2. **Revised Features** - OCR schedule upload & voice-first Bond dating system

---

## ✅ **STRENGTHS**

### 1. **Comprehensive Feature Coverage**
- ✅ Complete social graph (friends, follows, blocks)
- ✅ Stories system (Snapchat/Instagram style)
- ✅ Robust notification system (push/email/in-app)
- ✅ Badge/achievement system
- ✅ Content moderation with AI support
- ✅ OCR schedule upload
- ✅ Voice-first dating system
- ✅ Performance optimizations (materialized views, partitioning)

### 2. **Security & Privacy**
- ✅ Comprehensive RLS policies
- ✅ Shadow ban system
- ✅ User violation tracking
- ✅ Content filtering

### 3. **Performance**
- ✅ Proper indexing strategy
- ✅ Materialized views for stats
- ✅ Partitioned tables for analytics
- ✅ Pre-computed compatibility scores

---

## ⚠️ **CRITICAL ISSUES**

### 1. **Table Name Conflicts**

**Issue**: Both schemas reference `orgs` table, but it might be `organizations` or `clubs`.

**Fix**:
```sql
-- Check what table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orgs', 'organizations', 'clubs');

-- Then update references accordingly
```

### 2. **Missing Table References**

**Issue**: Several tables referenced but may not exist:
- `event_attendance` - Referenced in materialized view
- `orgs` - Referenced in multiple places
- `universities` - Should exist from base schema

**Fix**: Verify these exist or create them:
```sql
-- Check if event_attendance exists (should be in events-schema.sql)
-- If not, create it:
CREATE TABLE IF NOT EXISTS public.event_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'going' CHECK (status IN ('going', 'interested', 'not_going')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);
```

### 3. **Bond Matches Table Conflict**

**Issue**: First schema creates `bond_matches`, second schema drops and recreates it. This will cause issues if run in order.

**Fix**: 
```sql
-- In the revised features file, change:
DROP TABLE IF EXISTS public.bond_matches CASCADE;
-- To:
-- DROP TABLE IF EXISTS public.bond_matches CASCADE; -- Commented out, use ALTER instead

-- Or better: Use ALTER TABLE to add new columns instead of dropping
```

### 4. **Materialized View Dependencies**

**Issue**: `user_stats` materialized view references tables that may not exist yet.

**Fix**: Create view AFTER all tables exist, or add conditional logic:
```sql
-- Add IF EXISTS checks or create view later
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_stats AS
SELECT 
  p.id as user_id,
  p.university_id,
  COUNT(DISTINCT r1.target_user_id) FILTER (
    WHERE r1.relationship_type = 'friend' AND r1.status = 'accepted'
  ) as friend_count,
  -- ... rest of query
FROM public.profiles p
LEFT JOIN public.relationships r1 ON p.id = r1.user_id
-- Add LEFT JOIN for event_attendance with IF EXISTS check
LEFT JOIN public.event_attendance ea ON p.id = ea.user_id
-- ... rest
```

### 5. **RLS Policy Gaps**

**Issue**: Some tables have RLS enabled but incomplete policies.

**Missing Policies**:
- `close_friends` - No policies defined
- `story_reactions` - No policies defined
- `push_tokens` - No policies defined
- `bond_preferences` - No policies defined
- `bond_personality_quiz` - No policies defined
- `badge_progress` - No policies defined
- `moderation_queue` - Should be admin-only
- `user_violations` - Should be admin-only
- `shadow_bans` - Should be admin-only
- `feed_interactions` - No policies defined
- `user_feed_preferences` - No policies defined
- `bond_rating_queue` - No policies defined
- `bond_compatibility_cache` - No policies defined

**Fix**: Add policies for all tables:
```sql
-- Close friends
CREATE POLICY "Users can view own close friends" ON public.close_friends
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own close friends" ON public.close_friends
  FOR ALL USING (auth.uid() = user_id);

-- Story reactions
CREATE POLICY "Users can view story reactions" ON public.story_reactions
  FOR SELECT USING (
    story_id IN (
      SELECT id FROM public.stories 
      WHERE user_id = auth.uid() OR 
      (expires_at > now() AND visibility IN ('all_friends', 'close_friends'))
    )
  );

CREATE POLICY "Users can create story reactions" ON public.story_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Push tokens
CREATE POLICY "Users can manage own push tokens" ON public.push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Bond preferences
CREATE POLICY "Users can manage own bond preferences" ON public.bond_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Bond personality quiz
CREATE POLICY "Users can manage own quiz" ON public.bond_personality_quiz
  FOR ALL USING (auth.uid() = user_id);

-- Badge progress
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
CREATE POLICY "Admins can view moderation queue" ON public.moderation_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User violations (admin + own)
CREATE POLICY "Users can view own violations" ON public.user_violations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage violations" ON public.user_violations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Shadow bans (admin only)
CREATE POLICY "Admins can view shadow bans" ON public.shadow_bans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Feed interactions
CREATE POLICY "Users can manage own feed interactions" ON public.feed_interactions
  FOR ALL USING (auth.uid() = user_id);

-- User feed preferences
CREATE POLICY "Users can manage own feed preferences" ON public.user_feed_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Bond rating queue
CREATE POLICY "Users can view own rating queue" ON public.bond_rating_queue
  FOR SELECT USING (auth.uid() = user_id);

-- Bond compatibility cache
CREATE POLICY "Users can view own compatibility scores" ON public.bond_compatibility_cache
  FOR SELECT USING (auth.uid() IN (user1_id, user2_id));
```

### 6. **Trigger Function Issues**

**Issue**: `update_bond_message_count()` references `conversation_id` but Bond matches don't have that field.

**Fix**:
```sql
-- The trigger should reference messages table, not bond_matches directly
-- Or create a bond_messages table:
CREATE TABLE IF NOT EXISTS public.bond_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.bond_matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text text,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image')),
  created_at timestamptz DEFAULT now()
);

-- Then update trigger:
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

CREATE TRIGGER trigger_bond_message_count
  AFTER INSERT ON public.bond_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_bond_message_count();
```

### 7. **OCR Processing Function**

**Issue**: `process_schedule_ocr()` function is a placeholder - needs actual OCR integration.

**Fix**: This should call an external OCR service (Google Vision, AWS Textract, etc.):
```sql
-- This function should be called from application code, not SQL
-- SQL function should just update status:
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
```

### 8. **Missing Indexes**

**Issue**: Some frequently queried columns lack indexes.

**Add These Indexes**:
```sql
-- Stories visibility queries
CREATE INDEX idx_stories_visibility ON public.stories(user_id, visibility, expires_at) 
  WHERE deleted_at IS NULL;

-- Notification unread count
CREATE INDEX idx_notifications_unread_count ON public.notifications(user_id, is_read, created_at DESC)
  WHERE is_read = false;

-- Bond matches by stage
CREATE INDEX idx_bond_matches_active_stage ON public.bond_matches(user1_id, current_stage, expires_at)
  WHERE current_stage NOT IN ('ended') AND expires_at > now();

-- Rating queue priority
CREATE INDEX idx_rating_queue_priority ON public.bond_rating_queue(user_id, priority DESC, created_at)
  WHERE shown_at IS NULL AND expires_at > now();

-- Schedule uploads by status
CREATE INDEX idx_schedule_uploads_processing ON public.schedule_uploads(upload_status, created_at)
  WHERE upload_status IN ('pending', 'processing');
```

### 9. **Data Type Issues**

**Issue**: Some fields use `text` where `uuid` would be better.

**Fix**:
```sql
-- In bond_matches, action_url should be text (correct)
-- But ensure all UUID references are proper UUIDs
-- Check for any text fields that should be UUIDs
```

### 10. **Constraint Validation**

**Issue**: Some CHECK constraints could be more specific.

**Improvements**:
```sql
-- Bond ratings: ensure rating is 1-10
-- Already correct: CHECK (rating BETWEEN 1 AND 10)

-- Add validation for age_range
ALTER TABLE public.bond_preferences
  ADD CONSTRAINT check_age_range_valid 
  CHECK (lower(age_range) >= 18 AND upper(age_range) <= 100);

-- Add validation for match scores
ALTER TABLE public.bond_matches
  ADD CONSTRAINT check_scores_valid
  CHECK (
    personality_compatibility BETWEEN 0 AND 100 AND
    mutual_rating_score BETWEEN 0 AND 100 AND
    final_match_score BETWEEN 0 AND 100
  );
```

---

## 📋 **RECOMMENDED ADDITIONS**

### 1. **Bond Messages Table** (Missing!)

```sql
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

CREATE INDEX idx_bond_messages_match ON public.bond_messages(match_id, created_at DESC);
CREATE INDEX idx_bond_messages_unread ON public.bond_messages(match_id, sender_id, is_read)
  WHERE is_read = false;

ALTER TABLE public.bond_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their matches" ON public.bond_messages
  FOR SELECT USING (
    match_id IN (
      SELECT id FROM public.bond_matches 
      WHERE auth.uid() IN (user1_id, user2_id)
    )
  );

CREATE POLICY "Users can create messages in their matches" ON public.bond_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    match_id IN (
      SELECT id FROM public.bond_matches 
      WHERE auth.uid() IN (user1_id, user2_id)
    )
  );
```

### 2. **Story Highlights Table**

```sql
CREATE TABLE IF NOT EXISTS public.story_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  highlight_name text,
  cover_image_url text,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, story_id)
);

CREATE INDEX idx_story_highlights_user ON public.story_highlights(user_id);
```

### 3. **Badge Auto-Award Trigger**

```sql
-- Improve the badge auto-award function
CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS void AS $$
DECLARE
  badge_record record;
  user_record record;
  progress_record record;
BEGIN
  -- Check each automated badge type
  FOR badge_record IN 
    SELECT * FROM public.badge_types WHERE is_automated = true
  LOOP
    -- Social Butterfly (50+ friends)
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
      END LOOP;
    END IF;
    
    -- Add more badge checks...
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 4. **Cron Job Functions**

```sql
-- Function to clean up expired content
CREATE OR REPLACE FUNCTION cleanup_expired_content()
RETURNS void AS $$
BEGIN
  -- Delete expired stories
  DELETE FROM public.stories 
  WHERE expires_at < now() AND is_highlighted = false;
  
  -- Delete expired notifications
  DELETE FROM public.notifications 
  WHERE expires_at < now();
  
  -- Expire old matches
  UPDATE public.bond_matches
  SET current_stage = 'ended', ended_at = now()
  WHERE expires_at < now() AND current_stage NOT IN ('connected', 'ended');
  
  -- Clean up old activity logs (keep last 90 days)
  DELETE FROM public.user_activity_log
  WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_stats;
  -- Add other materialized views here
END;
$$ LANGUAGE plpgsql;
```

---

## ✅ **FINAL VERDICT**

**Overall Rating**: ⭐⭐⭐⭐ (4.5/5)

**Recommendation**: **APPROVE with fixes**

The schemas are **excellent** and **production-ready** after addressing:
1. ✅ Missing RLS policies (CRITICAL)
2. ✅ Table name conflicts (orgs vs organizations)
3. ✅ Bond messages table (MISSING!)
4. ✅ Trigger function fixes
5. ✅ Missing indexes
6. ✅ Materialized view dependencies

**Priority Order**:
1. **CRITICAL**: Add missing RLS policies
2. **CRITICAL**: Create bond_messages table
3. **HIGH**: Fix table name conflicts
4. **HIGH**: Fix trigger functions
5. **MEDIUM**: Add missing indexes
6. **MEDIUM**: Fix materialized view dependencies
7. **LOW**: Add helper functions and cron jobs

---

## 📝 **IMPLEMENTATION CHECKLIST**

### Before Running:
- [ ] Verify `orgs` table name (might be `organizations` or `clubs`)
- [ ] Verify `event_attendance` table exists
- [ ] Verify `universities` table exists
- [ ] Check if `bond_matches` already exists (to avoid DROP)

### Schema 1 (Complete Additions):
- [ ] Run relationships table
- [ ] Run stories tables
- [ ] Run notification system
- [ ] Run badge system
- [ ] Run moderation system
- [ ] Add missing RLS policies
- [ ] Create materialized view (after all tables exist)
- [ ] Add missing indexes

### Schema 2 (Revised Features):
- [ ] Run schedule upload tables
- [ ] Run Bond rating tables
- [ ] Run Bond matches (ALTER instead of DROP if exists)
- [ ] Create bond_messages table
- [ ] Run compatibility cache
- [ ] Add missing RLS policies
- [ ] Fix trigger functions
- [ ] Add missing indexes

### After Running:
- [ ] Test RLS policies
- [ ] Test trigger functions
- [ ] Set up cron jobs for cleanup
- [ ] Set up cron jobs for materialized view refresh
- [ ] Test OCR integration
- [ ] Test Bond matching algorithm
- [ ] Monitor performance

---

## 🚀 **NEXT STEPS**

1. **Fix critical issues** (RLS policies, bond_messages)
2. **Resolve table name conflicts**
3. **Test with sample data**
4. **Deploy to staging**
5. **Set up monitoring**
6. **Deploy to production**

---

**Excellent work!** These schemas provide a solid foundation for a production social app. The fixes above will make them bulletproof. 🎯

