-- ============================================================================
-- Messaging Schema for Bonded
-- ============================================================================
-- This creates the tables needed for real-time messaging:
-- 1. conversations - Chat rooms (1-on-1 or group)
-- 2. conversation_participants - Who's in each conversation
-- 3. messages - The actual messages (already exists per user)
--
-- Run this in Supabase SQL Editor to set up messaging.
-- Safe to run multiple times.
-- ============================================================================

-- 1) Conversations table
-- First, try to create the table
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  type text NOT NULL DEFAULT 'direct',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add created_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'conversations' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.conversations 
    ADD COLUMN created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  
  -- Add updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'conversations' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.conversations 
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());
  END IF;
  
  -- Add name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'conversations' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.conversations 
    ADD COLUMN name text;
  END IF;
  
  -- Add type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'conversations' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.conversations 
    ADD COLUMN type text NOT NULL DEFAULT 'direct';
  END IF;
END $$;

-- Add type check constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conversations_type_check'
  ) THEN
    ALTER TABLE public.conversations 
    ADD CONSTRAINT conversations_type_check 
    CHECK (type IN ('direct', 'group'));
  END IF;
EXCEPTION WHEN duplicate_object THEN
  -- Constraint already exists, ignore
  NULL;
END $$;

-- 2) Conversation participants table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  last_read_at timestamptz,
  is_muted boolean NOT NULL DEFAULT false,
  CONSTRAINT conversation_participants_pkey PRIMARY KEY (id)
);

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add last_read_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'conversation_participants' 
    AND column_name = 'last_read_at'
  ) THEN
    ALTER TABLE public.conversation_participants 
    ADD COLUMN last_read_at timestamptz;
  END IF;
  
  -- Add is_muted column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'conversation_participants' 
    AND column_name = 'is_muted'
  ) THEN
    ALTER TABLE public.conversation_participants 
    ADD COLUMN is_muted boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conversation_participants_unique'
  ) THEN
    ALTER TABLE public.conversation_participants 
    ADD CONSTRAINT conversation_participants_unique 
    UNIQUE (conversation_id, user_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 3) Indexes for performance (wrapped in DO block to handle missing columns)
DO $$
BEGIN
  -- Conversations indexes
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'created_by') THEN
    CREATE INDEX IF NOT EXISTS conversations_created_by_idx ON public.conversations(created_by);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'updated_at') THEN
    CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON public.conversations(updated_at DESC);
  END IF;
  
  -- Conversation participants indexes
  CREATE INDEX IF NOT EXISTS conversation_participants_user_id_idx ON public.conversation_participants(user_id);
  CREATE INDEX IF NOT EXISTS conversation_participants_conversation_id_idx ON public.conversation_participants(conversation_id);
  
  -- Messages index (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at DESC);
  END IF;
END $$;

-- 4) Function to find existing direct conversation between two users
CREATE OR REPLACE FUNCTION public.find_direct_conversation(user1 uuid, user2 uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conv_id uuid;
BEGIN
  SELECT c.id INTO conv_id
  FROM conversations c
  WHERE c.type = 'direct'
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp1 
      WHERE cp1.conversation_id = c.id AND cp1.user_id = user1
    )
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp2 
      WHERE cp2.conversation_id = c.id AND cp2.user_id = user2
    )
    AND (
      SELECT COUNT(*) FROM conversation_participants cp3 
      WHERE cp3.conversation_id = c.id
    ) = 2
  LIMIT 1;
  
  RETURN conv_id;
END;
$$;

-- 5) Function to auto-update updated_at on conversations (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'updated_at'
  ) THEN
    -- Create the function
    CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $func$
    BEGIN
      UPDATE conversations
      SET updated_at = timezone('utc', now())
      WHERE id = NEW.conversation_id;
      RETURN NEW;
    END;
    $func$;
    
    -- Create trigger if messages table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
      DROP TRIGGER IF EXISTS on_message_insert_update_conversation ON public.messages;
      CREATE TRIGGER on_message_insert_update_conversation
        AFTER INSERT ON public.messages
        FOR EACH ROW
        EXECUTE FUNCTION public.update_conversation_timestamp();
    END IF;
  END IF;
END $$;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view conversations they're in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they created" ON public.conversations;

DROP POLICY IF EXISTS "Users can view their own participations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view all participations in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON public.conversation_participants;

-- Conversations policies
CREATE POLICY "Users can view conversations they're in"
ON public.conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Only create update policy if created_by column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'conversations' 
    AND column_name = 'created_by'
  ) THEN
    DROP POLICY IF EXISTS "Users can update conversations they created" ON public.conversations;
    CREATE POLICY "Users can update conversations they created"
    ON public.conversations FOR UPDATE
    USING (created_by = auth.uid());
  END IF;
END $$;

-- Conversation participants policies
-- Helper function to avoid RLS recursion when checking membership
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conversation_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = conversation_uuid
    AND user_id = user_uuid
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;

CREATE POLICY "Users can view their own participations"
ON public.conversation_participants FOR SELECT
USING (user_id = auth.uid());

-- Allow users to see other participants in their conversations
-- Fixed: Use conversations table to avoid recursion
CREATE POLICY "Users can view all participations in their conversations"
ON public.conversation_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_participants.conversation_id
    AND public.is_conversation_participant(c.id, auth.uid())
  )
);

CREATE POLICY "Users can join conversations"
ON public.conversation_participants FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own participation"
ON public.conversation_participants FOR UPDATE
USING (user_id = auth.uid());

-- Messages policies (only if messages table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    -- Enable RLS on messages
    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
    DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
    
    -- Create view policy
    CREATE POLICY "Users can view messages in their conversations"
    ON public.messages FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
      )
    );
    
    -- Create insert policy
    CREATE POLICY "Users can send messages to their conversations"
    ON public.messages FOR INSERT
    WITH CHECK (
      sender_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- ============================================================================
-- Enable Realtime (run separately in Supabase Dashboard)
-- ============================================================================
-- Go to Database > Replication and enable these tables:
-- - messages
-- - conversations  
-- - conversation_participants
--
-- Or run these SQL commands:
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;

SELECT 'Messaging schema created successfully!' AS status;
