# Bonded App - Production Schema Documentation

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Production Ready

---

## 📋 **TABLE OF CONTENTS**

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Module Structure](#module-structure)
4. [Installation Guide](#installation-guide)
5. [Module Details](#module-details)
6. [Dependencies](#dependencies)
7. [Performance Considerations](#performance-considerations)
8. [Scaling Guide](#scaling-guide)
9. [Maintenance](#maintenance)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 **OVERVIEW**

This schema implements a complete social networking platform for college students with:
- Social graph (friends, follows, blocks)
- Stories system (Snapchat/Instagram style)
- Comprehensive notification system
- AI-powered dating/matching (Bond)
- Badge/achievement system
- Content moderation
- OCR schedule upload
- Feed algorithm support
- Analytics & metrics

**Total Modules**: 13  
**Total Tables**: 50+  
**Total Functions**: 15+  
**Total Triggers**: 8+

---

## 🏗️ **ARCHITECTURE**

### Design Principles

1. **Modular**: Each feature is self-contained in its own module
2. **Scalable**: Partitioned tables, materialized views, proper indexing
3. **Secure**: Row Level Security (RLS) on all tables
4. **Performant**: Pre-computed scores, caching, optimized queries
5. **Maintainable**: Clear documentation, consistent naming

### Database Structure

```
public schema
├── Core Tables (profiles, universities, forums, posts, events)
├── Module 1: Social Graph (relationships, close_friends)
├── Module 2: Stories (stories, story_views, story_reactions, story_highlights)
├── Module 3: Notifications (notifications, notification_types, push_tokens)
├── Module 4: Bond Basic (bond_preferences, personality_profiles, bond_matches, bond_swipes)
├── Module 5: Badges (badge_types, user_badges, badge_progress)
├── Module 6: Moderation (moderation_queue, user_violations, shadow_bans, content_filters)
├── Module 7: Performance (user_stats materialized view, user_activity_log)
├── Module 8: Feed Algorithm (feed_interactions, user_feed_preferences)
├── Module 9: OCR Schedule (schedule_uploads, ocr_patterns, class_extraction_confidence)
├── Module 10: Bond Enhanced (bond_ratings, bond_personality_quiz, bond_messages, bond_voice_notes, bond_rating_queue, bond_compatibility_cache)
├── Module 11: RLS Policies (all security policies)
├── Module 12: Triggers (automation functions)
└── Module 13: Helper Functions (utility functions)
```

---

## 📦 **MODULE STRUCTURE**

### Module Execution Order

**CRITICAL**: Modules must be run in this exact order:

1. **01-social-graph.sql** - Social relationships foundation
2. **02-stories.sql** - Stories system
3. **03-notifications.sql** - Notification infrastructure
4. **04-bond-basic.sql** - Basic Bond dating features
5. **05-badges.sql** - Badge/achievement system
6. **06-moderation.sql** - Content moderation
7. **07-performance.sql** - Performance optimizations
8. **08-feed-algorithm.sql** - Feed learning system
9. **09-ocr-schedule.sql** - OCR schedule upload
10. **10-bond-enhanced.sql** - Enhanced Bond features
11. **11-rls-policies.sql** - Security policies
12. **12-triggers.sql** - Automation triggers
13. **13-helper-functions.sql** - Utility functions

---

## 🚀 **INSTALLATION GUIDE**

### Prerequisites

1. **Supabase Project** (or PostgreSQL 14+)
2. **Required Extensions**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   -- Optional (for embeddings):
   CREATE EXTENSION IF NOT EXISTS vector;
   -- Optional (for partitions):
   CREATE EXTENSION IF NOT EXISTS pg_partman;
   ```

3. **Base Tables** (must exist first):
   - `profiles`
   - `universities`
   - `forums`
   - `posts`
   - `events`
   - `event_attendance`
   - `classes`
   - `user_class_enrollments`

### Installation Steps

1. **Verify Base Tables**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('profiles', 'universities', 'forums', 'posts', 'events');
   ```

2. **Run Modules in Order**:
   ```bash
   # In Supabase SQL Editor, run each file in order:
   # 01-social-graph.sql
   # 02-stories.sql
   # 03-notifications.sql
   # ... (continue through 13)
   ```

3. **Verify Installation**:
   ```sql
   -- Check all tables created
   SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE '%relationships%' OR table_name LIKE '%stories%';
   
   -- Check RLS enabled
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('relationships', 'stories', 'notifications');
   ```

4. **Set Up Cron Jobs** (Supabase Dashboard → Database → Cron):
   ```sql
   -- Daily cleanup
   SELECT cron.schedule(
     'cleanup-expired-content',
     '0 2 * * *', -- 2 AM daily
     $$SELECT cleanup_expired_content()$$
   );
   
   -- Hourly stats refresh
   SELECT cron.schedule(
     'refresh-user-stats',
     '0 * * * *', -- Every hour
     $$SELECT refresh_user_stats()$$
   );
   
   -- Daily badge check
   SELECT cron.schedule(
     'check-badges',
     '0 3 * * *', -- 3 AM daily
     $$SELECT check_and_award_badges()$$
   );
   ```

---

## 📚 **MODULE DETAILS**

### Module 1: Social Graph (`01-social-graph.sql`)

**Purpose**: Manages user relationships (friends, follows, blocks, close friends)

**Tables**:
- `relationships` - All relationship types (friend, follow, block, restricted)
- `close_friends` - Instagram-style close friends list

**Key Features**:
- Bidirectional friendships
- One-way follows
- Block functionality
- Close friends for story visibility

**Dependencies**: `profiles`

**Indexes**: Optimized for friend queries, relationship lookups

**RLS**: Users can only see their own relationships

---

### Module 2: Stories (`02-stories.sql`)

**Purpose**: Snapchat/Instagram-style stories system

**Tables**:
- `stories` - Story posts (expire after 24 hours)
- `story_views` - Who viewed each story
- `story_reactions` - Quick reactions (❤️, 🔥, etc.)
- `story_highlights` - Permanent story collections

**Key Features**:
- 24-hour expiration
- View tracking
- Reactions
- Highlights (permanent collections)
- Visibility controls (all friends, close friends, forum-only)

**Dependencies**: `profiles`, `forums` (optional)

**Indexes**: Optimized for active stories, user queries

**RLS**: Users see stories from friends/followed users

---

### Module 3: Notifications (`03-notifications.sql`)

**Purpose**: Comprehensive notification system (push, email, in-app)

**Tables**:
- `notification_types` - Notification type definitions
- `user_notification_preferences` - User preferences per type
- `notifications` - Actual notifications
- `push_tokens` - Device push tokens

**Key Features**:
- Multiple channels (push, email, in-app)
- User preferences per type
- Quiet hours
- Expiration (30 days default)
- Rich notifications (images, deep links)

**Dependencies**: `profiles`

**Indexes**: Optimized for unread queries, user lookups

**RLS**: Users can only see their own notifications

**Default Types**: 15 pre-configured types (friend_request, post_liked, etc.)

---

### Module 4: Bond Basic (`04-bond-basic.sql`)

**Purpose**: Basic dating/matching system foundation

**Tables**:
- `bond_preferences` - User dating preferences
- `personality_profiles` - Big 5 personality traits + embeddings
- `bond_matches` - Matched pairs
- `bond_swipes` - Swipe history

**Key Features**:
- Age range, gender preferences
- Personality matching (Big 5)
- Vector embeddings for semantic search
- Match scoring
- Swipe tracking

**Dependencies**: `profiles`

**Indexes**: Optimized for matching queries, compatibility scores

**RLS**: Users can only see their own matches/preferences

**Note**: Extended in Module 10 with voice notes, progressive reveal

---

### Module 5: Badges (`05-badges.sql`)

**Purpose**: Gamification and achievement system

**Tables**:
- `badge_types` - Badge definitions
- `user_badges` - User earned badges
- `badge_progress` - Progress tracking

**Key Features**:
- Automated badge awarding
- Manual badge assignment
- Progress tracking
- Featured badges on profiles
- Org-specific badges

**Dependencies**: `profiles`, `relationships`, `event_attendance`

**Indexes**: Optimized for user badge queries

**RLS**: Users can see own badges + featured badges from same university

**Default Badges**: 9 pre-configured (Social Butterfly, Event Master, etc.)

---

### Module 6: Moderation (`06-moderation.sql`)

**Purpose**: Content moderation and safety

**Tables**:
- `moderation_queue` - Reported content queue
- `user_violations` - User violation history
- `shadow_bans` - Invisible restrictions
- `content_filters` - Auto-moderation rules

**Key Features**:
- AI flagging support
- Priority queue
- Violation tracking
- Shadow bans (reduced visibility)
- Content filters (keyword, regex, AI)

**Dependencies**: `profiles`

**Indexes**: Optimized for pending queue, user violations

**RLS**: Admin-only access to queue, users see own violations

---

### Module 7: Performance (`07-performance.sql`)

**Purpose**: Performance optimizations and analytics

**Tables/Views**:
- `user_stats` (materialized view) - Pre-computed user statistics
- `user_activity_log` (partitioned) - User activity tracking

**Key Features**:
- Materialized view for fast stats
- Partitioned activity log (monthly)
- Auto-refresh function
- Activity tracking

**Dependencies**: `profiles`, `relationships`, `posts`, `event_attendance`, `user_badges`

**Indexes**: Optimized for stats queries

**Maintenance**: Refresh materialized view hourly via cron

---

### Module 8: Feed Algorithm (`08-feed-algorithm.sql`)

**Purpose**: Feed personalization and learning

**Tables**:
- `feed_interactions` - User interactions with posts
- `user_feed_preferences` - Learned preferences

**Key Features**:
- Dwell time tracking
- Viewport percentage
- Topic weights
- Engagement patterns
- Preferred posters

**Dependencies**: `profiles`, `posts`

**Indexes**: Optimized for user interaction queries

**RLS**: Users can only see their own interactions

---

### Module 9: OCR Schedule (`09-ocr-schedule.sql`)

**Purpose**: OCR-based class schedule upload

**Tables**:
- `schedule_uploads` - Upload tracking
- `ocr_patterns` - University-specific patterns
- `class_extraction_confidence` - Confidence scores

**Key Features**:
- Image upload tracking
- OCR processing status
- Pattern matching
- Confidence scoring
- Manual review flagging

**Dependencies**: `profiles`, `universities`, `classes`, `user_class_enrollments`

**Indexes**: Optimized for pending uploads, user queries

**RLS**: Users can only see their own uploads

**Integration**: OCR processing done in application, calls `mark_schedule_processed()`

---

### Module 10: Bond Enhanced (`10-bond-enhanced.sql`)

**Purpose**: Enhanced Bond dating with voice notes and progressive reveal

**Tables**:
- `bond_ratings` - 1-10 ratings before matching
- `bond_personality_quiz` - Personality quiz responses
- `bond_messages` - Match messages
- `bond_voice_notes` - Voice notes
- `bond_rating_queue` - Rating queue
- `bond_compatibility_cache` - Pre-computed compatibility

**Key Features**:
- Progressive reveal (chat → voice → photo → full)
- Voice notes
- Rating system (1-10)
- Personality quiz
- Compatibility caching
- Rating queue

**Dependencies**: `profiles`, `bond_matches` (from Module 4)

**Indexes**: Optimized for match queries, rating queue

**RLS**: Users can only see their own matches/messages

**Stages**: matched → chatting → voice_revealed → photo_revealed → fully_revealed → connected

---

### Module 11: RLS Policies (`11-rls-policies.sql`)

**Purpose**: Row Level Security policies for all tables

**Features**:
- User-specific access
- Admin-only access
- University-scoped access
- Match-scoped access

**Security Model**:
- Users see own data
- Users see public data from same university
- Admins see moderation data
- Match participants see match data

---

### Module 12: Triggers (`12-triggers.sql`)

**Purpose**: Automated actions and data consistency

**Triggers**:
- Friend request notifications
- Story view count updates
- Badge auto-awarding
- Bond message count updates
- Voice note count updates
- OCR class creation

**Functions**:
- `notify_friend_request()` - Auto-create notification
- `update_story_view_count()` - Increment view count
- `check_and_award_badges()` - Auto-award badges
- `update_bond_message_count()` - Track messages
- `update_voice_note_count()` - Track voice notes
- `create_classes_from_extraction()` - Auto-create classes

---

### Module 13: Helper Functions (`13-helper-functions.sql`)

**Purpose**: Utility functions for common operations

**Functions**:
- `get_mutual_friends(user1_id, user2_id)` - Calculate mutual friends
- `get_unread_notifications(user_id)` - Get unread count
- `cleanup_expired_content()` - Clean expired data
- `refresh_user_stats()` - Refresh materialized view
- `mark_schedule_processed()` - Update OCR status
- `calculate_bond_match_score()` - Calculate match score
- `get_bond_rating_candidates()` - Get rating candidates
- `progress_bond_stage()` - Progress match stages

---

## 🔗 **DEPENDENCIES**

### External Dependencies

1. **Base Schema** (must exist):
   - `profiles` - User profiles
   - `universities` - University data
   - `forums` - Forum definitions
   - `posts` - Forum posts
   - `events` - Event data
   - `event_attendance` - Event attendance
   - `classes` - Class definitions
   - `user_class_enrollments` - User enrollments

2. **Extensions**:
   - `uuid-ossp` - UUID generation (required)
   - `pgcrypto` - Encryption (required)
   - `vector` - Vector embeddings (optional, for personality matching)
   - `pg_partman` - Partition management (optional)

3. **Table Name Variations**:
   - `orgs` vs `organizations` vs `clubs` - Check your schema
   - Update `user_badges.org_id` foreign key if needed

### Internal Dependencies

```
Module 1 (Social Graph)
  └─> profiles

Module 2 (Stories)
  └─> profiles, forums (optional)

Module 3 (Notifications)
  └─> profiles

Module 4 (Bond Basic)
  └─> profiles

Module 5 (Badges)
  └─> profiles, relationships (Module 1), event_attendance

Module 6 (Moderation)
  └─> profiles

Module 7 (Performance)
  └─> profiles, relationships (Module 1), posts, event_attendance, user_badges (Module 5)

Module 8 (Feed Algorithm)
  └─> profiles, posts

Module 9 (OCR Schedule)
  └─> profiles, universities, classes, user_class_enrollments

Module 10 (Bond Enhanced)
  └─> profiles, bond_matches (Module 4)

Module 11 (RLS Policies)
  └─> All previous modules

Module 12 (Triggers)
  └─> All previous modules

Module 13 (Helper Functions)
  └─> All previous modules
```

---

## ⚡ **PERFORMANCE CONSIDERATIONS**

### Indexing Strategy

**High-Traffic Tables**:
- `relationships` - 3 indexes (user, target, friends)
- `notifications` - 4 indexes (user, unread, unseen, expires)
- `stories` - 4 indexes (user, forum, active, visibility)
- `bond_matches` - 5 indexes (user1, user2, stage, expiry, active)

**Query Patterns**:
- User-specific queries (most common)
- Time-based queries (recent activity)
- Status-based queries (pending, active)
- Composite queries (user + status + time)

### Materialized Views

**`user_stats`**:
- Refreshes: Hourly (via cron)
- Size: ~1 row per user
- Use: Profile stats, leaderboards
- Refresh: `REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;`

### Partitioning

**`user_activity_log`**:
- Partitioned by: Month
- Retention: 90 days
- Auto-cleanup: Via `cleanup_expired_content()`

### Caching

**Pre-computed**:
- `bond_compatibility_cache` - Compatibility scores
- `user_stats` - User statistics
- `badge_progress` - Badge progress

### Query Optimization

**Common Patterns**:
```sql
-- Always use indexes
WHERE user_id = $1 AND status = 'active'

-- Use partial indexes
WHERE expires_at > now() AND deleted_at IS NULL

-- Limit results
ORDER BY created_at DESC LIMIT 20

-- Use EXPLAIN ANALYZE
EXPLAIN ANALYZE SELECT ...
```

---

## 📈 **SCALING GUIDE**

### Horizontal Scaling

**Read Replicas**:
- Use for analytics queries
- Use for feed generation
- Use for stats queries

**Connection Pooling**:
- PgBouncer recommended
- Transaction pooling for most queries
- Session pooling for materialized views

### Vertical Scaling

**When to Scale**:
- CPU > 70% sustained
- Memory > 80% usage
- Disk I/O > 80% capacity
- Query time > 1s for common queries

**Optimization Steps**:
1. Add missing indexes
2. Refresh materialized views more frequently
3. Increase connection pool size
4. Enable query caching
5. Partition large tables

### Database Size Estimates

**Per 10,000 Users**:
- `relationships`: ~500MB (50 friends avg)
- `notifications`: ~2GB (200 notifications/user)
- `stories`: ~10GB (with media URLs)
- `bond_matches`: ~100MB (10% match rate)
- `user_activity_log`: ~5GB/month

**Total**: ~20GB per 10,000 active users

### Monitoring

**Key Metrics**:
- Query performance (p95, p99)
- Connection pool usage
- Index hit ratio (>95% target)
- Cache hit ratio (>80% target)
- Replication lag (<100ms)

**Alerts**:
- Query time > 5s
- Connection pool > 80%
- Disk usage > 85%
- Replication lag > 1s

---

## 🔧 **MAINTENANCE**

### Daily Tasks

1. **Cleanup Expired Content**:
   ```sql
   SELECT cleanup_expired_content();
   ```

2. **Check Failed Jobs**:
   ```sql
   SELECT * FROM schedule_uploads 
   WHERE upload_status = 'failed' 
   AND created_at > now() - interval '24 hours';
   ```

### Weekly Tasks

1. **Refresh Stats**:
   ```sql
   SELECT refresh_user_stats();
   ```

2. **Check Badge Progress**:
   ```sql
   SELECT check_and_award_badges();
   ```

3. **Review Moderation Queue**:
   ```sql
   SELECT COUNT(*) FROM moderation_queue 
   WHERE status = 'pending';
   ```

### Monthly Tasks

1. **Analyze Index Usage**:
   ```sql
   SELECT schemaname, tablename, indexname, idx_scan
   FROM pg_stat_user_indexes
   WHERE idx_scan = 0
   ORDER BY schemaname, tablename;
   ```

2. **Vacuum Analyze**:
   ```sql
   VACUUM ANALYZE;
   ```

3. **Check Partition Growth**:
   ```sql
   SELECT 
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   ```

### Quarterly Tasks

1. **Review RLS Policies**:
   - Test access patterns
   - Verify security
   - Update if needed

2. **Optimize Queries**:
   - Review slow queries
   - Add indexes if needed
   - Update materialized views

3. **Archive Old Data**:
   - Move old activity logs
   - Archive old notifications
   - Clean up expired matches

---

## 🐛 **TROUBLESHOOTING**

### Common Issues

**1. RLS Blocking Access**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'relationships';

-- Temporarily disable (NOT RECOMMENDED FOR PROD)
ALTER TABLE relationships DISABLE ROW LEVEL SECURITY;
```

**2. Missing Indexes**
```sql
-- Find missing indexes
EXPLAIN ANALYZE SELECT * FROM relationships 
WHERE user_id = '...' AND status = 'accepted';

-- Add index if needed
CREATE INDEX idx_relationships_user_status 
ON relationships(user_id, status);
```

**3. Materialized View Stale**
```sql
-- Check last refresh
SELECT schemaname, matviewname, hasindexes
FROM pg_matviews
WHERE matviewname = 'user_stats';

-- Refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
```

**4. Trigger Not Firing**
```sql
-- Check trigger exists
SELECT * FROM pg_trigger 
WHERE tgname = 'trigger_friend_request_notification';

-- Check function exists
SELECT * FROM pg_proc 
WHERE proname = 'notify_friend_request';
```

**5. Foreign Key Violations**
```sql
-- Find orphaned records
SELECT r.* FROM relationships r
LEFT JOIN profiles p ON r.user_id = p.id
WHERE p.id IS NULL;

-- Clean up
DELETE FROM relationships r
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = r.user_id
);
```

### Performance Issues

**Slow Queries**:
1. Run `EXPLAIN ANALYZE`
2. Check for missing indexes
3. Verify statistics are up to date
4. Consider materialized views

**High CPU**:
1. Check for N+1 queries
2. Review trigger performance
3. Optimize materialized view refresh
4. Consider read replicas

**High Memory**:
1. Review connection pool size
2. Check for memory leaks
3. Optimize materialized views
4. Consider partitioning

---

## 📝 **CHANGELOG**

### Version 1.0 (Current)
- Initial production release
- 13 modules
- 50+ tables
- Complete RLS policies
- Full documentation

---

## 🔐 **SECURITY NOTES**

1. **RLS is Critical**: Never disable RLS in production
2. **Admin Access**: Only grant admin role to trusted users
3. **API Keys**: Store securely, rotate regularly
4. **Audit Logs**: Monitor `user_activity_log` for suspicious activity
5. **Shadow Bans**: Use for problematic users without notification

---

## 📞 **SUPPORT**

For issues or questions:
1. Check this documentation
2. Review module-specific notes
3. Check Supabase logs
4. Review query performance

---

**Last Updated**: 2024  
**Maintained By**: Bonded Development Team  
**Status**: Production Ready ✅

