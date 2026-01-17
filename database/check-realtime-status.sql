-- ============================================================================
-- Check Real-time Status for Messaging
-- ============================================================================
-- Run this in Supabase SQL Editor to diagnose real-time subscription errors
-- ============================================================================

-- 1. Check if tables are in realtime publication
SELECT 
  t.tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_rel pr
      JOIN pg_publication p ON p.oid = pr.prpubid
      JOIN pg_class c ON c.oid = pr.prrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = t.tablename
    ) THEN '✅ Enabled'
    ELSE '❌ NOT Enabled'
  END AS realtime_status
FROM (
  SELECT unnest(ARRAY['messages', 'conversations', 'conversation_participants', 'message_reactions']) AS tablename
) t;

-- 2. Check REPLICA IDENTITY for messages table
SELECT 
  'messages' AS table_name,
  CASE c.relreplident
    WHEN 'f' THEN '✅ FULL (Required for real-time)'
    WHEN 'd' THEN '⚠️ DEFAULT (May not work for real-time)'
    WHEN 'n' THEN '❌ NOTHING (Will not work for real-time)'
    ELSE '❓ UNKNOWN'
  END AS replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'messages';

-- 3. Check RLS policies on messages table
SELECT 
  policyname,
  cmd AS operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END AS has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END AS has_with_check
FROM pg_policies
WHERE tablename = 'messages' AND schemaname = 'public'
ORDER BY policyname;

-- 4. Check if RLS is enabled
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('messages', 'conversations', 'conversation_participants');

-- 5. Test if a user can SELECT from messages (requires auth context)
-- This will only work if run with proper auth context
SELECT 
  'To test RLS, run this query while authenticated:' AS note,
  'SELECT COUNT(*) FROM messages LIMIT 1;' AS test_query;


