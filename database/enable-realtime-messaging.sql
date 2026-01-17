-- ============================================================================
-- Enable Real-time for Messaging (Supabase)
-- ============================================================================
-- This script enables real-time subscriptions for messages, conversations,
-- and typing indicators via broadcast channels.
--
-- Run this in Supabase SQL Editor after creating the messaging tables.
-- ============================================================================

-- 1. Enable real-time replication for messages table
-- This allows Postgres Changes subscriptions to work
DO $$
BEGIN
  -- Add messages table to realtime publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    RAISE NOTICE 'Added messages table to realtime publication';
  ELSE
    RAISE NOTICE 'messages table already in realtime publication';
  END IF;

  -- Add conversations table to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
    RAISE NOTICE 'Added conversations table to realtime publication';
  ELSE
    RAISE NOTICE 'conversations table already in realtime publication';
  END IF;

  -- Add conversation_participants table to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
    RAISE NOTICE 'Added conversation_participants table to realtime publication';
  ELSE
    RAISE NOTICE 'conversation_participants table already in realtime publication';
  END IF;
END $$;

-- 2. Set REPLICA IDENTITY FULL for messages table
-- This ensures full row data is sent in real-time updates (required for Postgres Changes)
DO $$
BEGIN
  -- Check if messages table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'messages'
  ) THEN
    -- Set replica identity to FULL for real-time
    ALTER TABLE messages REPLICA IDENTITY FULL;
    RAISE NOTICE 'Set REPLICA IDENTITY FULL on messages table';
  ELSE
    RAISE NOTICE 'messages table does not exist, skipping REPLICA IDENTITY';
  END IF;
END $$;

-- 3. Verify real-time is enabled (using system catalogs directly)
DO $$
DECLARE
  table_name text;
  pub_oid oid;
  rel_oid oid;
  is_enabled boolean;
BEGIN
  -- Get the publication OID
  SELECT oid INTO pub_oid FROM pg_publication WHERE pubname = 'supabase_realtime';
  
  IF pub_oid IS NULL THEN
    RAISE NOTICE '⚠️ supabase_realtime publication not found';
    RETURN;
  END IF;
  
  FOR table_name IN SELECT unnest(ARRAY['messages', 'conversations', 'conversation_participants']) LOOP
    -- Get the table OID
    SELECT c.oid INTO rel_oid
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = table_name;
    
    IF rel_oid IS NULL THEN
      RAISE NOTICE '⚠️ Table % does not exist', table_name;
      CONTINUE;
    END IF;
    
    -- Check if table is in publication using pg_publication_rel
    SELECT EXISTS (
      SELECT 1 
      FROM pg_publication_rel 
      WHERE prpubid = pub_oid 
      AND prrelid = rel_oid
    ) INTO is_enabled;
    
    IF is_enabled THEN
      RAISE NOTICE '✅ % is enabled for real-time', table_name;
    ELSE
      RAISE NOTICE '❌ % is NOT enabled for real-time', table_name;
    END IF;
  END LOOP;
END $$;

-- 4. Check REPLICA IDENTITY for messages table
DO $$
DECLARE
  repl_ident char;
BEGIN
  SELECT c.relreplident INTO repl_ident
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'messages';
  
  IF repl_ident IS NULL THEN
    RAISE NOTICE '⚠️ messages table does not exist';
  ELSIF repl_ident = 'f' THEN
    RAISE NOTICE '✅ messages table has REPLICA IDENTITY FULL';
  ELSIF repl_ident = 'd' THEN
    RAISE NOTICE '⚠️ messages table has REPLICA IDENTITY DEFAULT (may not work for real-time)';
  ELSE
    RAISE NOTICE 'ℹ️ messages table has REPLICA IDENTITY: %', repl_ident;
  END IF;
END $$;

SELECT 'Real-time messaging setup complete! ✅ Check the notices above for status.' AS status;

