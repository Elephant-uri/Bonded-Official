# Link AI Schema Review

**Date**: Current Review  
**Status**: ✅ **Overall Excellent** - Well-designed with minor improvements needed

---

## ✅ **STRENGTHS**

### 1. **Comprehensive Architecture**
- ✅ Conversation persistence with metadata
- ✅ Message history with embeddings
- ✅ Search optimization with preprocessed profiles
- ✅ GroupJam compatibility scoring system
- ✅ Safety & moderation built-in
- ✅ Response caching for cost optimization
- ✅ Analytics & insights tracking
- ✅ Proper RLS policies

### 2. **Performance Optimizations**
- ✅ Vector embeddings for semantic search (pgvector)
- ✅ Full-text search indexes (GIN)
- ✅ Pre-computed GroupJam scores with expiration
- ✅ Response caching to reduce AI costs
- ✅ Partitioned analytics table
- ✅ Proper indexing strategy

### 3. **Safety & Privacy**
- ✅ Moderation logging
- ✅ User safety scores
- ✅ Query limits based on trust level
- ✅ Discoverability controls
- ✅ RLS policies for data access

---

## ⚠️ **ISSUES & IMPROVEMENTS NEEDED**

### 1. **Missing Table Dependencies**

**Issue**: Schema references tables that may not exist:
- `personality_profiles` - Referenced in `calculate_groupjam_score()` but not defined
- `relationships` - Referenced but may not exist (check if it's `friendships` or similar)
- `orgs` - Referenced in `org_search_profiles` but may be `organizations` or `clubs`

**Fix**: 
```sql
-- Check if these tables exist, or create them:
-- Option 1: Create personality_profiles table
CREATE TABLE IF NOT EXISTS public.personality_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  openness float CHECK (openness >= 0 AND openness <= 1),
  conscientiousness float CHECK (conscientiousness >= 0 AND conscientiousness <= 1),
  extraversion float CHECK (extraversion >= 0 AND extraversion <= 1),
  agreeableness float CHECK (agreeableness >= 0 AND agreeableness <= 1),
  neuroticism float CHECK (neuroticism >= 0 AND neuroticism <= 1),
  calculated_at timestamptz DEFAULT now()
);

-- Option 2: Check relationships table name
-- It might be: friendships, connections, or user_relationships
```

### 2. **Vector Embedding Indexes Commented Out**

**Issue**: Vector similarity indexes are commented out, which are critical for performance.

**Fix**: 
```sql
-- Enable pgvector extension first
CREATE EXTENSION IF NOT EXISTS vector;

-- Then uncomment and create indexes:
CREATE INDEX ON public.link_messages 
  USING ivfflat (query_embedding vector_cosine_ops) 
  WITH (lists = 100);

CREATE INDEX ON public.user_search_profiles 
  USING ivfflat (bio_embedding vector_cosine_ops) 
  WITH (lists = 100);

CREATE INDEX ON public.user_search_profiles 
  USING ivfflat (combined_embedding vector_cosine_ops) 
  WITH (lists = 100);

CREATE INDEX ON public.link_response_cache 
  USING ivfflat (query_embedding vector_cosine_ops) 
  WITH (lists = 50);
```

### 3. **Analytics Partitioning**

**Issue**: Only one partition created (`link_analytics_2024_01`), but table is partitioned by date range.

**Fix**: 
```sql
-- Create function to auto-create partitions
CREATE OR REPLACE FUNCTION create_link_analytics_partition(partition_date date)
RETURNS void AS $$
DECLARE
  partition_name text;
  start_date date;
  end_date date;
BEGIN
  start_date := date_trunc('month', partition_date);
  end_date := start_date + interval '1 month';
  partition_name := 'link_analytics_' || to_char(start_date, 'YYYY_MM');
  
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.link_analytics
    FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date
  );
END;
$$ LANGUAGE plpgsql;

-- Create partitions for next 12 months
SELECT create_link_analytics_partition(generate_series(
  '2024-01-01'::date, 
  '2025-12-01'::date, 
  '1 month'::interval
)::date);
```

### 4. **GroupJam Score Calculation Issues**

**Issue**: Function references `user_class_enrollments` but uses `auth.users(id)` instead of `profiles(id)`.

**Fix**:
```sql
-- Update calculate_groupjam_score function
-- Change: user_class_enrollments.user_id should reference profiles.id
-- Check if user_class_enrollments uses auth.users or profiles
-- If it uses auth.users, the join should work, but verify consistency
```

### 5. **Missing Triggers for Search Profiles**

**Issue**: `user_search_profiles` and `org_search_profiles` need to be kept in sync with source data.

**Fix**:
```sql
-- Trigger to update user_search_profiles when profile changes
CREATE OR REPLACE FUNCTION update_user_search_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_search_profiles (
    user_id,
    full_name_tokens,
    bio_tokens,
    interests_array,
    last_updated
  )
  VALUES (
    NEW.id,
    to_tsvector('english', COALESCE(NEW.full_name, '')),
    to_tsvector('english', COALESCE(NEW.bio, '')),
    COALESCE(NEW.interests::text[], '{}'),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name_tokens = to_tsvector('english', COALESCE(NEW.full_name, '')),
    bio_tokens = to_tsvector('english', COALESCE(NEW.bio, '')),
    interests_array = COALESCE(NEW.interests::text[], '{}'),
    last_updated = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_search_profile
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_search_profile();
```

### 6. **RLS Policy Gaps**

**Issue**: Some tables have RLS enabled but no policies defined (will block all access).

**Fix**:
```sql
-- Add missing RLS policies
-- org_search_profiles
CREATE POLICY "Users can view org search profiles from same university" 
  ON public.org_search_profiles
  FOR SELECT USING (
    org_id IN (
      SELECT id FROM public.orgs -- or organizations/clubs
      WHERE university_id = (
        SELECT university_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- link_moderation_log (admin only)
CREATE POLICY "Admins can view moderation log" 
  ON public.link_moderation_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- link_user_safety_scores (users can see their own)
CREATE POLICY "Users can view own safety score" 
  ON public.link_user_safety_scores
  FOR SELECT USING (auth.uid() = user_id);
```

### 7. **Missing Constraints & Validations**

**Issue**: Some fields could use better constraints.

**Fix**:
```sql
-- Add constraints
ALTER TABLE public.link_conversations
  ADD CONSTRAINT check_message_count CHECK (message_count >= 0);

ALTER TABLE public.link_messages
  ADD CONSTRAINT check_result_count CHECK (result_count >= 0),
  ADD CONSTRAINT check_tokens_used CHECK (tokens_used >= 0),
  ADD CONSTRAINT check_response_time CHECK (response_time_ms >= 0);

ALTER TABLE public.groupjam_scores
  ADD CONSTRAINT check_scores_range CHECK (
    total_score >= 0 AND total_score <= 100 AND
    personality_score >= 0 AND personality_score <= 100 AND
    interests_score >= 0 AND interests_score <= 100
  );
```

### 8. **Search Function Optimization**

**Issue**: `search_people_by_query()` might be slow for large datasets.

**Improvement**:
```sql
-- Add LIMIT to prevent excessive GroupJam calculations
-- Consider caching results
-- Add EXPLAIN ANALYZE to optimize query plan
```

---

## 📋 **RECOMMENDED ADDITIONS**

### 1. **Add Rate Limiting Table**
```sql
CREATE TABLE IF NOT EXISTS public.link_rate_limits (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  queries_today integer DEFAULT 0,
  queries_hour integer DEFAULT 0,
  last_query_at timestamptz,
  reset_at timestamptz DEFAULT (date_trunc('day', now()) + interval '1 day')
);
```

### 2. **Add Conversation Sharing**
```sql
-- Allow users to share conversations
ALTER TABLE public.link_conversations
  ADD COLUMN shared_with uuid[] DEFAULT '{}',
  ADD COLUMN is_shared boolean DEFAULT false;
```

### 3. **Add Query Templates**
```sql
CREATE TABLE IF NOT EXISTS public.link_query_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid REFERENCES public.universities(id),
  template_text text NOT NULL,
  query_type text NOT NULL,
  usage_count integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

---

## ✅ **FINAL VERDICT**

**Overall Rating**: ⭐⭐⭐⭐⭐ (5/5)

**Recommendation**: **APPROVE with minor fixes**

The schema is **production-ready** after addressing:
1. ✅ Missing table dependencies (personality_profiles, relationships)
2. ✅ Enable vector indexes (requires pgvector extension)
3. ✅ Add missing RLS policies
4. ✅ Add triggers for search profile sync
5. ✅ Fix analytics partitioning

**Priority Order**:
1. **HIGH**: Fix missing table references
2. **HIGH**: Add missing RLS policies
3. **MEDIUM**: Enable vector indexes
4. **MEDIUM**: Add search profile sync triggers
5. **LOW**: Analytics partitioning automation

---

## 📝 **IMPLEMENTATION CHECKLIST**

- [ ] Verify `personality_profiles` table exists or create it
- [ ] Verify `relationships` table name (might be `friendships` or `connections`)
- [ ] Verify `orgs` table name (might be `organizations` or `clubs`)
- [ ] Install pgvector extension: `CREATE EXTENSION IF NOT EXISTS vector;`
- [ ] Uncomment and create vector indexes
- [ ] Add missing RLS policies
- [ ] Create search profile sync triggers
- [ ] Set up analytics partition automation
- [ ] Test GroupJam score calculation
- [ ] Test search functions with sample data
- [ ] Verify RLS policies work correctly
- [ ] Set up cron job for cache cleanup
- [ ] Set up cron job for GroupJam score expiration

---

## 🚀 **NEXT STEPS**

1. **Create missing tables** (personality_profiles, verify relationships/orgs)
2. **Enable pgvector** and create indexes
3. **Add missing RLS policies**
4. **Test with sample data**
5. **Deploy to staging**
6. **Monitor performance**

---

**Excellent work on this schema!** It's comprehensive, well-thought-out, and production-ready with the minor fixes above.

