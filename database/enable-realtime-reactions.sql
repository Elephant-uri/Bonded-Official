-- ============================================================================
-- Enable Real-time for Message Reactions (Supabase)
-- ============================================================================
-- This script enables real-time subscriptions for message_reactions table
-- so that heart reactions appear in real-time across devices.
--
-- Run this in Supabase SQL Editor after creating the message_reactions table.
-- ============================================================================

-- 1. Enable real-time replication for message_reactions table
DO $$
DECLARE
  pub_oid oid;
  rel_oid oid;
BEGIN
  SELECT oid INTO pub_oid FROM pg_publication WHERE pubname = 'supabase_realtime';
  SELECT c.oid INTO rel_oid FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'message_reactions';

  IF rel_oid IS NULL THEN
    RAISE NOTICE '⚠️ message_reactions table does not exist';
    RETURN;
  END IF;

  -- Add message_reactions table to realtime publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel WHERE prpubid = pub_oid AND prrelid = rel_oid
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
    RAISE NOTICE '✅ Added message_reactions table to realtime publication';
  ELSE
    RAISE NOTICE 'ℹ️ message_reactions table already in realtime publication';
  END IF;
END $$;

-- 2. Set REPLICA IDENTITY FULL for message_reactions table
-- This ensures full row data is sent in real-time updates
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'message_reactions'
  ) THEN
    ALTER TABLE message_reactions REPLICA IDENTITY FULL;
    RAISE NOTICE '✅ Set REPLICA IDENTITY FULL on message_reactions table';
  ELSE
    RAISE NOTICE '⚠️ message_reactions table does not exist, skipping REPLICA IDENTITY';
  END IF;
END $$;

-- 3. Verify real-time is enabled
SELECT
  relname AS table_name,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_publication_rel pr
      JOIN pg_publication p ON p.oid = pr.prpubid
      WHERE p.pubname = 'supabase_realtime' AND pr.prrelid = c.oid
    ) THEN '✅ Enabled for Realtime'
    ELSE '❌ Not Enabled for Realtime'
  END AS realtime_status,
  CASE c.relreplident
    WHEN 'f' THEN 'FULL ✅'
    WHEN 'd' THEN 'DEFAULT (may not work for updates/deletes)'
    WHEN 'n' THEN 'NOTHING (will not work for updates/deletes)'
    ELSE 'UNKNOWN'
  END AS replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname = 'message_reactions';

SELECT 'Real-time reactions setup complete! ✅' AS status;

